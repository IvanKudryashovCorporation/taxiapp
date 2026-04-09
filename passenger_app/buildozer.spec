[app]

# Название и пакет
title = Рассвет — Пассажир
package.name = rassvetpassenger
package.domain = org.rassvet

# Версия
version = 1.0.0

# Исходники: корень taxiapp/, чтобы passenger_app.* и shared.* были в Python-пути
source.dir = ..
source.include_exts = py,png,jpg,kv,atlas,ttf
source.exclude_dirs = driver_app, backend, start, .buildozer, __pycache__, .git, .claude

# Зависимости (без mapview — пассажиру карта не нужна)
requirements = python3,kivy==2.3.0,requests

# Иконка и сплэш (заменить на свои PNG)
# icon.filename = %(source.dir)s/passenger_app/assets/icon.png
# presplash.filename = %(source.dir)s/passenger_app/assets/presplash.png

# Ориентация
orientation = portrait

# Полноэкранный режим
fullscreen = 1

# Android
android.permissions = INTERNET
android.api = 33
android.minapi = 21
android.ndk = 25b
android.sdk = 33
android.archs = arm64-v8a, armeabi-v7a

android.allow_backup = True

[buildozer]
log_level = 2
warn_on_root = 1
