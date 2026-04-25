import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Animated,
  View, Text, TextInput, Pressable, ScrollView, FlatList,
  StyleSheet, ActivityIndicator, Alert, Dimensions, Keyboard, Platform, PanResponder,
} from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStore } from "../state";
import { api, reverseGeocode, geocodeSearch, getRoute } from "../api";
import { CAR_CLASSES } from "../config";
import LeafletMap from "../components/LeafletMap";
import NavBar from "../components/NavBar";
import ChatBubble from "../components/ChatBubble";
import OrderModal from "../components/OrderModal";

const DEFAULT_LAT = 55.7558;
const DEFAULT_LON = 37.6173;
const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const SHEET_EXPANDED_H  = SCREEN_H * 0.60;
const SHEET_COLLAPSED_H = 90;

/* ─── Light-theme palette ─── */
const L = {
  sheet:   "#FFFFFF",
  bg:      "#F7F7F7",
  input:   "#F2F2F2",
  border:  "#EBEBEB",
  text:    "#1A1A1A",
  muted:   "#8A8A8A",
  dim:     "#C8C8C8",
  accent:  "#F5CF31",
  actText: "#1A1A1A",
  dotA:    "#F5CF31",
  dotB:    "#1A1A1A",
  danger:  "#FF5A4D",
  info:    "#5CB8FF",
  success: "#3CD48D",
};

/* ─── Utilities ─── */
function formatMoney(v) { return `${Math.round(Number(v || 0)).toLocaleString("ru-RU")} ₽`; }
function formatDistance(m) { return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${Math.round(m)} м`; }
function formatDuration(s) {
  const min = Math.round(s / 60);
  if (min < 60) return `~${min} мин`;
  return `~${Math.floor(min / 60)} ч ${min % 60} мин`;
}
function humanStatus(s) {
  return ({
    created: "новый", searching_driver: "ищем водителя", accepted: "водитель назначен",
    driver_on_the_way: "водитель в пути", driver_nearby_leave_now: "водитель рядом",
    arrived: "водитель на месте", ride_in_progress: "поездка идёт",
    completed: "поездка завершена", cancelled: "отменён",
  }[s] || s || "—");
}

const QUICK_PLACES = [
  { icon: "🏠", label: "Дом",      hint: "3 мин"  },
  { icon: "💼", label: "Работа",   hint: "24 мин" },
  { icon: "🛍", label: "Торговый", hint: "18 мин" },
  { icon: "＋", label: "Добавить", hint: ""       },
];

/* ─── Pickup pin ─── */
function PickupPin({ loading }) {
  return (
    <View style={pin.wrap}>
      <View style={pin.box}>
        {loading
          ? <ActivityIndicator color="#1A1A1A" size={22} />
          : <Text style={{ fontSize: 24 }}>🧍</Text>
        }
      </View>
      <View style={pin.stem} />
    </View>
  );
}
const pin = StyleSheet.create({
  wrap: { alignItems: "center" },
  box:  {
    width: 52, height: 52, backgroundColor: L.accent, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 12,
  },
  stem: { width: 4, height: 20, backgroundColor: L.actText, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
});

/* ─── Main Screen ─── */
export default function MainScreen() {
  const cityLat  = useStore((s) => s.cityLat);
  const cityLon  = useStore((s) => s.cityLon);
  const cityName = useStore((s) => s.cityName);
  const currentOrder = useStore((s) => s.currentOrder);
  const history      = useStore((s) => s.history);
  const wsStatus     = useStore((s) => s.wsStatus);
  const refreshState = useStore((s) => s.refreshState);
  const logout       = useStore((s) => s.logout);
  const setLastQuote = useStore((s) => s.setLastQuote);

  const mapRef       = useRef(null);
  const geocodeTimer = useRef(null);
  const searchTimer  = useRef(null);

  const initLat = cityLat || DEFAULT_LAT;
  const initLon = cityLon || DEFAULT_LON;

  const [tab,           setTab]           = useState(currentOrder ? "ride" : "create");
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [keyboardH,     setKeyboardH]     = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardH(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardH(0)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  const sheetH     = useRef(new Animated.Value(SHEET_EXPANDED_H)).current;
  const dragStartH = useRef(SHEET_EXPANDED_H);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  (_, g) => Math.abs(g.dy) > 5,
    onPanResponderGrant: () => {
      sheetH.stopAnimation((val) => { dragStartH.current = val; });
    },
    onPanResponderMove: (_, g) => {
      const next = dragStartH.current - g.dy;
      sheetH.setValue(Math.max(SHEET_COLLAPSED_H, Math.min(SHEET_EXPANDED_H, next)));
    },
    onPanResponderRelease: (_, g) => {
      const currentH = dragStartH.current - g.dy;
      const mid = (SHEET_EXPANDED_H + SHEET_COLLAPSED_H) / 2;
      const collapse = g.vy > 0.3 || (g.vy >= -0.3 && currentH < mid);
      Animated.spring(sheetH, {
        toValue: collapse ? SHEET_COLLAPSED_H : SHEET_EXPANDED_H,
        useNativeDriver: false,
        tension: 60,
        friction: 11,
      }).start();
      setSheetExpanded(!collapse);
    },
  }), []); // eslint-disable-line

  useEffect(() => {
    Animated.spring(sheetH, {
      toValue: sheetExpanded ? SHEET_EXPANDED_H : SHEET_COLLAPSED_H,
      useNativeDriver: false,
      tension: 60,
      friction: 11,
    }).start();
  }, [sheetExpanded]); // eslint-disable-line

  const [activeField,      setActiveField]      = useState(null);
  const [activeSug,        setActiveSug]        = useState([]);
  const [activeSugLoading, setActiveSugLoading] = useState(false);

  const [centerLat,     setCenterLat]     = useState(initLat);
  const [centerLon,     setCenterLon]     = useState(initLon);
  const [centerAddress, setCenterAddress] = useState("");
  const [geocoding,     setGeocoding]     = useState(false);

  const [pickupAddr,  setPickupAddr]  = useState("");
  const [pickupLat,   setPickupLat]   = useState(null);
  const [pickupLon,   setPickupLon]   = useState(null);
  const [dropoffAddr, setDropoffAddr] = useState("");
  const [dropoffLat,  setDropoffLat]  = useState(null);
  const [dropoffLon,  setDropoffLon]  = useState(null);

  const [carClass,  setCarClass]  = useState("econom");
  const [comment,   setComment]   = useState("");
  const [quote,     setQuote]     = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [busy,      setBusy]      = useState(false);
  const [status,    setStatus]    = useState("");

  useEffect(() => {
    if (currentOrder && tab === "create") setTab("ride");
    if (!currentOrder && tab === "ride")  setTab("create");
  }, [currentOrder]); // eslint-disable-line

  const handleMapReady = useCallback(() => {
    if (cityLat) mapRef.current?.setCenter(cityLat, cityLon, 13);
  }, [cityLat, cityLon]);

  useEffect(() => {
    let cancelled = false;
    let subscription = null;
    let hasInitialCenter = false;
    (async () => {
      try {
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (perm !== "granted" || cancelled) return;
        const last = await Location.getLastKnownPositionAsync();
        if (last && !cancelled) {
          const { latitude: lat, longitude: lon } = last.coords;
          mapRef.current?.setCenter(lat, lon, 15);
          mapRef.current?.setUserLocation(lat, lon);
          hasInitialCenter = true;
        }
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 5 },
          (pos) => {
            if (cancelled) return;
            const { latitude: lat, longitude: lon } = pos.coords;
            mapRef.current?.setUserLocation(lat, lon);
            if (!hasInitialCenter) { hasInitialCenter = true; mapRef.current?.setCenter(lat, lon, 15); }
          }
        );
      } catch (e) { console.warn("GPS:", e?.message); }
    })();
    return () => { cancelled = true; subscription?.remove(); };
  }, []); // eslint-disable-line

  useEffect(() => {
    const markers = [];
    if (pickupLat  != null) markers.push({ lat: pickupLat,  lon: pickupLon,  color: "#FF5A4D", label: "А" });
    if (dropoffLat != null) markers.push({ lat: dropoffLat, lon: dropoffLon, color: "#5CB8FF", label: "Б" });
    mapRef.current?.setMarkers(markers);
  }, [pickupLat, pickupLon, dropoffLat, dropoffLon]);

  useEffect(() => {
    if (pickupLat == null || dropoffLat == null) {
      mapRef.current?.clearRoute();
      setRouteInfo(null);
      setQuote(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const route = await getRoute(pickupLat, pickupLon, dropoffLat, dropoffLon);
      if (!cancelled && route) {
        mapRef.current?.setRoute(route.coords);
        setRouteInfo({ distanceM: route.distanceM, durationS: route.durationS });
      }
      try {
        const res = await api.quote({
          pickup_lat: pickupLat, pickup_lon: pickupLon,
          dropoff_lat: dropoffLat, dropoff_lon: dropoffLon,
          pickup_address: pickupAddr, dropoff_address: dropoffAddr,
          car_class: carClass, passengers_count: 1,
          payment_method: "cash", promo_code: null, waypoints: [],
        });
        if (!cancelled) { setQuote(res); setLastQuote(res); }
      } catch { if (!cancelled) setQuote(null); }
    })();
    return () => { cancelled = true; };
  }, [pickupLat, pickupLon, dropoffLat, dropoffLon, carClass]); // eslint-disable-line

  const handleCenterChange = useCallback((lat, lon) => {
    setCenterLat(lat);
    setCenterLon(lon);
    setGeocoding(true);
    clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      const addr = await reverseGeocode(lat, lon);
      setGeocoding(false);
      setCenterAddress(addr || "");
    }, 700);
  }, []);

  const useCenterForPickup = useCallback(() => {
    if (!centerAddress && !geocoding) return;
    setPickupAddr(centerAddress || "");
    setPickupLat(centerLat);
    setPickupLon(centerLon);
  }, [centerAddress, centerLat, centerLon, geocoding]);

  const openSearch = useCallback((field) => {
    setActiveField(field);
    setSheetExpanded(true);
    setActiveSug([]);
    const existing = field === "pickup" ? pickupAddr : dropoffAddr;
    if (existing.trim().length >= 1) {
      setActiveSugLoading(true);
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(async () => {
        const res = await geocodeSearch(existing.trim(), cityLat ?? centerLat, cityLon ?? centerLon, cityName);
        setActiveSug(res);
        setActiveSugLoading(false);
      }, 0);
    }
  }, [pickupAddr, dropoffAddr, cityLat, cityLon, centerLat, centerLon, cityName]);

  const closeSearch = useCallback(() => {
    setActiveField(null);
    setActiveSug([]);
    clearTimeout(searchTimer.current);
  }, []);

  const onActiveSearch = useCallback((text) => {
    if (activeField === "pickup") { setPickupAddr(text); setPickupLat(null); setPickupLon(null); }
    else { setDropoffAddr(text); setDropoffLat(null); setDropoffLon(null); }
    clearTimeout(searchTimer.current);
    if (text.trim().length < 1) { setActiveSug([]); return; }
    setActiveSugLoading(true);
    searchTimer.current = setTimeout(async () => {
      const res = await geocodeSearch(text.trim(), cityLat ?? centerLat, cityLon ?? centerLon, cityName);
      setActiveSug(res);
      setActiveSugLoading(false);
    }, 400);
  }, [activeField, cityLat, cityLon, centerLat, centerLon, cityName]);

  const selectSug = useCallback((item) => {
    if (activeField === "pickup") {
      setPickupAddr(item.label); setPickupLat(item.lat); setPickupLon(item.lon);
      mapRef.current?.setCenter(item.lat, item.lon, 16);
    } else {
      setDropoffAddr(item.label); setDropoffLat(item.lat); setDropoffLon(item.lon);
    }
    closeSearch();
  }, [activeField, closeSearch]);

  const clearActive = useCallback(() => {
    if (activeField === "pickup") { setPickupAddr(""); setPickupLat(null); setPickupLon(null); }
    else { setDropoffAddr(""); setDropoffLat(null); setDropoffLon(null); }
    setActiveSug([]);
  }, [activeField]);

  const doCreate = async () => {
    if (pickupLat == null || dropoffLat == null) { setStatus("Укажите точку А и точку Б"); return; }
    setBusy(true); setStatus("");
    try {
      await api.createOrder({
        pickup_address: pickupAddr, pickup_lat: pickupLat, pickup_lon: pickupLon,
        dropoff_address: dropoffAddr, dropoff_lat: dropoffLat, dropoff_lon: dropoffLon,
        comment: comment.trim(), passengers_count: 1, car_class: carClass,
        payment_method: "cash", promo_code: null, waypoints: [],
      });
      await refreshState();
    } catch (e) { setStatus(e.message || "Не удалось создать"); }
    finally { setBusy(false); }
  };

  const activeText    = activeField === "pickup" ? pickupAddr : dropoffAddr;
  const orderBtnReady = pickupLat != null && dropoffLat != null;
  const orderBtnText  = orderBtnReady && quote
    ? `Заказать  ·  ${formatMoney(quote.fare_total)}`
    : orderBtnReady
    ? "Заказать"
    : "Выберите маршрут";

  return (
    <View style={s.root}>
      <LeafletMap
        ref={mapRef} centerLat={initLat} centerLon={initLon}
        style={StyleSheet.absoluteFill}
        onCenterChange={handleCenterChange} onReady={handleMapReady}
      />

      {/* ── Верхние кнопки над картой (Yandex Go стиль) ── */}
      {tab === "create" && !activeField && (
        <SafeAreaView style={s.mapTopRow} pointerEvents="box-none">
          {/* Гамбургер */}
          <Pressable style={s.mapIconBtn} onPress={() => {}}>
            <Text style={s.mapIconText}>☰</Text>
          </Pressable>

          {/* WS-статус (маленькая точка) */}
          <View style={s.wsPill}>
            <View style={[s.wsDot, { backgroundColor: wsStatus === "online" ? "#3CD48D" : "#AAAAAA" }]} />
            <Text style={s.wsText}>
              {wsStatus === "online" ? "онлайн" : wsStatus === "connecting" ? "…" : "офлайн"}
            </Text>
          </View>

          {/* Бонусы */}
          <Pressable style={s.bonusBtn} onPress={() => {}}>
            <Text style={s.bonusBtnText}>🎁 Бонусы</Text>
          </Pressable>
        </SafeAreaView>
      )}

      {/* ── Плашка адреса (над картой) ── */}
      {tab === "create" && !activeField && (
        <SafeAreaView style={s.addrBarOuter} pointerEvents="none">
          <View style={s.addrBar}>
            <Text style={s.addrBarLabel}>Точка подачи</Text>
            <Text style={s.addrBarText} numberOfLines={1}>
              {geocoding ? "уточняем…" : (centerAddress || "Переместите карту")}
            </Text>
          </View>
        </SafeAreaView>
      )}

      {/* ── Пин ── */}
      {tab === "create" && !activeField && (
        <View style={s.pinOverlay} pointerEvents="none">
          <PickupPin loading={geocoding} />
        </View>
      )}

      {/* ── Поиск: полноэкранный оверлей ── */}
      {activeField && (
        <>
          <SafeAreaView style={[s.sugPanel, { bottom: keyboardH + 64 }]}>
            {activeSugLoading
              ? <ActivityIndicator color={L.muted} style={{ marginTop: 32 }} />
              : (
                <FlatList
                  data={activeSug}
                  keyExtractor={(_, i) => String(i)}
                  keyboardShouldPersistTaps="always"
                  renderItem={({ item, index }) => (
                    <Pressable
                      style={({ pressed }) => [
                        s.sugRow,
                        index < activeSug.length - 1 && s.sugRowSep,
                        pressed && { backgroundColor: L.bg },
                      ]}
                      onPress={() => selectSug(item)}
                    >
                      <Text style={s.sugIcon}>📍</Text>
                      <Text style={s.sugRowText} numberOfLines={2}>{item.label}</Text>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text style={s.sugHint}>
                      {activeText.length >= 1
                        ? "Адреса не найдены — уточните запрос"
                        : activeField === "pickup"
                          ? "Введите адрес откуда едете"
                          : "Введите адрес куда едете"}
                    </Text>
                  }
                />
              )}
          </SafeAreaView>

          {/* Строка ввода */}
          <View style={[s.searchBarFixed, { bottom: keyboardH }]}>
            <Pressable onPress={closeSearch} style={s.searchBackBtn} hitSlop={12}>
              <Text style={s.searchBackText}>←</Text>
            </Pressable>
            <TextInput
              style={s.searchInput}
              value={activeText}
              onChangeText={onActiveSearch}
              placeholder={activeField === "pickup" ? "Откуда поедете…" : "Куда поедете…"}
              placeholderTextColor={L.dim}
              autoFocus
              returnKeyType="search"
            />
            {activeText.length > 0 && (
              <Pressable onPress={clearActive} style={s.searchClearBtn} hitSlop={8}>
                <Text style={s.searchClearText}>✕</Text>
              </Pressable>
            )}
          </View>
        </>
      )}

      {/* ── Нижняя шторка ── */}
      <Animated.View style={[s.sheet, { bottom: 0, height: sheetH }]}>

        {/* Ручка drag */}
        <View {...panResponder.panHandlers} style={s.handleWrap}>
          <Pressable onPress={() => setSheetExpanded((v) => !v)} hitSlop={10}>
            <View style={s.handle} />
          </Pressable>
        </View>

        {/* ── Вкладка: создать заказ ── */}
        {!activeField && sheetExpanded && tab === "create" && (
          <ScrollView
            contentContainerStyle={s.sheetInner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ── Адресная секция ── */}
            <View style={s.addrSection}>

              {/* Откуда */}
              <View style={s.addrRow}>
                <View style={s.dotCol}>
                  <View style={s.dotA} />
                  <View style={s.dotLine} />
                </View>
                <Pressable style={s.addrFieldWrap} onPress={() => openSearch("pickup")}>
                  <Text style={s.addrLabel}>Откуда</Text>
                  <Text
                    style={[s.addrValue, !pickupAddr && s.addrPlaceholder]}
                    numberOfLines={1}
                  >
                    {pickupAddr || "Ваше местоположение"}
                  </Text>
                </Pressable>
                <Pressable style={s.addrRightBtn} onPress={useCenterForPickup}>
                  <Text style={s.addrRightBtnText}>Подъезд ›</Text>
                </Pressable>
              </View>

              {/* Разделитель */}
              <View style={s.addrDivider} />

              {/* Куда */}
              <View style={s.addrRow}>
                <View style={s.dotCol}>
                  <View style={s.dotB} />
                </View>
                <Pressable style={s.addrFieldWrap} onPress={() => openSearch("dropoff")}>
                  <Text style={s.addrLabel}>Куда</Text>
                  <Text
                    style={[s.addrValue, !dropoffAddr && s.addrPlaceholder]}
                    numberOfLines={1}
                  >
                    {dropoffAddr || "Введите адрес"}
                  </Text>
                </Pressable>
                <Pressable style={s.addrPlusBtn} onPress={() => openSearch("dropoff")}>
                  <Text style={s.addrPlusBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* ── Быстрые места: 2×2 сетка ── */}
            <View style={s.quickGrid}>
              {QUICK_PLACES.map((p) => (
                <Pressable
                  key={p.label}
                  style={({ pressed }) => [s.quickCard, pressed && { opacity: 0.72 }]}
                  onPress={() => openSearch("dropoff")}
                >
                  <Text style={s.quickCardIcon}>{p.icon}</Text>
                  <Text style={s.quickCardLabel}>{p.label}</Text>
                  {!!p.hint && <Text style={s.quickCardHint}>{p.hint}</Text>}
                </Pressable>
              ))}
            </View>

            {/* ── Маршрут: км + время ── */}
            {routeInfo && (
              <View style={s.routeInfo}>
                <Text style={s.routeInfoText}>
                  {formatDistance(routeInfo.distanceM)}{"   ·   "}{formatDuration(routeInfo.durationS)}
                </Text>
              </View>
            )}

            {/* ── Тарифы ── */}
            <View style={s.tariffHeader}>
              <Text style={s.tariffHeaderTitle}>Тарифы</Text>
              <Pressable onPress={() => {}}>
                <Text style={s.tariffHeaderLink}>Все тарифы ›</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tariffRow}
              style={{ marginBottom: 14 }}
            >
              {CAR_CLASSES.map((c) => {
                const selected = carClass === c.id;
                const price = selected && quote
                  ? formatMoney(quote.fare_total)
                  : c.priceHint;
                return (
                  <Pressable
                    key={c.id}
                    style={[s.tariffCard, selected && s.tariffCardSelected]}
                    onPress={() => setCarClass(c.id)}
                  >
                    <Text style={s.tariffIcon}>{c.icon}</Text>
                    <Text style={[s.tariffLabel, selected && s.tariffLabelSel]}>
                      {c.label}
                    </Text>
                    <Text style={[s.tariffPrice, selected && s.tariffPriceSel]}>{price}</Text>
                    {selected && <View style={s.tariffActiveDot} />}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* ── Комментарий ── */}
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Комментарий водителю"
              placeholderTextColor={L.dim}
              style={s.comment}
            />

            {/* ── Кнопка ЗАКАЗАТЬ ── */}
            <Pressable
              onPress={doCreate}
              style={[s.orderBtn, !orderBtnReady && s.orderBtnDisabled]}
              disabled={busy || !orderBtnReady}
            >
              {busy ? (
                <ActivityIndicator color={L.actText} />
              ) : (
                <View style={s.orderBtnInner}>
                  <Text style={s.orderBtnText}>{orderBtnText}</Text>
                  <View style={s.orderBtnFilter}>
                    <Text style={s.orderBtnFilterIcon}>≡</Text>
                  </View>
                </View>
              )}
            </Pressable>

            {!!status && <Text style={s.statusTxt}>{status}</Text>}
          </ScrollView>
        )}

        {/* ── История ── */}
        {!activeField && sheetExpanded && tab === "history" && (
          <HistoryTab items={history} />
        )}

        {/* ── Текущий заказ ── */}
        {!activeField && sheetExpanded && tab === "ride" && currentOrder && (
          <RideTab order={currentOrder} onRefresh={refreshState} />
        )}

        {/* NavBar */}
        {!activeField && <NavBar active={tab} onChange={setTab} />}
      </Animated.View>

      {/* ── Модал активного заказа ── */}
      {currentOrder && (
        <OrderModal
          order={currentOrder}
          onRefresh={refreshState}
          onClose={() => refreshState()}
        />
      )}
    </View>
  );
}

/* ─── Вкладка: активный заказ ─── */
function RideTab({ order, onRefresh }) {
  const [text,     setText]     = useState("");
  const [messages, setMessages] = useState([]);
  const [sending,  setSending]  = useState(false);

  const loadChat = useCallback(async () => {
    if (!order?.public_id) return;
    try { const items = await api.chatHistory(order.public_id, 0); setMessages(items); } catch {}
  }, [order?.public_id]);

  useEffect(() => {
    loadChat();
    const t = setInterval(loadChat, 4000);
    return () => clearInterval(t);
  }, [loadChat]);

  if (!order) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: L.muted }}>Нет активного заказа.</Text>
      </View>
    );
  }

  const cancel = () => Alert.alert("Отменить заказ?", "", [
    { text: "Нет", style: "cancel" },
    {
      text: "Да", style: "destructive",
      onPress: async () => {
        try { await api.cancelOrder(order.public_id); await onRefresh(); }
        catch (e) { Alert.alert("Ошибка", e.message); }
      },
    },
  ]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try { await api.chatSend(order.public_id, text.trim()); setText(""); await loadChat(); }
    catch (e) { Alert.alert("Ошибка", e.message); }
    finally { setSending(false); }
  };

  return (
    <ScrollView contentContainerStyle={s.sheetInner} keyboardShouldPersistTaps="handled">
      <View style={s.infoCard}>
        <Text style={s.infoTitle}>{humanStatus(order.status)}</Text>
        <Text style={s.infoLine}>Заказ {order.public_id}</Text>
        <Text style={s.infoLine}>{order.pickup_address} → {order.dropoff_address}</Text>
        <Text style={s.infoLine}>Водитель: {order.driver_full_name || "ищем…"}</Text>
        <Text style={s.infoLine}>
          {[order.vehicle_make, order.vehicle_model, order.vehicle_plate].filter(Boolean).join(" ") || "машина будет назначена"}
        </Text>
        <Text style={s.infoLine}>Цена: {formatMoney(order.fare_total)}</Text>
      </View>

      <Pressable onPress={cancel} style={s.cancelBtn}>
        <Text style={s.cancelBtnText}>Отменить заказ</Text>
      </Pressable>

      <Text style={s.sectionTitle}>Чат с водителем</Text>
      <View style={s.chatBox}>
        {messages.length === 0
          ? <Text style={{ color: L.muted, fontSize: 13 }}>Сообщений пока нет.</Text>
          : messages.map((m) => (
            <ChatBubble key={m.id} text={m.text} mine={m.sender_type === "passenger"} />
          ))}
      </View>
      <View style={{ flexDirection: "row", marginTop: 10, gap: 8 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Сообщение водителю"
          placeholderTextColor={L.dim}
          style={[s.comment, { flex: 1, marginTop: 0 }]}
        />
        <Pressable onPress={send} style={[s.orderBtn, { paddingHorizontal: 18, marginTop: 0 }]} disabled={sending}>
          {sending
            ? <ActivityIndicator color={L.actText} />
            : <Text style={s.orderBtnText}>→</Text>
          }
        </Pressable>
      </View>
      {order.status === "completed" && <FeedbackSection order={order} />}
    </ScrollView>
  );
}

function FeedbackSection({ order }) {
  const [rating, setRating] = useState(0);
  const [sent,   setSent]   = useState(false);
  const submit = async (n) => {
    setRating(n);
    try { await api.submitFeedback(order.public_id, n); setSent(true); }
    catch (e) { Alert.alert("Ошибка", e.message); }
  };
  if (sent) return <Text style={{ color: L.success, marginTop: 16, textAlign: "center", fontWeight: "700" }}>Спасибо за оценку!</Text>;
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={s.sectionTitle}>Оцените поездку</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {[1,2,3,4,5].map((n) => (
          <Pressable
            key={n}
            onPress={() => submit(n)}
            style={[s.starBtn, rating >= n && s.starBtnActive]}
          >
            <Text style={{ color: rating >= n ? L.actText : L.muted, fontSize: 22 }}>★</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function HistoryTab({ items }) {
  return (
    <ScrollView contentContainerStyle={s.sheetInner} showsVerticalScrollIndicator={false}>
      <Text style={s.sectionTitle}>История поездок</Text>
      {items.length === 0
        ? <Text style={{ color: L.muted, fontSize: 14 }}>Ваши поездки появятся здесь.</Text>
        : items.map((item) => (
          <View key={item.public_id} style={s.infoCard}>
            <Text style={s.infoTitle}>{item.pickup_address} → {item.dropoff_address}</Text>
            <Text style={s.infoLine}>
              {item.public_id} · {formatMoney(item.fare_total)} · {humanStatus(item.status)}
            </Text>
          </View>
        ))}
    </ScrollView>
  );
}

/* ─── Стили ─── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EDEAE4" },

  /* ── Верхняя строка над картой ── */
  mapTopRow: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingTop: 6,
    zIndex: 20,
    gap: 8,
  },
  mapIconBtn: {
    width: 44, height: 44,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 14, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  mapIconText: { fontSize: 18, color: "#1A1A1A" },

  wsPill: {
    flex: 1,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center",
  },
  wsDot:  { width: 7, height: 7, borderRadius: 3.5, marginRight: 5 },
  wsText: {
    color: "rgba(30,30,30,0.7)", fontSize: 11, fontWeight: "600",
    backgroundColor: "rgba(255,255,255,0.80)",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },

  bonusBtn: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  bonusBtnText: { color: "#1A1A1A", fontSize: 13, fontWeight: "700" },

  /* ── Плашка адреса ── */
  addrBarOuter: {
    position: "absolute", top: 56, left: 0, right: 0,
    alignItems: "center", zIndex: 15,
  },
  addrBar: {
    marginTop: 8, backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 18,
    alignItems: "center", minWidth: 200, maxWidth: "85%",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 6,
  },
  addrBarLabel: { color: "#888", fontSize: 11, fontWeight: "600", letterSpacing: 0.4 },
  addrBarText:  { color: "#1A1A1A", fontSize: 14, fontWeight: "700", marginTop: 1, textAlign: "center" },

  /* ── Пин ── */
  pinOverlay: {
    position: "absolute", left: 0, right: 0,
    top: SCREEN_H * 0.30, alignItems: "center", zIndex: 10,
  },

  /* ── Шторка ── */
  sheet: {
    position: "absolute", left: 0, right: 0,
    backgroundColor: L.sheet,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    zIndex: 20, overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10, shadowRadius: 16, elevation: 16,
  },
  handleWrap: { alignItems: "center", paddingVertical: 10 },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: L.dim, alignSelf: "center",
  },
  sheetInner: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 2 },

  /* ── Адресная секция (Yandex Go стиль) ── */
  addrSection: {
    backgroundColor: L.bg, borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 6,
    marginBottom: 14,
    borderWidth: 1, borderColor: L.border,
  },
  addrRow: {
    flexDirection: "row", alignItems: "center",
    minHeight: 52,
  },
  dotCol: {
    width: 20, alignItems: "center",
    marginRight: 12,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  dotA: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: L.dotA,
    borderWidth: 2, borderColor: "#1A1A1A",
  },
  dotLine: {
    width: 2, height: 16,
    backgroundColor: L.border,
    marginVertical: 2, marginTop: 3,
  },
  dotB: {
    width: 12, height: 12, borderRadius: 3,
    backgroundColor: L.dotB,
  },
  addrFieldWrap: {
    flex: 1,
    paddingVertical: 6,
    justifyContent: "center",
  },
  addrLabel: {
    fontSize: 11, color: L.muted,
    fontWeight: "600", letterSpacing: 0.2,
    marginBottom: 1,
  },
  addrValue: {
    fontSize: 15, color: L.text, fontWeight: "500",
  },
  addrPlaceholder: { color: L.dim },
  addrDivider: {
    height: 1, backgroundColor: L.border,
    marginLeft: 32, marginRight: -14,
    marginBottom: 0,
  },
  addrRightBtn: {
    marginLeft: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 10, borderWidth: 1, borderColor: L.border,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  addrRightBtnText: { color: L.muted, fontSize: 12, fontWeight: "600" },
  addrPlusBtn: {
    marginLeft: 8,
    width: 32, height: 32,
    backgroundColor: L.accent, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  addrPlusBtnText: { color: "#1A1A1A", fontSize: 18, fontWeight: "700", lineHeight: 22 },

  /* ── Быстрые места: 2×2 ── */
  quickGrid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 10, marginBottom: 14,
  },
  quickCard: {
    width: (SCREEN_W - 32 - 10) / 2 - 2,
    backgroundColor: L.bg,
    borderRadius: 16, borderWidth: 1, borderColor: L.border,
    paddingHorizontal: 14, paddingVertical: 13,
    flexDirection: "column",
  },
  quickCardIcon:  { fontSize: 22, marginBottom: 5 },
  quickCardLabel: { color: L.text, fontSize: 14, fontWeight: "700" },
  quickCardHint:  { color: L.muted, fontSize: 12, marginTop: 2 },

  /* Маршрут: инфо */
  routeInfo: {
    backgroundColor: "#FFF9E0", borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 14,
    marginBottom: 12, alignItems: "center",
    borderWidth: 1, borderColor: "#F0E080",
  },
  routeInfoText: { color: "#7A6400", fontSize: 13, fontWeight: "700" },

  /* ── Тарифы ── */
  tariffHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  tariffHeaderTitle: { color: L.text, fontSize: 17, fontWeight: "700" },
  tariffHeaderLink:  { color: L.muted, fontSize: 13, fontWeight: "500" },

  tariffRow: { paddingHorizontal: 2, paddingVertical: 4, gap: 10 },
  tariffCard: {
    width: 100, borderRadius: 18,
    backgroundColor: L.bg,
    borderWidth: 2, borderColor: L.border,
    alignItems: "center",
    paddingVertical: 12, paddingHorizontal: 8,
  },
  tariffCardSelected: { borderColor: L.accent, backgroundColor: "#FFFDE7" },
  tariffIcon:  { fontSize: 26, marginBottom: 2 },
  tariffLabel: { color: L.muted, fontWeight: "600", fontSize: 12, marginTop: 3 },
  tariffLabelSel: { color: "#1A1A1A" },
  tariffPrice: { color: L.muted, fontSize: 12, marginTop: 2, fontWeight: "500" },
  tariffPriceSel: { color: "#7A6400", fontWeight: "700" },
  tariffActiveDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: L.accent, marginTop: 5,
  },

  /* Комментарий */
  comment: {
    backgroundColor: L.bg, color: L.text,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, marginBottom: 10,
    borderWidth: 1, borderColor: L.border,
  },

  /* Кнопка заказа */
  orderBtn: {
    backgroundColor: L.accent, borderRadius: 18,
    paddingVertical: 17, alignItems: "center",
    shadowColor: "#C8A800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 6,
    marginTop: 2,
  },
  orderBtnDisabled: { backgroundColor: L.dim, shadowOpacity: 0 },
  orderBtnInner: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center",
    width: "100%", paddingHorizontal: 16,
  },
  orderBtnText: { color: L.actText, fontWeight: "800", fontSize: 17, flex: 1, textAlign: "center" },
  orderBtnFilter: {
    width: 34, height: 34,
    backgroundColor: "rgba(0,0,0,0.10)", borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  orderBtnFilterIcon: { color: "#1A1A1A", fontSize: 18, fontWeight: "700" },
  statusTxt: { color: L.danger, marginTop: 10, fontSize: 13, textAlign: "center" },

  /* ── Поиск: оверлей ── */
  sugPanel: {
    position: "absolute", top: 0, left: 0, right: 0,
    backgroundColor: L.sheet,
    zIndex: 40,
  },
  searchBarFixed: {
    position: "absolute", left: 0, right: 0, height: 64,
    backgroundColor: L.sheet,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12,
    borderTopWidth: 1, borderTopColor: L.border,
    zIndex: 41,
  },
  searchBackBtn: {
    width: 40, height: 40, backgroundColor: L.bg,
    borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  searchBackText: { color: L.text, fontSize: 20, lineHeight: 24 },
  searchInput: {
    flex: 1, backgroundColor: L.bg, color: L.text,
    fontSize: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  searchClearBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  searchClearText: { color: L.muted, fontSize: 18 },
  sugRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  sugRowSep: { borderBottomWidth: 1, borderBottomColor: L.border },
  sugIcon:    { fontSize: 16, marginRight: 10, marginTop: 1 },
  sugRowText: { flex: 1, color: L.text, fontSize: 15, lineHeight: 20 },
  sugHint: {
    color: L.muted, fontSize: 14, textAlign: "center",
    marginTop: 40, paddingHorizontal: 24, lineHeight: 20,
  },

  /* ── Ride Tab ── */
  infoCard: {
    backgroundColor: L.bg, borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: L.border,
  },
  infoTitle: { color: L.text, fontWeight: "700", fontSize: 16, marginBottom: 6 },
  infoLine:  { color: L.muted, fontSize: 13, marginTop: 2 },
  cancelBtn: {
    borderWidth: 1.5, borderColor: L.danger, borderRadius: 14,
    paddingVertical: 13, alignItems: "center", marginBottom: 6,
  },
  cancelBtnText: { color: L.danger, fontSize: 15, fontWeight: "600" },
  sectionTitle:  { color: L.text, fontWeight: "700", fontSize: 15, marginTop: 12, marginBottom: 8 },
  chatBox: {
    backgroundColor: L.bg, borderRadius: 12,
    padding: 10, minHeight: 80, maxHeight: 180,
    borderWidth: 1, borderColor: L.border,
  },
  starBtn: {
    width: 52, height: 46, borderRadius: 12,
    backgroundColor: L.bg, borderWidth: 1, borderColor: L.border,
    alignItems: "center", justifyContent: "center",
  },
  starBtnActive: { backgroundColor: "#FFF9C4", borderColor: L.accent },
});
