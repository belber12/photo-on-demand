# Фото на заказ — лендинг + инструменты

Монорепо: лендинг для фотостудии, плагин Photoshop и скрипт предметной ретуши.

---

## Структура

| Папка | Описание |
|-------|----------|
| `src/` | React-лендинг (Vite, Tailwind) |
| `plugin/` | Плагин Photoshop (UXP) — AI-ретушь, удаление фона, генерация |
| `backend/` | Node.js API для плагина (Replicate) |
| `product_retouch/` | Python CLI — предметная ретушь для e-commerce |

---

## Лендинг (сайт)

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # сборка в dist/
```

Сайт: [fotostudiozakaz.ru](https://fotostudiozakaz.ru)

---

## Плагин Photoshop + backend

1. Запусти backend: `start-backend.bat` или `cd backend && npm run dev`
2. UXP Developer Tool → Add Plugin → папка `plugin` → Load
3. В панели: Backend URL = `http://127.0.0.1:8787`

Подробно: `WINDOWS_SETUP.md`

---

## Предметная ретушь

```bash
cd product_retouch
pip install -r requirements.txt
python retouch_product.py photo.png
```

Подробно: `product_retouch/README.md`
