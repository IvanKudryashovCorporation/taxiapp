// Driver app screens — dark theme accent for night driving feel
const DW = 360, DH = 740;

function DrvLogin() {
  const T = window.T;
  return (
    <div style={{ width: DW, height: DH, background: T.ink, color: T.paper, fontFamily: T.fontUI, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: -200, right: -120, width: 480, height: 480, borderRadius: '50%',
        background: `radial-gradient(circle, ${T.sun}44 0%, transparent 60%)`, filter: 'blur(20px)' }} />
      <div style={{ position: 'absolute', top: 32, left: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: T.sun }} />
        <span style={{ fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.mist }}>Рассвет · Водитель</span>
      </div>

      <div style={{ position: 'absolute', top: 150, left: 24, right: 24 }}>
        <div style={{ fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          Смена<br/>начинается<br/><span style={{ color: T.sun }}>здесь.</span>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 28, background: T.ink2, borderRadius: 20, padding: 20, border: `1px solid ${T.ink3}` }}>
        <div style={{ fontSize: 11, color: T.stone, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Парковый код</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {['7','3','4','2','9','0'].map((d,i) => (
            <div key={i} style={{ flex: 1, height: 56, borderRadius: 10, background: T.ink, border: `1px solid ${T.ink3}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, fontFamily: T.fontMono, color: T.paper }}>{d}</div>
          ))}
        </div>
        <button style={{ width: '100%', height: 56, borderRadius: 14, border: 'none',
          background: T.sun, color: T.ink, fontSize: 16, fontWeight: 600, fontFamily: T.fontUI }}>
          Войти в смену
        </button>
        <div style={{ marginTop: 12, fontSize: 11, color: T.stone, textAlign: 'center' }}>
          АП «Рассвет» · Севастополь · ИНН 7706…
        </div>
      </div>
    </div>
  );
}

function DrvMap() {
  const T = window.T;
  return (
    <div style={{ width: DW, height: DH, background: '#13130F', fontFamily: T.fontUI, position: 'relative', overflow: 'hidden' }}>
      <SevMap width={DW} height={DH} variant="night" car={{x:480,y:640,rot:25}}
        cars={[{x:280,y:560,rot:30,color:T.sun,label:'250₽'},{x:680,y:540,rot:80,color:T.sun,label:'410₽'},{x:380,y:740,rot:-40,color:T.sun,label:'180₽'}]}/>

      {/* top status */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, padding: '10px 14px', background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.ok, boxShadow: `0 0 0 4px ${T.ok}33` }} />
          <span style={{ fontSize: 13, color: T.paper, fontWeight: 500 }}>На линии</span>
          <span style={{ fontSize: 11, color: T.stone, marginLeft: 'auto', fontFamily: T.fontMono }}>4ч 22м</span>
        </div>
        <div style={{ width: 44, height: 44, background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bell" size={18} color={T.paper}/>
        </div>
      </div>

      {/* earnings strip */}
      <div style={{ position: 'absolute', top: 76, left: 16, right: 16, padding: '12px 14px', background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 14, display: 'flex', justifyContent: 'space-between' }}>
        {[
          {l:'Заказов', v:'12'},
          {l:'Заработок', v:'4 280 ₽'},
          {l:'Рейтинг', v:'4,91'},
        ].map((x,i)=>(
          <div key={i} style={{ textAlign: 'center', flex: 1, borderLeft: i>0?`1px solid ${T.ink3}`:'none' }}>
            <div style={{ fontSize: 10, color: T.stone, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{x.l}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.paper, fontFamily: T.fontDisplay, marginTop: 2 }}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* bottom action */}
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 24, background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 18, padding: 14 }}>
        <div style={{ fontSize: 11, color: T.stone, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Свободные заказы рядом · 3</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.sun }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: T.paper, fontWeight: 500 }}>пр. Острякова → Балаклава</div>
            <div style={{ fontSize: 11, color: T.stone, marginTop: 2 }}>1,2 км · ~3 мин до пасс. · 410 ₽</div>
          </div>
          <button style={{ height: 40, padding: '0 16px', borderRadius: 12, background: T.sun, color: T.ink, border: 'none', fontWeight: 600, fontSize: 13 }}>
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}

function DrvNewOrder() {
  const T = window.T;
  return (
    <div style={{ width: DW, height: DH, background: '#13130F', fontFamily: T.fontUI, position: 'relative', overflow: 'hidden' }}>
      <SevMap width={DW} height={DH} variant="night" car={{x:480,y:640,rot:25}} pickup={{x:280,y:540}}
        route="M480 640 C 400 600, 340 580, 280 540"/>

      {/* huge incoming card */}
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 24, background: T.paper, borderRadius: 24, padding: 22, color: T.ink, boxShadow: T.s3 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ padding: '5px 9px', background: T.ink, color: T.sun, fontSize: 11, fontFamily: T.fontMono, borderRadius: 6, letterSpacing: '0.08em' }}>НОВЫЙ ЗАКАЗ</div>
            <span style={{ fontSize: 11, color: T.graphite, fontFamily: T.fontMono }}>#0427-1182</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.ink, fontFamily: T.fontMono, fontVariantNumeric: 'tabular-nums' }}>0:14</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 38, fontFamily: T.fontDisplay, fontWeight: 600, letterSpacing: '-0.02em' }}>410 ₽</span>
          <span style={{ fontSize: 13, color: T.graphite }}>Комфорт · 7,2 км</span>
        </div>

        <div style={{ background: T.paper2, borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.sun }} />
              <div style={{ width: 1, flex: 1, background: T.sand, margin: '4px 0', minHeight: 24 }} />
              <div style={{ width: 10, height: 10, borderRadius: 2, background: T.ink }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>пр. Острякова, 64</div>
              <div style={{ fontSize: 11, color: T.graphite, marginBottom: 12 }}>1,2 км · ~3 мин до пассажира</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>Балаклава, ул. Калича, 14</div>
              <div style={{ fontSize: 11, color: T.graphite }}>через Сапёрный пер. · ~18 мин</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ flex: 1, height: 56, borderRadius: 14, background: T.paper2, color: T.graphite, border: `1px solid ${T.sand}`, fontSize: 14, fontWeight: 500, fontFamily: T.fontUI }}>
            Отклонить
          </button>
          <button style={{ flex: 2, height: 56, borderRadius: 14, background: T.sun, color: T.ink, border: 'none', fontSize: 16, fontWeight: 700, fontFamily: T.fontUI, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Принять <Icon name="arrow" size={18} color={T.ink}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function DrvNav() {
  const T = window.T;
  return (
    <div style={{ width: DW, height: DH, background: '#13130F', fontFamily: T.fontUI, position: 'relative', overflow: 'hidden' }}>
      <SevMap width={DW} height={DH} variant="night" car={{x:480,y:640,rot:25}} pickup={{x:280,y:540}}
        route="M480 640 C 400 600, 340 580, 280 540"/>

      {/* turn-by-turn banner */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, padding: 18, borderRadius: 18, background: T.ink, border: `1px solid ${T.ink3}`, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: T.sun, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v10M12 4l-5 5M12 4l5 5"/>
            <path d="M12 14v6"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.paper, fontFamily: T.fontDisplay, letterSpacing: '-0.01em' }}>320 м</div>
          <div style={{ fontSize: 13, color: T.mist }}>далее налево на пр. Острякова</div>
        </div>
      </div>

      {/* bottom — pickup card */}
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 24, background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 18, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.ink, color: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>МК</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: T.paper, fontWeight: 500 }}>Мария К.</div>
            <div style={{ fontSize: 11, color: T.stone, fontFamily: T.fontMono, marginTop: 2 }}>пр. Острякова, 64 · подъезд 3</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="phone" size={18} color={T.sun}/>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, padding: '10px 0', borderTop: `1px solid ${T.ink3}`, fontSize: 12, color: T.mist, fontFamily: T.fontMono }}>
          <span>До пассажира · 1,2 км</span>
          <span style={{ color: T.sun }}>~3 мин</span>
        </div>
        <button style={{ marginTop: 4, width: '100%', height: 52, borderRadius: 14, background: T.sun, color: T.ink, border: 'none', fontSize: 14, fontWeight: 600 }}>
          Я на месте
        </button>
      </div>
    </div>
  );
}

function DrvRiding() {
  const T = window.T;
  return (
    <div style={{ width: DW, height: DH, background: '#13130F', fontFamily: T.fontUI, position: 'relative', overflow: 'hidden' }}>
      <SevMap width={DW} height={DH} variant="night" car={{x:420,y:600,rot:35}} dropoff={{x:760,y:560}}
        route="M420 600 C 540 580, 640 565, 720 562 S 760 560, 760 560"/>

      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, padding: 14, borderRadius: 14, background: T.ink, border: `1px solid ${T.ink3}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ padding: '5px 9px', background: T.sun, color: T.ink, fontSize: 11, fontFamily: T.fontMono, borderRadius: 6, letterSpacing: '0.08em', fontWeight: 600 }}>В ПОЕЗДКЕ</div>
        <div style={{ flex: 1, fontSize: 13, color: T.paper, fontWeight: 500 }}>Балаклава, Калича 14</div>
        <div style={{ fontSize: 13, color: T.sun, fontFamily: T.fontMono, fontWeight: 600 }}>18 мин</div>
      </div>

      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 24, background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 18, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: T.stone, letterSpacing: '0.06em', textTransform: 'uppercase' }}>К оплате</div>
            <div style={{ fontSize: 32, fontFamily: T.fontDisplay, fontWeight: 700, color: T.paper, marginTop: 2 }}>410 ₽</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: T.stone, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Способ</div>
            <div style={{ fontSize: 13, color: T.paper, fontWeight: 500, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="card" size={16} color={T.sun}/> карта •• 4471
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ width: 52, height: 52, borderRadius: 14, background: T.ink, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chat" size={18} color={T.paper}/>
          </button>
          <button style={{ flex: 1, height: 52, borderRadius: 14, background: T.sun, color: T.ink, border: 'none', fontSize: 14, fontWeight: 600 }}>
            Завершить поездку
          </button>
        </div>
      </div>
    </div>
  );
}

function DrvComplete() {
  const T = window.T;
  return (
    <div style={{ width: DW, height: DH, background: T.ink, fontFamily: T.fontUI, position: 'relative', overflow: 'hidden', color: T.paper }}>
      <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${T.sun}33 0%, transparent 60%)` }} />

      <div style={{ padding: '60px 24px 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.sun, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Icon name="check" size={32} color={T.ink} strokeWidth={2.5}/>
        </div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          Поездка завершена
        </div>
        <div style={{ fontSize: 13, color: T.mist, marginTop: 6, fontFamily: T.fontMono }}>#0427-1182 · 18:42 → 19:04</div>
      </div>

      <div style={{ margin: '32px 16px 0', padding: 20, background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: T.mist }}>Пассажир оплатил</span>
          <span style={{ fontSize: 28, fontWeight: 700, fontFamily: T.fontDisplay, color: T.sun }}>410 ₽</span>
        </div>
        <div style={{ height: 1, background: T.ink3, margin: '14px 0' }}/>
        {[
          ['Тариф «Комфорт»', '380 ₽'],
          ['Время ожидания', '+30 ₽'],
          ['Комиссия парка (12%)', '−49 ₽'],
        ].map(([l,v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', color: T.mist }}>
            <span>{l}</span><span style={{ color: T.paper, fontFamily: T.fontMono }}>{v}</span>
          </div>
        ))}
        <div style={{ height: 1, background: T.ink3, margin: '12px 0' }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
          <span style={{ color: T.paper }}>Чистыми</span>
          <span style={{ color: T.paper, fontFamily: T.fontMono }}>361 ₽</span>
        </div>
      </div>

      <div style={{ margin: '20px 16px 0', padding: 18, background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 18 }}>
        <div style={{ fontSize: 11, color: T.stone, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Оцените пассажира</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          {[1,2,3,4,5].map(n => (
            <Icon key={n} name="star" size={36} color={n<=5?T.sun:T.ink3} fill={n<=5?T.sun:'none'}/>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 24, display: 'flex', gap: 8 }}>
        <button style={{ flex: 1, height: 56, borderRadius: 16, background: T.ink2, border: `1px solid ${T.ink3}`, color: T.paper, fontSize: 14 }}>
          Перерыв
        </button>
        <button style={{ flex: 2, height: 56, borderRadius: 16, background: T.sun, color: T.ink, border: 'none', fontSize: 15, fontWeight: 600 }}>
          Принимать заказы
        </button>
      </div>
    </div>
  );
}

function DrvStats() {
  const T = window.T;
  // bar heights for hours
  const hours = [12,18,24,16,28,42,36,30,22,14,18,26,32,40,28,18,12,8];
  const max = Math.max(...hours);
  return (
    <div style={{ width: DW, height: DH, background: T.ink, color: T.paper, fontFamily: T.fontUI, position: 'relative', overflow: 'auto' }}>
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Icon name="back" size={22} color={T.paper}/>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Смена · 27 апр</span>
        <Icon name="more" size={22} color={T.paper}/>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: 12, color: T.stone, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Заработано сегодня</div>
        <div style={{ fontSize: 52, fontFamily: T.fontDisplay, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 6 }}>
          4 280 <span style={{ fontSize: 28, color: T.mist }}>₽</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, fontSize: 12 }}>
          <Icon name="trend" size={14} color={T.sun}/>
          <span style={{ color: T.sun, fontFamily: T.fontMono }}>+12%</span>
          <span style={{ color: T.mist }}>к среднему за неделю</span>
        </div>
      </div>

      <div style={{ margin: '20px 16px 0', padding: 16, background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: T.paper, fontWeight: 500 }}>По часам</span>
          <span style={{ fontSize: 11, color: T.stone, fontFamily: T.fontMono }}>06:00 — 23:59</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
          {hours.map((h,i) => (
            <div key={i} style={{ flex: 1, height: `${h/max*100}%`, borderRadius: 2,
              background: i===5||i===13 ? T.sun : T.ink3 }}/>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: T.stone, fontFamily: T.fontMono }}>
          <span>06</span><span>10</span><span>14</span><span>18</span><span>22</span>
        </div>
      </div>

      <div style={{ margin: '14px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          {l:'Заказов', v:'12', s:'5 ч 22 мин'},
          {l:'Средний чек', v:'357 ₽', s:'+24 ₽'},
          {l:'Пробег', v:'118 км', s:'из них 76 с пасс.'},
          {l:'Рейтинг', v:'4,91', s:'из 12 оценок'},
        ].map((s,i) => (
          <div key={i} style={{ padding: 14, background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 14 }}>
            <div style={{ fontSize: 10, color: T.stone, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.l}</div>
            <div style={{ fontSize: 22, fontWeight: 600, fontFamily: T.fontDisplay, marginTop: 4 }}>{s.v}</div>
            <div style={{ fontSize: 11, color: T.mist, marginTop: 2 }}>{s.s}</div>
          </div>
        ))}
      </div>

      <div style={{ margin: '14px 16px 24px', padding: 16, background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: T.paper, fontWeight: 500 }}>Смена закрывается через</span>
          <span style={{ fontSize: 16, fontFamily: T.fontMono, color: T.sun, fontWeight: 600 }}>02:38</span>
        </div>
        <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: T.ink3, overflow: 'hidden' }}>
          <div style={{ width: '62%', height: '100%', background: T.sun }}/>
        </div>
      </div>
    </div>
  );
}

function DrvChat() {
  const T = window.T;
  const msgs = [
    { me: false, t: 'Здравствуйте! Я в светлом плаще, у подъезда 3', time: '18:41' },
    { me: true,  t: 'Добрый вечер. Подъезжаю, серая Skoda А247ВО', time: '18:41' },
    { me: false, t: 'Спасибо, увидела', time: '18:42' },
    { me: true,  t: 'Помочь с сумкой?', time: '18:42' },
  ];
  return (
    <div style={{ width: DW, height: DH, background: T.ink, color: T.paper, fontFamily: T.fontUI, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 16px 14px', borderBottom: `1px solid ${T.ink3}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon name="back" size={22} color={T.paper}/>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>МК</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Мария К.</div>
          <div style={{ fontSize: 11, color: T.sun, fontFamily: T.fontMono }}>в сети</div>
        </div>
        <Icon name="phone" size={20} color={T.sun}/>
      </div>

      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ alignSelf: 'center', padding: '4px 10px', background: T.ink2, borderRadius: 8, fontSize: 11, color: T.stone, fontFamily: T.fontMono }}>27 апреля · 18:40</div>
        {msgs.map((m,i) => (
          <div key={i} style={{ alignSelf: m.me ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
            <div style={{ padding: '10px 14px', borderRadius: m.me ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.me ? T.sun : T.ink2, color: m.me ? T.ink : T.paper, fontSize: 14, lineHeight: 1.4 }}>
              {m.t}
            </div>
            <div style={{ fontSize: 10, color: T.stone, marginTop: 4, fontFamily: T.fontMono, textAlign: m.me ? 'right' : 'left' }}>{m.time}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: 12, borderTop: `1px solid ${T.ink3}`, display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, height: 44, padding: '0 16px', background: T.ink2, borderRadius: 14, display: 'flex', alignItems: 'center', color: T.stone, fontSize: 13 }}>Сообщение…</div>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: T.sun, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="send" size={18} color={T.ink}/>
        </div>
      </div>
    </div>
  );
}

function DrvProfile() {
  const T = window.T;
  return (
    <div style={{ width: DW, height: DH, background: T.ink, color: T.paper, fontFamily: T.fontUI, overflow: 'hidden' }}>
      <div style={{ padding: '20px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Профиль</span>
        <Icon name="settings" size={20} color={T.paper}/>
      </div>

      <div style={{ padding: '8px 20px 20px', borderBottom: `1px solid ${T.ink3}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.ink2, color: T.sun,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, fontFamily: T.fontDisplay,
            border: `1.5px solid ${T.sun}` }}>ИП</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600, fontFamily: T.fontDisplay }}>Игорь Полтавец</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.mist, marginTop: 4 }}>
              <Icon name="star" size={13} color={T.sun} fill={T.sun}/>
              <span style={{ fontFamily: T.fontMono }}>4,91</span>
              <span>· 1 248 поездок</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 16 }}>
          {[
            {l:'Стаж', v:'2 г 4 м'},
            {l:'Принято', v:'94%'},
            {l:'Отмен', v:'1,2%'},
          ].map((s,i)=>(
            <div key={i} style={{ padding: '10px 12px', background: T.ink2, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: T.stone, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.l}</div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: T.fontMono, marginTop: 2 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.ink3}` }}>
        <div style={{ fontSize: 11, color: T.stone, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Автомобиль</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: T.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="car" size={22} color={T.sun}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Skoda Octavia · серебристая</div>
            <div style={{ fontSize: 11, color: T.stone, fontFamily: T.fontMono, marginTop: 2 }}>А247ВО · 92 RUS · 2021</div>
          </div>
          <Icon name="arrow" size={18} color={T.stone}/>
        </div>
      </div>

      <div style={{ padding: '8px 0' }}>
        {[
          ['Документы и лицензии', 'shield'],
          ['Выплаты', 'money'],
          ['История поездок', 'list'],
          ['Поддержка парка', 'phone'],
          ['Выйти из смены', 'shift'],
        ].map(([l, ic], i) => (
          <div key={i} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: i<4?`1px solid ${T.ink3}`:'none' }}>
            <Icon name={ic} size={18} color={i===4?T.bad:T.mist}/>
            <span style={{ flex: 1, fontSize: 14, color: i===4?T.bad:T.paper }}>{l}</span>
            <Icon name="arrow" size={16} color={T.stone}/>
          </div>
        ))}
      </div>
    </div>
  );
}

window.DrvLogin = DrvLogin;
window.DrvMap = DrvMap;
window.DrvNewOrder = DrvNewOrder;
window.DrvNav = DrvNav;
window.DrvRiding = DrvRiding;
window.DrvComplete = DrvComplete;
window.DrvStats = DrvStats;
window.DrvChat = DrvChat;
window.DrvProfile = DrvProfile;
