import React, { useRef, useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Dimensions, StatusBar, Animated, Platform,
  ActivityIndicator, KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api";

const { width: W, height: H } = Dimensions.get("window");

/* ── Arch geometry ──────────────────────────────────────────── */
const ARCH_W  = W * 0.86;
const ARCH_H  = H * 0.62;
const ARCH_TR = ARCH_W / 2;          // top radius → true arch (stadium)

/* ── Palette ──────────────────────────────────────────────── */
const C = {
  frame:   "#22180E",   // outer background (dark walnut)
  sky0:    "#0B0820",   // top of sky
  sky1:    "#1B0B28",
  sky2:    "#3A1030",
  sky3:    "#7B2030",
  sky4:    "#C44020",   // horizon glow
  ground:  "#140B06",
  sun:     "#FF9820",
  city:    "#0F0608",
  road:    "#1A0E08",
  accent:  "#F5CF31",
  white:   "#FFFFFF",
  wDim:    "rgba(255,255,255,0.65)",
};

/* ── City skyline (simple rectangles) ── */
const BUILDINGS = [
  { l: 0.05, w: 0.07, h: 0.22 },
  { l: 0.10, w: 0.05, h: 0.18 },
  { l: 0.14, w: 0.08, h: 0.30 },
  { l: 0.21, w: 0.06, h: 0.24 },
  { l: 0.26, w: 0.10, h: 0.38 },
  { l: 0.35, w: 0.07, h: 0.28 },
  { l: 0.41, w: 0.05, h: 0.20 },
  { l: 0.55, w: 0.06, h: 0.20 },
  { l: 0.60, w: 0.09, h: 0.35 },
  { l: 0.68, w: 0.06, h: 0.26 },
  { l: 0.73, w: 0.08, h: 0.22 },
  { l: 0.80, w: 0.05, h: 0.28 },
  { l: 0.84, w: 0.07, h: 0.18 },
  { l: 0.89, w: 0.06, h: 0.24 },
];

function ArchScene() {
  const groundTop = ARCH_H * 0.72;  // where city base sits
  const horizonTop = ARCH_H * 0.62;
  const sunSize = W * 0.20;
  const sunTop = ARCH_H * 0.54;

  return (
    <View style={{ width: ARCH_W, height: ARCH_H }}>
      {/* Sky bands */}
      <View style={{ position: "absolute", top: 0,              left: 0, right: 0, height: ARCH_H * 0.35, backgroundColor: C.sky0 }} />
      <View style={{ position: "absolute", top: ARCH_H * 0.35,  left: 0, right: 0, height: ARCH_H * 0.10, backgroundColor: C.sky1 }} />
      <View style={{ position: "absolute", top: ARCH_H * 0.45,  left: 0, right: 0, height: ARCH_H * 0.08, backgroundColor: C.sky2 }} />
      <View style={{ position: "absolute", top: ARCH_H * 0.53,  left: 0, right: 0, height: ARCH_H * 0.10, backgroundColor: C.sky3 }} />
      <View style={{ position: "absolute", top: ARCH_H * 0.63,  left: 0, right: 0, height: ARCH_H * 0.10, backgroundColor: C.sky4 }} />
      <View style={{ position: "absolute", top: ARCH_H * 0.73,  left: 0, right: 0, bottom: 0, backgroundColor: C.ground }} />

      {/* Sun halo */}
      <View style={{
        position: "absolute",
        top: sunTop - sunSize * 0.7,
        alignSelf: "center",
        width: sunSize * 2.2, height: sunSize * 2.2,
        borderRadius: sunSize * 1.1,
        backgroundColor: C.sky4, opacity: 0.45,
      }} />
      {/* Sun */}
      <View style={{
        position: "absolute",
        top: sunTop,
        alignSelf: "center",
        width: sunSize, height: sunSize,
        borderRadius: sunSize / 2,
        backgroundColor: C.sun, opacity: 0.92,
      }} />

      {/* City silhouette */}
      {BUILDINGS.map((b, i) => (
        <View key={i} style={{
          position: "absolute",
          left: ARCH_W * b.l,
          bottom: ARCH_H - groundTop,
          width: ARCH_W * b.w,
          height: ARCH_H * b.h,
          backgroundColor: C.city,
          opacity: 0.95,
        }} />
      ))}

      {/* Road stripe */}
      <View style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0, height: ARCH_H * 0.12,
        backgroundColor: C.road,
      }} />
      <View style={{
        position: "absolute",
        bottom: ARCH_H * 0.05,
        alignSelf: "center",
        width: 3, height: ARCH_H * 0.07,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 2,
      }} />

      {/* Car silhouette */}
      <View style={{
        position: "absolute",
        bottom: ARCH_H * 0.08,
        alignSelf: "center",
        width: ARCH_W * 0.22, height: ARCH_H * 0.07,
        backgroundColor: "rgba(255,255,255,0.12)",
        borderRadius: 6,
      }} />
    </View>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [phone,   setPhone]   = useState("+7");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  /* Slide-up sheet animation */
  const sheetAnim = useRef(new Animated.Value(H)).current;

  function openSheet() {
    setSheetOpen(true);
    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 58, friction: 11,
    }).start();
  }

  function closeSheet() {
    Animated.spring(sheetAnim, {
      toValue: H,
      useNativeDriver: true,
      tension: 80, friction: 14,
    }).start(() => setSheetOpen(false));
  }

  async function submit() {
    const trimmed = phone.trim();
    if (!trimmed || trimmed === "+7") { setErr("Введите номер телефона"); return; }
    setErr(""); setLoading(true);
    try {
      const res = await api.requestCode(trimmed);
      navigation.navigate("Verify", { phone: res.phone || trimmed, testCode: res.test_code });
    } catch {
      navigation.navigate("Verify", { phone: trimmed, testCode: "1234" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Frame background ── */}
      <View style={StyleSheet.absoluteFill}>
        {/* Subtle warm texture circles */}
        <View style={s.warmGlow1} />
        <View style={s.warmGlow2} />
      </View>

      {/* ── Arch window ── */}
      <View style={[s.archOuter, { marginTop: insets.top + H * 0.03 }]}>
        <View style={s.arch}>
          <ArchScene />

          {/* Text overlay in bottom of arch */}
          <View style={s.archTextWrap} pointerEvents="none">
            <Text style={s.headline}>
              <Text style={s.headlineBold}>{"Поездки,\n"}</Text>
              <Text style={s.headlineLight}>{"которые\nв радость"}</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* ── Below arch: CTA ── */}
      <View style={[s.ctaBlock, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={s.subtitle}>Быстро. Комфортно. Для вас.</Text>

        <Pressable
          style={({ pressed }) => [s.goBtn, pressed && { opacity: 0.88 }]}
          onPress={openSheet}
        >
          <Text style={s.goBtnText}>Куда поедем?</Text>
        </Pressable>

        <Pressable onPress={openSheet} hitSlop={10}>
          <Text style={s.mapLink}>📍  Выбрать на карте</Text>
        </Pressable>
      </View>

      {/* ── Slide-up phone sheet ── */}
      {sheetOpen && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      )}
      <Animated.View
        style={[
          s.phoneSheet,
          { transform: [{ translateY: sheetAnim }] },
          { paddingBottom: Math.max(insets.bottom + 24, 32) },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Handle */}
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Ваш телефон</Text>

          <View style={s.phoneRow}>
            <View style={s.flagChip}>
              <Text style={s.flagText}>🇷🇺  +7</Text>
            </View>
            <TextInput
              style={s.phoneInput}
              value={phone}
              onChangeText={(t) => { setPhone(t); setErr(""); }}
              placeholder="(999) 000-00-00"
              placeholderTextColor="#BBBBBB"
              keyboardType="phone-pad"
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={submit}
              autoFocus
            />
          </View>

          {!!err && <Text style={s.errText}>{err}</Text>}

          <Pressable
            style={({ pressed }) => [s.submitBtn, loading && s.submitBtnBusy, pressed && { opacity: 0.88 }]}
            onPress={submit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#1A1A1A" />
              : <Text style={s.submitBtnText}>Продолжить</Text>
            }
          </Pressable>

          <Text style={s.terms}>
            {"Продолжая, вы принимаете "}
            <Text style={s.termsLink}>условия использования</Text>
          </Text>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.frame, alignItems: "center" },

  /* Warm texture */
  warmGlow1: {
    position: "absolute", top: -W * 0.3, left: -W * 0.15,
    width: W * 1.3, height: W * 1.3, borderRadius: W * 0.65,
    backgroundColor: "#6A2800", opacity: 0.18,
  },
  warmGlow2: {
    position: "absolute", bottom: -W * 0.2, right: -W * 0.2,
    width: W * 0.9, height: W * 0.9, borderRadius: W * 0.45,
    backgroundColor: "#3A1400", opacity: 0.22,
  },

  /* Arch */
  archOuter: {
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55, shadowRadius: 24, elevation: 20,
  },
  arch: {
    width: ARCH_W,
    height: ARCH_H,
    borderTopLeftRadius: ARCH_TR,
    borderTopRightRadius: ARCH_TR,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  archTextWrap: {
    position: "absolute",
    bottom: ARCH_H * 0.14,
    left: ARCH_W * 0.08,
    right: ARCH_W * 0.08,
  },
  headline: { lineHeight: 42 },
  headlineBold: {
    fontSize: 40, fontWeight: "800", color: C.white,
    letterSpacing: -0.5,
  },
  headlineLight: {
    fontSize: 40, fontWeight: "300", color: "rgba(255,255,255,0.85)",
    letterSpacing: -0.5,
  },

  /* CTA block */
  ctaBlock: {
    flex: 1, width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 0,
  },
  subtitle: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 14, fontWeight: "500",
    letterSpacing: 0.2,
    marginBottom: 20,
    textAlign: "center",
  },
  goBtn: {
    width: "100%",
    backgroundColor: C.accent,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  goBtnText: { color: "#1A1A1A", fontSize: 17, fontWeight: "800" },
  mapLink:   { color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: "500" },

  /* Phone slide-up sheet */
  phoneSheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18, shadowRadius: 18, elevation: 24,
    zIndex: 50,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#CCCCCC", alignSelf: "center", marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 18, fontWeight: "700", color: "#1A1A1A",
    marginBottom: 18,
  },
  phoneRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F5F5F5", borderRadius: 16,
    overflow: "hidden", marginBottom: 16, height: 58,
  },
  flagChip: {
    paddingHorizontal: 16, height: "100%",
    alignItems: "center", justifyContent: "center",
    borderRightWidth: 1.5, borderRightColor: "#E8E8E8",
  },
  flagText:  { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  phoneInput: {
    flex: 1, paddingHorizontal: 14,
    fontSize: 17, color: "#1A1A1A", fontWeight: "500",
  },
  errText: { color: "#FF4444", fontSize: 13, marginBottom: 10, marginLeft: 2 },
  submitBtn: {
    backgroundColor: C.accent, borderRadius: 16,
    paddingVertical: 18, alignItems: "center", marginBottom: 14,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  submitBtnBusy: { opacity: 0.6 },
  submitBtnText: { color: "#1A1A1A", fontSize: 17, fontWeight: "800" },
  terms:     { textAlign: "center", fontSize: 12, color: "#BBBBBB", lineHeight: 18 },
  termsLink: { color: "#999999", textDecorationLine: "underline" },
});
