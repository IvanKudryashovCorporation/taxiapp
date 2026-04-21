import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, FlatList,
  StyleSheet, ActivityIndicator, Alert, Dimensions, Keyboard, Platform, PanResponder,
} from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStore } from "../state";
import { api, reverseGeocode, geocodeSearch, getRoute } from "../api";
import { CAR_CLASSES } from "../config";
import { colors, radius } from "../theme";
import LeafletMap from "../components/LeafletMap";
import ServiceCard from "../components/ServiceCard";
import NavBar from "../components/NavBar";
import ChatBubble from "../components/ChatBubble";

const DEFAULT_LAT = 55.7558;
const DEFAULT_LON = 37.6173;
const { height: SCREEN_H } = Dimensions.get("window");

/* ─── Pickup pin ─── */
function PickupPin({ loading }) {
  return (
    <View style={pin.wrap}>
      <View style={pin.box}>
        {loading ? <ActivityIndicator color="#1a1a1a" size={22} /> : <PersonIcon />}
      </View>
      <View style={pin.stem} />
    </View>
  );
}
function PersonIcon() {
  return (
    <View style={pin.person}>
      <View style={pin.head} />
      <View style={pin.bodyRow}>
        <View style={pin.torso} />
        <View style={pin.armRaised} />
      </View>
      <View style={pin.legsRow}>
        <View style={pin.leg} />
        <View style={[pin.leg, { marginLeft: 3 }]} />
      </View>
    </View>
  );
}
const pin = StyleSheet.create({
  wrap: { alignItems: "center" },
  box: {
    width: 54, height: 54, backgroundColor: "#F5CF31", borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 12,
  },
  stem: { width: 4, height: 22, backgroundColor: "#1a1a1a", borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  person: { alignItems: "center" },
  head: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#1a1a1a", marginBottom: 2 },
  bodyRow: { flexDirection: "row", alignItems: "flex-end" },
  torso: { width: 10, height: 12, borderRadius: 3, backgroundColor: "#1a1a1a" },
  armRaised: { width: 8, height: 3.5, borderRadius: 2, backgroundColor: "#1a1a1a", marginLeft: 1, marginBottom: 8, transform: [{ rotate: "-50deg" }] },
  legsRow: { flexDirection: "row", marginTop: 1 },
  leg: { width: 4, height: 7, borderRadius: 2, backgroundColor: "#1a1a1a" },
});

/* ─── Утилиты ─── */
function formatMoney(v) { return `${Math.round(Number(v || 0)).toLocaleString("ru-RU")} ₽`; }
function formatDistance(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${Math.round(m)} м`;
}
function formatDuration(s) {
  const min = Math.round(s / 60);
  if (min < 60) return `~${min} мин`;
  return `~${Math.floor(min / 60)} ч ${min % 60} мин`;
}
function humanStatus(s) {
  return ({ created:"новый", searching_driver:"ищем водителя", accepted:"водитель назначен", driver_on_the_way:"водитель в пути", driver_nearby_leave_now:"водитель рядом", arrived:"водитель на месте", ride_in_progress:"поездка идёт", completed:"поездка завершена", cancelled:"отменён" }[s] || s || "—");
}

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

  // Клавиатура
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

  // Свайп по ручке
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
    onPanResponderRelease: (_, g) => {
      if (g.dy > 40)       setSheetExpanded(false);
      else if (g.dy < -40) setSheetExpanded(true);
    },
  }), []);

  // Поиск адреса
  const [activeField,      setActiveField]      = useState(null);
  const [activeSug,        setActiveSug]        = useState([]);
  const [activeSugLoading, setActiveSugLoading] = useState(false);

  // Шторка статична — поиск теперь отдельный оверлей поверх всего
  const sheetStyle = useMemo(() => ({ bottom: 0, maxHeight: SCREEN_H * 0.62 }), []);

  // Центр карты (для кнопки "С карты")
  const [centerLat,     setCenterLat]     = useState(initLat);
  const [centerLon,     setCenterLon]     = useState(initLon);
  const [centerAddress, setCenterAddress] = useState("");
  const [geocoding,     setGeocoding]     = useState(false);

  // Форма
  const [pickupAddr, setPickupAddr] = useState("");
  const [pickupLat,  setPickupLat]  = useState(null);
  const [pickupLon,  setPickupLon]  = useState(null);
  const [dropoffAddr, setDropoffAddr] = useState("");
  const [dropoffLat,  setDropoffLat]  = useState(null);
  const [dropoffLon,  setDropoffLon]  = useState(null);

  const [carClass,   setCarClass]   = useState("econom");
  const [comment,    setComment]    = useState("");
  const [quote,      setQuote]      = useState(null);
  const [routeInfo,  setRouteInfo]  = useState(null); // { distanceM, durationS }
  const [busy,       setBusy]       = useState(false);
  const [status,     setStatus]     = useState("");

  useEffect(() => {
    if (currentOrder && tab === "create") setTab("ride");
    if (!currentOrder && tab === "ride")  setTab("create");
  }, [currentOrder]);

  // Карта готова — летим на город
  const handleMapReady = useCallback(() => {
    if (cityLat) mapRef.current?.setCenter(cityLat, cityLon, 13);
  }, [cityLat, cityLon]);

  // GPS — непрерывное слежение + синяя точка
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

  // Маркеры А и Б на карте (только когда явно выбраны)
  useEffect(() => {
    const markers = [];
    if (pickupLat  != null) markers.push({ lat: pickupLat,  lon: pickupLon,  color: "#FF5A4D", label: "А" });
    if (dropoffLat != null) markers.push({ lat: dropoffLat, lon: dropoffLon, color: "#5CB8FF", label: "Б" });
    mapRef.current?.setMarkers(markers);
  }, [pickupLat, pickupLon, dropoffLat, dropoffLon]);

  // ── Маршрут + авто-цена когда обе точки выбраны ──
  useEffect(() => {
    if (pickupLat == null || dropoffLat == null) {
      mapRef.current?.clearRoute();
      setRouteInfo(null);
      setQuote(null);
      return;
    }
    let cancelled = false;
    (async () => {
      // 1. Маршрут на карте
      const route = await getRoute(pickupLat, pickupLon, dropoffLat, dropoffLon);
      if (!cancelled && route) {
        mapRef.current?.setRoute(route.coords);
        setRouteInfo({ distanceM: route.distanceM, durationS: route.durationS });
      }
      // 2. Цена
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

  // Карта двигается → обновляем только centerAddress (НЕ поля формы)
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

  // Кнопка "С карты" для поля откуда
  const useCenterForPickup = useCallback(() => {
    if (!centerAddress && !geocoding) return;
    setPickupAddr(centerAddress || "");
    setPickupLat(centerLat);
    setPickupLon(centerLon);
  }, [centerAddress, centerLat, centerLon, geocoding]);

  // Открыть поиск
  const openSearch = useCallback((field) => {
    setActiveField(field);
    setSheetExpanded(true);
    setActiveSug([]);
    const existing = field === "pickup" ? pickupAddr : dropoffAddr;
    if (existing.trim().length >= 1) {
      setActiveSugLoading(true);
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(async () => {
        // Используем координаты города (не центра карты) для bounded-поиска
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
      // Всегда ищем в рамках выбранного города
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
      setStatus("Заказ создан. Ищем водителя…");
    } catch (e) { setStatus(e.message || "Не удалось создать"); }
    finally { setBusy(false); }
  };

  const activeText    = activeField === "pickup" ? pickupAddr : dropoffAddr;
  const orderBtnReady = pickupLat != null && dropoffLat != null;
  const orderBtnText  = orderBtnReady && quote
    ? `${formatMoney(quote.fare_total)}  ЗАКАЗАТЬ`
    : orderBtnReady
    ? "ЗАКАЗАТЬ"
    : "Выберите маршрут";

  return (
    <View style={styles.root}>
      <LeafletMap
        ref={mapRef} centerLat={initLat} centerLon={initLon}
        style={StyleSheet.absoluteFill}
        onCenterChange={handleCenterChange} onReady={handleMapReady}
      />

      {/* Плашка точки подачи сверху */}
      {tab === "create" && !activeField && (
        <SafeAreaView style={styles.addrBarOuter} pointerEvents="none">
          <View style={styles.addrBar}>
            <Text style={styles.addrBarLabel}>Точка подачи</Text>
            <Text style={styles.addrBarText} numberOfLines={1}>
              {geocoding ? "уточняем…" : (centerAddress || "Переместите карту")}
            </Text>
          </View>
        </SafeAreaView>
      )}

      {/* Пин */}
      {tab === "create" && !activeField && (
        <View style={styles.pinOverlay} pointerEvents="none">
          <PickupPin loading={geocoding} />
        </View>
      )}

      {/* Статус + выход */}
      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.wsPill}>
          <View style={[styles.wsDot, { backgroundColor: wsStatus === "online" ? colors.success : colors.textDim }]} />
          <Text style={styles.wsText}>{wsStatus === "online" ? "онлайн" : wsStatus === "connecting" ? "подключение…" : "офлайн"}</Text>
        </View>
        <Pressable onPress={logout} style={styles.logoutPill}>
          <Text style={styles.wsText}>Выйти</Text>
        </Pressable>
      </SafeAreaView>

      {/* ══ ПОИСК — абсолютный оверлей, НЕ внутри шторки ══
           Инпут прибит к bottom: keyboardH и никогда не прыгает.
           Подсказки заполняют пространство выше инпута.              */}
      {activeField && (
        <>
          {/* Панель подсказок: от верха экрана до инпута */}
          <SafeAreaView style={[styles.sugPanel, { bottom: keyboardH + 64 }]}>
            {activeSugLoading
              ? <ActivityIndicator color={colors.textMuted} style={{ marginTop: 32 }} />
              : (
                <FlatList
                  data={activeSug}
                  keyExtractor={(_, i) => String(i)}
                  keyboardShouldPersistTaps="always"
                  renderItem={({ item, index }) => (
                    <Pressable
                      style={({ pressed }) => [
                        styles.sugRow,
                        index < activeSug.length - 1 && styles.sugRowSep,
                        pressed && { backgroundColor: colors.cardAlt },
                      ]}
                      onPress={() => selectSug(item)}
                    >
                      <Text style={styles.sugIcon}>📍</Text>
                      <Text style={styles.sugRowText} numberOfLines={2}>{item.label}</Text>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.sugHint}>
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

          {/* Строка ввода — ВСЕГДА ровно над клавиатурой, не двигается */}
          <View style={[styles.searchBarFixed, { bottom: keyboardH }]}>
            <Pressable onPress={closeSearch} style={styles.searchBackBtn} hitSlop={12}>
              <Text style={styles.searchBackText}>←</Text>
            </Pressable>
            <TextInput
              style={styles.searchInput}
              value={activeText}
              onChangeText={onActiveSearch}
              placeholder={activeField === "pickup" ? "Откуда поедете…" : "Куда поедете…"}
              placeholderTextColor={colors.textMuted}
              autoFocus
              returnKeyType="search"
            />
            {activeText.length > 0 && (
              <Pressable onPress={clearActive} style={styles.searchClearBtn} hitSlop={8}>
                <Text style={styles.searchClearText}>✕</Text>
              </Pressable>
            )}
          </View>
        </>
      )}

      {/* ── Bottom sheet ── */}
      <View style={[styles.sheet, sheetStyle]}>

        {/* Ручка */}
        <View {...panResponder.panHandlers} style={styles.handleWrap}>
          <Pressable onPress={() => setSheetExpanded((v) => !v)} hitSlop={10}>
            <View style={styles.handle} />
            <Text style={styles.handleArrow}>{sheetExpanded ? "▼" : "▲  развернуть"}</Text>
          </Pressable>
        </View>

        {/* ══ ОБЫЧНЫЙ КОНТЕНТ ══ */}
        {!activeField && sheetExpanded && tab === "create" && (
          <ScrollView contentContainerStyle={styles.sheetInner} keyboardShouldPersistTaps="handled">

            {/* Откуда — пустое по умолчанию, кнопка "С карты" справа */}
            <View style={styles.addrRowWrap}>
              <Pressable style={styles.addrRowMain} onPress={() => openSearch("pickup")}>
                <View style={[styles.dot, { backgroundColor: colors.danger }]} />
                <Text style={[styles.addrDisplayText, !pickupAddr && styles.addrPlaceholder]} numberOfLines={1}>
                  {pickupAddr || "Откуда поедете"}
                </Text>
              </Pressable>
              <Pressable style={styles.fromMapBtn} onPress={useCenterForPickup}>
                <Text style={styles.fromMapBtnText}>📍 С карты</Text>
              </Pressable>
            </View>

            {/* Куда — только поиск */}
            <Pressable style={styles.addrRowDisplay} onPress={() => openSearch("dropoff")}>
              <View style={[styles.dot, { backgroundColor: colors.info }]} />
              <Text style={[styles.addrDisplayText, !dropoffAddr && styles.addrPlaceholder]} numberOfLines={1}>
                {dropoffAddr || "Куда поедете"}
              </Text>
              <Text style={styles.addrChevron}>›</Text>
            </Pressable>

            {/* Маршрут: км + время */}
            {routeInfo && (
              <View style={styles.routeInfo}>
                <Text style={styles.routeInfoText}>
                  🛣 {formatDistance(routeInfo.distanceM)}
                  {"   "}
                  ⏱ {formatDuration(routeInfo.durationS)}
                </Text>
              </View>
            )}

            {/* Классы */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ paddingVertical: 4 }}>
              {CAR_CLASSES.map((c) => (
                <ServiceCard
                  key={c.id} icon={c.icon} label={c.label}
                  priceHint={c.id === carClass && quote ? formatMoney(quote.fare_total) : c.priceHint}
                  selected={carClass === c.id}
                  onPress={() => setCarClass(c.id)}
                />
              ))}
            </ScrollView>

            <TextInput
              value={comment} onChangeText={setComment}
              placeholder="Комментарий водителю (необязательно)"
              placeholderTextColor={colors.textMuted}
              style={styles.comment}
            />

            {/* Одна кнопка ЗАКАЗАТЬ с ценой */}
            <Pressable
              onPress={doCreate}
              style={[styles.primary, { marginTop: 10 }, !orderBtnReady && styles.primaryDisabled]}
              disabled={busy || !orderBtnReady}
            >
              {busy
                ? <ActivityIndicator color={colors.accentText} />
                : <Text style={styles.primaryText}>{orderBtnText}</Text>
              }
            </Pressable>

            {!!status && <Text style={styles.statusTxt}>{status}</Text>}
          </ScrollView>
        )}

        {!activeField && sheetExpanded && tab === "ride"    && <RideTab order={currentOrder} onRefresh={refreshState} />}
        {!activeField && sheetExpanded && tab === "history" && <HistoryTab items={history} />}
        {!activeField && <NavBar active={tab} onChange={setTab} />}
      </View>
    </View>
  );
}

/* ─── Вкладка заказа ─── */
function RideTab({ order, onRefresh }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const loadChat = useCallback(async () => {
    if (!order?.public_id) return;
    try { const items = await api.chatHistory(order.public_id, 0); setMessages(items); } catch {}
  }, [order?.public_id]);
  useEffect(() => { loadChat(); const t = setInterval(loadChat, 4000); return () => clearInterval(t); }, [loadChat]);

  if (!order) return <View style={{ padding: 16 }}><Text style={{ color: colors.textMuted }}>Нет активного заказа.</Text></View>;

  const cancel = () => Alert.alert("Отменить заказ?", "", [
    { text: "Нет", style: "cancel" },
    { text: "Да", style: "destructive", onPress: async () => { try { await api.cancelOrder(order.public_id); await onRefresh(); } catch (e) { Alert.alert("Ошибка", e.message); } } },
  ]);
  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try { await api.chatSend(order.public_id, text.trim()); setText(""); await loadChat(); }
    catch (e) { Alert.alert("Ошибка", e.message); }
    finally { setSending(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.sheetInner} keyboardShouldPersistTaps="handled">
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{humanStatus(order.status)}</Text>
        <Text style={styles.infoLine}>Заказ {order.public_id}</Text>
        <Text style={styles.infoLine}>{order.pickup_address} → {order.dropoff_address}</Text>
        <Text style={styles.infoLine}>Водитель: {order.driver_full_name || "ищем…"}</Text>
        <Text style={styles.infoLine}>Машина: {[order.vehicle_make, order.vehicle_model, order.vehicle_plate].filter(Boolean).join(" ") || "будет назначена"}</Text>
        <Text style={styles.infoLine}>Цена: {formatMoney(order.fare_total)}</Text>
      </View>
      <Pressable onPress={cancel} style={[styles.secondary, { marginTop: 10 }]}>
        <Text style={styles.secondaryText}>Отменить заказ</Text>
      </Pressable>
      <Text style={styles.sectionTitle}>Чат с водителем</Text>
      <View style={styles.chatBox}>
        {messages.length === 0
          ? <Text style={{ color: colors.textDim }}>Сообщений пока нет.</Text>
          : messages.map((m) => <ChatBubble key={m.id} text={m.text} mine={m.sender_type === "passenger"} />)}
      </View>
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        <TextInput value={text} onChangeText={setText} placeholder="Сообщение водителю" placeholderTextColor={colors.textMuted} style={[styles.comment, { flex: 1, marginRight: 8, marginTop: 0 }]} />
        <Pressable onPress={send} style={[styles.primary, { paddingHorizontal: 18 }]} disabled={sending}>
          {sending ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.primaryText}>→</Text>}
        </Pressable>
      </View>
      {order.status === "completed" && <FeedbackSection order={order} />}
    </ScrollView>
  );
}

function FeedbackSection({ order }) {
  const [rating, setRating] = useState(0);
  const [sent, setSent] = useState(false);
  const submit = async (n) => { setRating(n); try { await api.submitFeedback(order.public_id, n); setSent(true); } catch (e) { Alert.alert("Ошибка", e.message); } };
  if (sent) return <Text style={{ color: colors.success, marginTop: 16 }}>Спасибо за оценку!</Text>;
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.sectionTitle}>Оцените поездку</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {[1,2,3,4,5].map((n) => (
          <Pressable key={n} onPress={() => submit(n)} style={[styles.star, rating >= n && { backgroundColor: colors.accent }]}>
            <Text style={{ color: rating >= n ? colors.accentText : colors.text, fontSize: 20 }}>★</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function HistoryTab({ items }) {
  return (
    <ScrollView contentContainerStyle={styles.sheetInner}>
      <Text style={styles.sectionTitle}>История поездок</Text>
      {items.length === 0
        ? <Text style={{ color: colors.textDim }}>Ваши поездки появятся здесь.</Text>
        : items.map((item) => (
          <View key={item.public_id} style={styles.infoCard}>
            <Text style={styles.infoTitle}>{item.pickup_address} → {item.dropoff_address}</Text>
            <Text style={styles.infoLine}>{item.public_id} · {formatMoney(item.fare_total)} · {humanStatus(item.status)}</Text>
          </View>
        ))}
    </ScrollView>
  );
}

/* ─── Стили ─── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  addrBarOuter: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", zIndex: 15 },
  addrBar: {
    marginTop: 8, backgroundColor: "rgba(15,18,28,0.88)",
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 18,
    alignItems: "center", minWidth: 200, maxWidth: "85%",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  addrBarLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 },
  addrBarText: { color: colors.text, fontSize: 15, fontWeight: "800", textAlign: "center" },

  pinOverlay: { position: "absolute", left: 0, right: 0, top: SCREEN_H * 0.30, alignItems: "center", zIndex: 10 },

  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12, zIndex: 20 },
  wsPill: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(23,26,38,0.92)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  logoutPill: { backgroundColor: "rgba(23,26,38,0.92)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  wsDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  wsText: { color: colors.text, fontSize: 12, fontWeight: "600" },

  sheet: {
    position: "absolute", left: 0, right: 0,
    backgroundColor: colors.sheet,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    zIndex: 20,
  },

  handleWrap: { alignItems: "center", paddingVertical: 8 },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center" },
  handleArrow: { color: colors.textMuted, fontSize: 11, fontWeight: "600", marginTop: 4, textAlign: "center", letterSpacing: 0.5 },

  sheetInner: { padding: 14, paddingBottom: 20 },

  /* Строки адреса */
  addrRowWrap: {
    flexDirection: "row", alignItems: "center",
    marginBottom: 8,
  },
  addrRowMain: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: colors.card, borderRadius: radius.lg,
    paddingHorizontal: 14, paddingVertical: 14,
    marginRight: 8,
  },
  addrRowDisplay: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.card, borderRadius: radius.lg,
    paddingHorizontal: 14, paddingVertical: 14,
    marginBottom: 8,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  addrDisplayText: { flex: 1, color: colors.text, fontSize: 15 },
  addrPlaceholder: { color: colors.textMuted },
  addrChevron: { color: colors.textMuted, fontSize: 20, marginLeft: 8 },

  /* Кнопка "С карты" */
  fromMapBtn: {
    backgroundColor: colors.card, borderRadius: radius.md,
    paddingHorizontal: 10, paddingVertical: 14,
    alignItems: "center", justifyContent: "center",
  },
  fromMapBtnText: { color: colors.info, fontSize: 12, fontWeight: "700" },

  /* Инфо о маршруте */
  routeInfo: {
    backgroundColor: colors.cardAlt, borderRadius: radius.md,
    paddingVertical: 8, paddingHorizontal: 14,
    marginBottom: 6, alignItems: "center",
  },
  routeInfoText: { color: colors.text, fontSize: 13, fontWeight: "600" },

  /* ── Поиск: абсолютный оверлей ── */
  // Панель подсказок: position absolute, top→bottom выше инпута
  sugPanel: {
    position: "absolute", top: 0, left: 0, right: 0,
    backgroundColor: colors.sheet,
    zIndex: 40,
    // нижняя граница задаётся инлайн через { bottom: keyboardH + 64 }
  },
  // Строка ввода: прибита к клавиатуре
  searchBarFixed: {
    position: "absolute", left: 0, right: 0, height: 64,
    backgroundColor: colors.sheet,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
    zIndex: 41,
  },
  searchBackBtn: { width: 40, height: 40, backgroundColor: colors.card, borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginRight: 10 },
  searchBackText: { color: colors.text, fontSize: 20, lineHeight: 24 },
  searchInput: { flex: 1, backgroundColor: colors.card, color: colors.text, fontSize: 16, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  searchClearBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  searchClearText: { color: colors.textMuted, fontSize: 18 },
  sugRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 14 },
  sugRowSep: { borderBottomWidth: 1, borderBottomColor: colors.border },
  sugIcon: { fontSize: 16, marginRight: 10, marginTop: 1 },
  sugRowText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 20 },
  sugHint: { color: colors.textMuted, fontSize: 14, textAlign: "center", marginTop: 40, paddingHorizontal: 24, lineHeight: 20 },

  /* Форма */
  comment: { marginTop: 10, backgroundColor: colors.card, color: colors.text, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  primary: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  primaryDisabled: { backgroundColor: colors.cardAlt },
  primaryText: { color: colors.accentText, fontWeight: "800", fontSize: 15 },
  secondary: { backgroundColor: colors.cardAlt, borderRadius: radius.md, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.text, fontWeight: "700", fontSize: 14 },
  statusTxt: { color: colors.textMuted, marginTop: 10, fontSize: 12, textAlign: "center" },
  infoCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginBottom: 8 },
  infoTitle: { color: colors.text, fontWeight: "700", fontSize: 16, marginBottom: 6 },
  infoLine: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  sectionTitle: { color: colors.text, fontWeight: "700", fontSize: 15, marginTop: 14, marginBottom: 6 },
  chatBox: { backgroundColor: colors.card, borderRadius: radius.md, padding: 10, minHeight: 100, maxHeight: 200 },
  star: { width: 52, height: 46, borderRadius: radius.md, backgroundColor: colors.cardAlt, alignItems: "center", justifyContent: "center" },
});
