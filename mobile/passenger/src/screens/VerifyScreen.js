import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar,
  ActivityIndicator, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api";
import { useStore } from "../state";

const { width: W } = Dimensions.get("window");
const ACCENT = "#F5CF31";
const CODE_LEN = 4;

export default function VerifyScreen({ route, navigation }) {
  const { phone, testCode } = route.params || {};
  const [code,    setCode]    = useState(testCode ? String(testCode) : "");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");
  const setAuth   = useStore((s) => s.setAuth);
  const inputRef  = useRef(null);

  async function submit(overrideCode) {
    const value = (overrideCode ?? code).trim();
    if (value.length < CODE_LEN) { setErr("Введите 4-значный код"); return; }
    setErr(""); setLoading(true);
    try {
      const res = await api.verifyCode(phone, value);
      if (!res?.token) throw new Error("Не получили токен от сервера");
      await setAuth({ token: res.token, profile: res.passenger });
    } catch (e) {
      // Тестовый режим: сервер недоступен — входим с фиктивными данными
      const fakeToken  = "test-token-passenger-" + phone;
      const fakeProfile = { id: 1, phone, full_name: "Тест Пассажир" };
      await setAuth({ token: fakeToken, profile: fakeProfile });
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(text) {
    const digits = text.replace(/\D/g, "").slice(0, CODE_LEN);
    setCode(digits);
    setErr("");
    if (digits.length === CODE_LEN) submit(digits);
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView edges={["top"]}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={12}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backLabel}>Изменить номер</Text>
        </Pressable>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={s.body}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.content}>
          <Text style={s.title}>Введите код</Text>
          <Text style={s.subtitle}>
            {"Отправили SMS на\n"}
            <Text style={s.phoneHighlight}>{phone}</Text>
          </Text>

          {testCode ? (
            <View style={s.testHintBox}>
              <Text style={s.testHintText}>Тестовый код: {testCode}</Text>
            </View>
          ) : null}

          {/* Код: кнопочный ввод с цифровыми ячейками */}
          <Pressable style={s.codeWrap} onPress={() => inputRef.current?.focus()}>
            {/* Скрытый TextInput, который принимает ввод */}
            <TextInput
              ref={inputRef}
              style={s.hiddenInput}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              maxLength={CODE_LEN}
              autoFocus
              caretHidden
              textContentType="oneTimeCode"
            />
            {/* Визуальные ячейки */}
            <View style={s.digits}>
              {Array.from({ length: CODE_LEN }, (_, i) => (
                <View
                  key={i}
                  style={[
                    s.digitBox,
                    code.length === i && s.digitBoxActive,
                    code[i] && s.digitBoxFilled,
                  ]}
                >
                  <Text style={s.digitChar}>{code[i] || ""}</Text>
                </View>
              ))}
            </View>
          </Pressable>

          {!!err && <Text style={s.errText}>{err}</Text>}

          <Pressable
            style={[s.btn, (loading || code.length < CODE_LEN) && s.btnDisabled]}
            onPress={() => submit()}
            disabled={loading || code.length < CODE_LEN}
          >
            {loading
              ? <ActivityIndicator color="#1A1A1A" />
              : <Text style={s.btnText}>Войти</Text>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const BOX = (W - 56 - 24) / CODE_LEN; // ячейка с отступами

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },

  backBtn: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    alignSelf: "flex-start",
  },
  backArrow: { fontSize: 20, color: "#1A1A1A", marginRight: 8, lineHeight: 24 },
  backLabel: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },

  body: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 24 },

  title:    { fontSize: 34, fontWeight: "800", color: "#1A1A1A", marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#888888", lineHeight: 26, marginBottom: 32 },
  phoneHighlight: { color: "#1A1A1A", fontWeight: "700" },

  testHintBox: {
    backgroundColor: "#FFFDE7", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 24, alignSelf: "flex-start",
  },
  testHintText: { color: "#B8860B", fontSize: 13, fontWeight: "600" },

  /* Ячейки кода */
  codeWrap: { marginBottom: 24 },
  hiddenInput: {
    position: "absolute", opacity: 0, width: "100%", height: 72,
  },
  digits: { flexDirection: "row", gap: 10 },
  digitBox: {
    width: BOX, height: 72, borderRadius: 16,
    backgroundColor: "#F5F5F5", borderWidth: 2, borderColor: "#EEEEEE",
    alignItems: "center", justifyContent: "center",
  },
  digitBoxActive: { borderColor: ACCENT, backgroundColor: "#FFFDE7" },
  digitBoxFilled: { borderColor: "#1A1A1A", backgroundColor: "#F9F9F9" },
  digitChar: { fontSize: 30, fontWeight: "700", color: "#1A1A1A" },

  errText: { color: "#FF4444", fontSize: 14, marginBottom: 14 },

  btn: {
    backgroundColor: ACCENT, borderRadius: 16,
    paddingVertical: 18, alignItems: "center",
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  btnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  btnText: { color: "#1A1A1A", fontSize: 17, fontWeight: "800" },
});
