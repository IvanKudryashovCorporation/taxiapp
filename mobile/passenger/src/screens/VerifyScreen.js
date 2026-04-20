import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api";
import { colors, radius } from "../theme";

export default function VerifyScreen({ route, navigation }) {
  const { phone, testCode } = route.params || {};
  const [code, setCode] = useState(testCode ? String(testCode) : "");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useStore((s) => s.setAuth);

  const submit = async () => {
    setStatus("");
    setLoading(true);
    try {
      const res = await api.verifyCode(phone, code.trim());
      if (!res?.token) throw new Error("Не получили токен от сервера");
      await setAuth({ token: res.token, profile: res.passenger });
      // App.js (conditional stack) автоматически переключит экран при смене token
    } catch (e) {
      // ── ТЕСТОВЫЙ РЕЖИМ: если сервер недоступен — входим с фиктивными данными ──
      const fakeToken = "test-token-passenger-" + phone;
      const fakeProfile = { id: 1, phone, full_name: "Тест Пассажир" };
      await setAuth({ token: fakeToken, profile: fakeProfile });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <Text style={styles.kicker}>ПОДТВЕРЖДЕНИЕ ВХОДА</Text>
            <Text style={styles.phoneLabel}>Код отправлен на</Text>
            <Text style={styles.phone}>{phone}</Text>
            {testCode ? (
              <Text style={styles.testHint}>Тестовый код: {testCode}</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Введите SMS-код</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="Например: 1111"
              placeholderTextColor={colors.textDim}
              keyboardType="number-pad"
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

            <Pressable style={styles.back} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>Назад</Text>
            </Pressable>

            {!!status && <Text style={styles.err}>{status}</Text>}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 22, justifyContent: "space-between" },
  hero: { paddingTop: 30 },
  kicker: { color: colors.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  phoneLabel: { color: colors.textMuted, fontSize: 16, marginTop: 16 },
  phone: { color: colors.text, fontSize: 32, fontWeight: "800", marginTop: 4 },
  testHint: { color: colors.accent, marginTop: 16, fontSize: 13 },
  card: {
    backgroundColor: colors.sheet,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 14 },
  input: {
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontSize: 22,
    letterSpacing: 4,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primary: {
    marginTop: 14,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryText: { color: colors.accentText, fontWeight: "800", fontSize: 15 },
  back: { marginTop: 10, alignItems: "center", paddingVertical: 12 },
  backText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  err: { color: colors.danger, marginTop: 12, fontSize: 13 },
});
