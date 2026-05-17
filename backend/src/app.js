'use strict'

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { hasInjection, sanitizeOutput, validateMessages, createRateLimiter } = require("./security");
const { processMessage } = require("./chat");

const ALLOWED_BROWSER_ORIGINS = new Set(
  (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

const app = express();
app.use(helmet());

app.use(
  "/api/chat",
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(new Error("Direct server calls to /api/chat not allowed"));
      cb(null, ALLOWED_BROWSER_ORIGINS.has(origin));
    },
    methods: ["POST"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  })
);

app.use("/api", cors());
app.use(express.json({ limit: "32kb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

const rateLimiter = createRateLimiter();

app.post("/api/chat", rateLimiter, async (req, res) => {
  const { messages, channel = "web", session_id } = req.body;

  const validation = validateMessages(messages);
  if (!validation.ok) return res.status(400).json({ error: validation.error });

  for (const msg of messages) {
    if (hasInjection(msg.content)) {
      return res.status(400).json({ error: "Message contains disallowed content" });
    }
  }

  try {
    const result = await processMessage({ messages, channel, sessionId: session_id });
    result.reply = sanitizeOutput(result.reply);
    return res.json(result);
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "AI response timeout" });
    }
    console.error("[chat]", err.message);
    return res.status(502).json({ error: "AI service unavailable" });
  }
});

module.exports = app;
