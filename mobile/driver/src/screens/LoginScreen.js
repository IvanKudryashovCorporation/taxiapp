import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api";
import { useStore } from "../state";
import { colors, radius } from "../theme";

export default function LoginScreen() {
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
    } catch (e) {
      // ── ТЕСТОВЫЙ РЕЖИМ: если сервер недоступен — входим с фиктивными данными ──
      const fakeToken = "test-token-" + trimmed;
      const fakeProfile = {
        id: 1,
        full_name: "Тест Водитель",
        invite_code: trimmed,
        is_online: false,
      };
      await setAuth({ token: fakeToken, profile: fakeProfile });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.hero}>
              <Text style={styles.kicker}>ВОДИТЕЛЬСКОЕ ПРИЛОЖЕНИЕ</Text>
              <Text style={styles.title}>Профсоюз{"\n"}«Рассвет»</Text>
              <Text style={styles.subtitle}>
                Войдите по коду приглашения, чтобы начать принимать заказы.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Код приглашения</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={(v) => setCode(v.toUpperCase())}
                placeholder="ABC123"
                placeholderTextColor={colors.textDim}
                keyboardType="default"
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
              />
              <Pressable
                style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
                onPress={submit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.accentText} />
                ) : (
                  <Text style={styles.primaryText}>Войти</Text>
                )}
              </Pressable>
              {!!status && <Text style={styles.err}>{status}</Text>}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 22, justifyContent: "space-between" },
  hero: { paddingTop: 30 },
  kicker: { color: colors.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  title: { color: colors.text, fontSize: 44, fontWeight: "800", marginTop: 12, lineHeight: 48 },
  subtitle: { color: colors.textMuted, fontSize: 15, marginTop: 18, lineHeight: 22 },
  card: {
    backgroundColor: colors.sheet,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 12 },
  input: {
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontSize: 22,
    letterSpacing: 3,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: "center",
  },
  primary: {
    marginTop: 14,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryText: { color: colors.accentText, fontWeight: "800", fontSize: 15 },
  err: { color: colors.danger, marginTop: 12, fontSize: 13 },
});
