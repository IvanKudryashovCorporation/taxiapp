#!/bin/bash
# Сборка APK приложения водителя для Android.
# Запускать из WSL: bash driver_app/build_android.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAXIAPP_DIR="$(dirname "$SCRIPT_DIR")"
MAIN_PY="$TAXIAPP_DIR/main.py"

echo "==> Сборка: Рассвет — Водитель"
echo "    Источник: $TAXIAPP_DIR"

# Создаём временный main.py в корне taxiapp/
cat > "$MAIN_PY" << 'PYEOF'
from driver_app.app import DriverMobileApp
DriverMobileApp().run()
PYEOF

# Функция очистки — удаляет main.py даже при ошибке
cleanup() {
    rm -f "$MAIN_PY"
}
trap cleanup EXIT

# Запускаем buildozer из директории driver_app/
cd "$SCRIPT_DIR"
buildozer android debug

echo ""
APK=$(ls -1 bin/*.apk 2>/dev/null | head -1)
if [ -n "$APK" ]; then
    echo "✓ APK готов: $SCRIPT_DIR/$APK"
else
    echo "✗ APK не найден в bin/"
    exit 1
fi
