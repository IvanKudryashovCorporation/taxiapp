// Shared inline icons — line-only, 1.5px stroke, monochrome
// Usage: <Icon name="search" size={20} color="#000" />

const ICON_PATHS = {
  search:   <><circle cx="11" cy="11" r="7"/><path d="M16 16l4 4"/></>,
  pin:      <><path d="M12 21s7-7.6 7-12a7 7 0 1 0-14 0c0 4.4 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></>,
  arrow:    <path d="M5 12h14M13 6l6 6-6 6"/>,
  back:     <path d="M19 12H5M11 18l-6-6 6-6"/>,
  close:    <path d="M6 6l12 12M18 6l-6 6-6 6"/>,
  menu:     <path d="M4 7h16M4 12h16M4 17h16"/>,
  more:     <><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></>,
  user:     <><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></>,
  chat:     <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>,
  phone:    <path d="M5 4h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>,
  star:     <path d="M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17.3 6.5 20l1-6.1L3 9.5l6.3-.9z"/>,
  card:     <><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/></>,
  cash:     <><rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="12" cy="12.5" r="3"/></>,
  car:      <><path d="M5 16h14l-1.5-6.2A2 2 0 0 0 15.6 8H8.4a2 2 0 0 0-1.9 1.4L5 16z"/><circle cx="8" cy="17.5" r="1.5"/><circle cx="16" cy="17.5" r="1.5"/></>,
  clock:    <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  home:     <><path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/></>,
  briefcase:<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></>,
  heart:    <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z"/>,
  shield:   <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>,
  bell:     <><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5z"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5"/></>,
  list:     <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></>,
  grid:     <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  trend:    <path d="M3 17l6-6 4 4 8-8M14 7h7v7"/>,
  filter:   <path d="M4 5h16l-6 8v6l-4-2v-4z"/>,
  download: <><path d="M12 4v12M6 12l6 6 6-6"/><path d="M4 20h16"/></>,
  plus:     <path d="M12 5v14M5 12h14"/>,
  check:    <path d="M5 12l5 5 9-11"/>,
  shift:    <path d="M12 4v8l5 3"/>,
  loc:      <><circle cx="12" cy="12" r="8"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/></>,
  send:     <path d="M21 3L3 11l8 2 2 8z"/>,
  zone:     <><path d="M5 5h14v14H5z"/><path d="M5 12h14M12 5v14"/></>,
  money:    <><circle cx="12" cy="12" r="9"/><path d="M9 14c0 1.5 1.3 2 3 2s3-.5 3-2-1.3-2-3-2-3-.5-3-2 1.3-2 3-2 3 .5 3 2"/><path d="M12 7v10"/></>,
  nav:      <path d="M12 3l9 18-9-5-9 5z"/>,
  warn:     <><path d="M12 4l10 17H2z"/><path d="M12 10v5M12 18v.5"/></>,
};

function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.5, fill = 'none', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      {ICON_PATHS[name] || null}
    </svg>
  );
}

window.Icon = Icon;
