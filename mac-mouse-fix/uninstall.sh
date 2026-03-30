#!/bin/bash
# Удаление автозапуска Mouse Wheel Fix

PLIST_NAME="com.user.mousewheelfix"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo "Удаляем Mouse Wheel Fix..."

launchctl unload "$PLIST_PATH" 2>/dev/null
rm -f "$PLIST_PATH"

echo "Готово. Автозапуск удалён."
