import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Dimensions, StatusBar, Platform, ActivityIndicator,
  KeyboardAvoidingView, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../api";
import { T, fonts, radii, shadows } from "../theme";
import { Icon } from "../components/Icon";

const { width: W } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const phoneFull = "+7" + phone.replace(/[^\d]/g, "");
  const valid = phone.replace(/[^\d]/g, "").length >= 10;

  async function submit() {
    if (!valid) { setErr("Введите номер телефона"); return; }
    setErr(""); setLoading(true);
    try {
      const res = await api.requestCode(phoneFull);
      navigation.navigate("Verify", { phone: res.phone || phoneFull, testCode: res.test_code });
    } catch {
      navigation.navigate("Verify", { phone: phoneFull, testCode: "1234" });
    } finally {
      setLoading(false);
    }
  }

  function formatPhone(raw) {
    const d = raw.replace(/[^\d]/g, "").slice(0, 10);
    let out = "";
    if (d.length > 0) out += d.slice(0, 3);
    if (d.length > 3) out += " " + d.slice(3, 6);
    if (d.length > 6) out += "-" + d.slice(6, 8);
    if (d.length > 8) out += "-" + d.slice(8, 10);
    return out;
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* sunrise glow — top→down warm fade (заменяет CSS filter:blur эталона). */}
      <LinearGradient
        colors={["rgba(242,166,90,0.35)", "rgba(242,166,90,0)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={s.glowTop}
        pointerEvents="none"
      />
      {/* доп. локальный warm-spot справа сверху (как второй glow на эталоне) */}
      <LinearGradient
        colors={["rgba(242,166,90,0.22)", "rgba(242,166,90,0)"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.3, y: 0.7 }}
        style={s.glowSide}
        pointerEvents="none"
      />

      {/* top brand row */}
      <View style={[s.topBar, { top: insets.top + 12 }]}>
        <View style={s.brand}>
          <View style={s.brandDot} />
          <Text style={s.brandText}>РАССВЕТ</Text>
        </View>
        <Text style={s.brandVer}>v1.4</Text>
      </View>

      {/* hero text */}
      <View style={[s.hero, { top: insets.top + 110 }]}>
        <Text style={s.heroLine}>Доброе</Text>
        <Text style={s.heroLine}>утро,</Text>
        <Text style={[s.heroLine, { color: T.sun }]}>Севастополь.</Text>
        <Text style={s.heroSub}>
          Войдите по номеру телефона. Мы отправим код подтверждения.
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.kbWrap}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
          showsVerticalScrollIndicator={false}
        >
          {/* paper card — bottom 28px по эталону (плюс safe-area inset, чтобы не залазить под home indicator) */}
          <View style={[s.card, shadows.s3, { marginBottom: Math.max(insets.bottom, 28) }]}>
            <Text style={s.label}>НОМЕР ТЕЛЕФОНА</Text>
            <View style={s.inputRow}>
              <Text style={s.prefix}>+7</Text>
              <TextInput
                style={s.input}
                value={formatPhone(phone)}
                onChangeText={(t) => { setPhone(t); setErr(""); }}
                placeholder="978 000-00-00"
                placeholderTextColor={T.mist}
                keyboardType="phone-pad"
                maxLength={15}
                returnKeyType="done"
                onSubmitEditing={submit}
                autoFocus
              />
            </View>
            {!!err && <Text style={s.err}>{err}</Text>}

            <Pressable
              onPress={submit}
              disabled={loading || !valid}
              style={({ pressed }) => [
                s.cta,
                (!valid || loading) && { opacity: 0.4 },
                pressed && valid && !loading && { transform: [{ scale: 0.97 }] },
              ]}
            >
              {loading
                ? <ActivityIndicator color={T.paper} />
                : (
                  <>
                    <Text style={s.ctaText}>Получить код</Text>
                    <Icon name="arrow" size={18} color={T.paper} style={{ marginLeft: 10 }} />
                  </>
                )
              }
            </Pressable>

            <Text style={s.terms}>
              Нажимая «Получить код», вы соглашаетесь{"\n"}с условиями обслуживания.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.ink },

  glowTop: {
    position: "absolute", top: 0, left: 0, right: 0, height: 280,
  },
  glowSide: {
    position: "absolute", top: 0, right: 0, width: 320, height: 360,
  },

  topBar: {
    position: "absolute", left: 24, right: 24,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandDot: { width: 22, height: 22, borderRadius: 6, backgroundColor: T.sun },
  brandText: { fontFamily: fonts.ui, fontSize: 13, letterSpacing: 0.78, color: T.mist, fontWeight: "500" },
  brandVer: { fontFamily: fonts.mono, fontSize: 11, color: T.stone },

  hero: { position: "absolute", left: 24, right: 24 },
  heroLine: {
    fontFamily: fonts.display, fontSize: 38, fontWeight: "500",
    color: T.paper, letterSpacing: -0.6, lineHeight: 42,
  },
  heroSub: {
    marginTop: 16, fontFamily: fonts.ui, fontSize: 14,
    color: T.mist, lineHeight: 21, maxWidth: 280,
  },

  kbWrap: { flex: 1, justifyContent: "flex-end", marginHorizontal: 16 },

  card: {
    backgroundColor: T.paper,
    borderRadius: 24,
    padding: 20,
  },
  label: {
    fontFamily: fonts.ui, fontSize: 11, color: T.graphite,
    letterSpacing: 0.88, fontWeight: "400", marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: T.sand,
    gap: 10,
  },
  prefix: {
    fontFamily: fonts.display, fontSize: 22, fontWeight: "500", color: T.ink,
  },
  input: {
    flex: 1, fontFamily: fonts.mono, fontSize: 22, fontWeight: "500", color: T.ink,
    paddingVertical: 0, letterSpacing: 0.44, // 0.02em * 22 ≈ 0.44 (эталон)
  },
  err: { fontFamily: fonts.ui, fontSize: 12, color: T.bad, marginTop: 8, fontWeight: "500" },

  cta: {
    marginTop: 18, height: 56, borderRadius: radii.r3,
    backgroundColor: T.ink, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
  },
  ctaText: {
    fontFamily: fonts.ui, fontSize: 16, color: T.paper, fontWeight: "500",
  },

  terms: {
    marginTop: 14, fontFamily: fonts.ui, fontSize: 11, color: T.stone,
    lineHeight: 17, textAlign: "center",
  },
});
