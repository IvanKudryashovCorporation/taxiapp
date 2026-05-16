# shared/map — единая карта для 3 приложений

Это **единственное** место где определены стили Google Maps для всего проекта.

## Файлы

| Файл | Назначение |
|------|------------|
| `style.js` | `LIGHT_STYLE` и `DARK_STYLE` массивы — главное место правки |
| `buildHTML.js` | Возвращает полный HTML-документ для WebView/iframe |
| `README.md` | Этот файл |

## Где это используется

```
shared/map/style.js
  ├──→ shared/map/buildHTML.js
  ├──→ operator-web/src/components/AppMap.tsx    (web рендер)
  ├──→ mobile/driver/src/components/LeafletMap.js (WebView рендер)
  └──→ mobile/passenger/src/components/LeafletMap.js (WebView рендер)
```

**Правило**: правки стиля делаются ТОЛЬКО в `style.js`. Любой код в трёх приложениях, дублирующий стиль, считается багом.

## Как тестировать изменения

1. Открыть `operator-web/src/app/(panel)/map/preview/page.tsx` в браузере на http://localhost:3001/map/preview — там обе карты бок-о-бок.
2. Правим `shared/map/style.js`.
3. Reload страницы в браузере — стиль обновится сразу.
4. Когда выглядит ок — раскатывается на mobile автоматически (driver/passenger импортируют тот же файл).

## Ограничения Google Maps Styling API

- `weight` в `stylers` — **только integer** (1, 2, 3, 4). Float (1.5) тихо ломает весь стиль.
- `featureType` и `elementType` — валидные значения см. https://developers.google.com/maps/documentation/javascript/style-reference
- `visibility: "on"` вместе с `color` в одном `stylers[]` элементе — допустимо.
- Шрифт подписей (размер, семейство) — **нельзя** изменить через стили. Контролируется Google по zoom-уровню.
- Номера домов появляются с zoom 17+ там где Google имеет данные.
