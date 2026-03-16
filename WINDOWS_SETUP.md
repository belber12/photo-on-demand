# Настройка плагина и backend на Windows

Краткая инструкция: как запустить плагин Photoshop и backend на ПК.

---

## Структура проекта

```
├── src/              ← Лендинг (React)
├── plugin/           ← Плагин Photoshop (UXP)
├── backend/          ← Node.js API
├── product_retouch/  ← Python-скрипт для предметной ретуши
├── start-backend.bat
└── WINDOWS_SETUP.md
```

---

## Рекомендация: путь без кириллицы

Если проект на рабочем столе (путь с кириллицей), UXP может давать «Plugin load timed out».  
**Решение:** запусти `copy-to-c.bat` — он скопирует проект в `C:\photo-on-demand`.

---

## 1. Backend (для плагина Photoshop)

**Вариант А — через скрипт:**
- Дважды кликни по `start-backend.bat` в корне проекта.
- Окно оставь открытым.

**Вариант Б — вручную:**
```cmd
cd backend
copy .env.example .env
npm install
npm run dev
```

В `backend\.env` добавь `REPLICATE_API_TOKEN` (если используешь Replicate).  
Проверка: http://127.0.0.1:8787/api/health

---

## 2. Плагин Photoshop

1. Photoshop 2022+ с включённым режимом разработчика.
2. UXP Developer Tool: https://developer.adobe.com/photoshop/uxp/
3. Add Plugin → укажи папку `plugin`.
4. Load → в Photoshop: Плагины → AI Starter Panel.
5. В панели Settings: Backend URL = `http://127.0.0.1:8787`, Save settings.

---

## 3. Предметная ретушь (Python)

```bash
cd product_retouch
pip install -r requirements.txt
python retouch_product.py path/to/photo.png
```

Подробнее: `product_retouch/README.md`.
