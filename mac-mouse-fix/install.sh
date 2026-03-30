#!/bin/bash
# Установка автозапуска Mouse Wheel Fix через launchd

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_PATH="$SCRIPT_DIR/mouse_wheel_fix.py"
PYTHON=$(which python3)
PLIST_NAME="com.user.mousewheelfix"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo "=== Mac Mouse Wheel Fix — Установка ==="
echo ""

# Проверяем Python и зависимости
echo "Проверяем зависимости..."
$PYTHON -c "import Quartz, Cocoa" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Устанавливаем pyobjc..."
    pip3 install pyobjc-framework-Quartz pyobjc-framework-Cocoa
fi

# Создаём plist для launchd
echo "Создаём LaunchAgent: $PLIST_PATH"
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
    "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${PYTHON}</string>
        <string>${SCRIPT_PATH}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/mousewheelfix.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/mousewheelfix.err</string>
</dict>
</plist>
EOF

# Загружаем агент
launchctl unload "$PLIST_PATH" 2>/dev/null
launchctl load "$PLIST_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "Готово! Mouse Wheel Fix запущен и будет стартовать автоматически."
    echo ""
    echo "Управление:"
    echo "  Стоп:     launchctl unload $PLIST_PATH"
    echo "  Старт:    launchctl load $PLIST_PATH"
    echo "  Удалить:  bash $SCRIPT_DIR/uninstall.sh"
    echo "  Логи:     tail -f /tmp/mousewheelfix.log"
    echo ""
    echo "ВАЖНО: Если не работает — добавь Терминал в:"
    echo "  Системные настройки → Конфиденциальность → Специальные возможности"
else
    echo "Ошибка при загрузке. Попробуй запустить вручную:"
    echo "  python3 $SCRIPT_PATH"
fi
