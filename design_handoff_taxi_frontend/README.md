# Handoff: Taxi Frontend — «Профсоюз Рассвет»

> **Цель: пиксель-в-пиксель копия дизайна, без импровизаций.**
> Этот пакет — спецификация для разработчика, реализующего фронтенд в существующем codebase (`taxiapp/` — Expo / React Native + FastAPI).

---

## ⚠️ ПРАВИЛА ДЛЯ РАЗРАБОТЧИКА (ОБЯЗАТЕЛЬНО ПРОЧИТАТЬ)

**Эта спецификация требует пиксельной точности. Не импровизируй.** Если возникает соблазн «сделать чуть лучше», «более современно», «логичнее» — **остановись и спроси**. Дизайн уже принят и согласован.

### Как работать с этим пакетом

1. **Источник истины — HTML/JSX-файлы в этом пакете.** `Профсоюз Рассвет.html` — открой его в браузере и держи открытым всё время работы. Это твой эталон, на который ты сверяешься после каждого экрана.
2. **Открой DevTools на референс-странице.** На любом элементе кликай «Inspect» — там лежат **точные пиксельные значения** размеров, отступов, цветов, шрифтов. **Не угадывай — измеряй.**
3. **Читай исходники макетов.** `passenger.jsx`, `driver.jsx`, `operator.jsx` содержат точные значения всех `padding`, `marginBottom`, `fontSize`, `lineHeight`, `borderRadius`, `boxShadow`. Скопируй их 1-в-1 в свой код, преобразуя только синтаксис (HTML → React Native View/Text, веб-CSS → StyleSheet).
4. **После каждого экрана — diff-сверка.** Открой свою реализацию рядом с эталоном и сравнивай:
   - совпадают ли размеры элементов (px)?
   - совпадают ли цвета (hex)?
   - совпадают ли шрифты (family, size, weight, line-height)?
   - совпадают ли отступы между элементами (margin/padding)?
   - совпадает ли порядок элементов в списках?
   - совпадают ли тексты и заглушки данных?
   Если **что-то отличается — переделай, не оставляй**.
5. **Не добавляй элементов, которых нет в эталоне.** Никаких «полезных дополнений», поясняющих подписей, лишних иконок, дефолтных skeleton-ов и т.п. То, что не нарисовано — не существует.
6. **Не убирай элементов, которые есть в эталоне.** Если не понимаешь, зачем элемент — спроси, не удаляй.
7. **Тексты и числа копируй буквально.** «Доброе утро, Севастополь.», «Севастопольская бухта», цены `450 ₽`, ETA `4 мин`, рейтинги `4,91`, номера авто `А123ВС 92` — **в том же виде**, включая регистр, точки, неразрывные пробелы. Это не «lorem ipsum», это финальный контент.
8. **Шрифты-цифры — моноширинные везде.** Цены, ETA, время, расстояние, рейтинги, координаты, ID заказов, телефоны, номера авто — `JetBrains Mono` / `SF Mono` / `ui-monospace`. Если в RN нет нужного шрифта — установи через `expo-font` (см. §11).
9. **Только один акцентный цвет на экране** — `#F2A65A` (sun). Если на экране эталона его нет — у тебя на экране его тоже не должно быть.
10. **Не используй сторонние UI-библиотеки** (Material UI, NativeBase, Gluestack, и т.п.). Все компоненты — кастомные на базе React Native built-ins. Это намеренно: библиотеки накладывают свой стиль, который ломает дизайн.

### Workflow: экран за экраном, не пачкой

Делай **по одному экрану**. После каждого:
- запусти приложение, открой экран
- сделай скриншот
- открой эталон в браузере рядом
- сверь по чек-листу выше
- только тогда переходи к следующему

**Не делай 5 экранов разом и не показывай «всё готово» — это гарантированно даст не-1-в-1 результат.**

---

## 1. Overview

Такси-сервис «Профсоюз Рассвет» (Севастополь) — три клиента:

1. **Passenger app** — мобильное приложение пассажира (iOS-first, светлая тема, 360×740 reference)
2. **Driver app** — мобильное приложение водителя (Android-first, тёмная тема, 360×740 reference)
3. **Operator panel** — веб для оператора/диспетчера (1440×900 reference, светлая тема)

Бэкенд (FastAPI + PostgreSQL) уже существует и **не меняется**. См. `taxiapp/CLAUDE.md` в корне проекта для контекста по существующему codebase.

---

## 2. О дизайн-файлах

Файлы в пакете — **дизайн-референсы на HTML/JSX**. Это **прототипы**, показывающие желаемый внешний вид и поведение, **не production-код для копирования напрямую** в RN.

Задача — воссоздать эти макеты в существующей среде:

- `mobile/passenger/`, `mobile/driver/` — Expo (React Native): Zustand для state, React Navigation, axios, WebView+Leaflet для карт, `Animated` API для анимаций. Сохранить.
- `operator-web/` — нужно создать: рекомендуется **Next.js + React + TypeScript**, либо Vite+React+TS. Без UI-библиотек.

JSX-файлы используют веб React + inline styles — **не копировать буквально в RN**, переносить как структурную/стилевую спецификацию в `<View>`, `<Text>`, `StyleSheet.create()`.

---

## 3. Fidelity

**High-fidelity (hifi).** Все цвета, типографика, отступы, скругления, тени — финальные. Воспроизводить пиксель-в-пиксель.

---

## 4. Design Tokens

См. `tokens.js`. Перенести в:
- `mobile/passenger/src/theme.js`
- `mobile/driver/src/theme.js`
- `operator-web/src/theme.ts`

Имена сохранить **без изменений**.

### 4.1. Цвета

#### Нейтральные (тёплые серые)
| Имя | Hex | Назначение |
|---|---|---|
| `ink` | `#0E0E0C` | Основной текст, тёмная поверхность (фон driver app) |
| `ink2` | `#1A1A17` | Карточки на тёмной теме |
| `ink3` | `#2A2A26` | Поднятые поверхности на тёмной теме |
| `graphite` | `#5C5A55` | Вторичный текст |
| `stone` | `#8A8780` | Третичный текст, иконки |
| `mist` | `#B8B5AD` | Disabled, разделители светлые |
| `sand` | `#E6E2D8` | Hairline-границы 1px |
| `paper` | `#F4F1EA` | Фон страницы (светлая тема) |
| `paper2` | `#FBF9F4` | Фон карточек (светлая тема) |
| `white` | `#FFFFFF` | Чисто белый, ввод полей |

#### Акцент — Sunrise (ЕДИНСТВЕННЫЙ)
| Имя | Hex | Назначение |
|---|---|---|
| `sun` | `#F2A65A` | Primary CTA, активные состояния, фирменный акцент |
| `sunDeep` | `#D9823A` | Pressed на акценте, темнее |
| `sunSoft` | `rgba(242,166,90,0.14)` | Tinted background (активные чипы) |

#### Функциональные (только для статуса)
| Имя | Hex | Назначение |
|---|---|---|
| `ok` | `#3D8A6A` | Success / online |
| `warn` | `#C49A2C` | Warning |
| `bad` | `#B0463A` | Error / cancel |
| `link` | `#3F6BB0` | Ссылки |

#### Карта (бумажный стиль)
| Имя | Hex | Назначение |
|---|---|---|
| `mapBg` | `#EFEBE2` | Фон карты |
| `mapWater` | `#D9DCE0` | Море/реки |
| `mapRoad` | `#FFFFFF` | Главные дороги |
| `mapRoadAlt` | `#E8E4DA` | Второстепенные дороги |
| `mapInk` | `#1A1A17` | Подписи и точки |

### 4.2. Типографика

| Роль | Family | Где |
|---|---|---|
| `fontUI` | Inter, Helvetica Neue, system-ui | Основной UI |
| `fontDisplay` | Inter Tight, Inter, system-ui | Заголовки / display |
| `fontMono` | JetBrains Mono, SF Mono, ui-monospace | **Все цифры** |

Шкала размеров (px): `11, 12, 13, 14, 15, 16, 17, 18, 22, 24, 28, 32, 40, 48`. Веса: 400 / 500 / 600 / 700. Не более 3 весов на экране.

### 4.3. Радиусы, тени, spacing

```js
r1=8  r2=12  r3=16  r4=20  r5=28
s1: 0 1px 2px rgba(20,18,14,.06), 0 1px 1px rgba(20,18,14,.04)
s2: 0 4px 14px rgba(20,18,14,.08), 0 1px 2px rgba(20,18,14,.04)
s3: 0 12px 32px rgba(20,18,14,.12), 0 2px 6px rgba(20,18,14,.06)
spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
```

---

## 5. Принципы дизайна

1. Минимализм с воздухом. Лишнего нет.
2. Тёплая монохромная палитра + единственный акцент `sun`.
3. **Цифры — моноширинно** (`fontMono`).
4. Карта в бумажном стиле — не дефолтный OSM.
5. Один `sun`-акцент на экране.
6. Hairline-разделители 1px `sand` (light) / `ink3` (dark) — не тени.
7. Без градиентов, кроме «закатного» glow на login (тёмный→`sun`, opacity 0.35, blur 80).
8. Без эмодзи в production — placeholder в макете заменить SVG-иконками.

---

## 6. Список экранов (всего 22)

### Passenger (5) — iOS-style, светлая тема
| # | Файл-исходник | Функция | Что |
|---|---|---|---|
| P-01 | `passenger.jsx` | `PaxLogin` | Логин (телефон + код) |
| P-02 | `passenger.jsx` | `PaxMain` | Главный — карта + поиск |
| P-03 | `passenger.jsx` | `PaxTariff` | Выбор тарифа + подтверждение |
| P-04 | `passenger.jsx` | `PaxSearching` | Поиск водителя (анимация) |
| P-05 | `passenger.jsx` | `PaxRide` | В поездке |

### Driver (9) — Android-style, тёмная тема
| # | Файл-исходник | Функция | Что |
|---|---|---|---|
| D-01 | `driver.jsx` | `DrvLogin` | Логин (парковый код) |
| D-02 | `driver.jsx` | `DrvMap` | Главный — карта с заказами |
| D-03 | `driver.jsx` | `DrvNewOrder` | Карточка нового заказа |
| D-04 | `driver.jsx` | `DrvNav` | Навигация к пассажиру |
| D-05 | `driver.jsx` | `DrvRiding` | Поездка с пассажиром |
| D-06 | `driver.jsx` | `DrvComplete` | Завершение + рейтинг |
| D-07 | `driver.jsx` | `DrvStats` | Статистика смены |
| D-08 | `driver.jsx` | `DrvChat` | Чат с пассажиром |
| D-09 | `driver.jsx` | `DrvProfile` | Профиль и документы |

### Operator (8) — веб, 1440×900
| # | Файл-исходник | Функция | Что |
|---|---|---|---|
| O-01 | `operator.jsx` | `OpDashboard` | Дашборд |
| O-02 | `operator.jsx` | `OpMap` | Карта-диспетчерская |
| O-03 | `operator.jsx` | `OpOrders` | Заказы + фильтры |
| O-04 | `operator.jsx` | `OpDrivers` | Управление водителями |
| O-05 | `operator.jsx` | `OpPassengers` | Управление пассажирами |
| O-06 | `operator.jsx` | `OpTariffs` | Тарифы и зоны |
| O-07 | `operator.jsx` | `OpSupport` | Чаты поддержки |
| O-08 | `operator.jsx` | `OpAnalytics` | Аналитика и отчёты |

**Шелл оператора (sidebar + header):** функции `OpShell` и `OpHeader` в `operator.jsx`. Он один на все 8 разделов — не переписывай его 8 раз.

---

## 7. Как читать исходники макетов

В каждом JSX-файле каждый экран — отдельная функция. Внутри — inline `style={{...}}`-объекты с **точными значениями**.

Пример из `passenger.jsx`, функция `PaxLogin`:

```jsx
<div style={{
  width: PW, height: PH,           // 360 × 740
  background: T.ink,                // #0E0E0C
  position: 'relative',
  overflow: 'hidden',
  fontFamily: T.fontUI,
}}>
  <div style={{
    position: 'absolute',
    top: -120, left: -80,
    width: 380, height: 380,
    borderRadius: '50%',
    background: 'radial-gradient(...)',
    filter: 'blur(60px)',
  }} />
  ...
</div>
```

В RN это становится:

```jsx
<View style={paxLoginStyles.root}>
  <View style={paxLoginStyles.glow} />
  ...
</View>

const paxLoginStyles = StyleSheet.create({
  root: {
    width: 360, height: 740,
    backgroundColor: T.ink,
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -120, left: -80,
    width: 380, height: 380,
    borderRadius: 190,
    // gradient → use expo-linear-gradient or react-native-svg
    // blur → react-native-skia или layered semi-transparent shapes
  },
  ...
});
```

**Каждое числовое значение в эталоне → то же значение в RN.** Не округляй, не «улучшай».

---

## 8. Работа с картой

В макетах карта — упрощённый SVG-mock из `map.jsx` (бухты Севастополя, дороги, метки). **В production это плейсхолдер.**

В реальном приложении:
- **Driver app:** оставить существующий `mobile/driver/src/components/LeafletMap.js` (Leaflet WebView + кастомная SVG-машинка). Не переписывать.
- **Passenger app:** аналогичный Leaflet WebView, светлый стиль.
- **Operator panel:** Leaflet (через `react-leaflet`) или MapLibre.

**Тайлы в бумажном стиле:** настроить `tileLayer` с custom URL (Stadia Maps `stamen-toner-lite`, MapTiler `paper-style`, или собственный MapLibre style.json). Цвета должны соответствовать `mapBg/mapRoad/mapWater` из §4.1. Если быстро не получается — использовать дефолтные тайлы и применить CSS-фильтр `filter: grayscale(1) sepia(0.15) brightness(1.05)` как **временное** решение.

**Маркеры (общие для всех клиентов):**
- Pickup: `sun` filled circle 14px, white border 3px, тень `s2`.
- Dropoff: `ink` filled circle 14px, white border 3px, тень `s2`.
- Маршрут: `ink` line 4px, `lineCap: round`. На тёмной теме — `paper2`.
- Доступный заказ (driver map): `sun` circle 32px, цена внутри `fontMono` 12/600 `ink`.

---

## 9. Анимации (точные значения)

| Что | Длительность | Easing |
|---|---|---|
| Sheet open/close | 320ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| Modal slide-up | 280ms | spring (tension 80, friction 12) |
| Tariff card select | 180ms | ease-out |
| Searching wave | 2000ms infinite | linear, scale 1→2.5, opacity 0.3→0, stagger 0.6s между 3 кругами |
| Map marker pulse | 1400ms infinite | ease-in-out |
| Button press | 120ms | ease-out, scale 0.97 |

Использовать `Animated` API React Native (`Animated.spring`, `Animated.timing`, `useNativeDriver: true` где возможно).

---

## 10. State, навигация, real-time

См. существующий `taxiapp/CLAUDE.md` — там описано существующее устройство Zustand stores, API endpoints, WebSocket. **Сохранить как есть**, только заменить визуал.

Для operator-web:
- Server state: TanStack Query.
- UI state: Zustand.
- Slices: `dashboard`, `orders`, `drivers`, `passengers`, `mapView`, `chats`.

---

## 11. Шрифты

В `app.json` обоих RN-приложений добавить `expo-font`:

```js
import { useFonts } from 'expo-font';

useFonts({
  'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
  'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
  'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
  'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
  'InterTight-SemiBold': require('./assets/fonts/InterTight-SemiBold.ttf'),
  'InterTight-Bold': require('./assets/fonts/InterTight-Bold.ttf'),
  'JetBrainsMono-Regular': require('./assets/fonts/JetBrainsMono-Regular.ttf'),
  'JetBrainsMono-Medium': require('./assets/fonts/JetBrainsMono-Medium.ttf'),
  'JetBrainsMono-SemiBold': require('./assets/fonts/JetBrainsMono-SemiBold.ttf'),
  'JetBrainsMono-Bold': require('./assets/fonts/JetBrainsMono-Bold.ttf'),
});
```

Скачать с rsms.me/inter, fonts.google.com/specimen/Inter+Tight, fonts.google.com/specimen/JetBrains+Mono.

---

## 12. Иконки

Все иконки — в `icons.jsx` (SVG-компоненты). Для RN перенести через `react-native-svg`:

```bash
npx expo install react-native-svg
```

Имена сохранить: `IconSearch`, `IconPin`, `IconCar`, `IconClock`, `IconStar`, `IconPhone`, `IconChat`, `IconClose`, `IconChevron`, `IconUser`, `IconHome`, `IconBriefcase`, `IconCard`, `IconCash`, `IconArrowUp`, `IconCheck`, `IconLocation`.

**Не использовать** `expo/vector-icons`, `react-native-vector-icons` — они навяжут чужой стиль.

---

## 13. Файлы в пакете

| Файл | Зачем |
|---|---|
| `Профсоюз Рассвет.html` | **Главный эталон.** Открыть в браузере, держать открытым во время работы. |
| `tokens.js` | Дизайн-токены. Источник истины для цветов/шрифтов/радиусов. |
| `icons.jsx` | SVG иконки. |
| `map.jsx` | Бумажная карта (mock Севастополя). |
| `passenger.jsx` | 5 экранов пассажира (`PaxLogin`, `PaxMain`, `PaxTariff`, `PaxSearching`, `PaxRide`). |
| `driver.jsx` | 9 экранов водителя. |
| `operator.jsx` | 8 разделов оператора + `OpShell` + `OpHeader`. |
| `ios-frame.jsx`, `android-frame.jsx`, `browser-window.jsx`, `design-canvas.jsx` | **Только для preview-страницы.** В production не нужны. |

---

## 14. Порядок работы

Строго по этому порядку. **Не перескакивать.**

1. **День 1.** Перенести `tokens.js` в оба RN-проекта и operator-web. Установить шрифты (`expo-font`). Перенести иконки (`react-native-svg`). Не двигаться дальше, пока на тестовом экране не появятся правильные цвета и шрифт.
2. **День 2.** P-01 LoginScreen пассажира. Сверка с эталоном. **Только после approve переходить дальше.**
3. **День 3.** P-02 → P-05 пассажирские экраны, по одному, с verifications.
4. **День 4–5.** D-01 → D-09 водительские экраны, по одному.
5. **День 6.** Bootstrap operator-web (Next.js, layout, sidebar+header через `OpShell`/`OpHeader`).
6. **День 7–8.** O-01 → O-08 разделы оператора, по одному.
7. **День 9.** Карта в бумажном стиле во всех трёх клиентах.
8. **День 10.** Анимации, real-time WebSocket интеграция, polish.

---

## 15. Финальный чек-лист (по каждому экрану)

- [ ] Размеры элементов совпадают с эталоном (px-в-px, проверено через DevTools)
- [ ] Цвета совпадают (hex codes из `tokens.js`, не похожие)
- [ ] Шрифты совпадают (family, size, weight, line-height — все четыре)
- [ ] Цифры моноширинно (`JetBrainsMono`)
- [ ] Только один акцент `sun` на экране
- [ ] Hairline 1px `sand`/`ink3`, не тени
- [ ] Тексты-плейсхолдеры скопированы дословно (включая «Севастопольская бухта», номера авто, имена)
- [ ] Нет лишних элементов, которых нет в эталоне
- [ ] Нет недостающих элементов из эталона
- [ ] Анимации с правильными длительностями и easing (§9)
- [ ] Safe-area соблюдён (status bar, home indicator)
- [ ] Скриншот реализации положен рядом с эталонным — отличий нет (или минимальны и обоснованы)

---

## 16. Если что-то непонятно

**Не угадывай. Не «улучшай». Не молчи.**

Если требование непонятно или в эталоне баг — задай вопрос с конкретной ссылкой:
> «P-03, sheet-section "Тарифы": в эталоне 3 карточки с фиксированной шириной 124px, но при экране 360px они не помещаются с заявленными отступами 16+12+12+16. Что делать?»

Это всегда лучше, чем «я подумал, что лучше будет иначе».
