import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api";
import { colors, radius } from "../theme";

const SCREEN_H = Dimensions.get("window").height;

const STATUS_META = {
  searching_driver:        { label: "Ищем водителя…",             color: "#F5CF31", textColor: "#1a1a1a", icon: "🔍" },
  accepted:                { label: "Водитель назначен",           color: "#2ECC71", textColor: "#fff",    icon: "✓"  },
  driver_on_the_way:       { label: "Водитель едет к вам",        color: "#2ECC71", textColor: "#fff",    icon: "🚗" },
  driver_nearby_leave_now: { label: "Водитель рядом — выходите!", color: "#FF9800", textColor: "#fff",    icon: "⚡" },
  arrived:                 { label: "Водитель на месте",          color: "#2ECC71", textColor: "#fff",    icon: "📍" },
  ride_in_progress:        { label: "Поездка идёт",              color: "#3498DB", textColor: "#fff",    icon: "🚕" },
  completed:               { label: "Поездка завершена ✓",       color: "#2ECC71", textColor: "#fff",    icon: "⭐" },
  cancelled:               { label: "Заказ отменён",             color: "#E74C3C", textColor: "#fff",    icon: "✕"  },
};

const ACTIVE_STATUSES = new Set([
  "accepted",
  "driver_on_the_way",
  "driver_nearby_leave_now",
  "arrived",
  "ride_in_progress",
]);

// ─────────────────────────────────────────────
// SearchingAnimation
// ─────────────────────────────────────────────
function SearchingAnimation() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [anim]);

  const ring1Scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1.8],
  });
  const ring1Opacity = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.6, 0],
  });

  const ring2Scale = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.2, 0.9, 1.8],
  });
  const ring2Opacity = anim.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 0, 0.5, 0],
  });

  return (
    <View style={sa.container}>
      <Animated.View
        style={[
          sa.ring,
          { transform: [{ scale: ring1Scale }], opacity: ring1Opacity },
        ]}
      />
      <Animated.View
        style={[
          sa.ring,
          { transform: [{ scale: ring2Scale }], opacity: ring2Opacity },
        ]}
      />
      <View style={sa.center}>
        <Text style={sa.emoji}>🚖</Text>
      </View>
    </View>
  );
}

const sa = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 160,
    marginVertical: 8,
  },
  ring: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#F5CF31",
  },
  center: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F5CF31",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 28 },
});

// ─────────────────────────────────────────────
// DriverCard
// ─────────────────────────────────────────────
function DriverCard({ order }) {
  const driver = order.driver || {};
  const rating = driver.rating ? parseFloat(driver.rating) : null;
  const eta = order.eta_minutes ?? order.driver_eta_minutes ?? null;

  function renderStars(r) {
    const full = Math.round(r);
    return Array.from({ length: 5 }, (_, i) => (
      <Text key={i} style={dc.star}>
        {i < full ? "★" : "☆"}
      </Text>
    ));
  }

  return (
    <View style={dc.card}>
      <View style={dc.leftBorder} />
      <View style={dc.body}>
        <View style={dc.row}>
          <View style={dc.info}>
            <Text style={dc.name}>
              {driver.first_name || driver.name || "Водитель"}
            </Text>
            {(driver.car_make || driver.car_model) && (
              <Text style={dc.car}>
                {[driver.car_make, driver.car_model].filter(Boolean).join(" ")}
                {driver.car_plate ? `  ·  ${driver.car_plate}` : ""}
              </Text>
            )}
            {rating != null && (
              <View style={dc.starsRow}>{renderStars(rating)}</View>
            )}
          </View>
          {eta != null && (
            <View style={dc.etaPill}>
              <Text style={dc.etaText}>~{eta} мин</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const dc = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  leftBorder: {
    width: 4,
    backgroundColor: colors.accent,
  },
  body: {
    flex: 1,
    padding: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  info: { flex: 1 },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  car: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: "row",
  },
  star: {
    fontSize: 16,
    color: colors.accent,
    marginRight: 1,
  },
  etaPill: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    marginLeft: 12,
  },
  etaText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 14,
  },
});

// ─────────────────────────────────────────────
// RouteCard
// ─────────────────────────────────────────────
function RouteCard({ pickup, dropoff }) {
  return (
    <View style={rc.card}>
      <View style={rc.row}>
        <View style={rc.dotCol}>
          <View style={rc.dotPickup} />
          <View style={rc.line} />
          <View style={rc.dotDropoff} />
        </View>
        <View style={rc.textCol}>
          <Text style={rc.address} numberOfLines={2}>
            {pickup || "Точка отправления"}
          </Text>
          <View style={rc.sep} />
          <Text style={rc.address} numberOfLines={2}>
            {dropoff || "Точка назначения"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const rc = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  row: { flexDirection: "row" },
  dotCol: {
    width: 20,
    alignItems: "center",
    marginRight: 12,
    paddingTop: 2,
  },
  dotPickup: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF5A4D",
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 4,
    minHeight: 28,
  },
  dotDropoff: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#5CB8FF",
  },
  textCol: { flex: 1, justifyContent: "space-between" },
  address: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  sep: { height: 20 },
});

// ─────────────────────────────────────────────
// PriceCard
// ─────────────────────────────────────────────
function PriceCard({ order }) {
  const price = order.fare_total ?? order.price ?? null;
  const payment = order.payment_method;
  const publicId = order.public_id;

  const paymentLabel = payment === "card" ? "💳 Карта"
    : payment === "online" ? "📱 Онлайн"
    : "💵 Наличные";

  return (
    <View style={pr.card}>
      <View style={pr.topRow}>
        {price != null && (
          <Text style={pr.price}>{Math.round(price)} ₽</Text>
        )}
        <Text style={pr.payment}>{paymentLabel}</Text>
      </View>
      {publicId && (
        <Text style={pr.orderId}>Заказ #{publicId}</Text>
      )}
    </View>
  );
}

const pr = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  price: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.accent,
  },
  payment: {
    fontSize: 15,
    color: colors.textMuted,
  },
  orderId: {
    fontSize: 12,
    color: colors.textMuted,
    opacity: 0.7,
  },
});

// ─────────────────────────────────────────────
// ChatSection
// ─────────────────────────────────────────────
function ChatSection({ order }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const lastIdRef = useRef(0);

  const loadMessages = useCallback(async () => {
    if (!order?.public_id) return;
    try {
      const msgs = await api.chatHistory(order.public_id, lastIdRef.current);
      if (msgs && msgs.length > 0) {
        lastIdRef.current = msgs[msgs.length - 1].id || 0;
        setMessages((prev) => [...prev, ...msgs]);
      }
    } catch {}
  }, [order?.public_id]);

  useEffect(() => {
    loadMessages();
    const timer = setInterval(loadMessages, 4000);
    return () => clearInterval(timer);
  }, [loadMessages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !order?.public_id) return;
    setSending(true);
    setInput("");
    try {
      const msg = await api.chatSend(order.public_id, text);
      if (msg) {
        setMessages((prev) => [...prev, msg]);
        lastIdRef.current = msg.id || lastIdRef.current;
      }
    } catch {}
    setSending(false);
    scrollRef.current?.scrollToEnd({ animated: true });
  }

  return (
    <View style={ch.container}>
      <Text style={ch.title}>Чат с водителем</Text>
      <ScrollView
        ref={scrollRef}
        style={ch.scroll}
        contentContainerStyle={ch.scrollContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 && (
          <Text style={ch.empty}>Сообщений нет</Text>
        )}
        {messages.map((m, i) => {
          const isMe = m.sender === "passenger" || m.role === "passenger";
          return (
            <View key={i} style={[ch.bubble, isMe ? ch.bubbleMe : ch.bubbleThem]}>
              <Text style={[ch.bubbleText, isMe ? ch.bubbleTextMe : ch.bubbleTextThem]}>
                {m.text || m.message || ""}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <View style={ch.inputRow}>
        <TextInput
          style={ch.input}
          placeholder="Написать…"
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!sending}
        />
        <Pressable
          style={[ch.sendBtn, (!input.trim() || sending) && ch.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Text style={ch.sendText}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}

const ch = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scroll: { maxHeight: 200 },
  scrollContent: { padding: 10, gap: 6 },
  empty: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  bubbleMe: {
    alignSelf: "flex-end",
    backgroundColor: colors.accent,
  },
  bubbleThem: {
    alignSelf: "flex-start",
    backgroundColor: colors.cardAlt,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: colors.accentText },
  bubbleTextThem: { color: colors.text },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { fontSize: 18, color: colors.accentText, fontWeight: "700" },
});

// ─────────────────────────────────────────────
// RatingRow
// ─────────────────────────────────────────────
function RatingRow({ order, onClose }) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (rating === 0 || !order?.public_id) return;
    setLoading(true);
    try {
      await api.submitFeedback(order.public_id, rating, null, "");
      setSubmitted(true);
      setTimeout(onClose, 1000);
    } catch (e) {
      Alert.alert("Ошибка", e.message || "Не удалось отправить оценку");
    }
    setLoading(false);
  }

  if (submitted) {
    return (
      <View style={rr.container}>
        <Text style={rr.thanks}>Спасибо за оценку! ⭐</Text>
      </View>
    );
  }

  return (
    <View style={rr.container}>
      <Text style={rr.label}>Оцените поездку</Text>
      <View style={rr.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} style={rr.starBtn}>
            <Text style={[rr.star, n <= rating && rr.starActive]}>
              {n <= rating ? "★" : "☆"}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        style={[rr.btn, (rating === 0 || loading) && rr.btnDisabled]}
        onPress={handleSubmit}
        disabled={rating === 0 || loading}
      >
        <Text style={rr.btnText}>
          {loading ? "Отправляем…" : "Оценить поездку"}
        </Text>
      </Pressable>
    </View>
  );
}

const rr = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  stars: { flexDirection: "row", gap: 8, marginBottom: 16 },
  starBtn: { padding: 4 },
  star: { fontSize: 36, color: colors.border },
  starActive: { color: colors.accent },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: 32,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: colors.accentText, fontWeight: "700", fontSize: 16 },
  thanks: { fontSize: 18, color: colors.success, fontWeight: "700" },
});

// ─────────────────────────────────────────────
// OrderModal (main export)
// ─────────────────────────────────────────────
export default function OrderModal({ order, onRefresh, onClose }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  const status = order?.status || "searching_driver";
  const meta = STATUS_META[status] || STATUS_META.searching_driver;
  const isSearching = status === "searching_driver";
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled";
  const isActive = ACTIVE_STATUSES.has(status);
  const hasDriver = !isSearching && !isCompleted && !isCancelled;
  const showCancel = isSearching || isActive;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 160,
    }).start();
  }, [slideAnim]);

  function handleCancel() {
    Alert.alert(
      "Отменить заказ?",
      "Вы уверены, что хотите отменить заказ?",
      [
        { text: "Нет", style: "cancel" },
        {
          text: "Да, отменить",
          style: "destructive",
          onPress: async () => {
            try {
              await api.cancelOrder(order.public_id, "Отменено пассажиром");
              onRefresh?.();
              onClose?.();
            } catch (e) {
              Alert.alert("Ошибка", e.message || "Не удалось отменить заказ");
            }
          },
        },
      ]
    );
  }

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { transform: [{ translateY: slideAnim }], zIndex: 100 },
      ]}
    >
      {/* Status bar */}
      <SafeAreaView
        style={[styles.statusBar, { backgroundColor: meta.color }]}
        edges={["top"]}
      >
        <Text style={[styles.statusIcon, { color: meta.textColor }]}>
          {meta.icon}
        </Text>
        <Text style={[styles.statusLabel, { color: meta.textColor }]}>
          {meta.label}
        </Text>
      </SafeAreaView>

      {/* Body */}
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Searching animation or driver card */}
          {isSearching && <SearchingAnimation />}
          {hasDriver && <DriverCard order={order} />}

          {/* Route */}
          <RouteCard
            pickup={order?.pickup_address}
            dropoff={order?.dropoff_address}
          />

          {/* Price + details */}
          <PriceCard order={order} />

          {/* Chat */}
          {isActive && <ChatSection order={order} />}

          {/* Rating */}
          {isCompleted && <RatingRow order={order} onClose={onClose} />}

          {/* Cancel button */}
          {showCancel && (
            <Pressable style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>Отменить заказ</Text>
            </Pressable>
          )}

          {/* Close button for completed/cancelled */}
          {(isCompleted || isCancelled) && (
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Закрыть</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  statusIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  statusLabel: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  body: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  cancelBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "600",
  },
  closeBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "600",
  },
});
