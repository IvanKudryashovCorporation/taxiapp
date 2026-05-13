# operator-web

Панель оператора такси-сервиса «Профсоюз Рассвет» (Севастополь). Реализована по
спецификации `design_handoff_taxi_frontend/README.md` §6.3.

## Стек

- **Next.js 14** (App Router)
- **React 18** + **TypeScript 5**
- **Tailwind CSS 3** — токены проброшены через CSS variables в `globals.css`
- **Zustand 5** — UI state
- **axios** — HTTP-клиент (через Next.js rewrites: `/api/backend/*` → `NEXT_PUBLIC_BACKEND_URL`)
- **Inline SVG** иконки (без зависимостей, копия из `icons.jsx`)
- **JS** для общих утилит-форматтеров (`src/lib/utils.js`) и конфигов (`next.config.mjs`, `postcss.config.mjs`)

Никаких UI-библиотек (shadcn/Radix/MUI и пр.) — всё на голом Tailwind по дизайн-токенам.

## Quick start

```bash
cd operator-web
npm install
cp .env.local.example .env.local   # отредактируйте при необходимости
npm run dev
```

Откроется на http://localhost:3001 (порт 3001 чтобы не конфликтовать с Expo `web`).

## Скрипты

| Скрипт | Что делает |
|---|---|
| `npm run dev`       | Dev-сервер с hot-reload |
| `npm run build`     | Production-сборка |
| `npm run start`     | Запуск собранной версии |
| `npm run lint`      | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Структура

```
operator-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← root <html>/<body>
│   │   ├── globals.css              ← CSS variables (токены)
│   │   ├── page.tsx                 ← redirect → /dashboard
│   │   └── (panel)/                 ← группа маршрутов с sidebar+topbar
│   │       ├── layout.tsx           ← Sidebar + Topbar wrapper
│   │       ├── dashboard/page.tsx   ← §6.3.1
│   │       ├── map/page.tsx         ← §6.3.2 MapDispatch
│   │       ├── orders/page.tsx      ← §6.3.3
│   │       ├── drivers/page.tsx     ← §6.3.4
│   │       ├── passengers/page.tsx  ← §6.3.5
│   │       ├── tariffs/page.tsx     ← §6.3.6
│   │       ├── support/page.tsx     ← §6.3.7
│   │       └── analytics/page.tsx   ← §6.3.8
│   ├── components/
│   │   ├── Icon.tsx                 ← SVG-иконки (line, 1.5px stroke)
│   │   ├── Sidebar.tsx              ← 240px, paper2 + hairline-r
│   │   ├── Topbar.tsx               ← 64px, paper + hairline-b
│   │   ├── KpiCard.tsx              ← KPI-карточка
│   │   ├── StatusBadge.tsx          ← ok/warn/bad/stone бейдж
│   │   ├── OrdersChart.tsx          ← SVG line chart (без зависимостей)
│   │   └── PageHeader.tsx           ← заголовок раздела + фильтры
│   ├── lib/
│   │   ├── api.ts                   ← axios + типы
│   │   ├── store.ts                 ← Zustand store
│   │   ├── mock.ts                  ← мок-данные (fallback при недоступном backend)
│   │   └── utils.js                 ← форматтеры (формат денег, дат, статусы)
│   └── theme.ts                     ← типизированные токены (для inline styles)
├── tailwind.config.ts               ← маппинг CSS vars → Tailwind classes
├── next.config.mjs                  ← rewrites для proxy на backend
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

## Дизайн-токены

Все цвета хранятся в `src/app/globals.css` как CSS variables (`--c-ink`, `--c-sun` и т.д.) и
маппятся в Tailwind через `tailwind.config.ts`. То есть в JSX пишется `className="bg-paper text-ink"`,
а реальные значения берутся из CSS-переменных — менять можно в одном месте.

Шрифты: системные fallback (Inter / Helvetica Neue / SF Mono / JetBrains Mono). Для production
рекомендуется загрузить через `next/font/google`, но ради zero-dependency dev'а пока fallback.

## Backend integration

Все запросы идут через `/api/backend/*` (см. `next.config.mjs` → rewrites), который проксирует
их на `NEXT_PUBLIC_BACKEND_URL` (по дефолту `http://127.0.0.1:8000`).

Endpoints, которые ожидает оператор:
- `POST /api/operator/login`
- `GET  /api/operator/dashboard/kpi`
- `GET  /api/operator/dashboard/orders-by-hour`
- `GET  /api/operator/orders` (+ params: status, date range, query)
- `GET  /api/operator/drivers`
- `GET  /api/operator/passengers`
- `GET  /api/operator/map/fleet`

Если эндпоинт пока не реализован на backend — UI берёт данные из `src/lib/mock.ts`,
ошибка просто игнорируется (try/catch). Это позволяет разрабатывать фронт параллельно с бэком.

## Чек-лист дизайна (из спеки §13)

- [x] Все цифры моноширинно (`tabular-nums` или `font-mono`)
- [x] Только один акцент-цвет `sun` на экране
- [x] Hairline-разделители `sand` (1px), не тени
- [x] Spacing с шкалы 8px (Tailwind defaults уже совпадают)
- [x] Радиусы из шкалы `r1..r5` (`rounded-r1` … `rounded-r5`)
- [x] Тени только из `s1..s3` (`shadow-s1` … `shadow-s3`)
- [ ] Карта в бумажном стиле — пока mock-сетка, в production нужен Leaflet/MapLibre
- [x] Анимации с указанными длительностями (CSS transitions)
- [x] Status bar и нотчи учтены — для desktop неактуально

## Что не реализовано

1. **Auth flow** — login-страница пока stub. `setToken()` есть в `lib/api.ts`, но flow
   "ввести email/password → получить token → сохранить в localStorage" не написан.
   Для dev можно подкинуть токен через `.env.local`: `NEXT_PUBLIC_OPERATOR_TOKEN=…` и
   вызвать `setToken(process.env.NEXT_PUBLIC_OPERATOR_TOKEN!)` в `lib/api.ts`.
2. **Real Leaflet map** — на странице `/map` пока сетка-mock с точками.
3. **Drawer с деталями заказа** при клике на строку (`/orders`) — TODO.
4. **WebSocket** для real-time fleet positions (§8.5: throttle 1s) — пока only polling
   через React `useEffect`.
5. **Кастомные шрифты Inter / JetBrains Mono** через `next/font` — fallback на system.
