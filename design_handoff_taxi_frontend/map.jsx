// Stylized paper-like Севастополь map (SVG). Pure decorative; reusable.
// Props: width, height, dark, showCar, carPos {x,y,rot}, pickup {x,y}, dropoff {x,y}, route, cars (multiple)

function SevMap({
  width = 360, height = 640, dark = false,
  car = null,            // {x,y,rot}
  pickup = null,         // {x,y}
  dropoff = null,        // {x,y}
  route = null,          // svg path d-string in viewBox 0..1000 x 0..1000
  cars = [],             // [{x,y,rot,color?,label?}]
  zoom = 1,
  showLabels = true,
  variant = 'paper',     // 'paper' | 'night'
}) {
  const T = window.T;
  const isDark = variant === 'night' || dark;

  const bg = isDark ? '#13130F' : T.mapBg;
  const water = isDark ? '#0A1620' : T.mapWater;
  const road = isDark ? '#22221E' : T.mapRoad;
  const roadAlt = isDark ? '#1B1B17' : T.mapRoadAlt;
  const inkColor = isDark ? '#E6E2D8' : T.mapInk;
  const labelColor = isDark ? 'rgba(230,226,216,0.55)' : 'rgba(26,26,23,0.55)';

  // Sevastopol-ish: two long bays cutting in from west, peninsula in middle.
  return (
    <svg width={width} height={height} viewBox="0 0 1000 1000" style={{ display: 'block', background: bg }}>
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)'} strokeWidth="1"/>
        </pattern>
      </defs>

      <rect width="1000" height="1000" fill={bg}/>
      <rect width="1000" height="1000" fill="url(#grid)"/>

      {/* Bays — Севастопольская и Южная */}
      <path d="M -50 380 C 120 360, 280 370, 420 410 C 480 425, 520 430, 560 420 C 600 410, 640 380, 680 370 L -50 370 Z" fill={water}/>
      <path d="M 200 530 C 280 520, 380 525, 460 540 C 520 552, 560 560, 600 555 C 640 548, 660 540, 680 530 L 680 580 C 640 590, 580 600, 500 600 C 380 600, 280 590, 200 580 Z" fill={water}/>
      {/* open sea south-west */}
      <path d="M -50 800 L -50 1050 L 1050 1050 L 1050 880 C 900 870, 750 880, 600 870 C 460 862, 320 852, 180 840 C 60 832, 0 820, -50 800 Z" fill={water}/>

      {/* Roads — main grid */}
      <g stroke={road} strokeWidth="14" fill="none" strokeLinecap="round">
        {/* Проспект Нахимова — главная */}
        <path d="M 100 620 C 240 600, 360 580, 480 560 C 600 540, 720 520, 880 510"/>
        {/* Большая Морская */}
        <path d="M 140 700 C 260 680, 380 660, 500 640 C 620 622, 740 612, 870 605"/>
        {/* Подъездные */}
        <path d="M 320 250 L 360 470"/>
        <path d="M 580 240 L 540 480"/>
        <path d="M 760 260 L 720 490"/>
      </g>
      <g stroke={roadAlt} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.85">
        <path d="M 80 800 L 920 800"/>
        <path d="M 120 880 L 880 880"/>
        <path d="M 220 720 L 220 920"/>
        <path d="M 380 680 L 380 920"/>
        <path d="M 540 660 L 540 940"/>
        <path d="M 700 660 L 700 940"/>
        <path d="M 840 660 L 840 920"/>
        <path d="M 80 60 L 920 60"/>
        <path d="M 80 140 L 920 140"/>
        <path d="M 80 220 L 920 220"/>
        <path d="M 200 60 L 200 280"/>
        <path d="M 420 60 L 420 280"/>
        <path d="M 640 60 L 640 280"/>
        <path d="M 860 60 L 860 280"/>
      </g>

      {/* Parks / squares — Малахов курган, Исторический бульвар */}
      <g fill={isDark ? 'rgba(96,140,90,0.22)' : 'rgba(140,170,120,0.32)'}>
        <ellipse cx="820" cy="680" rx="60" ry="42"/>
        <ellipse cx="280" cy="780" rx="50" ry="36"/>
        <rect x="420" y="760" width="80" height="60" rx="20"/>
      </g>

      {/* Route */}
      {route && (
        <path d={route} fill="none" stroke={T.sun} strokeWidth="6" strokeLinecap="round" strokeDasharray="0" opacity="0.95"/>
      )}

      {/* Dropoff — square pin */}
      {dropoff && (
        <g transform={`translate(${dropoff.x},${dropoff.y})`}>
          <rect x="-10" y="-10" width="20" height="20" rx="3" fill={inkColor}/>
          <rect x="-4" y="-4" width="8" height="8" rx="1" fill={isDark ? '#13130F' : T.paper}/>
        </g>
      )}

      {/* Pickup — circle pin */}
      {pickup && (
        <g transform={`translate(${pickup.x},${pickup.y})`}>
          <circle r="11" fill={T.sun}/>
          <circle r="4" fill={isDark ? '#13130F' : T.paper}/>
        </g>
      )}

      {/* Other cars (operator view) */}
      {cars.map((c, i) => (
        <g key={i} transform={`translate(${c.x},${c.y}) rotate(${c.rot || 0})`}>
          <rect x="-7" y="-12" width="14" height="24" rx="3" fill={c.color || inkColor} stroke={isDark ? '#13130F' : '#fff'} strokeWidth="1.5"/>
          <rect x="-4" y="-8" width="8" height="6" rx="1" fill={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.7)'}/>
          {c.label && <text x="0" y="-16" fontSize="10" textAnchor="middle" fill={inkColor} fontFamily={T.fontMono}>{c.label}</text>}
        </g>
      ))}

      {/* User car */}
      {car && (
        <g transform={`translate(${car.x},${car.y}) rotate(${car.rot || 0})`}>
          <circle r="22" fill={T.sun} opacity="0.18"/>
          <rect x="-9" y="-15" width="18" height="30" rx="4" fill={T.ink} stroke="#fff" strokeWidth="2"/>
          <rect x="-5.5" y="-10" width="11" height="8" rx="1.5" fill="rgba(255,255,255,0.85)"/>
          <rect x="-5.5" y="2" width="11" height="6" rx="1.5" fill="rgba(255,255,255,0.5)"/>
        </g>
      )}

      {/* Labels */}
      {showLabels && (
        <g fontFamily={T.fontUI} fill={labelColor} fontSize="11" letterSpacing="0.04em">
          <text x="120" y="350" textTransform="uppercase">Севастопольская бухта</text>
          <text x="280" y="566" textTransform="uppercase">Южная бухта</text>
          <text x="820" y="666" textAnchor="middle">Малахов курган</text>
          <text x="50" y="980" fontFamily={T.fontMono} fontSize="9" opacity="0.6">44.616° N · 33.525° E</text>
        </g>
      )}
    </svg>
  );
}

window.SevMap = SevMap;
