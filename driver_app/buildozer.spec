[app]

# Название и пакет
title = Рассвет — Водитель
package.name = rassvetdriver
package.domain = org.rassvet

# Версия
version = 1.0.0

# Исходники: корень taxiapp/, чтобы driver_app.* и shared.* были в Python-пути
source.dir = ..
source.include_exts = py,png,jpg,kv,atlas,ttf
source.exclude_dirs = passenger_app, backend, start, .buildozer, __pycache__, .git, .claude

# Зависимости
# mapview: для карты в приложении водителя
requirements = python3,kivy==2.3.0,requests,plyer,mapview

# Иконка и сплэш (заменить на свои PNG)
# icon.filename = %(source.dir)s/driver_app/assets/icon.png
# presplash.filename = %(source.dir)s/driver_app/assets/presplash.png

# Ориентация
orientation = portrait

# Полноэкранный режим
fullscreen = 1

# Android
android.permissions = INTERNET, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION
android.api = 33
android.minapi = 21
android.ndk = 25b
android.sdk = 33
android.archs = arm64-v8a, armeabi-v7a

# Включить поддержку резервного копирования (Android 6+)
android.allow_backup = True

[buildozer]
log_level = 2
warn_on_root = 1
