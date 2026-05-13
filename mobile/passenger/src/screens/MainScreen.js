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
import { Icon } from "../components/Icon";
import { T, fonts, radii, shadows } from "../theme";

const DEFAULT_LAT = 44.6166;
const DEFAULT_LON = 33.5254;
const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const SHEET_EXPANDED_H  = SCREEN_H * 0.62;
const SHEET_COLLAPSED_H = 96;

const QUICK_PLACES = [
  { icon: "home",      label: "Дом · Героев Сталинграда" },
  { icon: "briefcase", label: "Работа" },
  { icon: "heart",     label: "Графская пристань" },
];

function formatMoney(v) {
  return `${Math.round(Number(v || 0)).toLocaleString("ru-RU").replace(",", " ")} ₽`;
}
function formatDistance(m) { return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${Math.round(m)} м`; }
function formatDuration(s) {
  const min = Math.round(s / 60);
  if (min < 60) return `${min} мин`;
  return `${Math.floor(min / 60)} ч ${min % 60} мин`;
}
function humanStatus(s) {
  return ({
    created: "новый", searching_driver: "ищем водителя", accepted: "водитель назначен",
    driver_on_the_way: "водитель в пути", driver_nearby_leave_now: "водитель рядом",
    arrived: "водитель на месте", ride_in_progress: "поездка идёт",
    completed: "поездка завершена", cancelled: "отменён",
  }[s] || s || "—");
}

function PickupPin({ loading }) {
  return (
    <View style={pin.wrap}>
      <View style={pin.box}>
        {loading
          ? <ActivityIndicator color={T.ink} size={20} />
          : <View style={pin.dot} />
        }
      </View>
      <View style={pin.stem} />
    </View>
  );
}
const pin = StyleSheet.create({
  wrap: { alignItems: "center" },
  box: {
    width: 28, height: 28, backgroundColor: T.sun, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: T.white,
    ...shadows.s2,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.white },
  stem: { width: 2, height: 14, backgroundColor: T.ink, marginTop: 2, borderRadius: 1 },
});

export default function MainScreen() {
  const cityLat  = useStore((s) => s.cityLat);
  const cityLon  = useStore((s) => s.cityLon);
  const cityName = useStore((s) => s.cityName);
  const currentOrder = useStore((s) => s.currentOrder);
  const history      = useStore((s) => s.history);
  const wsStatus     = useStore((s) => s.wsStatus);
  const refreshState = useStore((s) => s.refreshState);
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
        useNativeDriver: false, tension: 60, friction: 11,
      }).start();
      setSheetExpanded(!collapse);
    },
  }), []); // eslint-disable-line

  useEffect(() => {
    Animated.spring(sheetH, {
      toValue: sheetExpanded ? SHEET_EXPANDED_H : SHEET_COLLAPSED_H,
      useNativeDriver: false, tension: 60, friction: 11,
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
    if (pickupLat  != null) markers.push({ lat: pickupLat,  lon: pickupLon,  color: T.sun, label: "А" });
    if (dropoffLat != null) markers.push({ lat: dropoffLat, lon: dropoffLon, color: T.ink, label: "Б" });
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

  return (
    <View style={s.root}>
      <LeafletMap
        ref={mapRef} centerLat={initLat} centerLon={initLon}
        style={StyleSheet.absoluteFill}
        onCenterChange={handleCenterChange} onReady={handleMapReady}
      />

      {/* Top floating bar (Yandex Go style) */}
      {tab === "create" && !activeField && (
        <SafeAreaView edges={["top"]} style={s.topRow} pointerEvents="box-none">
          <Pressable style={[s.iconChip, shadows.s2]} hitSlop={8}>
            <Icon name="menu" size={20} color={T.ink} />
          </Pressable>
          <Pressable
            style={[s.searchPill, shadows.s2]}
            onPress={() => openSearch("dropoff")}
          >
            <Icon name="search" size={18} color={T.graphite} />
            <Text style={s.searchPillText}>Куда едем?</Text>
          </Pressable>
          <View style={[s.avatarChip, shadows.s2]}>
            <Text style={s.avatarText}>АК</Text>
          </View>
        </SafeAreaView>
      )}

      {/* WS status (subtle) */}
      {tab === "create" && !activeField && wsStatus !== "online" && (
        <SafeAreaView edges={["top"]} style={s.wsWrap} pointerEvents="none">
          <View style={s.wsPill}>
            <View style={[s.wsDot, { backgroundColor: wsStatus === "connecting" ? T.warn : T.bad }]} />
            <Text style={s.wsText}>{wsStatus === "connecting" ? "соединение…" : "офлайн"}</Text>
          </View>
        </SafeAreaView>
      )}

      {/* My-location FAB */}
      {tab === "create" && !activeField && (
        <Pressable style={[s.locFab, shadows.s2]} onPress={() => {}}>
          <Icon name="loc" size={20} color={T.ink} />
        </Pressable>
      )}

      {/* Pickup pin (centered on map) */}
      {tab === "create" && !activeField && pickupLat == null && (
        <View style={s.pinOverlay} pointerEvents="none">
          <PickupPin loading={geocoding} />
        </View>
      )}

      {/* Search overlay (full-screen above keyboard) */}
      {activeField && (
        <>
          <SafeAreaView style={[s.sugPanel, { bottom: keyboardH + 64 }]}>
            {activeSugLoading
              ? <ActivityIndicator color={T.stone} style={{ marginTop: 32 }} />
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
                        pressed && { backgroundColor: T.paper },
                      ]}
                      onPress={() => selectSug(item)}
                    >
                      <Icon name="pin" size={18} color={T.graphite} style={{ marginRight: 10, marginTop: 1 }} />
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

          <View style={[s.searchBarFixed, { bottom: keyboardH }]}>
            <Pressable onPress={closeSearch} style={s.searchBackBtn} hitSlop={12}>
              <Icon name="back" size={20} color={T.ink} />
            </Pressable>
            <TextInput
              style={s.searchInput}
              value={activeText}
              onChangeText={onActiveSearch}
              placeholder={activeField === "pickup" ? "Откуда поедете…" : "Куда поедете…"}
              placeholderTextColor={T.mist}
              autoFocus
              returnKeyType="search"
            />
            {activeText.length > 0 && (
              <Pressable onPress={clearActive} style={s.searchClearBtn} hitSlop={8}>
                <Icon name="close" size={18} color={T.stone} />
              </Pressable>
            )}
          </View>
        </>
      )}

      {/* Bottom sheet */}
      <Animated.View style={[s.sheet, shadows.s3, { bottom: 0, height: sheetH }]}>
        <View {...panResponder.panHandlers} style={s.handleWrap}>
          <Pressable onPress={() => setSheetExpanded((v) => !v)} hitSlop={10}>
            <View style={s.handle} />
          </Pressable>
        </View>

        {!activeField && sheetExpanded && tab === "create" && (
          <ScrollView
            contentContainerStyle={s.sheetInner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Address card */}
            <View style={s.addrCard}>
              <View style={s.addrRow}>
                <View style={s.dotCol}>
                  <View style={s.dotA} />
                  <View style={s.dotLine} />
                </View>
                <Pressable style={s.addrField} onPress={() => openSearch("pickup")}>
                  <Text style={s.addrLabel}>ОТКУДА</Text>
                  <Text
                    style={[s.addrValue, !pickupAddr && s.addrPlaceholder]}
                    numberOfLines={1}
                  >
                    {pickupAddr || (centerAddress || "Ваше местоположение")}
                  </Text>
                </Pressable>
              </View>

              <View style={s.addrDashedDivider} />

              <View style={s.addrRow}>
                <View style={s.dotCol}>
                  <View style={s.dotB} />
                </View>
                <Pressable style={s.addrField} onPress={() => openSearch("dropoff")}>
                  <Text style={s.addrLabel}>КУДА</Text>
                  <Text
                    style={[s.addrValue, !dropoffAddr && s.addrPlaceholder]}
                    numberOfLines={1}
                  >
                    {dropoffAddr || "Куда едем?"}
                  </Text>
                </Pressable>
                <Pressable style={s.addrPlus} onPress={() => openSearch("dropoff")} hitSlop={8}>
                  <Icon name="plus" size={16} color={T.graphite} />
                </Pressable>
              </View>
            </View>

            {/* Quick places (horizontal chips per spec §6.1.3) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipsRow}
            >
              {QUICK_PLACES.map((p) => (
                <Pressable
                  key={p.label}
                  style={({ pressed }) => [s.chip, pressed && { backgroundColor: T.sand }]}
                  onPress={() => openSearch("dropoff")}
                >
                  <Icon name={p.icon} size={15} color={T.graphite} style={{ marginRight: 8 }} />
                  <Text style={s.chipText}>{p.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Recent rides hint */}
            <View style={s.recentHeader}>
              <Text style={s.recentLabel}>ПОСЛЕДНИЕ</Text>
              <Pressable hitSlop={8}>
                <Text style={s.recentLink}>Все →</Text>
              </Pressable>
            </View>
            <View>
              {(history.slice(0, 2).length === 0
                ? [{ label: "ТЦ «Муссон» · ул. Вакуленчука, 29" }, { label: "Аквамарин · набережная Корнилова, 1" }]
                : history.slice(0, 2).map((h) => ({ label: h.dropoff_address }))
              ).map((row, i, arr) => (
                <Pressable
                  key={i}
                  style={[s.recentRow, i < arr.length - 1 && s.recentRowSep]}
                  onPress={() => openSearch("dropoff")}
                >
                  <View style={s.recentIconBox}>
                    <Icon name="clock" size={14} color={T.graphite} />
                  </View>
                  <Text style={s.recentText} numberOfLines={1}>{row.label}</Text>
                  <Icon name="arrow" size={14} color={T.stone} />
                </Pressable>
              ))}
            </View>

            {/* Route info chip (when route is computed) */}
            {routeInfo && (
              <View style={s.routeChip}>
                <Text style={s.routeChipText}>
                  {formatDistance(routeInfo.distanceM)}  ·  {formatDuration(routeInfo.durationS)}
                </Text>
              </View>
            )}

            {/* Tariffs */}
            <View style={s.tariffHeader}>
              <Text style={s.sectionTitle}>Тарифы</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tariffRow}
            >
              {CAR_CLASSES.map((c) => {
                const selected = carClass === c.id;
                const price = selected && quote ? formatMoney(quote.fare_total) : (c.priceHint || "—");
                return (
                  <Pressable
                    key={c.id}
                    style={[s.tariffCard, selected && s.tariffCardSel]}
                    onPress={() => setCarClass(c.id)}
                  >
                    <Icon name="car" size={28} color={selected ? T.ink : T.graphite} />
                    <Text style={[s.tariffLabel, selected && { color: T.ink }]}>{c.label}</Text>
                    <Text style={[s.tariffPrice, selected && { color: T.ink }]}>{price}</Text>
                    <Text style={s.tariffEta}>4 мин</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Comment */}
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Комментарий водителю"
              placeholderTextColor={T.mist}
              style={s.comment}
            />

            {/* CTA — single primary, sun bg */}
            <Pressable
              onPress={doCreate}
              style={({ pressed }) => [
                s.cta,
                !orderBtnReady && { opacity: 0.4 },
                pressed && orderBtnReady && { transform: [{ scale: 0.97 }] },
              ]}
              disabled={busy || !orderBtnReady}
            >
              {busy
                ? <ActivityIndicator color={T.ink} />
                : (
                  <Text style={s.ctaText}>
                    {orderBtnReady && quote
                      ? `Заказать  ·  ${formatMoney(quote.fare_total)}`
                      : orderBtnReady
                      ? "Заказать"
                      : "Выберите маршрут"}
                  </Text>
                )
              }
            </Pressable>

            {!!status && <Text style={s.statusTxt}>{status}</Text>}
          </ScrollView>
        )}

        {!activeField && sheetExpanded && tab === "history" && (
          <HistoryTab items={history} />
        )}

        {!activeField && sheetExpanded && tab === "ride" && currentOrder && (
          <RideTab order={currentOrder} onRefresh={refreshState} />
        )}

        {!activeField && <NavBar active={tab} onChange={setTab} />}
      </Animated.View>

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
        <Text style={{ color: T.graphite }}>Нет активного заказа.</Text>
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
        <Text style={s.infoLine}>Заказ <Text style={s.mono}>{order.public_id}</Text></Text>
        <Text style={s.infoLine}>{order.pickup_address} → {order.dropoff_address}</Text>
        <Text style={s.infoLine}>Водитель: {order.driver_full_name || "ищем…"}</Text>
        <Text style={s.infoLine}>
          {[order.vehicle_make, order.vehicle_model, order.vehicle_plate].filter(Boolean).join(" ") || "машина будет назначена"}
        </Text>
        <Text style={s.infoLine}>Цена: <Text style={s.mono}>{formatMoney(order.fare_total)}</Text></Text>
      </View>

      <Pressable onPress={cancel} style={s.cancelBtn}>
        <Text style={s.cancelBtnText}>Отменить заказ</Text>
      </Pressable>

      <Text style={s.sectionTitle}>Чат с водителем</Text>
      <View style={s.chatBox}>
        {messages.length === 0
          ? <Text style={{ color: T.graphite, fontSize: 13 }}>Сообщений пока нет.</Text>
          : messages.map((m) => (
            <ChatBubble key={m.id} text={m.text} mine={m.sender_type === "passenger"} />
          ))}
      </View>
      <View style={{ flexDirection: "row", marginTop: 10, gap: 8 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Сообщение водителю"
          placeholderTextColor={T.mist}
          style={[s.comment, { flex: 1, marginTop: 0 }]}
        />
        <Pressable onPress={send} style={[s.cta, { paddingHorizontal: 18, marginTop: 0, height: 48 }]} disabled={sending}>
          {sending
            ? <ActivityIndicator color={T.ink} />
            : <Icon name="send" size={18} color={T.ink} />
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
  if (sent) return <Text style={{ color: T.ok, marginTop: 16, textAlign: "center", fontWeight: "600" }}>Спасибо за оценку!</Text>;
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
            <Text style={{ color: rating >= n ? T.ink : T.stone, fontSize: 22 }}>★</Text>
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
        ? <Text style={{ color: T.graphite, fontSize: 14 }}>Ваши поездки появятся здесь.</Text>
        : items.map((item) => (
          <View key={item.public_id} style={s.infoCard}>
            <Text style={s.infoTitle}>{item.pickup_address} → {item.dropoff_address}</Text>
            <Text style={s.infoLine}>
              <Text style={s.mono}>{item.public_id}</Text> · <Text style={s.mono}>{formatMoney(item.fare_total)}</Text> · {humanStatus(item.status)}
            </Text>
          </View>
        ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.mapBg },

  // Top bar (Yandex Go: menu | search-pill | avatar)
  topRow: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 8, gap: 8,
    zIndex: 20,
  },
  iconChip: {
    width: 44, height: 44, borderRadius: radii.r3,
    backgroundColor: T.white, alignItems: "center", justifyContent: "center",
  },
  searchPill: {
    flex: 1, height: 44, borderRadius: radii.r3,
    backgroundColor: T.white, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, gap: 10,
  },
  searchPillText: { fontFamily: fonts.ui, fontSize: 15, color: T.ink, fontWeight: "500" },
  avatarChip: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: T.ink, alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.ui, fontSize: 13, color: T.paper, fontWeight: "600" },

  // WS pill
  wsWrap: {
    position: "absolute", top: 60, left: 0, right: 0,
    alignItems: "center", zIndex: 18,
  },
  wsPill: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: T.white, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 6, gap: 6,
    ...shadows.s1,
  },
  wsDot: { width: 7, height: 7, borderRadius: 3.5 },
  wsText: { fontFamily: fonts.ui, fontSize: 12, color: T.graphite, fontWeight: "500" },

  // My-location FAB
  locFab: {
    position: "absolute", right: 16, bottom: SHEET_EXPANDED_H + 16,
    width: 44, height: 44, borderRadius: radii.r3,
    backgroundColor: T.white, alignItems: "center", justifyContent: "center",
    zIndex: 18,
  },

  // Pin overlay
  pinOverlay: {
    position: "absolute", left: 0, right: 0,
    top: SCREEN_H * 0.32, alignItems: "center", zIndex: 10,
  },

  // Sheet
  sheet: {
    position: "absolute", left: 0, right: 0,
    backgroundColor: T.paper2,
    borderTopLeftRadius: radii.r5, borderTopRightRadius: radii.r5,
    overflow: "hidden", zIndex: 20,
  },
  handleWrap: { alignItems: "center", paddingVertical: 10 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: T.mist },
  sheetInner: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4 },

  // Address card
  addrCard: {
    backgroundColor: T.paper, borderRadius: radii.r3,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 14,
  },
  addrRow: { flexDirection: "row", alignItems: "center", minHeight: 48 },
  dotCol: {
    width: 14, alignItems: "center", marginRight: 12,
    alignSelf: "stretch", justifyContent: "center",
  },
  dotA: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.sun },
  dotLine: { position: "absolute", top: 28, width: 1, height: 14, backgroundColor: T.sand },
  dotB: { width: 10, height: 10, borderRadius: 2, backgroundColor: T.ink },
  addrField: { flex: 1, paddingVertical: 6 },
  addrLabel: {
    fontFamily: fonts.ui, fontSize: 11, color: T.graphite,
    fontWeight: "600", letterSpacing: 0.6, marginBottom: 2,
  },
  addrValue: { fontFamily: fonts.ui, fontSize: 15, color: T.ink, fontWeight: "500" },
  addrPlaceholder: { color: T.stone },
  addrDashedDivider: {
    borderBottomWidth: 1, borderBottomColor: T.sand, borderStyle: "dashed",
    marginLeft: 26, marginRight: -14,
  },
  addrPlus: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: T.white, alignItems: "center", justifyContent: "center",
    marginLeft: 8, borderWidth: 1, borderColor: T.sand,
  },

  // Chips
  chipsRow: { gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: "row", alignItems: "center",
    height: 36, paddingHorizontal: 14,
    backgroundColor: T.paper, borderRadius: radii.r2,
    borderWidth: 1, borderColor: T.sand,
  },
  chipText: { fontFamily: fonts.ui, fontSize: 13, color: T.ink, fontWeight: "500" },

  // Recent
  recentHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 18, marginBottom: 6,
  },
  recentLabel: {
    fontFamily: fonts.ui, fontSize: 11, color: T.graphite,
    fontWeight: "600", letterSpacing: 0.6,
  },
  recentLink: { fontFamily: fonts.ui, fontSize: 11, color: T.graphite, letterSpacing: 0.6, fontWeight: "600" },
  recentRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, gap: 12,
  },
  recentRowSep: { borderBottomWidth: 1, borderBottomColor: T.sand },
  recentIconBox: {
    width: 32, height: 32, borderRadius: radii.r1,
    backgroundColor: T.paper, alignItems: "center", justifyContent: "center",
  },
  recentText: { flex: 1, fontFamily: fonts.ui, fontSize: 14, color: T.ink },

  // Route chip
  routeChip: {
    alignSelf: "flex-start",
    marginTop: 14, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: T.sunSoft, borderRadius: radii.r1,
  },
  routeChipText: { fontFamily: fonts.mono, fontSize: 12, color: T.sunDeep, fontWeight: "500" },

  // Tariffs
  tariffHeader: { marginTop: 18, marginBottom: 8 },
  sectionTitle: {
    fontFamily: fonts.display, fontSize: 17, fontWeight: "600", color: T.ink,
  },
  tariffRow: { gap: 10, paddingVertical: 4 },
  tariffCard: {
    width: 124, height: 148, borderRadius: radii.r3,
    backgroundColor: T.paper2, borderWidth: 1, borderColor: T.sand,
    paddingHorizontal: 12, paddingVertical: 14,
    alignItems: "flex-start", justifyContent: "space-between",
  },
  tariffCardSel: { borderWidth: 2, borderColor: T.ink },
  tariffLabel: {
    fontFamily: fonts.ui, fontSize: 15, fontWeight: "600", color: T.graphite, marginTop: 4,
  },
  tariffPrice: { fontFamily: fonts.mono, fontSize: 22, fontWeight: "600", color: T.graphite },
  tariffEta:   { fontFamily: fonts.mono, fontSize: 12, fontWeight: "500", color: T.graphite },

  // Comment
  comment: {
    backgroundColor: T.white, color: T.ink,
    borderRadius: radii.r2, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, marginTop: 14, marginBottom: 14,
    borderWidth: 1, borderColor: T.sand,
    fontFamily: fonts.ui,
  },

  // CTA
  cta: {
    height: 56, borderRadius: radii.r3,
    backgroundColor: T.sun, alignItems: "center", justifyContent: "center",
  },
  ctaText: { fontFamily: fonts.ui, fontSize: 17, fontWeight: "600", color: T.ink },
  statusTxt: { fontFamily: fonts.ui, color: T.bad, marginTop: 10, fontSize: 13, textAlign: "center" },

  // Search overlay
  sugPanel: {
    position: "absolute", top: 0, left: 0, right: 0,
    backgroundColor: T.paper2,
    zIndex: 40,
  },
  searchBarFixed: {
    position: "absolute", left: 0, right: 0, height: 64,
    backgroundColor: T.paper2,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12,
    borderTopWidth: 1, borderTopColor: T.sand,
    zIndex: 41,
  },
  searchBackBtn: {
    width: 40, height: 40, borderRadius: radii.r2,
    backgroundColor: T.paper,
    alignItems: "center", justifyContent: "center",
    marginRight: 10,
  },
  searchInput: {
    flex: 1, backgroundColor: T.paper, color: T.ink,
    fontSize: 16, borderRadius: radii.r2, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: fonts.ui,
  },
  searchClearBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  sugRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  sugRowSep: { borderBottomWidth: 1, borderBottomColor: T.sand },
  sugRowText: { flex: 1, fontFamily: fonts.ui, color: T.ink, fontSize: 15, lineHeight: 20 },
  sugHint: {
    fontFamily: fonts.ui, color: T.graphite, fontSize: 14, textAlign: "center",
    marginTop: 40, paddingHorizontal: 24, lineHeight: 20,
  },

  // Ride tab
  infoCard: {
    backgroundColor: T.paper, borderRadius: radii.r3,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: T.sand,
  },
  infoTitle: {
    fontFamily: fonts.display, color: T.ink, fontWeight: "600", fontSize: 16, marginBottom: 6,
  },
  infoLine: { fontFamily: fonts.ui, color: T.graphite, fontSize: 13, marginTop: 2 },
  mono: { fontFamily: fonts.mono },

  cancelBtn: {
    borderWidth: 1, borderColor: T.sand, borderRadius: radii.r3,
    paddingVertical: 14, alignItems: "center", marginBottom: 6,
  },
  cancelBtnText: { fontFamily: fonts.ui, color: T.bad, fontSize: 16, fontWeight: "500" },

  chatBox: {
    backgroundColor: T.paper, borderRadius: radii.r2,
    padding: 10, minHeight: 80, maxHeight: 180,
    borderWidth: 1, borderColor: T.sand,
  },
  starBtn: {
    width: 52, height: 46, borderRadius: radii.r2,
    backgroundColor: T.paper, borderWidth: 1, borderColor: T.sand,
    alignItems: "center", justifyContent: "center",
  },
  starBtnActive: { backgroundColor: T.sunSoft, borderColor: T.sun },
});
