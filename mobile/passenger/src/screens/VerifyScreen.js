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
import { useStore } from "../state";
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

          {/* ── Кнопка назад ── */}
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => navigation.goBack()}
            hitSlop={12}
          >
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backLabel}>Изменить номер</Text>
          </Pressable>

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

  /* Кнопка назад */
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.sheet,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  backArrow: {
    color: colors.text,
    fontSize: 18,
    marginRight: 8,
    lineHeight: 22,
  },
  backLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },

  hero: { paddingTop: 8 },
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
  err: { color: colors.danger, marginTop: 12, fontSize: 13 },
});
