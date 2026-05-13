// Passenger app screens — minimal monochrome + sunrise accent
// All screens are 360×740 (typical phone content area excluding chrome)

const PW = 360, PH = 740;

// Tiny status bar baked into screens (since we frame outside, but screens still need internal bar look)
function PaxLogin() {
  const T = window.T;
  return (
    <div style={{ width: PW, height: PH, background: T.ink, color: T.paper, fontFamily: T.fontUI, position: 'relative', overflow: 'hidden' }}>
      {/* sunrise glow */}
      <div style={{ position: 'absolute', top: -180, left: -120, width: 540, height: 540, borderRadius: '50%',
        background: `radial-gradient(circle, ${T.sun}55 0%, transparent 60%)`, filter: 'blur(20px)' }} />
      <div style={{ position: 'absolute', top: 60, right: -80, width: 280, height: 280, borderRadius: '50%',
        background: `radial-gradient(circle, ${T.sun}33 0%, transparent 70%)` }} />

      <div style={{ position: 'absolute', top: 32, left: 24, right: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: T.sun }} />
          <span style={{ fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.mist }}>Рассвет</span>
        </div>
        <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.stone }}>v1.4</span>
      </div>

      <div style={{ position: 'absolute', top: 180, left: 24, right: 24 }}>
        <div style={{ fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 38, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          Доброе<br/>утро,<br/><span style={{ color: T.sun }}>Севастополь.</span>
        </div>
        <div style={{ marginTop: 16, fontSize: 14, color: T.mist, lineHeight: 1.5, maxWidth: 280 }}>
          Войдите по номеру телефона. Мы отправим код подтверждения.
        </div>
      </div>

      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 28, background: T.paper, borderRadius: 24, padding: 20, color: T.ink, boxShadow: T.s3 }}>
        <div style={{ fontSize: 11, color: T.graphite, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Номер телефона</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: `1px solid ${T.sand}` }}>
          <div style={{ fontSize: 22, fontWeight: 500 }}>+7</div>
          <div style={{ fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: '0.02em' }}>978 ▎742-08-15</div>
        </div>
        <button style={{ marginTop: 18, width: '100%', height: 56, borderRadius: 16, border: 'none',
          background: T.ink, color: T.paper, fontSize: 16, fontWeight: 500, fontFamily: T.fontUI,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          Получить код <Icon name="arrow" size={18} color={T.paper}/>
        </button>
        <div style={{ marginTop: 14, fontSize: 11, color: T.stone, lineHeight: 1.5, textAlign: 'center' }}>
          Нажимая «Получить код», вы соглашаетесь<br/>с условиями обслуживания.
        </div>
      </div>
    </div>
  );
}

function PaxMain() {
  const T = window.T;
  return (
    <div style={{ width: PW, height: PH, background: T.paper, fontFamily: T.fontUI, position: 'relative', overflow: 'hidden' }}>
      <SevMap width={PW} height={PH} pickup={{x:340,y:620}} />
      {/* top floating bar */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', gap: 8 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: T.white, boxShadow: T.s2,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="menu" size={20} color={T.ink}/>
        </div>
        <div style={{ flex: 1, height: 44, borderRadius: 14, background: T.white, boxShadow: T.s2,
          display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, color: T.graphite, fontSize: 13 }}>
          <Icon name="search" size={18} color={T.graphite}/>
          <span style={{ color: T.ink, fontWeight: 500 }}>Куда едем?</span>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.ink, boxShadow: T.s2,
          color: T.paper, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          АК
        </div>
      </div>

      {/* my-location FAB */}
      <div style={{ position: 'absolute', right: 16, bottom: 380, width: 44, height: 44, borderRadius: 14,
        background: T.white, boxShadow: T.s2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="loc" size={20} color={T.ink}/>
      </div>

      {/* bottom sheet */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: T.white,
        borderRadius: '24px 24px 0 0', padding: '12px 20px 24px', boxShadow: '0 -8px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.sand, margin: '0 auto 14px' }} />

        <div style={{ background: T.paper, borderRadius: 16, padding: '14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: `1px dashed ${T.sand}` }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.sun }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.graphite, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Откуда</div>
              <div style={{ fontSize: 14, color: T.ink, fontWeight: 500 }}>пр. Нахимова, 4</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: T.ink }} />
            <div style={{ flex: 1, color: T.stone, fontSize: 14 }}>Куда едем?</div>
            <Icon name="plus" size={16} color={T.graphite}/>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14, overflow: 'hidden' }}>
          {[
            { i: 'home', l: 'Дом · Героев Сталинграда' },
            { i: 'briefcase', l: 'Работа' },
            { i: 'heart', l: 'Графская пристань' },
          ].map((x,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
              border: `1px solid ${T.sand}`, borderRadius: 12, fontSize: 13, color: T.ink, whiteSpace: 'nowrap' }}>
              <Icon name={x.i} size={15} color={T.graphite}/>{x.l}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: T.graphite, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <span>Последние</span><span>Все →</span>
        </div>
        <div style={{ marginTop: 8 }}>
          {['ТЦ «Муссон» · ул. Вакуленчука, 29','Аквамарин · набережная Корнилова, 1'].map((t,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i===0?`1px solid ${T.sand}`:'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="clock" size={16} color={T.graphite}/>
              </div>
              <div style={{ flex: 1, fontSize: 14, color: T.ink }}>{t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaxTariff() {
  const T = window.T;
  const tariffs = [
    { n: 'Эконом', p: '210 ₽', t: '4 мин', a: false, sub: 'Lada, Kia Rio' },
    { n: 'Комфорт', p: '340 ₽', t: '6 мин', a: true,  sub: 'Skoda Octavia, Camry' },
    { n: 'Бизнес', p: '620 ₽', t: '11 мин', a: false, sub: 'E-class, Audi A6' },
    { n: 'Минивэн', p: '480 ₽', t: '8 мин', a: false, sub: 'до 6 пассажиров' },
  ];
  return (
    <div style={{ width: PW, height: PH, background: T.paper, fontFamily: T.fontUI, position: 'relative', overflow: 'hidden' }}>
      <div style={{ height: 280, position: 'relative' }}>
        <SevMap width={PW} height={280}
          pickup={{x:340,y:620}} dropoff={{x:760,y:560}}
          route="M340 620 C 460 600, 560 580, 660 575 S 760 560, 760 560"/>
        <div style={{ position: 'absolute', top: 16, left: 16, width: 44, height: 44, borderRadius: 14, background: T.white, boxShadow: T.s2,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" size={20} color={T.ink}/>
        </div>
      </div>

      <div style={{ background: T.white, borderRadius: '24px 24px 0 0', marginTop: -24, position: 'relative', padding: '14px 20px 100px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.sand, margin: '0 auto 16px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: T.graphite, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Маршрут · 6,4 км</div>
            <div style={{ fontSize: 14, color: T.ink, fontWeight: 500 }}>Нахимова, 4 → Малахов курган</div>
          </div>
          <div style={{ fontSize: 11, color: T.graphite, fontFamily: T.fontMono }}>~14 мин</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tariffs.map((t,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14,
              border: `1.5px solid ${t.a ? T.ink : T.sand}`, borderRadius: 16,
              background: t.a ? T.ink : T.white, color: t.a ? T.paper : T.ink }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: t.a ? 'rgba(255,255,255,0.08)' : T.paper,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="car" size={22} color={t.a ? T.sun : T.ink}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{t.n}</span>
                  <span style={{ fontSize: 11, color: t.a ? T.mist : T.graphite, fontFamily: T.fontMono }}>· {t.t}</span>
                </div>
                <div style={{ fontSize: 12, color: t.a ? T.mist : T.graphite, marginTop: 2 }}>{t.sub}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, fontFamily: T.fontDisplay }}>{t.p}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <div style={{ flex: 1, padding: '12px 14px', border: `1px solid ${T.sand}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="card" size={18} color={T.ink}/>
              <span style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>•• 4471</span>
            </div>
            <span style={{ fontSize: 11, color: T.graphite }}>Изменить</span>
          </div>
          <div style={{ padding: '12px 14px', border: `1px solid ${T.sand}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={16} color={T.ink}/>
            <span style={{ fontSize: 13 }}>Промо</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 24,
        height: 60, borderRadius: 18, background: T.sun, color: T.ink, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 22px', boxShadow: T.s2 }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Заказать Комфорт</span>
        <span style={{ fontSize: 17, fontWeight: 700, fontFamily: T.fontDisplay }}>340 ₽</span>
      </div>
    </div>
  );
}

function PaxSearching() {
  const T = window.T;
  return (
    <div style={{ width: PW, height: PH, background: T.paper, fontFamily: T.fontUI, position: 'relative', overflow: 'hidden' }}>
      <SevMap width={PW} height={PH} pickup={{x:340,y:620}} dropoff={{x:760,y:560}}
        route="M340 620 C 460 600, 560 580, 660 575 S 760 560, 760 560"
        cars={[{x:280,y:540,rot:30},{x:480,y:660,rot:-20},{x:600,y:520,rot:80}]}/>

      {/* searching pulse over map */}
      <div style={{ position: 'absolute', top: 280, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${T.sun}`, opacity: 0.25, transform: 'scale(2)' }}/>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${T.sun}`, opacity: 0.5, transform: 'scale(1.5)' }}/>
          <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', background: T.sun, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="car" size={28} color={T.ink}/>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, padding: '14px 18px', borderRadius: 16, background: T.white, boxShadow: T.s2, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="clock" size={18} color={T.ink}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>Ищем водителя…</div>
          <div style={{ fontSize: 11, color: T.graphite, fontFamily: T.fontMono }}>обычно 1–3 минуты</div>
        </div>
        <div style={{ fontSize: 22, fontFamily: T.fontMono, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>00:42</div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: T.white, borderRadius: '24px 24px 0 0', padding: '12px 20px 24px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.sand, margin: '0 auto 16px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: T.graphite, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Тариф</div>
            <div style={{ fontSize: 16, color: T.ink, fontWeight: 600, marginTop: 2 }}>Комфорт · 340 ₽</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: T.graphite, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Откуда</div>
            <div style={{ fontSize: 13, color: T.ink, marginTop: 2 }}>Нахимова, 4</div>
          </div>
        </div>

        {/* dot scrubber */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 18 }}>
          {[...Array(20)].map((_,i) => (
            <div key={i} style={{ width: 4, height: i<7?14:6, borderRadius: 2,
              background: i<7?T.sun:T.sand }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ flex: 1, height: 52, borderRadius: 14, background: T.paper, color: T.ink, border: 'none', fontSize: 14, fontWeight: 500, fontFamily: T.fontUI }}>
            Изменить тариф
          </button>
          <button style={{ flex: 1, height: 52, borderRadius: 14, background: T.ink, color: T.paper, border: 'none', fontSize: 14, fontWeight: 500, fontFamily: T.fontUI }}>
            Отменить
          </button>
        </div>
      </div>
    </div>
  );
}

function PaxRide() {
  const T = window.T;
  return (
    <div style={{ width: PW, height: PH, background: T.paper, fontFamily: T.fontUI, position: 'relative', overflow: 'hidden' }}>
      <SevMap width={PW} height={PH}
        car={{x:420,y:600,rot:35}}
        pickup={{x:340,y:620}} dropoff={{x:760,y:560}}
        route="M420 600 C 540 580, 640 565, 720 562 S 760 560, 760 560"/>

      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, padding: '12px 14px', borderRadius: 16, background: T.white, boxShadow: T.s2,
        display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ padding: '6px 10px', background: T.ink, color: T.sun, fontSize: 11, fontFamily: T.fontMono, borderRadius: 8, letterSpacing: '0.08em' }}>В ПУТИ</div>
        <div style={{ flex: 1, fontSize: 13, color: T.ink, fontWeight: 500 }}>Малахов курган</div>
        <div style={{ fontSize: 12, color: T.graphite, fontFamily: T.fontMono }}>~9 мин</div>
      </div>

      {/* bottom sheet — driver card */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: T.white, borderRadius: '24px 24px 0 0', padding: '12px 20px 24px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.sand, margin: '0 auto 14px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: T.ink, fontFamily: T.fontDisplay }}>ИП</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>Игорь П.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.graphite, marginTop: 2 }}>
              <Icon name="star" size={13} color={T.sun} fill={T.sun}/>
              <span>4,92 · 1 248 поездок</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chat" size={18} color={T.ink}/>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="phone" size={18} color={T.paper}/>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, padding: 12, background: T.paper, borderRadius: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: T.graphite, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Skoda Octavia · серебристая</div>
            <div style={{ fontSize: 16, color: T.ink, fontWeight: 600, fontFamily: T.fontMono, marginTop: 2 }}>А 247 ВО · 92</div>
          </div>
          <div style={{ padding: '8px 12px', border: `1.5px solid ${T.ink}`, borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: T.fontMono, color: T.ink }}>А247ВО</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, fontSize: 13 }}>
          <span style={{ color: T.graphite }}>Поездка</span>
          <span style={{ color: T.ink, fontWeight: 600, fontFamily: T.fontDisplay, fontSize: 18 }}>340 ₽</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button style={{ flex: 1, height: 48, borderRadius: 14, background: T.paper, border: 'none', fontSize: 13, color: T.ink, fontFamily: T.fontUI }}>
            Поделиться поездкой
          </button>
          <button style={{ width: 48, height: 48, borderRadius: 14, background: T.paper, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shield" size={18} color={T.ink}/>
          </button>
        </div>
      </div>
    </div>
  );
}

window.PaxLogin = PaxLogin;
window.PaxMain = PaxMain;
window.PaxTariff = PaxTariff;
window.PaxSearching = PaxSearching;
window.PaxRide = PaxRide;
