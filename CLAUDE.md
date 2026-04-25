# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## PROJECT OVERVIEW

**Профсоюз Рассвет** — мобильное такси-приложение с 2 Expo (React Native) приложениями и Python FastAPI бэкенд.

```
taxiapp/
├── mobile/
│   ├── passenger/      — приложение для пассажиров (светлая тема, Yandex Go стиль)
│   └── driver/         — приложение для водителей (тёмная тема, с картой)
└── backend/            — FastAPI + PostgreSQL (не изменяется)
```

**Приложения независимые** — каждое имеет свой App.js и config.

---

## STACK

- **Frontend**: React Native (Expo) + React Navigation
- **State Management**: Zustand (глобальный стор)
- **UI Components**: React Native built-ins + custom
- **Maps**: Leaflet (WebView) в LeafletMap.js для водителя
- **Real-time**: WebSocket (ws.js)
- **Backend**: Python FastAPI (не в этом репо)
- **HTTP Client**: axios с Bearer token auth

---

## KEY FILES & RECENT CHANGES

### 0. Пассажирское приложение — полный редизайн (2026-04-24)
**Тема: Yandex Go стиль, светлая тема**

- `LoginScreen.js` — тёмный фон (#0C0E17) с декоративными кругами (warm glow), большой белый заголовок, карточка ввода с белым фоном снизу
- `VerifyScreen.js` — белый фон, 4 цифровые ячейки для кода (визуальный UI поверх скрытого TextInput), жёлтая кнопка
- `MainScreen.js` — светлая шторка на тёмной карте, Yandex Go layout
- `NavBar.js` — светлая тема (белый фон, жёлтый active)
- `ChatBubble.js` — светлая тема (желтый/серый)

**Сохранённая логика:** вся бизнес-логика (api calls, state, PanResponder, GPS) — без изменений.

---

### 1. `mobile/driver/src/components/LeafletMap.js`
**Последние изменения (2026-04-24):**
- ✅ Машинка: детальная top-down SVG (52×90px), белый кузов с radialGradient, окна, колёса, фары
- ✅ Rotation: приоритет compass heading; fallback → GPS bearing между точками
- ✅ `setCarPosition(lat, lon, compassHeading)` — heading из телефонного компаса
- ✅ Fixed size: не меняется при zoom (markerZoomAnimation: false)
- ✅ Removed zoom controls (zoomControl: false)
- ✅ No flickering during interaction (display: block !important in CSS)

**Архитектура:**
- `buildHTML()` — встроенный Leaflet html (с дефолтными tile layers)
- `LeafletMap` — компонент-обёртка с useImperativeHandle
- Коммуникация: WebView ↔ React Native через postMessage
- Car icon: SVG в JavaScript string (viewBox: "0 0 52 90"), NORTH = вверх

**Методы:**
- `setCenter(lat, lon, zoom)` — центр карты
- `setCar(lat, lon, heading)` — позиция + компасный поворот машинки
- `setMarkers(list)` — заказы на карте (yellow circles)

### 1b. `mobile/driver/src/components/LocationTracker.js`
- GPS: `Location.watchPositionAsync(distanceInterval: 5, timeInterval: 2000)`
- Compass: `Location.watchHeadingAsync()` → `trueHeading >= 0 ? trueHeading : magHeading`
- Backend push: `api.pushLocation(lat, lon)` каждые LOCATION_PUSH_INTERVAL мс
- `setLocation(loc)` и `setHeading(deg)` → в Zustand store
- Нет зависимости от `isOnline` — всегда трекает

### 1c. `mobile/driver/src/state.js`
- `setHeading(deg)` — мёржит heading в location объект
- `refreshState()` — не проверяет `isOnline`, всегда загружает заказы
- `available` — список доступных заказов (без условия смены)

### 2. `mobile/driver/src/screens/MapScreen.js`
**Компоненты:**
- `MapScreen` — главный экран водителя с картой
- `OrderDetailSheet` — bottom sheet с деталями заказа (animated)

**Состояние:**
- `location` → `setCar()` на LeafletMap
- `available` → желтые маркеры на карте
- `currentOrder` → красная точка (pickup) и синяя (dropoff)
- `wsStatus` → online/offline статус

**Последние изменения:**
- ✅ OrderDetailSheet с анимацией (Animated.Value, spring)
- ✅ Клик на маркер → openSheet(order)
- ✅ Accept/Decline кнопки вызывают api.accept() и api.decline()

### 3. `mobile/passenger/src/screens/MainScreen.js`
**Компоненты:**
- Скрытая search UI (absolute overlay, не в sheet)
- Sheet с фиксированной высотой, плавная анимация
- Real-time drag поддержка (PanResponder)

**Состояние:**
- `sheetH` (Animated.Value) — высота sheet
- `sheetExpanded` — is expanded / collapsed
- Search results → nominatim через `geocodeSearch()`

**Дизайн (2026-04-24) — Yandex Go стиль, светлая тема:**
- Sheet: белый фон (#FFFFFF), тень снизу
- Адресная секция: `addrSection` (F7F7F7 bg) с желтой и черной точкой, соединены линией
- Быстрые места: горизонтальный ScrollView с chips (Домой, Работа, Избранное)
- Тарифы: горизонтальный ScrollView с карточками `tariffCard` (не импортирует ServiceCard)
- Кнопка: большая жёлтая "Заказать · 450 ₽"
- Локальная палитра `L` (const L = {...}) вместо `colors` из theme
- NavBar: обновлён на светлую тему (NavBar.js)

**Баги, которые уже исправлены:**
- ✅ Убрана `sheetStyle` переменная → заменена на `sheetH` animated
- ✅ Search UI вырвана из sheet → absolute overlay с bottom: keyboardH
- ✅ Criminea geocoding: удалена `countrycodes: "ru"` (Nominatim использует `ua` для Крыма)
- ✅ Real-time drag: `sheetH.stopAnimation(callback)` → захватывает текущее значение при драге

### 4. `mobile/passenger/src/components/OrderModal.js`
**Новый компонент (760+ строк):**
- Полноэкранный animated modal с `Animated.Value`
- Слайдит с низу вверх (slide animation)
- Статусы: searching → accepted → arrived → in_route → completed/cancelled
- SearchingAnimation: две волны (радиус расширяется, opacity падает)

**Компоненты внутри:**
- DriverCard: имя водителя, авто, рейтинг, ETA
- RouteCard: красная точка → линия → синяя точка
- PriceCard: большая цена (28px bold, accent color)
- ChatSection: polling api.chatHistory() каждые 4s
- RatingRow: 5-star feedback (completed rides)
- Cancel button с Alert confirmation

**API интеграция:**
```javascript
api.submitFeedback(publicId, rating, reason, text)
api.chatHistory(publicId, since)
api.chatSend(publicId, text)
api.cancelOrder(publicId, reason)
```

### 5. `mobile/passenger/src/api.js`
**HTTP client с axios:**
- Bearer token auth (Bearer ${_token})
- Error unwrapping (извлекает detail из response)

**Endpoints:**
```
POST /api/auth/passenger/request-code
POST /api/auth/passenger/verify-code
GET /api/passenger/me
POST /api/passenger/orders/quote
POST /api/passenger/orders
GET /api/passenger/orders/current
GET /api/passenger/orders/history
POST /api/passenger/orders/{id}/cancel
POST /api/passenger/orders/{id}/feedback
GET /api/passenger/orders/{id}/chat
POST /api/passenger/orders/{id}/chat
```

**Nominatim reverse geocoding:**
- `reverseGeocodeCity()` — найти город по координатам
- `reverseGeocode()` — найти адрес (дорога, номер, город)
- `geocodeSearch()` — поиск адресов (с viewbox + городом)
- Без `countrycodes: "ru"` (иначе Крым не находится)

---

## QUICK START

### Passenger app:
```bash
cd mobile/passenger
npm install  # if needed
npx expo start --clear
# Scan QR or press 'w' for web
```

### Driver app:
```bash
cd mobile/driver
npm install  # if needed
npx expo start --clear
```

### Backend (Python, не меняется):
```bash
cd ..
./start_backend.ps1  # или вручную: uvicorn backend.main:app --reload
```

---

## ARCHITECTURE DECISIONS

### 1. LeafletMap in WebView (not native Expo map)
- Reason: Fine control over SVG rendering for car icon
- Trade-off: Slightly slower, but beautiful animations
- How: JSON messages between WebView ↔ React Native via postMessage

### 2. Zustand for global state (not Redux)
- Reason: Less boilerplate, hooks-based
- Usage: `useStore(state => state.property)`

### 3. Animated API for sheet/modal animations
- Reason: Native performance, smooth 60fps
- Pattern: Animated.Value + Animated.spring/timing + interpolate

### 4. Bottom Sheet pattern for order details
- Reason: Mobile-first UX, familiar to users
- Implementation: Animated.View with translateY interpolation

### 5. Nominatim (OpenStreetMap) for geocoding
- Reason: Free, no API key needed, works with Crimea
- Note: Include `"accept-language": "ru"` for Russian address formatting

---

## COMMON TASKS

### Adding a new screen:
1. Create `mobile/passenger/src/screens/NewScreen.js`
2. Add to navigation in `App.js`
3. Use hooks: `useStore()`, `useEffect()`, `useState()`

### Modifying LeafletMap:
1. Change SVG in `CAR_SVG` string or `buildHTML()`
2. Adjust `iconSize` and `iconAnchor` if dimensions change
3. Test with `npx expo start` → both zoomlevels

### Adding API endpoint:
1. Define in `api.js` inside `export const api = { ... }`
2. Use `unwrap()` for error handling
3. Call from component: `await api.methodName(...)`

### State management:
```javascript
// Read
const data = useStore(state => state.data);

// Write
useStore.setState({ data: newValue });

// Define in state.js
const useStore = create(set => ({
  data: null,
  setData: data => set({ data }),
}));
```

### Debugging map issues:
1. Open Expo DevTools (via Metro menu)
2. Check WebView console: React Native DevTools → WebView inspector
3. Common: CSS conflicts in `.leaflet-*` classes

---

## KNOWN ISSUES & SOLUTIONS

### Search input jumping to top when typing:
**SOLVED** — moved search UI to absolute overlay outside sheet.

### Car icon changing size on zoom:
**SOLVED** — markerZoomAnimation: false + fixed iconSize.

### Crimea addresses not found:
**SOLVED** — removed countrycodes: "ru" (Nominatim uses "ua" for Crimea).

### Sheet content flickering during drag:
**SOLVED** — PanResponder with sheetH.stopAnimation() captures current value.

### Error "Property 'sheetStyle' doesn't exist":
**SOLVED** — renamed to sheetH (Animated.Value), cleared Metro cache.

---

## RECENT WORKFLOWS

### Workflow 1: n8n/Flowise automation (in progress)
- User describes changes → GPT analyzes → Claude generates code
- Not yet integrated with mobile apps
- Purpose: Auto-generate code for backend + frontend

### Workflow 2: Figma → React Native
- Design in Figma → export to Anima → React code
- Not yet set up, but planned for future UI work

---

## EXTERNAL SERVICES

### Backend API
- Default: `http://127.0.0.1:8000` (can override via EXPO_PUBLIC_BACKEND_URL)
- On real device: use local network IP (e.g. 192.168.1.50)

### Nominatim (OpenStreetMap)
- Free, no auth required
- Rate limit: ~1 req/sec, User-Agent required
- Language: add `"accept-language": "ru"` for Russian

### WebSocket (for real-time)
- Not yet fully integrated
- Config in `mobile/passenger/src/ws.js` (stub)

---

## FILE CHANGE FREQUENCY

**Often modified:**
- `mobile/passenger/src/screens/MainScreen.js` — search, sheet UI
- `mobile/passenger/src/components/OrderModal.js` — order flow
- `mobile/driver/src/screens/MapScreen.js` — map, markers
- `mobile/driver/src/components/LeafletMap.js` — map rendering, car icon

**Rarely modified:**
- `mobile/*/src/api.js` — API methods (backend changes first)
- `mobile/*/src/config.js` — constants (only if endpoints change)
- `mobile/*/App.js` — navigation (only for new screens)

---

## NEXT FEATURES (TODO)

- [ ] Complete n8n/Flowise workflow integration
- [ ] Figma design system sync
- [ ] WebSocket real-time updates (not polling)
- [ ] Offline mode support
- [ ] Push notifications
- [ ] Payment integration
- [ ] Driver ratings & reviews

---

## PERFORMANCE NOTES

- LeafletMap renders full Leaflet + SVG car → keep bundle under 100KB
- OrderModal uses Animated API → smooth even on low-end phones
- Nominatim calls are debounced → don't make request on every keystroke
- WebSocket polling (4s interval) → replace with actual WebSocket later

---

## CONTACTS & REFERENCES

- Expo docs: https://docs.expo.dev
- React Native docs: https://reactnative.dev
- Leaflet docs: https://leafletjs.com
- Zustand: https://github.com/pmndrs/zustand
- Nominatim: https://nominatim.org
