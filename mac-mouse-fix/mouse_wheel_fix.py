#!/usr/bin/env python3
"""
Mac Mouse Wheel Fix
-------------------
Переворачивает скролл ТОЛЬКО для мышки, трекпад не трогает.

Установка зависимостей:
    pip3 install pyobjc-framework-Quartz pyobjc-framework-Cocoa

Запуск:
    python3 mouse_wheel_fix.py

Автозапуск: запусти install.sh
"""

import sys
import os
import signal

try:
    import Quartz
    from Quartz import (
        CGEventTapCreate,
        CGEventTapEnable,
        CGEventGetIntegerValueField,
        CGEventSetIntegerValueField,
        kCGEventScrollWheel,
        kCGScrollWheelEventDeltaAxis1,
        kCGScrollWheelEventDeltaAxis2,
        kCGScrollWheelEventPointDeltaAxis1,
        kCGScrollWheelEventPointDeltaAxis2,
        kCGScrollWheelEventFixedPtDeltaAxis1,
        kCGScrollWheelEventFixedPtDeltaAxis2,
        kCGScrollWheelEventIsContinuous,
        kCGSessionEventTap,
        kCGHeadInsertEventTap,
        kCGEventTapOptionDefault,
        CFMachPortCreateRunLoopSource,
        CFRunLoopAddSource,
        CFRunLoopGetCurrent,
        kCFRunLoopCommonModes,
        CFRunLoopRun,
    )
    from Cocoa import NSEvent
except ImportError:
    print("Ошибка: установи зависимости:")
    print("  pip3 install pyobjc-framework-Quartz pyobjc-framework-Cocoa")
    sys.exit(1)

# Поля, которые нужно инвертировать
SCROLL_FIELDS = [
    kCGScrollWheelEventDeltaAxis1,
    kCGScrollWheelEventDeltaAxis2,
    kCGScrollWheelEventPointDeltaAxis1,
    kCGScrollWheelEventPointDeltaAxis2,
    kCGScrollWheelEventFixedPtDeltaAxis1,
    kCGScrollWheelEventFixedPtDeltaAxis2,
]


def scroll_callback(proxy, event_type, event, refcon):
    """Перехватываем события скролла. Инвертируем только для мышки."""
    if event_type == kCGEventScrollWheel:
        # isContinuous == 1 → трекпад (не трогаем)
        # isContinuous == 0 → мышь (инвертируем)
        is_continuous = CGEventGetIntegerValueField(event, kCGScrollWheelEventIsContinuous)
        if not is_continuous:
            for field in SCROLL_FIELDS:
                val = CGEventGetIntegerValueField(event, field)
                if val != 0:
                    CGEventSetIntegerValueField(event, field, -val)
    return event


def main():
    print("Mac Mouse Wheel Fix запущен.")
    print("Скролл мышки инвертирован, трекпад не тронут.")
    print("Ctrl+C для выхода.\n")

    tap = CGEventTapCreate(
        kCGSessionEventTap,
        kCGHeadInsertEventTap,
        kCGEventTapOptionDefault,
        1 << kCGEventScrollWheel,
        scroll_callback,
        None,
    )

    if tap is None:
        print("Ошибка: не удалось создать event tap.")
        print("Открой: Системные настройки → Конфиденциальность → Специальные возможности")
        print("и добавь Терминал (или Python) в список разрешённых приложений.")
        sys.exit(1)

    source = CFMachPortCreateRunLoopSource(None, tap, 0)
    CFRunLoopAddSource(CFRunLoopGetCurrent(), source, kCFRunLoopCommonModes)
    CGEventTapEnable(tap, True)

    def on_exit(sig, frame):
        print("\nОстановлено.")
        sys.exit(0)

    signal.signal(signal.SIGINT, on_exit)
    signal.signal(signal.SIGTERM, on_exit)

    CFRunLoopRun()


if __name__ == "__main__":
    main()
