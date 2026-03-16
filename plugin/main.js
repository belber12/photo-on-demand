var entrypoints = require("uxp").entrypoints;
var uxp = require("uxp");
var SETTINGS_KEY = "aiStarterSettings";

// Хранилище референса
var refImageData = null;

function setRefPreview(base64Data, label) {
  refImageData = base64Data;
  var wrap = document.getElementById("refPreviewWrap");
  var img  = document.getElementById("refPreviewImg");
  var hint = document.getElementById("refHint");
  if (wrap) wrap.style.display = "block";
  if (img)  img.src = base64Data;
  if (hint) hint.textContent = label || "Референс загружен";
}

function clearRefPreview() {
  refImageData = null;
  var wrap = document.getElementById("refPreviewWrap");
  var img  = document.getElementById("refPreviewImg");
  var hint = document.getElementById("refHint");
  if (wrap) wrap.style.display = "none";
  if (img)  img.src = "";
  if (hint) hint.textContent = "Референс не выбран";
}

function initRefButtons() {
  // Кнопка "Файл" — открыть через файловый пикер UXP
  var refFileBtn = document.getElementById("refFileBtn");
  if (refFileBtn) {
    refFileBtn.addEventListener("click", function () {
      uxp.storage.localFileSystem.getFileForOpening({
        types: ["png", "jpg", "jpeg", "webp"]
      }).then(function (file) {
        if (!file) return;
        return file.read({ format: uxp.storage.formats.binary });
      }).then(function (data) {
        if (!data) return;
        var bytes = new Uint8Array(data);
        var binary = "";
        for (var i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        var b64 = "data:image/png;base64," + btoa(binary);
        setRefPreview(b64, "Файл загружен");
        setStatus("Референс: файл загружен", "ok");
      }).catch(function (err) {
        setStatus("Ошибка загрузки файла: " + (err && err.message), "error");
      });
    });
  }

  // Кнопка "Слой" — захватить активный документ PS
  var refLayerBtn = document.getElementById("refLayerBtn");
  if (refLayerBtn) {
    refLayerBtn.addEventListener("click", function () {
      setStatus("Захватываю слой...", "busy");
      exportActiveDocumentAsBase64().then(function (b64) {
        setRefPreview(b64, "Активный слой");
        setStatus("Референс: слой захвачен", "ok");
      }).catch(function (err) {
        setStatus("Ошибка захвата слоя: " + (err && err.message), "error");
      });
    });
  }

  // Кнопка очистки референса
  var clearRefBtn = document.getElementById("clearRefBtn");
  if (clearRefBtn) {
    clearRefBtn.addEventListener("click", function () {
      clearRefPreview();
      setStatus("Референс убран", "ok");
    });
  }
}

function setStatus(text, type) {
  var status = document.getElementById("status");
  if (!status) return;
  status.textContent = text;
  status.className = "status-bar" + (type ? " " + type : "");
  // При ошибке — автоматически показать попап с полным текстом
  if (type === "error") {
    var popup = document.getElementById("statusPopup");
    var popupText = document.getElementById("statusPopupText");
    if (popup && popupText) {
      popupText.textContent = text;
      popup.className = "status-popup visible error-popup";
    }
  }
}

function initStatusPopup() {
  var statusBar = document.getElementById("status");
  var popup = document.getElementById("statusPopup");
  var closeBtn = document.getElementById("statusPopupClose");
  // Клик на статус-бар — раскрыть попап с полным текстом
  if (statusBar) {
    statusBar.addEventListener("click", function () {
      if (!popup) return;
      var popupText = document.getElementById("statusPopupText");
      if (popupText) popupText.textContent = statusBar.textContent;
      popup.className = "status-popup visible";
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (popup) popup.className = "status-popup";
    });
  }
}

function initTabs() {
  var tabs = document.querySelectorAll(".tab");
  tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
      tabs.forEach(function(t) { t.classList.remove("active"); });
      document.querySelectorAll(".tab-pane").forEach(function(p) { p.classList.remove("active"); });
      tab.classList.add("active");
      var pane = document.getElementById("tab-" + tab.dataset.tab);
      if (pane) pane.classList.add("active");
    });
  });
}

// Цены за изображение по моделям
var MODEL_PRICES = {
  "google/nano-banana-2": 0.003,
  "black-forest-labs/flux-schnell": 0.003,
  "black-forest-labs/flux-dev": 0.055,
  "stability-ai/sdxl": 0.010,
  "bytedance/sdxl-lightning-4step": 0.004
};

var MODEL_LABELS = {
  "google/nano-banana-2": "Nano Banana 2 ⚡",
  "black-forest-labs/flux-schnell": "Flux Schnell",
  "black-forest-labs/flux-dev": "Flux Dev",
  "stability-ai/sdxl": "SDXL",
  "bytedance/sdxl-lightning-4step": "SDXL Lightning"
};

var MODEL_KEYS = Object.keys(MODEL_LABELS);
var currentModelIndex = 0;

function updateModelDisplay() {
  var label = document.getElementById("modelNavLabel");
  var priceRow = document.getElementById("priceRow");
  var variantsEl = document.getElementById("variants");
  var key = MODEL_KEYS[currentModelIndex];
  if (label) label.textContent = MODEL_LABELS[key] || key;
  var qty = variantsEl ? Number(variantsEl.value) || 1 : 1;
  var price = (MODEL_PRICES[key] || 0) * qty;
  if (priceRow) priceRow.textContent = "~$" + price.toFixed(4) + " за изображение";
}

function initModelNav() {
  var prevBtn = document.getElementById("modelPrev");
  var nextBtn = document.getElementById("modelNext");
  var variantsEl = document.getElementById("variants");

  if (prevBtn) {
    prevBtn.addEventListener("click", function() {
      currentModelIndex = (currentModelIndex - 1 + MODEL_KEYS.length) % MODEL_KEYS.length;
      updateModelDisplay();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function() {
      currentModelIndex = (currentModelIndex + 1) % MODEL_KEYS.length;
      updateModelDisplay();
    });
  }
  if (variantsEl) {
    variantsEl.addEventListener("change", updateModelDisplay);
  }
  updateModelDisplay();
}

function getSettings() {
  try {
    var raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { backendUrl: "http://localhost:8787" };
    return JSON.parse(raw);
  } catch (e) {
    return { backendUrl: "http://localhost:8787" };
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function apiPost(path, body) {
  var settings = getSettings();
  var base = (settings.backendUrl || "http://localhost:8787").replace(/\/+$/, "");

  return fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(function (response) {
    if (!response.ok) {
      return response.text().then(function (txt) {
        throw new Error("API " + response.status + ": " + txt);
      });
    }
    return response.json();
  });
}

async function exportActiveDocumentAsBase64() {
  var photoshop = require("photoshop");
  var app = photoshop.app;
  var core = photoshop.core;
  var storage = require("uxp").storage;
  var fs = storage.localFileSystem;
  var formats = storage.formats;

  if (!app.activeDocument) {
    throw new Error("Нет открытого документа в Photoshop");
  }

  var tempFolder = await fs.getTemporaryFolder();
  var tempFile = await tempFolder.createFile("ai-export-" + Date.now() + ".png", { overwrite: true });

  await core.executeAsModal(async function () {
    await app.activeDocument.saveAs.png(tempFile, {}, true);
  }, { commandName: "Export for AI" });

  var buffer = await tempFile.read({ format: formats.binary });
  var bytes = new Uint8Array(buffer);
  var binary = "";
  var chunkSize = 8192;
  for (var i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
  }
  // Удаляем временный экспорт — он больше не нужен
  try { await tempFile.delete(); } catch(e) {}
  return "data:image/png;base64," + btoa(binary);
}

function openImageInPhotoshop(imageUrl) {
  var photoshop = require("photoshop");
  var app = photoshop.app;
  var core = photoshop.core;
  var storage = require("uxp").storage;
  var fs = storage.localFileSystem;
  var formats = storage.formats;

  return fetch(imageUrl)
    .then(function (response) {
      if (!response.ok) throw new Error("Cannot download image: " + response.status);
      return response.arrayBuffer();
    })
    .then(function (data) {
      return fs.getTemporaryFolder().then(function (tempFolder) {
        return tempFolder
          .createFile("ai-result-" + Date.now() + ".png", { overwrite: true })
          .then(function (file) {
            return file.write(data, { format: formats.binary }).then(function () {
              return core.executeAsModal(function () {
                return app.open(file);
              }, { commandName: "Open AI Result" }).then(function(result) {
                // Удаляем временный файл результата после открытия
                try { file.delete(); } catch(e) {}
                return result;
              });
            });
          });
      });
    });
}

function bindEvents() {
  initTabs();
  initRefButtons();
  initStatusPopup();
  initModelNav();

  var backendUrl = document.getElementById("backendUrl");
  var settings = getSettings();
  if (backendUrl) {
    backendUrl.value = settings.backendUrl || "http://localhost:8787";
  }

  var saveBtn = document.getElementById("saveSettingsBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      var url = backendUrl && backendUrl.value ? backendUrl.value.trim() : "";
      saveSettings({ backendUrl: url || "http://localhost:8787" });
      setStatus("Настройки сохранены", "ok");
    });
  }

  // Авто-выравнивание слоёв
  var autoAlignBtn = document.getElementById("autoAlignBtn");
  if (autoAlignBtn) {
    autoAlignBtn.addEventListener("click", function () {
      setStatus("Выравниваю слои...", "busy");
      var photoshop = require("photoshop");
      photoshop.core.executeAsModal(function () {
        return photoshop.action.batchPlay([{
          _obj: "autoCut",
          _options: { dialogOptions: "dontDisplay" }
        }], { synchronousExecution: false });
      }, { commandName: "Авто-выровнять слои" }).then(function () {
        setStatus("Слои выровнены", "ok");
      }).catch(function (err) {
        setStatus("Ошибка выравнивания: " + (err && err.message), "error");
      });
    });
  }

  var generateBtn = document.getElementById("generateBtn");
  if (generateBtn) {
    generateBtn.addEventListener("click", function () {
      var promptEl = document.getElementById("prompt");
      var ratioEl = document.getElementById("ratio");
      var variantsEl = document.getElementById("variants");
      var model = MODEL_KEYS[currentModelIndex] || "black-forest-labs/flux-schnell";
      var prompt = promptEl && promptEl.value ? promptEl.value.trim() : "";
      var ratio = ratioEl ? ratioEl.value : "1:1";
      var variants = variantsEl ? Number(variantsEl.value) || 1 : 1;

      if (!prompt) {
        setStatus("Введи описание изображения", "error");
        return;
      }

      setStatus("Генерирую...", "busy");

      // Генерируем нужное количество вариантов последовательно
      var chain = Promise.resolve();
      for (var i = 0; i < variants; i++) {
        (function(idx) {
          chain = chain.then(function() {
            setStatus("Генерирую вариант " + (idx + 1) + " из " + variants + "...", "busy");
            return apiPost("/api/generate", { prompt: prompt, model: model, aspectRatio: ratio })
              .then(function (data) {
                var imageUrl = data && data.imageUrl;
                if (!imageUrl) throw new Error("No imageUrl in response");
                return openImageInPhotoshop(imageUrl);
              });
          });
        })(i);
      }

      chain.then(function () {
        setStatus("Готово: " + variants + " вар. открыто в Photoshop", "ok");
      }).catch(function (err) {
        setStatus("Ошибка генерации: " + err.message, "error");
      });
    });
  }

  var restoreBtn = document.getElementById("restoreBtn");
  if (restoreBtn) {
    restoreBtn.addEventListener("click", function () {
      setStatus("Экспорт документа...");
      exportActiveDocumentAsBase64()
        .then(function (imageData) {
          setStatus("Восстанавливаю фото через AI (это может занять 1-2 мин)...");
          return apiPost("/api/restore", { imageData: imageData });
        })
        .then(function (data) {
          var imageUrl = data && data.imageUrl;
          if (!imageUrl) throw new Error("No imageUrl in response");
          setStatus("Открываю результат в Photoshop...");
          return openImageInPhotoshop(imageUrl);
        })
        .then(function () {
          setStatus("Готово: восстановленное фото открыто");
        })
        .catch(function (err) {
          setStatus("Ошибка восстановления: " + err.message, "error");
        });
    });
  }

  var colorizeBtn = document.getElementById("colorizeBtn");
  if (colorizeBtn) {
    colorizeBtn.addEventListener("click", function () {
      setStatus("Экспорт документа...");
      exportActiveDocumentAsBase64()
        .then(function (imageData) {
          setStatus("Раскрашиваю фото через AI (это может занять 1-2 мин)...");
          return apiPost("/api/colorize", { imageData: imageData });
        })
        .then(function (data) {
          var imageUrl = data && data.imageUrl;
          if (!imageUrl) throw new Error("No imageUrl in response");
          setStatus("Открываю результат в Photoshop...");
          return openImageInPhotoshop(imageUrl);
        })
        .then(function () {
          setStatus("Готово: раскрашенное фото открыто");
        })
        .catch(function (err) {
          setStatus("Ошибка раскраски: " + err.message, "error");
        });
    });
  }

  var removeBgBtn = document.getElementById("removeBgBtn");
  if (removeBgBtn) {
    removeBgBtn.addEventListener("click", function () {
      setStatus("Экспорт документа...");
      exportActiveDocumentAsBase64()
        .then(function (imageData) {
          setStatus("Удаляю фон через AI...");
          return apiPost("/api/remove-bg", { imageData: imageData });
        })
        .then(function (data) {
          var imageUrl = data && data.imageUrl;
          if (!imageUrl) throw new Error("No imageUrl in response");
          setStatus("Открываю результат в Photoshop...");
          return openImageInPhotoshop(imageUrl);
        })
        .then(function () {
          setStatus("Готово: фон удалён, результат открыт");
        })
        .catch(function (err) {
          setStatus("Remove BG ошибка: " + err.message, "error");
        });
    });
  }

  var enhanceBtn = document.getElementById("enhanceBtn");
  if (enhanceBtn) {
    enhanceBtn.addEventListener("click", function () {
      var promptEl = document.getElementById("enhancePrompt");
      var prompt = promptEl && promptEl.value ? promptEl.value.trim() : "";
      if (!prompt) {
        setStatus("Введи инструкцию для обработки");
        return;
      }
      setStatus("Экспорт документа...");
      exportActiveDocumentAsBase64()
        .then(function (imageData) {
          setStatus("Обрабатываю фото по промту...");
          var model = MODEL_KEYS[currentModelIndex] || "google/nano-banana-2";
          return apiPost("/api/enhance", { imageData: imageData, prompt: prompt, model: model });
        })
        .then(function (data) {
          var imageUrl = data && data.imageUrl;
          if (!imageUrl) throw new Error("No imageUrl in response");
          setStatus("Открываю результат в Photoshop...");
          return openImageInPhotoshop(imageUrl);
        })
        .then(function () {
          setStatus("Готово: обработанное фото открыто");
        })
        .catch(function (err) {
          setStatus("Ошибка улучшения: " + err.message, "error");
        });
    });
  }

  var upscaleBtn = document.getElementById("upscaleBtn");
  if (upscaleBtn) {
    upscaleBtn.addEventListener("click", function () {
      var imageUrlEl = document.getElementById("imageUrl");
      var scaleEl = document.getElementById("scale");
      var imageUrl = imageUrlEl && imageUrlEl.value ? imageUrlEl.value.trim() : "";
      var scale = Number(scaleEl ? scaleEl.value : 2);

      if (!imageUrl) {
        setStatus("Введи URL изображения");
        return;
      }

      setStatus("Увеличиваю...");
      apiPost("/api/upscale", {
        imageUrl: imageUrl,
        scale: scale
      })
        .then(function (data) {
          var out = data && data.imageUrl;
          if (!out) throw new Error("No imageUrl in response");
          setStatus("Открываю увеличенное изображение...");
          return openImageInPhotoshop(out);
        })
        .then(function () {
          setStatus("Готово: увеличенное изображение открыто");
        })
        .catch(function (err) {
          setStatus("Ошибка увеличения: " + err.message);
        });
    });
  }

  setStatus("Готов к работе", "ok");
}

entrypoints.setup({
  panels: {
    "ai-starter-panel": {
      show: function () {
        try {
          bindEvents();
        } catch (e) {
          if (document.getElementById("status")) {
            document.getElementById("status").textContent = "Error: " + (e && e.message ? e.message : String(e));
          }
        }
      },
      hide: function () {}
    }
  }
});
