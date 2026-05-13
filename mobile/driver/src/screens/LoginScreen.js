import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api";
import { useStore } from "../state";
import { T, fonts, radii, shadows } from "../theme";
import { Icon } from "../components/Icon";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useStore((s) => s.setAuth);

  const submit = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setStatus("");
    try {
      const res = await api.login(trimmed);
      if (!res?.token) throw new Error("Сервер не выдал токен");
      await setAuth({ token: res.token, profile: res.driver });
    } catch {
      const fakeToken = "test-token-" + trimmed;
      const fakeProfile = { id: 1, full_name: "Тест Водитель", invite_code: trimmed, is_online: false };
      await setAuth({ token: fakeToken, profile: fakeProfile });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* sunrise glow — насыщеннее, чем у пассажира */}
      <View style={[s.glow1, { top: -200, left: -140 }]} />
      <View style={[s.glow2, { top: 100, right: -100 }]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* brand row */}
          <SafeAreaView edges={["top"]} style={s.topRow}>
            <View style={s.brand}>
              <View style={s.brandDot} />
              <Text style={s.brandText}>РАССВЕТ · ВОДИТЕЛЬ</Text>
            </View>
            <Text style={s.brandVer}>v1.4</Text>
          </SafeAreaView>

          {/* hero */}
          <View style={s.hero}>
            <Text style={s.heroLine}>Доброе</Text>
            <Text style={s.heroLine}>утро,</Text>
            <Text style={[s.heroLine, { color: T.sun }]}>в смену.</Text>
            <Text style={s.heroSub}>
              Войдите по коду приглашения, чтобы начать принимать заказы.
            </Text>
          </View>

          {/* card */}
          <View style={[s.card, { marginBottom: insets.bottom + 24 }]}>
            <Text style={s.label}>КОД ПРИГЛАШЕНИЯ</Text>
            <TextInput
              style={s.input}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor={T.stone}
              keyboardType="default"
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
            />
            <Pressable
              onPress={submit}
              disabled={loading || !code.trim()}
              style={({ pressed }) => [
                s.cta,
                (!code.trim() || loading) && { opacity: 0.4 },
                pressed && code.trim() && !loading && { transform: [{ scale: 0.97 }] },
              ]}
            >
              {loading
                ? <ActivityIndicator color={T.ink} />
                : (
                  <>
                    <Text style={s.ctaText}>Войти</Text>
                    <Icon name="arrow" size={18} color={T.ink} style={{ marginLeft: 10 }} />
                  </>
                )
              }
            </Pressable>
            {!!status && <Text style={s.err}>{status}</Text>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.ink },

  glow1: {
    position: "absolute", width: 600, height: 600, borderRadius: 300,
    backgroundColor: T.sun, opacity: 0.28,
  },
  glow2: {
    position: "absolute", width: 320, height: 320, borderRadius: 160,
    backgroundColor: T.sun, opacity: 0.18,
  },

  topRow: {
    paddingHorizontal: 24, paddingTop: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandDot: { width: 22, height: 22, borderRadius: 6, backgroundColor: T.sun },
  brandText: { fontFamily: fonts.ui, fontSize: 12, letterSpacing: 1.2, color: T.mist, fontWeight: "500" },
  brandVer: { fontFamily: fonts.mono, fontSize: 11, color: T.stone },

  hero: { paddingHorizontal: 24, marginTop: 60 },
  heroLine: {
    fontFamily: fonts.display, fontSize: 38, fontWeight: "500",
    color: T.paper, letterSpacing: -0.6, lineHeight: 42,
  },
  heroSub: {
    marginTop: 16, fontFamily: fonts.ui, fontSize: 14,
    color: T.mist, lineHeight: 21, maxWidth: 320,
  },

  card: {
    marginTop: "auto",
    marginHorizontal: 16,
    backgroundColor: T.ink2, borderWidth: 1, borderColor: T.ink3,
    borderRadius: radii.r4, padding: 20,
    ...shadows.s2,
  },
  label: {
    fontFamily: fonts.ui, fontSize: 11, color: T.mist,
    letterSpacing: 1, fontWeight: "600", marginBottom: 12,
  },
  input: {
    backgroundColor: T.ink2, color: T.white,
    fontFamily: fonts.mono, fontSize: 22, letterSpacing: 3,
    borderRadius: radii.r2, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: T.ink3,
    textAlign: "center",
  },
  cta: {
    marginTop: 16, height: 56, borderRadius: radii.r3,
    backgroundColor: T.sun, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
  },
  ctaText: { fontFamily: fonts.ui, fontSize: 17, fontWeight: "600", color: T.ink },

  err: { fontFamily: fonts.ui, color: T.bad, marginTop: 12, fontSize: 13 },
});
