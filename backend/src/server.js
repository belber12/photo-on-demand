const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
app.use(cors());
app.use(express.json({ limit: "30mb" }));

const PORT = Number(process.env.PORT || 8787);
const MODE = process.env.AI_PROVIDER_MODE || "mock";
const REPLICATE_API_TOKEN = (process.env.REPLICATE_API_TOKEN || "").trim();
const REPLICATE_GENERATE_MODEL = process.env.REPLICATE_GENERATE_MODEL || "black-forest-labs/flux-schnell";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeFetchError(err) {
  if (!err) return "unknown fetch error";
  const base = err.message || String(err);
  const cause = err.cause || {};
  const code = cause.code ? ` code=${cause.code}` : "";
  const syscall = cause.syscall ? ` syscall=${cause.syscall}` : "";
  const address = cause.address ? ` address=${cause.address}` : "";
  return `${base}${code}${syscall}${address}`;
}

// Получить последнюю версию модели автоматически
async function getLatestModelVersion(owner, name) {
  if (!REPLICATE_API_TOKEN) throw new Error("Missing REPLICATE_API_TOKEN");
  const resp = await fetch(`https://api.replicate.com/v1/models/${owner}/${name}`, {
    headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` }
  });
  if (!resp.ok) throw new Error(`Cannot get model info ${owner}/${name}: ${resp.status}`);
  const data = await resp.json();
  const version = data.latest_version && data.latest_version.id;
  if (!version) throw new Error(`No latest_version found for ${owner}/${name}`);
  return version;
}

// Создание предикта по хешу версии (для community-моделей без deploy)
async function createReplicatePredictionByVersion(input, version) {
  if (!REPLICATE_API_TOKEN) throw new Error("Missing REPLICATE_API_TOKEN");
  const url = `https://api.replicate.com/v1/predictions`;
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let createResp;
    try {
      createResp = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ version, input })
      });
    } catch (err) {
      throw new Error(`Replicate network error (create): ${describeFetchError(err)}`);
    }
    if (createResp.status === 429 && attempt < maxAttempts) {
      const retryAfterHeader = Number(createResp.headers.get("retry-after") || "10");
      await sleep(Number.isFinite(retryAfterHeader) ? retryAfterHeader * 1000 : 10000);
      continue;
    }
    if (!createResp.ok) {
      const msg = await createResp.text();
      throw new Error(`Replicate create failed: ${createResp.status} ${msg}`);
    }
    return createResp.json();
  }
  throw new Error("Replicate create failed after retries");
}

async function createReplicatePrediction(input, model) {
  if (!REPLICATE_API_TOKEN) {
    throw new Error("Missing REPLICATE_API_TOKEN");
  }

  // Не кодируем весь путь — слэш в "owner/model" должен остаться слэшом
  const url = `https://api.replicate.com/v1/models/${model}/predictions`;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let createResp;
    try {
      createResp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ input })
      });
    } catch (err) {
      throw new Error(`Replicate network error (create): ${describeFetchError(err)}`);
    }

    if (createResp.status === 429 && attempt < maxAttempts) {
      const retryAfterHeader = Number(createResp.headers.get("retry-after") || "10");
      const waitMs = Number.isFinite(retryAfterHeader) ? retryAfterHeader * 1000 : 10000;
      await sleep(waitMs);
      continue;
    }

    if (!createResp.ok) {
      const msg = await createResp.text();
      throw new Error(`Replicate create failed: ${createResp.status} ${msg}`);
    }

    return createResp.json();
  }

  throw new Error("Replicate create failed after retries");
}

async function waitReplicateResult(getUrl) {
  if (!REPLICATE_API_TOKEN) {
    throw new Error("Missing REPLICATE_API_TOKEN");
  }

  const timeoutMs = 120000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    let res;
    try {
      res = await fetch(getUrl, {
        headers: {
          Authorization: `Bearer ${REPLICATE_API_TOKEN}`
        }
      });
    } catch (err) {
      throw new Error(`Replicate network error (poll): ${describeFetchError(err)}`);
    }

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Replicate polling failed: ${res.status} ${msg}`);
    }

    const data = await res.json();
    if (data.status === "succeeded") {
      return data;
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Replicate status: ${data.status}`);
    }

    await sleep(1500);
  }

  throw new Error("Replicate timeout");
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mode: MODE,
    timestamp: new Date().toISOString()
  });
});

app.post("/api/generate", async (req, res) => {
  const prompt = String(req.body?.prompt || "").trim();
  const model = String(req.body?.model || REPLICATE_GENERATE_MODEL).trim();
  const aspectRatio = String(req.body?.aspectRatio || "1:1");
  const refImage = req.body?.refImage || null; // base64 референс (опционально)

  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }

  try {
    if (MODE === "mock") {
      const encoded = encodeURIComponent(prompt);
      const mockUrl = `https://picsum.photos/seed/${encoded}/1024/1024`;
      return res.json({ imageUrl: mockUrl, provider: "mock" });
    }

    if (MODE === "replicate") {
      console.log("[generate] model:", model, "prompt:", prompt.slice(0, 80), "ref:", !!refImage);

      const input = { prompt, aspect_ratio: aspectRatio, output_format: "png" };
      // Если передан референс — используем как стартовое изображение (img2img)
      if (refImage) {
        input.image = refImage;
        input.prompt_strength = 0.4; // 0.4 = сильнее держится за референс
      }

      const prediction = await createReplicatePrediction(input, model);
      const result = await waitReplicateResult(prediction.urls.get);
      const output = result.output;
      const imageUrl = Array.isArray(output) ? output[0] : output;

      if (!imageUrl) throw new Error("Replicate returned empty output");
      return res.json({ imageUrl, provider: "replicate" });
    }

    return res.status(400).json({ error: `Unsupported AI_PROVIDER_MODE: ${MODE}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/remove-bg", async (req, res) => {
  const imageData = String(req.body?.imageData || "").trim();

  if (!imageData) {
    return res.status(400).json({ error: "imageData is required" });
  }

  try {
    if (MODE === "mock") {
      return res.json({ imageUrl: imageData, provider: "mock", note: "Mock: returning original" });
    }

    if (MODE === "replicate") {
      console.log("[remove-bg] starting background removal");
      console.log("[remove-bg] getting latest rembg version...");
      const rembgVersion = await getLatestModelVersion("cjwbw", "rembg");
      console.log("[remove-bg] version:", rembgVersion);
      const prediction = await createReplicatePredictionByVersion(
        { image: imageData },
        rembgVersion
      );
      const result = await waitReplicateResult(prediction.urls.get);
      const output = result.output;
      const imageUrl = Array.isArray(output) ? output[0] : output;
      if (!imageUrl) throw new Error("Replicate returned empty output");
      return res.json({ imageUrl, provider: "replicate" });
    }

    return res.status(400).json({ error: `Unsupported AI_PROVIDER_MODE: ${MODE}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/enhance", async (req, res) => {
  const imageData = String(req.body?.imageData || "").trim();
  const prompt = String(req.body?.prompt || "").trim();
  // Модель можно передать с фронта; по умолчанию используем nano-banana-2 (поддерживает img2img)
  const model = String(req.body?.model || "google/nano-banana-2").trim();

  if (!imageData) {
    return res.status(400).json({ error: "imageData is required" });
  }
  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }

  try {
    if (MODE === "mock") {
      return res.json({ imageUrl: imageData, provider: "mock", note: "Mock: returning original" });
    }

    if (MODE === "replicate") {
      console.log("[enhance] model:", model, "prompt:", prompt.slice(0, 80));

      // Nano Banana 2 и другие official-модели: используем /models/ endpoint
      if (model === "google/nano-banana-2" || model.startsWith("black-forest-labs/flux-schnell")) {
        const prediction = await createReplicatePrediction(
          { image: imageData, prompt, prompt_strength: 0.6, output_format: "png" },
          model
        );
        const result = await waitReplicateResult(prediction.urls.get);
        const output = result.output;
        const imageUrl = Array.isArray(output) ? output[0] : output;
        if (!imageUrl) throw new Error("Replicate returned empty output");
        return res.json({ imageUrl, provider: "replicate" });
      }

      // flux-dev и другие — версионный подход
      const [owner, name] = model.split("/");
      console.log("[enhance] getting latest version for", owner, name);
      const version = await getLatestModelVersion(owner, name);
      console.log("[enhance] version:", version);
      const prediction = await createReplicatePredictionByVersion(
        { image: imageData, prompt, prompt_strength: 0.5, num_inference_steps: 28, output_format: "png" },
        version
      );
      const result = await waitReplicateResult(prediction.urls.get);
      const output = result.output;
      const imageUrl = Array.isArray(output) ? output[0] : output;
      if (!imageUrl) throw new Error("Replicate returned empty output");
      return res.json({ imageUrl, provider: "replicate" });
    }

    return res.status(400).json({ error: `Unsupported AI_PROVIDER_MODE: ${MODE}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Восстановление старых/повреждённых фото (царапины, дефекты, размытость, лица)
app.post("/api/restore", async (req, res) => {
  const imageData = String(req.body?.imageData || "").trim();

  if (!imageData) {
    return res.status(400).json({ error: "imageData is required" });
  }

  try {
    if (MODE === "mock") {
      return res.json({ imageUrl: imageData, provider: "mock", note: "Mock: returning original" });
    }

    if (MODE === "replicate") {
      console.log("[restore] getting latest GFPGAN version...");
      const gfpganVersion = await getLatestModelVersion("tencentarc", "gfpgan");
      console.log("[restore] version:", gfpganVersion);
      const prediction = await createReplicatePredictionByVersion(
        { img: imageData, version: "v1.4", scale: 2 },
        gfpganVersion
      );
      const result = await waitReplicateResult(prediction.urls.get);
      const output = result.output;
      const imageUrl = Array.isArray(output) ? output[0] : output;
      if (!imageUrl) throw new Error("Replicate returned empty output");
      return res.json({ imageUrl, provider: "replicate" });
    }

    return res.status(400).json({ error: `Unsupported AI_PROVIDER_MODE: ${MODE}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Раскраска чёрно-белых фото
app.post("/api/colorize", async (req, res) => {
  const imageData = String(req.body?.imageData || "").trim();

  if (!imageData) {
    return res.status(400).json({ error: "imageData is required" });
  }

  try {
    if (MODE === "mock") {
      return res.json({ imageUrl: imageData, provider: "mock", note: "Mock: returning original" });
    }

    if (MODE === "replicate") {
      console.log("[colorize] getting latest DeOldify version...");
      const deoldifyVersion = await getLatestModelVersion("arielreplicate", "deoldify_image");
      console.log("[colorize] version:", deoldifyVersion);
      const prediction = await createReplicatePredictionByVersion(
        { input_image: imageData, render_factor: 35, model_name: "Artistic" },
        deoldifyVersion
      );
      const result = await waitReplicateResult(prediction.urls.get);
      const output = result.output;
      const imageUrl = Array.isArray(output) ? output[0] : output;
      if (!imageUrl) throw new Error("Replicate returned empty output");
      return res.json({ imageUrl, provider: "replicate" });
    }

    return res.status(400).json({ error: `Unsupported AI_PROVIDER_MODE: ${MODE}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/upscale", async (req, res) => {
  const imageUrl = String(req.body?.imageUrl || "").trim();
  const scale = Number(req.body?.scale || 2);

  if (!imageUrl) {
    return res.status(400).json({ error: "imageUrl is required" });
  }

  try {
    // Starter behavior: pass through original URL in both modes.
    // Replace this with your selected upscale model call.
    return res.json({
      imageUrl,
      scale,
      note: "Upscale endpoint is a starter placeholder."
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(
    `[ai-starter-backend] listening on http://localhost:${PORT} (mode=${MODE}, replicate_token=${REPLICATE_API_TOKEN ? "set" : "missing"})`
  );
});
