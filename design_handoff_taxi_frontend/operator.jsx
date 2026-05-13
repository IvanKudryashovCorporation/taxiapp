// Operator web panel — desktop, 1440×900 design size
// 8 sections rendered as standalone screens

const OW = 1440, OH = 900;

function OpShell({ active = 'dashboard', children, badge = null }) {
  const T = window.T;
  const items = [
    {id:'dashboard', l:'Дашборд', i:'grid'},
    {id:'map',       l:'Карта',   i:'loc'},
    {id:'orders',    l:'Заказы',  i:'list', badge: '47'},
    {id:'drivers',   l:'Водители',i:'car',  badge: '128'},
    {id:'passengers',l:'Пассажиры', i:'user'},
    {id:'tariffs',   l:'Тарифы и зоны', i:'zone'},
    {id:'support',   l:'Поддержка', i:'chat', badge: '3'},
    {id:'analytics', l:'Аналитика', i:'trend'},
  ];
  return (
    <div style={{ width: OW, height: OH, background: T.paper, fontFamily: T.fontUI, color: T.ink, display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: T.white, borderRight: `1px solid ${T.sand}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${T.sand}` }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.sun }}/>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Рассвет</span>
            <span style={{ fontSize: 10, fontFamily: T.fontMono, color: T.graphite, letterSpacing: '0.04em' }}>OPERATOR · СЕВ-01</span>
          </div>
        </div>

        <nav style={{ padding: 8, flex: 1, overflow: 'auto' }}>
          {items.map(it => {
            const a = active === it.id;
            return (
              <div key={it.id} style={{ padding: '10px 12px', margin: '2px 0', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
                background: a ? T.ink : 'transparent', color: a ? T.paper : T.ink3 }}>
                <Icon name={it.i} size={17} color={a ? T.sun : T.graphite}/>
                <span style={{ flex: 1, fontSize: 13, fontWeight: a ? 500 : 400 }}>{it.l}</span>
                {it.badge && (
                  <span style={{ fontSize: 10, fontFamily: T.fontMono, padding: '2px 6px', borderRadius: 6,
                    background: a ? 'rgba(255,255,255,0.1)' : T.paper, color: a ? T.paper : T.graphite }}>{it.badge}</span>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: 12, borderTop: `1px solid ${T.sand}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.ink, color: T.sun, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>ЕЛ</div>
          <div style={{ flex: 1, lineHeight: 1.2 }}>
            <div style={{ fontSize: 12, color: T.ink, fontWeight: 500 }}>Елена Лиман</div>
            <div style={{ fontSize: 10, color: T.graphite }}>Старший оператор</div>
          </div>
          <Icon name="settings" size={16} color={T.graphite}/>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}

function OpHeader({ title, sub, right = null }) {
  const T = window.T;
  return (
    <header style={{ padding: '20px 28px', borderBottom: `1px solid ${T.sand}`, background: T.white, display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 600, fontFamily: T.fontDisplay, letterSpacing: '-0.01em' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: T.graphite, marginTop: 4, fontFamily: T.fontMono }}>{sub}</div>}
      </div>
      {right}
      <div style={{ height: 36, padding: '0 14px', borderRadius: 10, background: T.paper, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: T.graphite, minWidth: 280 }}>
        <Icon name="search" size={16} color={T.graphite}/>
        <span>Поиск по заказам, водителям, телефонам…</span>
        <span style={{ marginLeft: 'auto', fontFamily: T.fontMono, fontSize: 11, padding: '2px 6px', background: T.white, borderRadius: 4, color: T.stone }}>⌘K</span>
      </div>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Icon name="bell" size={17} color={T.ink}/>
        <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: T.sun, border: `2px solid ${T.paper}` }}/>
      </div>
    </header>
  );
}

function OpDashboard() {
  const T = window.T;
  const metrics = [
    { l: 'Онлайн-водители', v: '128', d: '+6', total: '· из 184 в смене', accent: true },
    { l: 'Активные заказы', v: '47', d: '+12', total: '· 9 в ожидании' },
    { l: 'Выручка сегодня', v: '184 720 ₽', d: '+18%', total: '· к среднему' },
    { l: 'Средний чек', v: '342 ₽', d: '−4 ₽', total: '· к четвергу', neg: true },
  ];
  // bar chart hours
  const bars = [12,18,32,28,42,38,52,68,82,76,64,58,72,84,68,52,46,38,42,68,82,76,52,28];
  return (
    <OpShell active="dashboard">
      <OpHeader title="Дашборд" sub="Севастополь · 27 апр 2026, 18:42 МСК · смена дневная"
        right={<div style={{ display: 'flex', gap: 6, padding: 4, background: T.paper, borderRadius: 10 }}>
          {['День','Неделя','Месяц'].map((p,i)=>(
            <div key={i} style={{ padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
              background: i===0?T.white:'transparent', color: i===0?T.ink:T.graphite, boxShadow: i===0?T.s1:'none' }}>{p}</div>
          ))}
        </div>}/>

      <div style={{ flex: 1, padding: 24, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {metrics.map((m,i) => (
            <div key={i} style={{ padding: 18, background: m.accent ? T.ink : T.white, color: m.accent?T.paper:T.ink,
              border: m.accent?'none':`1px solid ${T.sand}`, borderRadius: 16 }}>
              <div style={{ fontSize: 11, color: m.accent?T.mist:T.graphite, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{m.l}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 600, fontFamily: T.fontDisplay, letterSpacing: '-0.02em' }}>{m.v}</span>
                <span style={{ fontSize: 12, fontFamily: T.fontMono, color: m.neg ? T.bad : (m.accent?T.sun:T.ok) }}>{m.d}</span>
              </div>
              <div style={{ fontSize: 11, color: m.accent?T.stone:T.graphite, marginTop: 4 }}>{m.total}</div>
            </div>
          ))}
        </div>

        {/* main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          {/* chart */}
          <div style={{ padding: 20, background: T.white, border: `1px solid ${T.sand}`, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Заказы по часам</div>
                <div style={{ fontSize: 11, color: T.graphite, marginTop: 2, fontFamily: T.fontMono }}>00:00 — 23:59 · 27 апр</div>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: T.graphite }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{width:8,height:8,background:T.sun,borderRadius:2}}/>Сегодня</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{width:8,height:8,background:T.sand,borderRadius:2}}/>Среднее</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, position: 'relative' }}>
              {bars.map((h,i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}>
                  <div style={{ height: `${h*0.85}%`, background: i===18?T.sun:i===8||i===19?T.sun:T.ink, borderRadius: 2 }}/>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: T.graphite, fontFamily: T.fontMono }}>
              <span>00</span><span>04</span><span>08</span><span>12</span><span>16</span><span>20</span><span>23</span>
            </div>
          </div>

          {/* incidents feed */}
          <div style={{ padding: 20, background: T.white, border: `1px solid ${T.sand}`, borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Лента событий</span>
              <span style={{ fontSize: 11, color: T.graphite }}>в реальном времени</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { t: 'SOS', s: 'А247ВО · Малахов курган', d: '2 мин назад', warn: true },
                { t: 'Долгая подача', s: '#0427-1182 · 8 мин', d: '4 мин назад' },
                { t: 'Низкий рейтинг рейса', s: '«Иван Г.» — 3,0 ★', d: '12 мин назад' },
                { t: 'Новый водитель в смене', s: 'К412АА · Балаклава', d: '18 мин назад' },
                { t: 'Тариф «Бизнес» × 1.2', s: 'центр · вечерний коэф.', d: '22 мин назад' },
              ].map((e,i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.warn ? T.bad : T.ink, marginTop: 6 }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: T.ink, fontWeight: 500 }}>{e.t}</div>
                    <div style={{ fontSize: 11, color: T.graphite }}>{e.s}</div>
                  </div>
                  <div style={{ fontSize: 10, color: T.stone, fontFamily: T.fontMono, whiteSpace: 'nowrap' }}>{e.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* zones table */}
        <div style={{ padding: 20, background: T.white, border: `1px solid ${T.sand}`, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Зоны спроса</span>
            <span style={{ fontSize: 11, color: T.graphite }}>обновлено 18:40</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              {n:'Центр', d:'высокий', v:'×1,4', cnt:24, c:T.sun},
              {n:'Балаклава', d:'средний', v:'×1,1', cnt:9},
              {n:'Северная', d:'обычный', v:'×1,0', cnt:6},
              {n:'Камышовая', d:'низкий', v:'×0,9', cnt:3, neg:true},
              {n:'Гагаринский', d:'высокий', v:'×1,3', cnt:14, c:T.sun},
            ].map((z,i)=>(
              <div key={i} style={{ padding: 14, border: `1px solid ${T.sand}`, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{z.n}</span>
                  <span style={{ fontSize: 13, fontFamily: T.fontMono, color: z.c||T.ink, fontWeight: 600 }}>{z.v}</span>
                </div>
                <div style={{ fontSize: 11, color: T.graphite, marginTop: 4 }}>{z.d} · {z.cnt} зак.</div>
                <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: T.sand, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100,z.cnt*4)}%`, height: '100%', background: z.c||T.ink }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OpShell>
  );
}

function OpMap() {
  const T = window.T;
  return (
    <OpShell active="map">
      <OpHeader title="Карта-диспетчерская" sub="Севастополь · 128 машин онлайн · 47 заказов в работе"/>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* filters left */}
        <div style={{ width: 280, background: T.white, borderRight: `1px solid ${T.sand}`, padding: 20, overflow: 'auto' }}>
          <div style={{ fontSize: 11, color: T.graphite, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Слои</div>
          {['Свободные водители','Занятые водители','Активные заказы','Заказы в ожидании','Зоны спроса','Тепловая карта'].map((l,i)=>(
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 13, color: T.ink }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${i<3?T.ink:T.sand}`, background: i<3?T.ink:'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i<3 && <Icon name="check" size={12} color={T.paper} strokeWidth={2.5}/>}
              </span>
              <span style={{ flex: 1 }}>{l}</span>
              <span style={{ fontSize: 11, color: T.graphite, fontFamily: T.fontMono }}>{[128,56,47,9,'',''][i]}</span>
            </label>
          ))}

          <div style={{ height: 1, background: T.sand, margin: '16px 0' }}/>
          <div style={{ fontSize: 11, color: T.graphite, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Тариф</div>
          {['Эконом · 84','Комфорт · 32','Бизнес · 8','Минивэн · 4'].map((l,i)=>(
            <div key={i} style={{ padding: '8px 12px', margin: '4px 0', borderRadius: 8, background: i===1?T.paper:'transparent', fontSize: 13, color: T.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.sun }}/>{l}
            </div>
          ))}
        </div>

        {/* map */}
        <div style={{ flex: 1, position: 'relative', background: T.mapBg }}>
          <SevMap width={920} height={780} cars={[
            {x:280,y:540,rot:30,color:T.sun,label:'А247'},
            {x:480,y:660,rot:-20,color:T.sun,label:'К412'},
            {x:600,y:520,rot:80,color:T.ink,label:'занят'},
            {x:340,y:760,rot:-40,color:T.ink},
            {x:720,y:680,rot:60,color:T.sun},
            {x:160,y:620,rot:10,color:T.ink},
            {x:820,y:740,rot:-90,color:T.sun},
            {x:540,y:820,rot:170,color:T.ink},
            {x:400,y:480,rot:0,color:T.sun},
          ]} pickup={{x:520,y:580}} dropoff={{x:780,y:540}}/>

          {/* floating order card */}
          <div style={{ position: 'absolute', top: 24, right: 24, width: 280, padding: 16, background: T.white, borderRadius: 14, boxShadow: T.s2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ padding: '3px 7px', background: T.sun, color: T.ink, fontSize: 10, fontFamily: T.fontMono, fontWeight: 600, borderRadius: 4 }}>В РАБОТЕ</span>
              <span style={{ fontSize: 11, color: T.graphite, fontFamily: T.fontMono }}>#0427-1182</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Острякова, 64 → Балаклава</div>
            <div style={{ fontSize: 11, color: T.graphite, marginTop: 4 }}>Мария К. · Игорь П. · А247ВО</div>
            <div style={{ height: 1, background: T.sand, margin: '12px 0' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.graphite }}>
              <span>До конца · 9 мин</span>
              <span style={{ color: T.ink, fontFamily: T.fontMono, fontWeight: 600 }}>410 ₽</span>
            </div>
          </div>

          {/* legend */}
          <div style={{ position: 'absolute', bottom: 24, left: 24, padding: '10px 14px', background: T.white, borderRadius: 10, boxShadow: T.s1, display: 'flex', gap: 16, fontSize: 11, color: T.ink }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{width:10,height:10,background:T.sun,borderRadius:2}}/>свободен</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{width:10,height:10,background:T.ink,borderRadius:2}}/>занят</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{width:10,height:10,background:T.sun,borderRadius:'50%'}}/>точка подачи</span>
          </div>
        </div>
      </div>
    </OpShell>
  );
}

function OpOrders() {
  const T = window.T;
  const orders = [
    { id: '#0427-1182', s: 'в работе', from: 'Острякова, 64', to: 'Балаклава, Калича 14', drv: 'Игорь П.', pax: 'Мария К.', t: 'Комфорт', p: '410 ₽', m: '18:38' },
    { id: '#0427-1181', s: 'завершён', from: 'Графская пристань', to: 'Парк Победы', drv: 'Антон С.', pax: 'Ольга В.', t: 'Эконом', p: '230 ₽', m: '18:34' },
    { id: '#0427-1180', s: 'отменён', from: 'ТЦ Муссон', to: '5 км Балаклавского шоссе', drv: '—', pax: 'Виктор Р.', t: 'Эконом', p: '— ₽', m: '18:30', warn: true },
    { id: '#0427-1179', s: 'в ожидании', from: 'Аэропорт Бельбек', to: 'центр Севастополя', drv: 'назначается…', pax: 'Алина К.', t: 'Бизнес', p: '1 280 ₽', m: '18:28' },
    { id: '#0427-1178', s: 'в работе', from: 'Камышовое шоссе', to: 'Артбухта', drv: 'Сергей М.', pax: 'Дмитрий О.', t: 'Комфорт', p: '380 ₽', m: '18:24' },
    { id: '#0427-1177', s: 'завершён', from: 'ул. Большая Морская, 43', to: '35-я батарея', drv: 'Анна Х.', pax: 'Игорь Б.', t: 'Эконом', p: '290 ₽', m: '18:18' },
    { id: '#0427-1176', s: 'завершён', from: 'Корнилова, 1', to: 'Учкуевка', drv: 'Олег Д.', pax: 'Лена П.', t: 'Минивэн', p: '540 ₽', m: '18:12' },
    { id: '#0427-1175', s: 'завершён', from: 'пр. Гагарина, 14', to: 'Сапун-гора', drv: 'Михаил Т.', pax: 'Юлия К.', t: 'Эконом', p: '210 ₽', m: '18:08' },
  ];
  const sBg = (s) => s==='в работе'?[T.ink,T.sun]:s==='завершён'?[T.paper,T.ok]:s==='отменён'?[T.paper,T.bad]:[T.sun,T.ink];
  return (
    <OpShell active="orders">
      <OpHeader title="Заказы" sub="247 за сегодня · 47 в работе · 9 в ожидании"/>
      <div style={{ flex: 1, padding: 24, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* filters bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            ['Все','247',true],['В работе','47'],['Ожидают','9'],['Завершены','178'],['Отменены','13'],
          ].map(([l,n,a],i)=>(
            <div key={i} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 500,
              background: a?T.ink:T.white, color: a?T.paper:T.ink, border: `1px solid ${a?T.ink:T.sand}`,
              display: 'flex', alignItems: 'center', gap: 8 }}>
              {l}<span style={{ fontFamily: T.fontMono, color: a?T.sun:T.graphite, fontSize: 11 }}>{n}</span>
            </div>
          ))}
          <div style={{ flex: 1 }}/>
          <div style={{ padding: '8px 14px', border: `1px solid ${T.sand}`, borderRadius: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, background: T.white }}>
            <Icon name="filter" size={14} color={T.graphite}/>Тариф · Все
          </div>
          <div style={{ padding: '8px 14px', border: `1px solid ${T.sand}`, borderRadius: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, background: T.white }}>
            <Icon name="clock" size={14} color={T.graphite}/>Сегодня
          </div>
          <div style={{ padding: '8px 14px', border: `1px solid ${T.sand}`, borderRadius: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, background: T.white }}>
            <Icon name="download" size={14} color={T.graphite}/>Экспорт
          </div>
        </div>

        {/* table */}
        <div style={{ background: T.white, border: `1px solid ${T.sand}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '110px 100px 1.4fr 1.4fr 1fr 1fr 80px 90px 70px',
            gap: 14, padding: '12px 20px', fontSize: 10, color: T.graphite, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: `1px solid ${T.sand}`, background: T.paper2 }}>
            <span>№ заказа</span><span>Статус</span><span>Откуда</span><span>Куда</span><span>Водитель</span><span>Пассажир</span><span>Тариф</span><span style={{textAlign:'right'}}>Сумма</span><span>Время</span>
          </div>
          {orders.map((o,i) => {
            const [bg,fg] = sBg(o.s);
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 100px 1.4fr 1.4fr 1fr 1fr 80px 90px 70px',
                gap: 14, padding: '14px 20px', fontSize: 13, alignItems: 'center', borderBottom: i<orders.length-1?`1px solid ${T.sand}`:'none' }}>
                <span style={{ fontFamily: T.fontMono, color: T.ink, fontWeight: 500 }}>{o.id}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <span style={{ padding: '3px 8px', background: bg, color: fg, fontSize: 10, fontFamily: T.fontMono, fontWeight: 600, borderRadius: 5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{o.s}</span>
                </span>
                <span style={{ color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.from}</span>
                <span style={{ color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.to}</span>
                <span style={{ color: T.graphite }}>{o.drv}</span>
                <span style={{ color: T.graphite }}>{o.pax}</span>
                <span style={{ color: T.ink, fontSize: 12 }}>{o.t}</span>
                <span style={{ color: T.ink, fontFamily: T.fontMono, fontWeight: 500, textAlign: 'right' }}>{o.p}</span>
                <span style={{ fontFamily: T.fontMono, color: T.graphite, fontSize: 12 }}>{o.m}</span>
              </div>
            );
          })}
        </div>
      </div>
    </OpShell>
  );
}

function OpDrivers() {
  const T = window.T;
  const drivers = [
    { fio: 'Полтавец Игорь Александрович', plate:'А247ВО92', car:'Skoda Octavia · 2021', s:'в поездке', r:4.91, rides: 1248, today: '4 280 ₽', t: 'Комфорт', a: true },
    { fio: 'Сидоренко Антон Викторович', plate:'К412АА92', car:'Kia Rio · 2019', s:'свободен', r:4.86, rides: 882, today: '3 120 ₽', t: 'Эконом' },
    { fio: 'Мельникова Анна Юрьевна', plate:'В101ВВ92', car:'Toyota Camry · 2022', s:'свободен', r:4.94, rides: 1622, today: '5 180 ₽', t: 'Бизнес' },
    { fio: 'Терещенко Михаил Иванович', plate:'Е778ЕС92', car:'Hyundai Solaris · 2020', s:'перерыв', r:4.78, rides: 540, today: '1 940 ₽', t: 'Эконом' },
    { fio: 'Дорошенко Олег Петрович', plate:'Н314НА92', car:'VW Caravelle · 2018', s:'в поездке', r:4.82, rides: 712, today: '3 760 ₽', t: 'Минивэн' },
    { fio: 'Хабарова Анастасия Сергеевна', plate:'У900УУ92', car:'Lada Vesta · 2021', s:'оффлайн', r:4.71, rides: 320, today: '— ₽', t: 'Эконом' },
  ];
  const stColor = s => s==='в поездке'?T.sun:s==='свободен'?T.ok:s==='перерыв'?T.warn:T.stone;
  return (
    <OpShell active="drivers">
      <OpHeader title="Водители" sub="184 в смене · 128 онлайн · 56 в поездке"/>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <div style={{ background: T.white, border: `1px solid ${T.sand}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '36px 2fr 1.2fr 1.4fr 110px 80px 90px 110px',
              gap: 12, padding: '12px 20px', fontSize: 10, color: T.graphite, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: `1px solid ${T.sand}`, background: T.paper2 }}>
              <span/><span>ФИО</span><span>Гос. номер</span><span>Авто</span><span>Статус</span><span>Рейтинг</span><span>Поездок</span><span style={{textAlign:'right'}}>Сегодня</span>
            </div>
            {drivers.map((d,i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '36px 2fr 1.2fr 1.4fr 110px 80px 90px 110px',
                gap: 12, padding: '14px 20px', fontSize: 13, alignItems: 'center',
                background: d.a?T.paper:'transparent',
                borderBottom: i<drivers.length-1?`1px solid ${T.sand}`:'none', borderLeft: d.a?`3px solid ${T.sun}`:'3px solid transparent' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: T.ink, color: T.sun, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                  {d.fio.split(' ').slice(0,2).map(s=>s[0]).join('')}
                </div>
                <span style={{ color: T.ink, fontWeight: 500 }}>{d.fio}</span>
                <span style={{ fontFamily: T.fontMono, color: T.ink }}>{d.plate}</span>
                <span style={{ color: T.graphite }}>{d.car}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:stColor(d.s)}}/>{d.s}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: T.fontMono, fontSize: 12 }}>
                  <Icon name="star" size={11} color={T.sun} fill={T.sun}/>{d.r}
                </span>
                <span style={{ fontFamily: T.fontMono, color: T.graphite, fontSize: 12 }}>{d.rides}</span>
                <span style={{ fontFamily: T.fontMono, color: T.ink, fontWeight: 500, textAlign: 'right' }}>{d.today}</span>
              </div>
            ))}
          </div>
        </div>

        {/* selected driver detail */}
        <aside style={{ width: 360, background: T.white, borderLeft: `1px solid ${T.sand}`, padding: 24, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.ink, color: T.sun, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, fontFamily: T.fontDisplay }}>ИП</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Игорь Полтавец</div>
              <div style={{ fontSize: 11, color: T.graphite, fontFamily: T.fontMono, marginTop: 2 }}>id 28411 · с 12 янв 2024</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              ['Рейтинг','4,91'],['Поездок','1 248'],['Принято','94%'],['Отмен','1,2%'],
            ].map(([l,v],i)=>(
              <div key={i} style={{ padding: 12, background: T.paper, borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: T.graphite, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontSize: 18, fontWeight: 600, fontFamily: T.fontDisplay, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: T.graphite, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Документы</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Водительские права','действ. до 06.2029', T.ok],
              ['Лицензия такси','действ. до 12.2027', T.ok],
              ['СТС','действ. до 04.2026', T.warn],
              ['Мед. справка','истекает через 14 дней', T.warn],
            ].map(([l,s,c],i) => (
              <div key={i} style={{ padding: '10px 12px', background: T.paper, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.ink, fontWeight: 500 }}>{l}</div>
                  <div style={{ fontSize: 10, color: T.graphite, fontFamily: T.fontMono }}>{s}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
            <button style={{ padding: '10px 14px', borderRadius: 10, background: T.paper, border: `1px solid ${T.sand}`, fontSize: 13, color: T.ink }}>Сообщение</button>
            <button style={{ padding: '10px 14px', borderRadius: 10, background: T.ink, border: 'none', fontSize: 13, color: T.paper }}>Открыть профиль</button>
          </div>
        </aside>
      </div>
    </OpShell>
  );
}

function OpPassengers() {
  const T = window.T;
  const pax = [
    { fio:'Котляр Мария Александровна', phone:'+7 978 742 08 15', rides:42, rating:4.92, last:'27 апр, 18:38', spent:'18 240 ₽', tag:'постоянный' },
    { fio:'Володина Ольга Петровна', phone:'+7 978 612 44 90', rides:14, rating:5.00, last:'27 апр, 18:34', spent:'4 580 ₽', tag:'новый' },
    { fio:'Романов Виктор Сергеевич', phone:'+7 978 011 22 31', rides:8, rating:3.40, last:'27 апр, 18:30', spent:'1 920 ₽', tag:'риск', warn:true },
    { fio:'Кравченко Алина Игоревна', phone:'+7 978 388 14 02', rides:64, rating:4.88, last:'27 апр, 18:28', spent:'42 110 ₽', tag:'VIP', accent:true },
    { fio:'Орлов Дмитрий Юрьевич', phone:'+7 978 220 90 11', rides:22, rating:4.80, last:'27 апр, 18:24', spent:'7 340 ₽', tag:'обычный' },
    { fio:'Беляков Игорь Олегович', phone:'+7 978 778 14 56', rides:31, rating:4.95, last:'27 апр, 18:18', spent:'9 820 ₽', tag:'обычный' },
  ];
  return (
    <OpShell active="passengers">
      <OpHeader title="Пассажиры" sub="12 480 уникальных · 184 активных за день"/>
      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
          {[
            ['Активных','184','за сегодня'],
            ['Новых','12','за неделю'],
            ['В чёрном списке','3','требуют ревью', true],
            ['LTV (ср.)','8 420 ₽','за 12 мес'],
          ].map(([l,v,s,w],i)=>(
            <div key={i} style={{ padding: 16, background: T.white, border: `1px solid ${T.sand}`, borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: T.graphite, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</div>
              <div style={{ fontSize: 26, fontWeight: 600, fontFamily: T.fontDisplay, marginTop: 6, color: w?T.bad:T.ink }}>{v}</div>
              <div style={{ fontSize: 11, color: T.graphite, marginTop: 2 }}>{s}</div>
            </div>
          ))}
        </div>

        <div style={{ background: T.white, border: `1px solid ${T.sand}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '36px 2fr 1.3fr 80px 90px 1fr 110px 100px',
            gap: 12, padding: '12px 20px', fontSize: 10, color: T.graphite, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: `1px solid ${T.sand}`, background: T.paper2 }}>
            <span/><span>ФИО</span><span>Телефон</span><span>Поездок</span><span>Рейтинг</span><span>Последняя</span><span style={{textAlign:'right'}}>Потрачено</span><span>Метка</span>
          </div>
          {pax.map((p,i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '36px 2fr 1.3fr 80px 90px 1fr 110px 100px',
              gap: 12, padding: '14px 20px', fontSize: 13, alignItems: 'center',
              background: p.accent?T.paper:'transparent',
              borderBottom: i<pax.length-1?`1px solid ${T.sand}`:'none', borderLeft: p.accent?`3px solid ${T.sun}`:'3px solid transparent' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: T.paper, color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                {p.fio.split(' ').slice(0,2).map(s=>s[0]).join('')}
              </div>
              <span style={{ color: T.ink, fontWeight: 500 }}>{p.fio}</span>
              <span style={{ fontFamily: T.fontMono, color: T.graphite, fontSize: 12 }}>{p.phone}</span>
              <span style={{ fontFamily: T.fontMono, color: T.ink, fontSize: 12 }}>{p.rides}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: T.fontMono, fontSize: 12, color: p.rating<4 ? T.bad : T.ink }}>
                <Icon name="star" size={11} color={p.rating<4?T.bad:T.sun} fill={p.rating<4?T.bad:T.sun}/>{p.rating.toFixed(2)}
              </span>
              <span style={{ fontFamily: T.fontMono, color: T.graphite, fontSize: 12 }}>{p.last}</span>
              <span style={{ fontFamily: T.fontMono, color: T.ink, fontWeight: 500, textAlign: 'right' }}>{p.spent}</span>
              <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, fontFamily: T.fontMono, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                background: p.warn?T.bad:p.accent?T.sun:T.paper, color: (p.warn||p.accent)?(p.warn?T.paper:T.ink):T.graphite, justifySelf: 'start' }}>
                {p.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </OpShell>
  );
}

function OpTariffs() {
  const T = window.T;
  const zones = [
    { n: 'Центр (кольцо Нахимова)', area: '4,2 км²', m: '×1,4', d: 'высокий спрос · вечер', a: true },
    { n: 'Балаклава', area: '6,8 км²', m: '×1,1', d: 'средний' },
    { n: 'Гагаринский р-н', area: '12,4 км²', m: '×1,3', d: 'высокий · ТЦ Муссон' },
    { n: 'Северная сторона', area: '18,2 км²', m: '×1,0', d: 'обычный' },
    { n: 'Камышовая бухта', area: '8,6 км²', m: '×0,9', d: 'низкий' },
    { n: 'Аэропорт Бельбек', area: '2,1 км²', m: '×1,5', d: 'фикс. подача +120 ₽' },
  ];
  return (
    <OpShell active="tariffs">
      <OpHeader title="Тарифы и зоны" sub="4 тарифа · 6 зон · 3 коэффициента"/>
      <div style={{ flex: 1, padding: 24, overflow: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* tariffs */}
        <div style={{ background: T.white, border: `1px solid ${T.sand}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Тарифные планы</div>
              <div style={{ fontSize: 11, color: T.graphite }}>базовая стоимость · подача · км · мин</div>
            </div>
            <button style={{ padding: '6px 12px', background: T.ink, color: T.paper, border: 'none', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="plus" size={14} color={T.sun}/>Тариф
            </button>
          </div>

          {[
            { n:'Эконом', icon:'car', base:'120 ₽', km:'14 ₽', min:'7 ₽', a:false },
            { n:'Комфорт', icon:'car', base:'160 ₽', km:'20 ₽', min:'9 ₽', a:true },
            { n:'Бизнес', icon:'car', base:'320 ₽', km:'38 ₽', min:'14 ₽', a:false },
            { n:'Минивэн', icon:'car', base:'220 ₽', km:'26 ₽', min:'11 ₽', a:false },
          ].map((t,i)=>(
            <div key={i} style={{ padding: 14, marginTop: 8, borderRadius: 12, border: `1.5px solid ${t.a?T.ink:T.sand}`,
              background: t.a?T.paper:T.white, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: t.a?T.ink:T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="car" size={20} color={t.a?T.sun:T.ink}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.n}</div>
                <div style={{ fontSize: 11, color: T.graphite, fontFamily: T.fontMono, marginTop: 2 }}>подача {t.base} · {t.km}/км · {t.min}/мин</div>
              </div>
              <div style={{ width: 36, height: 22, borderRadius: 999, background: t.a?T.sun:T.sand, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 2, left: t.a?16:2, width: 18, height: 18, borderRadius: '50%', background: T.white, boxShadow: T.s1 }}/>
              </div>
            </div>
          ))}
        </div>

        {/* zones */}
        <div style={{ background: T.white, border: `1px solid ${T.sand}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Зоны и коэффициенты</div>
              <div style={{ fontSize: 11, color: T.graphite }}>применяются по геозоне</div>
            </div>
            <button style={{ padding: '6px 12px', background: T.ink, color: T.paper, border: 'none', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="plus" size={14} color={T.sun}/>Зона
            </button>
          </div>

          <div style={{ background: T.paper, borderRadius: 12, height: 200, marginBottom: 12, overflow: 'hidden' }}>
            <SevMap width={520} height={200} showLabels={false}/>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {zones.map((z,i)=>(
              <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: z.a?T.paper:'transparent', border: `1px solid ${z.a?T.sand:'transparent'}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: z.a?T.sun:T.ink }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{z.n}</div>
                  <div style={{ fontSize: 11, color: T.graphite }}>{z.area} · {z.d}</div>
                </div>
                <span style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 600, color: z.a?T.sun:T.ink }}>{z.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OpShell>
  );
}

function OpSupport() {
  const T = window.T;
  const chats = [
    { who:'Мария К.', last:'Где водитель? уже 8 минут жду', t:'18:42', n:2, a:true, role:'пассажир' },
    { who:'А247ВО · Игорь П.', last:'Пассажир не выходит, ждать?', t:'18:38', n:1, role:'водитель' },
    { who:'Виктор Р.', last:'Спасибо за компенсацию', t:'18:24', role:'пассажир' },
    { who:'К412АА · Антон С.', last:'Закрылась смена, не могу войти', t:'18:14', role:'водитель' },
    { who:'Алина К.', last:'VIP-карта не привязалась', t:'17:58', role:'пассажир' },
  ];
  return (
    <OpShell active="support">
      <OpHeader title="Поддержка" sub="3 ожидают ответа · средний ответ 1 м 12 с"/>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 360, background: T.white, borderRight: `1px solid ${T.sand}`, overflow: 'auto' }}>
          <div style={{ padding: 16, borderBottom: `1px solid ${T.sand}`, display: 'flex', gap: 6 }}>
            {['Открытые','Все','Закрытые'].map((l,i)=>(
              <div key={i} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: i===0?T.ink:'transparent', color: i===0?T.paper:T.graphite }}>{l}</div>
            ))}
          </div>
          {chats.map((c,i)=>(
            <div key={i} style={{ padding: 14, borderBottom: `1px solid ${T.sand}`, background: c.a?T.paper:T.white, borderLeft: c.a?`3px solid ${T.sun}`:'3px solid transparent', display: 'flex', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: c.role==='водитель'?T.ink:T.sand, color: c.role==='водитель'?T.sun:T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                {c.who.split(' ').slice(-2).map(s=>s[0]).join('').toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{c.who}</span>
                  <span style={{ fontSize: 10, color: T.graphite, fontFamily: T.fontMono }}>{c.t}</span>
                </div>
                <div style={{ fontSize: 12, color: T.graphite, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last}</div>
                <div style={{ fontSize: 10, color: T.stone, fontFamily: T.fontMono, marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{c.role}</div>
              </div>
              {c.n && <div style={{ width: 20, height: 20, borderRadius: 10, background: T.sun, color: T.ink, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}>{c.n}</div>}
            </div>
          ))}
        </div>

        {/* chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.paper2 }}>
          <div style={{ padding: '16px 24px', background: T.white, borderBottom: `1px solid ${T.sand}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.sand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>МК</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Мария К.</div>
              <div style={{ fontSize: 11, color: T.graphite, fontFamily: T.fontMono }}>+7 978 742 08 15 · #0427-1182 · Острякова → Балаклава</div>
            </div>
            <button style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${T.sand}`, background: T.white, fontSize: 12 }}>Открыть заказ</button>
            <button style={{ padding: '8px 14px', borderRadius: 10, background: T.ink, color: T.paper, border: 'none', fontSize: 12 }}>Закрыть тикет</button>
          </div>

          <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
            <div style={{ alignSelf: 'center', padding: '4px 10px', background: T.white, borderRadius: 8, fontSize: 11, color: T.graphite, fontFamily: T.fontMono, border: `1px solid ${T.sand}` }}>27 апреля · 18:40</div>
            {[
              { me:false, t:'Здравствуйте! Заказала такси на Острякова, 64. Уже 8 минут водителя нет на месте' },
              { me:true,  t:'Здравствуйте, Мария. Вижу заказ #0427-1182. Водитель Игорь П. сейчас в 1,2 км от вас. ETA 3 минуты.' },
              { me:false, t:'Где водитель? уже 8 минут жду' },
              { me:true,  t:'Только что связалась с Игорем — попал в пробку на ул. Героев Сталинграда. Будет через 4 минуты. В качестве компенсации спишу 100 ₽ с этой поездки.' },
            ].map((m,i) => (
              <div key={i} style={{ alignSelf: m.me ? 'flex-end' : 'flex-start', maxWidth: '60%' }}>
                <div style={{ padding: '10px 14px', borderRadius: m.me ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.me ? T.ink : T.white, color: m.me ? T.paper : T.ink, fontSize: 13, lineHeight: 1.4, border: m.me?'none':`1px solid ${T.sand}` }}>
                  {m.t}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: 16, background: T.white, borderTop: `1px solid ${T.sand}`, display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, padding: '12px 16px', background: T.paper, borderRadius: 12, fontSize: 13, color: T.graphite }}>Сообщение Марии…</div>
            <button style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${T.sand}`, background: T.white, fontSize: 12 }}>Шаблоны</button>
            <button style={{ width: 44, height: 44, borderRadius: 12, background: T.sun, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="send" size={18} color={T.ink}/>
            </button>
          </div>
        </div>
      </div>
    </OpShell>
  );
}

function OpAnalytics() {
  const T = window.T;
  // 30-day dual line chart
  const days = 30;
  const a = Array.from({length:days}, (_,i)=> 0.4 + 0.4*Math.sin(i*0.4) + 0.2*Math.cos(i*0.9) + i*0.018);
  const b = Array.from({length:days}, (_,i)=> 0.35 + 0.3*Math.sin(i*0.4+1) + 0.15*Math.cos(i*0.7) + i*0.014);
  const W = 880, H = 220, pad = 16;
  const toPath = (arr) => arr.map((v,i)=>{
    const x = pad + (i/(days-1))*(W-2*pad);
    const y = H - pad - v*(H-2*pad);
    return `${i===0?'M':'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  return (
    <OpShell active="analytics">
      <OpHeader title="Аналитика" sub="30 дней · апр 2026"/>
      <div style={{ flex: 1, padding: 24, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            ['GMV','5 240 800 ₽','+18% к марту'],
            ['Поездок','14 882','+12%'],
            ['Активные водители','184','+6 за неделю'],
            ['Cancellation','3,4%','−0,8 п.п.'],
          ].map(([l,v,d],i)=>(
            <div key={i} style={{ padding: 16, background: T.white, border: `1px solid ${T.sand}`, borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: T.graphite, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</div>
              <div style={{ fontSize: 28, fontWeight: 600, fontFamily: T.fontDisplay, marginTop: 6 }}>{v}</div>
              <div style={{ fontSize: 11, color: T.ok, marginTop: 2, fontFamily: T.fontMono }}>{d}</div>
            </div>
          ))}
        </div>

        <div style={{ background: T.white, border: `1px solid ${T.sand}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Выручка vs план</div>
              <div style={{ fontSize: 11, color: T.graphite, fontFamily: T.fontMono }}>1 апр — 30 апр</div>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: T.graphite }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{width:14,height:2,background:T.ink}}/>Факт</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{width:14,height:2,background:T.sun}}/>План</span>
            </div>
          </div>
          <svg width={W} height={H} style={{ display: 'block', width: '100%' }} viewBox={`0 0 ${W} ${H}`}>
            {[0.25,0.5,0.75].map((y,i)=>(
              <line key={i} x1={pad} x2={W-pad} y1={H-pad-y*(H-2*pad)} y2={H-pad-y*(H-2*pad)} stroke={T.sand} strokeDasharray="2 4"/>
            ))}
            <path d={toPath(b)} fill="none" stroke={T.sun} strokeWidth="2"/>
            <path d={toPath(a)} fill="none" stroke={T.ink} strokeWidth="2.5"/>
            {a.map((v,i)=>i%5===0 && (
              <circle key={i} cx={pad + (i/(days-1))*(W-2*pad)} cy={H - pad - v*(H-2*pad)} r="3" fill={T.ink}/>
            ))}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: T.graphite, fontFamily: T.fontMono }}>
            {['1','5','10','15','20','25','30'].map(d=> <span key={d}>{d} апр</span>)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.white, border: `1px solid ${T.sand}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Распределение по тарифам</div>
            {[
              ['Эконом','58%',58,T.ink],
              ['Комфорт','24%',24,T.sun],
              ['Бизнес','11%',11,T.graphite],
              ['Минивэн','7%',7,T.stone],
            ].map(([n,v,p,c],i)=>(
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: T.ink }}>{n}</span>
                  <span style={{ color: T.graphite, fontFamily: T.fontMono }}>{v}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: T.paper, overflow: 'hidden' }}>
                  <div style={{ width: `${p}%`, height: '100%', background: c }}/>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.sand}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Топ-5 направлений</div>
            {[
              ['Центр → Балаклава','1 124','318 ₽'],
              ['Аэропорт → Центр','842','980 ₽'],
              ['ТЦ Муссон → Гагаринский','768','240 ₽'],
              ['Северная → Центр (через мост)','612','420 ₽'],
              ['Центр → 35-я батарея','548','290 ₽'],
            ].map(([r,n,p],i)=>(
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: i<4?`1px solid ${T.sand}`:'none', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.ink, color: T.sun, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, fontFamily: T.fontMono }}>{i+1}</div>
                <span style={{ flex: 1, fontSize: 13, color: T.ink }}>{r}</span>
                <span style={{ fontSize: 12, color: T.graphite, fontFamily: T.fontMono }}>{n} поездок</span>
                <span style={{ fontSize: 13, color: T.ink, fontFamily: T.fontMono, fontWeight: 500, width: 80, textAlign: 'right' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OpShell>
  );
}

window.OpDashboard = OpDashboard;
window.OpMap = OpMap;
window.OpOrders = OpOrders;
window.OpDrivers = OpDrivers;
window.OpPassengers = OpPassengers;
window.OpTariffs = OpTariffs;
window.OpSupport = OpSupport;
window.OpAnalytics = OpAnalytics;
