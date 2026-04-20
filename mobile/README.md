# Мобильные приложения — React Native + Expo

Два независимых приложения на Expo:

- `passenger/` — приложение пассажира (тёмная тема, Yandex Go style)
- `driver/` — приложение водителя

Бэкенд на Python (в `../backend/`) и веб-админка остаются без изменений.

## Требования

- Node.js ≥ 18
- npm или yarn
- Для запуска на устройстве: приложение **Expo Go** (iOS/Android)
- Для запуска эмулятора: Android Studio (Android) или Xcode (iOS, только macOS)

## Запуск

```bash
# В одном терминале — бэкенд
cd ../
./start_backend.ps1

# В другом терминале — приложение пассажира
cd mobile/passenger
npm install
npx expo start

# В третьем — приложение водителя
cd mobile/driver
npm install
npx expo start
```

После запуска откроется QR-код — отсканируйте его в Expo Go.

## Конфигурация бэкенда

По умолчанию приложения стучатся в `http://127.0.0.1:8000`. Чтобы поменять:

```bash
# Пример: бэкенд в локальной сети
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.50:8000 npx expo start
```

или отредактируйте `src/config.js` в соответствующем приложении.

> **Важно:** при запуске на реальном телефоне замените `127.0.0.1` на IP компьютера в локальной сети.

## Структура приложения

```
passenger/ (или driver/)
├── App.js              — корневой компонент + навигация
├── app.json            — Expo-конфиг
├── package.json
└── src/
    ├── config.js       — BACKEND_URL, константы
    ├── theme.js        — цвета
    ├── api.js          — HTTP-клиент
    ├── ws.js           — WebSocket-клиент
    ├── state.js        — глобальный стор (Zustand)
    ├── components/     — переиспользуемые UI-элементы
    └── screens/        — экраны
```
