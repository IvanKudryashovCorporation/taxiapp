import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStore } from "../state";
import { api, reverseGeocode } from "../api";
import { CAR_CLASSES } from "../config";
import { colors, radius } from "../theme";
import LeafletMap from "../components/LeafletMap";
import ServiceCard from "../components/ServiceCard";
import NavBar from "../components/NavBar";
import ChatBubble from "../components/ChatBubble";

const DEFAULT_LAT = 55.7558;
const DEFAULT_LON = 37.6173;
const { height: SCREEN_H } = Dimensions.get("window");

/* ─── Pickup pin (жёлтый квадрат + человечек + ножка) ─── */
function PickupPin({ loading }) {
  return (
    <View style={pin.wrap}>
      <View style={pin.box}>
        {loading ? (
          <ActivityIndicator color="#1a1a1a" size={22} />
        ) : (
          <PersonIcon />
        )}
      </View>
      <View style={pin.stem} />
    </View>
  );
}

function PersonIcon() {
  return (
    <View style={pin.person}>
      {/* Голова */}
      <View style={pin.head} />
      {/* Тело + поднятая рука */}
      <View style={pin.bodyRow}>
        <View style={pin.torso} />
        <View style={pin.armRaised} />
      </View>
      {/* Ноги */}
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
    width: 54,
    height: 54,
    backgroundColor: "#F5CF31",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  stem: {
    width: 4,
    height: 22,
    backgroundColor: "#1a1a1a",
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  person: { alignItems: "center" },
  head: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#1a1a1a",
    marginBottom: 2,
  },
  bodyRow: { flexDirection: "row", alignItems: "flex-end" },
  torso: {
    width: 10,
    height: 12,
    borderRadius: 3,
    backgroundColor: "#1a1a1a",
  },
  armRaised: {
    width: 8,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: "#1a1a1a",
    marginLeft: 1,
    marginBottom: 8,
    transform: [{ rotate: "-50deg" }],
  },
  legsRow: { flexDirection: "row", marginTop: 1 },
  leg: { width: 4, height: 7, borderRadius: 2, backgroundColor: "#1a1a1a" },
});

/* ─── Main Screen ─── */
export default function MainScreen() {
  const currentOrder = useStore((s) => s.currentOrder);
  const history = useStore((s) => s.history);
  const wsStatus = useStore((s) => s.wsStatus);
  const refreshState = useStore((s) => s.refreshState);
  const logout = useStore((s) => s.logout);
  const setLastQuote = useStore((s) => s.setLastQuote);

  const mapRef = useRef(null);
  const geocodeTimer = useRef(null);

  const [tab, setTab] = useState(currentOrder ? "ride" : "create");
  const [centerLat, setCenterLat] = useState(DEFAULT_LAT);
  const [centerLon, setCenterLon] = useState(DEFAULT_LON);
  const [centerAddress, setCenterAddress] = useState("");
  const [geocoding, setGeocoding] = useState(false);

  // Create form
  const [pickupAddr, setPickupAddr] = useState("");
  const [pickupLat, setPickupLat] = useState(null);
  const [pickupLon, setPickupLon] = useState(null);
  const [dropoffAddr, setDropoffAddr] = useState("");
  const [dropoffLat, setDropoffLat] = useState(null);
  const [dropoffLon, setDropoffLon] = useState(null);
  const [carClass, setCarClass] = useState("econom");
  const [comment, setComment] = useState("");
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (currentOrder && tab === "create") setTab("ride");
    if (!currentOrder && tab === "ride") setTab("create");
  }, [currentOrder]);

  // GPS on start
  useEffect(() => {
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") return;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCenterLat(lat);
        setCenterLon(lon);
        mapRef.current?.setCenter(lat, lon, 15);
        // Сразу получаем адрес
        const addr = await reverseGeocode(lat, lon);
        if (addr) setCenterAddress(addr);
      } catch {}
    })();
  }, []);

  // Markers when coords change
  useEffect(() => {
    const markers = [];
    if (pickupLat != null) markers.push({ lat: pickupLat, lon: pickupLon, color: "#FF5A4D", label: "А" });
    if (dropoffLat != null) markers.push({ lat: dropoffLat, lon: dropoffLon, color: "#5CB8FF", label: "Б" });
    mapRef.current?.setMarkers(markers);
  }, [pickupLat, pickupLon, dropoffLat, dropoffLon]);

  // Обработчик движения карты — дебаунс геокодинга
  const handleCenterChange = useCallback((lat, lon) => {
    setCenterLat(lat);
    setCenterLon(lon);
    setGeocoding(true);
    setCenterAddress("");
    clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      const addr = await reverseGeocode(lat, lon);
      setCenterAddress(addr || "");
      setGeocoding(false);
    }, 700);
  }, []);

  const useCenterForPickup = useCallback(async () => {
    setPickupLat(centerLat);
    setPickupLon(centerLon);
    setPickupAddr(centerAddress || "");
    setStatus("Точка А взята с карты");
  }, [centerLat, centerLon, centerAddress]);

  const useCenterForDropoff = useCallback(async () => {
    setDropoffLat(centerLat);
    setDropoffLon(centerLon);
    setDropoffAddr(centerAddress || "");
    setStatus("Точка Б взята с карты");
  }, [centerLat, centerLon, centerAddress]);

  const buildPayload = () => ({
    pickup_address: pickupAddr.trim() || null,
    pickup_lat: pickupLat,
    pickup_lon: pickupLon,
    dropoff_address: dropoffAddr.trim() || null,
    dropoff_lat: dropoffLat,
    dropoff_lon: dropoffLon,
    comment: comment.trim(),
    passengers_count: 1,
    car_class: carClass,
    payment_method: "cash",
    promo_code: null,
    waypoints: [],
  });

  const doQuote = async () => {
    if (pickupLat == null || dropoffLat == null) { setStatus("Укажите точки А и Б (кнопка «С карты»)"); return; }
    setBusy(true); setStatus("");
    try {
      const res = await api.quote(buildPayload());
      setQuote(res); setLastQuote(res);
    } catch (e) { setStatus(e.message || "Не удалось рассчитать"); }
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

  const orderBtnText = quote ? `Заказать  ${formatMoney(quote.fare_total)}` : "Заказать";

  return (
    <View style={styles.root}>
      {/* Карта — на всё полотно */}
      <LeafletMap
        ref={mapRef}
        centerLat={DEFAULT_LAT}
        centerLon={DEFAULT_LON}
        style={StyleSheet.absoluteFill}
        onCenterChange={handleCenterChange}
      />

      {/* ── Плашка адреса (сверху по центру) ── */}
      {tab === "create" && (
        <SafeAreaView style={styles.addrBarOuter} pointerEvents="none">
          <View style={styles.addrBar}>
            <Text style={styles.addrBarLabel}>Точка подачи</Text>
            <Text style={styles.addrBarText} numberOfLines={1}>
              {geocoding ? "уточняем…" : (centerAddress || "Переместите карту")}
            </Text>
          </View>
        </SafeAreaView>
      )}

      {/* ── Пин точки подачи ── */}
      {tab === "create" && (
        <View style={styles.pinOverlay} pointerEvents="none">
          <PickupPin loading={geocoding} />
        </View>
      )}

      {/* Статус + кнопка выхода */}
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

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {tab === "create" && (
          <ScrollView contentContainerStyle={styles.sheetInner} keyboardShouldPersistTaps="handled">
            {/* Откуда */}
            <View style={styles.addrRow}>
              <View style={[styles.dot, { backgroundColor: colors.danger }]} />
              <TextInput
                value={pickupAddr}
                onChangeText={setPickupAddr}
                placeholder="Откуда поедете"
                placeholderTextColor={colors.textMuted}
                style={styles.addrInput}
              />
              <Pressable onPress={useCenterForPickup} style={styles.mapBtn}>
                <Text style={styles.mapBtnText}>С карты</Text>
              </Pressable>
            </View>

            {/* Куда */}
            <View style={styles.addrRow}>
              <View style={[styles.dot, { backgroundColor: colors.info }]} />
              <TextInput
                value={dropoffAddr}
                onChangeText={setDropoffAddr}
                placeholder="Куда поедете"
                placeholderTextColor={colors.textMuted}
                style={styles.addrInput}
              />
              <Pressable onPress={useCenterForDropoff} style={styles.mapBtn}>
                <Text style={styles.mapBtnText}>С карты</Text>
              </Pressable>
            </View>

            {/* Классы */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ paddingVertical: 4 }}>
              {CAR_CLASSES.map((c) => (
                <ServiceCard
                  key={c.id}
                  icon={c.icon}
                  label={c.label}
                  priceHint={c.id === carClass && quote ? formatMoney(quote.fare_total) : c.priceHint}
                  selected={carClass === c.id}
                  onPress={() => { setCarClass(c.id); setQuote(null); }}
                />
              ))}
            </ScrollView>

            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Комментарий водителю (необязательно)"
              placeholderTextColor={colors.textMuted}
              style={styles.comment}
            />

            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <Pressable onPress={doQuote} style={[styles.secondary, { flex: 1, marginRight: 8 }]} disabled={busy}>
                <Text style={styles.secondaryText}>Рассчитать</Text>
              </Pressable>
              <Pressable onPress={doCreate} style={[styles.primary, { flex: 1 }]} disabled={busy}>
                {busy ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.primaryText}>{orderBtnText}</Text>}
              </Pressable>
            </View>

            {!!status && <Text style={styles.statusTxt}>{status}</Text>}
          </ScrollView>
        )}

        {tab === "ride" && <RideTab order={currentOrder} onRefresh={refreshState} />}
        {tab === "history" && <HistoryTab items={history} />}

        <NavBar active={tab} onChange={setTab} />
      </View>
    </View>
  );
}

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
        {messages.length === 0 ? <Text style={{ color: colors.textDim }}>Сообщений пока нет.</Text>
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
      {items.length === 0 ? <Text style={{ color: colors.textDim }}>Ваши поездки появятся здесь.</Text>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  /* Адресная плашка сверху */
  addrBarOuter: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    alignItems: "center",
    zIndex: 15,
  },
  addrBar: {
    marginTop: 8,
    backgroundColor: "rgba(15,18,28,0.88)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: "center",
    minWidth: 200,
    maxWidth: "85%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  addrBarLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  addrBarText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  /* Пин точки подачи */
  pinOverlay: {
    position: "absolute",
    left: 0, right: 0,
    top: SCREEN_H * 0.13,
    alignItems: "center",
    zIndex: 10,
  },

  /* Статус + выход */
  topOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    zIndex: 20,
  },
  wsPill: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(23,26,38,0.92)",
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginTop: 8,
  },
  logoutPill: {
    backgroundColor: "rgba(23,26,38,0.92)",
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginTop: 8,
  },
  wsDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  wsText: { color: colors.text, fontSize: 12, fontWeight: "600" },

  /* Bottom sheet */
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: colors.sheet,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    maxHeight: "62%",
    paddingTop: 8, zIndex: 20,
  },
  handle: {
    alignSelf: "center", width: 44, height: 4,
    borderRadius: 2, backgroundColor: colors.border, marginBottom: 8,
  },
  sheetInner: { padding: 14, paddingBottom: 20 },
  addrRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 8,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  addrInput: { flex: 1, color: colors.text, fontSize: 15, padding: 0 },
  mapBtn: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.sm, marginLeft: 8,
  },
  mapBtnText: { color: colors.info, fontSize: 12, fontWeight: "600" },
  comment: {
    marginTop: 10, backgroundColor: colors.card, color: colors.text,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
  },
  primary: {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center", justifyContent: "center",
  },
  primaryText: { color: colors.accentText, fontWeight: "800", fontSize: 15 },
  secondary: {
    backgroundColor: colors.cardAlt, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center", justifyContent: "center",
  },
  secondaryText: { color: colors.text, fontWeight: "700", fontSize: 14 },
  statusTxt: { color: colors.textMuted, marginTop: 10, fontSize: 12, textAlign: "center" },
  infoCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginBottom: 8 },
  infoTitle: { color: colors.text, fontWeight: "700", fontSize: 16, marginBottom: 6 },
  infoLine: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  sectionTitle: { color: colors.text, fontWeight: "700", fontSize: 15, marginTop: 14, marginBottom: 6 },
  chatBox: { backgroundColor: colors.card, borderRadius: radius.md, padding: 10, minHeight: 100, maxHeight: 200 },
  star: { width: 52, height: 46, borderRadius: radius.md, backgroundColor: colors.cardAlt, alignItems: "center", justifyContent: "center" },
});
