import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  Platform,
  PanResponder,
} from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStore } from "../state";
import { api, reverseGeocode, geocodeSearch } from "../api";
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

  // Поднимаем шторку над клавиатурой
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

  // Свайп вниз по ручке — сворачивает шторку
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
    onPanResponderRelease: (_, g) => {
      if (g.dy > 40)       setSheetExpanded(false);
      else if (g.dy < -40) setSheetExpanded(true);
    },
  }), []);

  // ── Активное поисковое поле: null | "pickup" | "dropoff"
  const [activeField,      setActiveField]      = useState(null);
  const [activeSug,        setActiveSug]        = useState([]);
  const [activeSugLoading, setActiveSugLoading] = useState(false);

  // Стиль шторки — адаптируется под экран и клавиатуру
  const sheetStyle = useMemo(() => {
    if (activeField) {
      if (keyboardH > 0) {
        // Клавиатура открыта: шторка точно заполняет пространство над ней
        const h = SCREEN_H - keyboardH;
        return { bottom: keyboardH, height: h, maxHeight: h };
      }
      // Клавиатура ещё не открылась: 70% экрана снизу
      return { bottom: 0, maxHeight: SCREEN_H * 0.70 };
    }
    // Обычный режим
    return { bottom: 0, maxHeight: SCREEN_H * 0.62 };
  }, [activeField, keyboardH]);

  const [centerLat, setCenterLat] = useState(initLat);
  const [centerLon, setCenterLon] = useState(initLon);
  const [geocoding, setGeocoding] = useState(false);

  // Форма заказа
  const [pickupAddr, setPickupAddr] = useState("");
  const [pickupLat,  setPickupLat]  = useState(null);
  const [pickupLon,  setPickupLon]  = useState(null);
  const [dropoffAddr, setDropoffAddr] = useState("");
  const [dropoffLat,  setDropoffLat]  = useState(null);
  const [dropoffLon,  setDropoffLon]  = useState(null);

  const [carClass, setCarClass] = useState("econom");
  const [comment,  setComment]  = useState("");
  const [quote,    setQuote]    = useState(null);
  const [busy,     setBusy]     = useState(false);
  const [status,   setStatus]   = useState("");

  useEffect(() => {
    if (currentOrder && tab === "create") setTab("ride");
    if (!currentOrder && tab === "ride")  setTab("create");
  }, [currentOrder]);

  // Карта готова → центрируем на городе
  const handleMapReady = useCallback(() => {
    if (cityLat) mapRef.current?.setCenter(cityLat, cityLon, 13);
  }, [cityLat, cityLon]);

  // GPS — непрерывное слежение, синяя точка на карте
  useEffect(() => {
    let cancelled = false;
    let subscription = null;
    let hasInitialCenter = false;

    (async () => {
      try {
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (perm !== "granted" || cancelled) return;

        // Шаг 1: последняя известная позиция (мгновенно)
        const last = await Location.getLastKnownPositionAsync();
        if (last && !cancelled) {
          const { latitude: lat, longitude: lon } = last.coords;
          mapRef.current?.setCenter(lat, lon, 15);
          mapRef.current?.setUserLocation(lat, lon);
          hasInitialCenter = true;
        }

        // Шаг 2: непрерывное слежение
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 3000,   // обновлять не чаще раз в 3 сек
            distanceInterval: 5,  // и только при сдвиге > 5 метров
          },
          (pos) => {
            if (cancelled) return;
            const { latitude: lat, longitude: lon } = pos.coords;
            // Синяя точка обновляется всегда
            mapRef.current?.setUserLocation(lat, lon);
            // Центрировать карту только при первом фиксе
            if (!hasInitialCenter) {
              hasInitialCenter = true;
              mapRef.current?.setCenter(lat, lon, 15);
            }
          }
        );
      } catch (e) {
        console.warn("GPS:", e?.message);
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []); // eslint-disable-line

  // Только маркер Б на карте (А показывает пин)
  useEffect(() => {
    const markers = [];
    if (dropoffLat != null) markers.push({ lat: dropoffLat, lon: dropoffLon, color: "#5CB8FF", label: "Б" });
    mapRef.current?.setMarkers(markers);
  }, [dropoffLat, dropoffLon]);

  // ── Карта двигается → авто-заполнение «Откуда» ──
  const handleCenterChange = useCallback((lat, lon) => {
    setCenterLat(lat);
    setCenterLon(lon);
    setGeocoding(true);
    clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      const addr = await reverseGeocode(lat, lon);
      setGeocoding(false);
      if (addr) {
        setPickupAddr(addr);
        setPickupLat(lat);
        setPickupLon(lon);
      }
    }, 700);
  }, []);

  // ── Открыть поиск для поля ──
  const openSearch = useCallback((field) => {
    setActiveField(field);
    setSheetExpanded(true);
    setActiveSug([]);
    // Если поле уже заполнено — сразу ищем
    const existingText = field === "pickup" ? pickupAddr : dropoffAddr;
    if (existingText.trim().length >= 1) {
      setActiveSugLoading(true);
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(async () => {
        const res = await geocodeSearch(existingText.trim(), centerLat, centerLon, cityName);
        setActiveSug(res);
        setActiveSugLoading(false);
      }, 0);
    }
  }, [pickupAddr, dropoffAddr, centerLat, centerLon, cityName]);

  const closeSearch = useCallback(() => {
    setActiveField(null);
    setActiveSug([]);
    clearTimeout(searchTimer.current);
  }, []);

  // ── Поиск в активном поле ──
  const onActiveSearch = useCallback((text) => {
    if (activeField === "pickup") {
      setPickupAddr(text);
      setPickupLat(null);
      setPickupLon(null);
    } else {
      setDropoffAddr(text);
      setDropoffLat(null);
      setDropoffLon(null);
    }
    clearTimeout(searchTimer.current);
    if (text.trim().length < 1) { setActiveSug([]); return; }
    setActiveSugLoading(true);
    searchTimer.current = setTimeout(async () => {
      const res = await geocodeSearch(text.trim(), centerLat, centerLon, cityName);
      setActiveSug(res);
      setActiveSugLoading(false);
    }, 400);
  }, [activeField, centerLat, centerLon, cityName]);

  // ── Выбрать подсказку ──
  const selectSug = useCallback((item) => {
    if (activeField === "pickup") {
      setPickupAddr(item.label);
      setPickupLat(item.lat);
      setPickupLon(item.lon);
      mapRef.current?.setCenter(item.lat, item.lon, 16);
    } else {
      setDropoffAddr(item.label);
      setDropoffLat(item.lat);
      setDropoffLon(item.lon);
    }
    closeSearch();
  }, [activeField, closeSearch]);

  const clearActive = useCallback(() => {
    if (activeField === "pickup") { setPickupAddr(""); setPickupLat(null); setPickupLon(null); }
    else { setDropoffAddr(""); setDropoffLat(null); setDropoffLon(null); }
    setActiveSug([]);
  }, [activeField]);

  // ── Заказ ──
  const buildPayload = () => ({
    pickup_address: pickupAddr.trim() || null,
    pickup_lat: pickupLat, pickup_lon: pickupLon,
    dropoff_address: dropoffAddr.trim() || null,
    dropoff_lat: dropoffLat, dropoff_lon: dropoffLon,
    comment: comment.trim(),
    passengers_count: 1, car_class: carClass,
    payment_method: "cash", promo_code: null, waypoints: [],
  });

  const doQuote = async () => {
    if (pickupLat == null || dropoffLat == null) {
      setStatus("Укажите точку А (пин на карте) и точку Б (поиск)"); return;
    }
    setBusy(true); setStatus("");
    try { const res = await api.quote(buildPayload()); setQuote(res); setLastQuote(res); }
    catch (e) { setStatus(e.message || "Не удалось рассчитать"); }
    finally { setBusy(false); }
  };

  const doCreate = async () => {
    if (pickupLat == null || dropoffLat == null) { setStatus("Укажите точки А и Б"); return; }
    setBusy(true); setStatus("");
    try {
      await api.createOrder(buildPayload());
      await refreshState();
      setStatus("Заказ создан. Ищем водителя…");
    } catch (e) { setStatus(e.message || "Не удалось создать"); }
    finally { setBusy(false); }
  };

  const activeText = activeField === "pickup" ? pickupAddr : dropoffAddr;
  const orderBtnText = quote ? `Заказать  ${formatMoney(quote.fare_total)}` : "Заказать";

  return (
    <View style={styles.root}>
      {/* Карта */}
      <LeafletMap
        ref={mapRef}
        centerLat={initLat} centerLon={initLon}
        style={StyleSheet.absoluteFill}
        onCenterChange={handleCenterChange}
        onReady={handleMapReady}
      />

      {/* Адресная плашка сверху */}
      {tab === "create" && !activeField && (
        <SafeAreaView style={styles.addrBarOuter} pointerEvents="none">
          <View style={styles.addrBar}>
            <Text style={styles.addrBarLabel}>Точка подачи</Text>
            <Text style={styles.addrBarText} numberOfLines={1}>
              {geocoding ? "уточняем…" : pickupAddr || "Переместите карту"}
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
          <Text style={styles.wsText}>
            {wsStatus === "online" ? "онлайн" : wsStatus === "connecting" ? "подключение…" : "офлайн"}
          </Text>
        </View>
        <Pressable onPress={logout} style={styles.logoutPill}>
          <Text style={styles.wsText}>Выйти</Text>
        </Pressable>
      </SafeAreaView>

      {/* ───── Bottom sheet ───── */}
      <View style={[styles.sheet, sheetStyle]}>

        {/* Ручка — свайп вниз/вверх и тап для переключения */}
        {!activeField && (
          <View
            {...panResponder.panHandlers}
            style={styles.handleWrap}
            onStartShouldSetResponder={() => false}
          >
            <Pressable onPress={() => setSheetExpanded((v) => !v)} hitSlop={10}>
              <View style={styles.handle} />
              <Text style={styles.handleArrow}>{sheetExpanded ? "▼" : "▲  развернуть"}</Text>
            </Pressable>
          </View>
        )}

        {/* ══ РЕЖИМ ПОИСКА ══ */}
        {activeField && (
          <View style={styles.searchContainer}>
            {/* Шапка с инпутом */}
            <View style={styles.searchHeader}>
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
                clearButtonMode="never"
              />
              {activeText.length > 0 && (
                <Pressable onPress={clearActive} style={styles.searchClearBtn} hitSlop={8}>
                  <Text style={styles.searchClearText}>✕</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.searchDivider} />

            {/* Подсказки */}
            {activeSugLoading ? (
              <ActivityIndicator color={colors.textMuted} style={{ marginTop: 24 }} />
            ) : (
              <FlatList
                data={activeSug}
                keyExtractor={(_, i) => String(i)}
                keyboardShouldPersistTaps="always"
                style={styles.sugScroll}
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
                    {activeText.length >= 3
                      ? "Адреса не найдены — уточните запрос"
                      : activeField === "pickup"
                        ? "Введите адрес или название места откуда едете"
                        : "Введите адрес или название места куда едете"}
                  </Text>
                }
              />
            )}
          </View>
        )}

        {/* ══ ОБЫЧНЫЙ КОНТЕНТ ══ */}
        {!activeField && sheetExpanded && tab === "create" && (
          <ScrollView contentContainerStyle={styles.sheetInner} keyboardShouldPersistTaps="handled">

            {/* Откуда — тап открывает поиск, текст авто-заполняется с пина */}
            <Pressable style={styles.addrRowDisplay} onPress={() => openSearch("pickup")}>
              <View style={[styles.dot, { backgroundColor: colors.danger }]} />
              <Text
                style={[styles.addrDisplayText, !pickupAddr && styles.addrPlaceholder]}
                numberOfLines={1}
              >
                {pickupAddr || "Откуда поедете"}
              </Text>
              <Text style={styles.addrChevron}>›</Text>
            </Pressable>

            {/* Куда — тап открывает поиск */}
            <Pressable style={styles.addrRowDisplay} onPress={() => openSearch("dropoff")}>
              <View style={[styles.dot, { backgroundColor: colors.info }]} />
              <Text
                style={[styles.addrDisplayText, !dropoffAddr && styles.addrPlaceholder]}
                numberOfLines={1}
              >
                {dropoffAddr || "Куда поедете"}
              </Text>
              <Text style={styles.addrChevron}>›</Text>
            </Pressable>

            {/* Классы */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ paddingVertical: 4 }}>
              {CAR_CLASSES.map((c) => (
                <ServiceCard
                  key={c.id} icon={c.icon} label={c.label}
                  priceHint={c.id === carClass && quote ? formatMoney(quote.fare_total) : c.priceHint}
                  selected={carClass === c.id}
                  onPress={() => { setCarClass(c.id); setQuote(null); }}
                />
              ))}
            </ScrollView>

            <TextInput
              value={comment} onChangeText={setComment}
              placeholder="Комментарий водителю (необязательно)"
              placeholderTextColor={colors.textMuted}
              style={styles.comment}
            />

            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <Pressable onPress={doQuote} style={[styles.secondary, { flex: 1, marginRight: 8 }]} disabled={busy}>
                <Text style={styles.secondaryText}>Рассчитать</Text>
              </Pressable>
              <Pressable onPress={doCreate} style={[styles.primary, { flex: 1 }]} disabled={busy}>
                {busy
                  ? <ActivityIndicator color={colors.accentText} />
                  : <Text style={styles.primaryText}>{orderBtnText}</Text>
                }
              </Pressable>
            </View>

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

/* ─── Вкладка активного заказа ─── */
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

function formatMoney(v) { return `${Math.round(Number(v || 0)).toLocaleString("ru-RU")} ₽`; }
function humanStatus(s) {
  return ({ created:"новый", searching_driver:"ищем водителя", accepted:"водитель назначен", driver_on_the_way:"водитель в пути", driver_nearby_leave_now:"водитель рядом", arrived:"водитель на месте", ride_in_progress:"поездка идёт", completed:"поездка завершена", cancelled:"отменён" }[s] || s || "—");
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
  addrBarText: { color: colors.text, fontSize: 16, fontWeight: "800", textAlign: "center" },

  pinOverlay: { position: "absolute", left: 0, right: 0, top: SCREEN_H * 0.30, alignItems: "center", zIndex: 10 },

  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12, zIndex: 20 },
  wsPill: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(23,26,38,0.92)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  logoutPill: { backgroundColor: "rgba(23,26,38,0.92)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  wsDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  wsText: { color: colors.text, fontSize: 12, fontWeight: "600" },

  /* Sheet */
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: colors.sheet,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    maxHeight: "62%",
    paddingTop: 0, zIndex: 20,
  },

  handleWrap: { alignItems: "center", paddingVertical: 8 },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border },
  handleArrow: { color: colors.textMuted, fontSize: 11, fontWeight: "600", marginTop: 4, letterSpacing: 0.5 },

  sheetInner: { padding: 14, paddingBottom: 20 },

  /* Тапабельные строки адреса в обычном режиме */
  addrRowDisplay: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: 14, paddingVertical: 14,
    marginBottom: 8,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  addrDisplayText: { flex: 1, color: colors.text, fontSize: 15 },
  addrPlaceholder: { color: colors.textMuted },
  addrChevron: { color: colors.textMuted, fontSize: 20, marginLeft: 8 },

  /* ── Режим поиска ── */
  searchContainer: { flex: 1 },
  searchHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10,
    paddingTop: 16,
  },
  searchBackBtn: {
    width: 40, height: 40,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    alignItems: "center", justifyContent: "center",
    marginRight: 10,
  },
  searchBackText: { color: colors.text, fontSize: 20, lineHeight: 24 },
  searchInput: {
    flex: 1,
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 16,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchClearBtn: {
    width: 36, height: 36,
    alignItems: "center", justifyContent: "center",
    marginLeft: 8,
  },
  searchClearText: { color: colors.textMuted, fontSize: 18 },
  searchDivider: { height: 1, backgroundColor: colors.border, marginTop: 4 },

  sugScroll: { flex: 1 },
  sugRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  sugRowSep: { borderBottomWidth: 1, borderBottomColor: colors.border },
  sugIcon: { fontSize: 16, marginRight: 10, marginTop: 1 },
  sugRowText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 20 },
  sugHint: { color: colors.textMuted, fontSize: 14, textAlign: "center", marginTop: 30, paddingHorizontal: 24, lineHeight: 20 },

  /* Остальные стили формы */
  comment: { marginTop: 10, backgroundColor: colors.card, color: colors.text, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  primary: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
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
