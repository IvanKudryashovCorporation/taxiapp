import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api";
import { colors, radius } from "../theme";

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("+7");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const trimmed = phone.trim();
    if (!trimmed || trimmed === "+7") return;
    setStatus("");
    setLoading(true);
    try {
      const res = await api.requestCode(trimmed);
      navigation.navigate("Verify", { phone: res.phone || trimmed, testCode: res.test_code });
    } catch (e) {
      // ── ТЕСТОВЫЙ РЕЖИМ: если сервер недоступен — переходим с кодом 1234 ──
      navigation.navigate("Verify", { phone: trimmed, testCode: "1234" });
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
            <Text style={styles.kicker}>ПАССАЖИРСКОЕ ПРИЛОЖЕНИЕ</Text>
            <Text style={styles.title}>Профсоюз{"\n"}«Рассвет»</Text>
            <Text style={styles.subtitle}>
              Закажите поездку за пару минут: маршрут на карте, расчёт стоимости и отслеживание водителя в реальном времени.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Введите номер телефона</Text>
            <Text style={styles.cardHint}>Мы отправим код для входа</Text>

            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+7 999 123-45-67"
              placeholderTextColor={colors.textDim}
              keyboardType="phone-pad"
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
                <Text style={styles.primaryText}>Получить код</Text>
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
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: "700" },
  cardHint: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 16 },
  input: {
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontSize: 18,
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
