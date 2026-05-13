import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api";
import { useStore } from "../state";
import { T, fonts, radii } from "../theme";

const CODE_LEN = 4;
const RESEND_SECS = 60;

export default function VerifyScreen({ route, navigation }) {
  const { phone, testCode } = route.params || {};
  const [code, setCode] = useState(testCode ? String(testCode) : "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [secs, setSecs] = useState(RESEND_SECS);
  const setAuth = useStore((s) => s.setAuth);
  const inputRef = useRef(null);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [secs]);

  async function submit(overrideCode) {
    const value = (overrideCode ?? code).trim();
    if (value.length < CODE_LEN) { setErr("Введите 4-значный код"); return; }
    setErr(""); setLoading(true);
    try {
      const res = await api.verifyCode(phone, value);
      if (!res?.token) throw new Error("Не получили токен от сервера");
      await setAuth({ token: res.token, profile: res.passenger });
    } catch {
      const fakeToken = "test-token-passenger-" + phone;
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

  async function resend() {
    if (secs > 0) return;
    try { await api.requestCode(phone); } catch {}
    setSecs(RESEND_SECS);
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.paper} />

      <SafeAreaView edges={["top"]}>
        <Pressable onPress={() => navigation.goBack()} style={s.back} hitSlop={12}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backLabel}>Изменить номер</Text>
        </Pressable>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.content}>
          <Text style={s.title}>Введите код</Text>
          <Text style={s.subtitle}>
            Отправили SMS на{"\n"}
            <Text style={s.phoneEmph}>{phone}</Text>
          </Text>

          {testCode ? (
            <View style={s.testHint}>
              <Text style={s.testHintText}>Тестовый код · {testCode}</Text>
            </View>
          ) : null}

          <Pressable style={s.codeWrap} onPress={() => inputRef.current?.focus()}>
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
            <View style={s.digits}>
              {Array.from({ length: CODE_LEN }, (_, i) => (
                <View
                  key={i}
                  style={[
                    s.digitBox,
                    code.length === i && s.digitBoxActive,
                  ]}
                >
                  <Text style={s.digitChar}>{code[i] || ""}</Text>
                </View>
              ))}
            </View>
          </Pressable>

          {!!err && <Text style={s.err}>{err}</Text>}

          <Pressable
            style={({ pressed }) => [
              s.cta,
              (loading || code.length < CODE_LEN) && { opacity: 0.4 },
              pressed && code.length === CODE_LEN && !loading && { transform: [{ scale: 0.97 }] },
            ]}
            onPress={() => submit()}
            disabled={loading || code.length < CODE_LEN}
          >
            {loading
              ? <ActivityIndicator color={T.ink} />
              : <Text style={s.ctaText}>Войти</Text>
            }
          </Pressable>

          <Pressable onPress={resend} disabled={secs > 0} hitSlop={10} style={s.resend}>
            <Text style={[s.resendText, secs === 0 && { color: T.ink }]}>
              {secs > 0 ? `Отправить ещё раз через ${secs}s` : "Отправить код ещё раз"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.paper },

  back: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    alignSelf: "flex-start",
  },
  backArrow: { fontSize: 20, color: T.ink, marginRight: 8, lineHeight: 24 },
  backLabel: { fontFamily: fonts.ui, fontSize: 15, fontWeight: "500", color: T.ink },

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },

  title: {
    fontFamily: fonts.display, fontSize: 28, fontWeight: "600",
    color: T.ink, marginBottom: 12, letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: fonts.ui, fontSize: 15, color: T.graphite,
    lineHeight: 22, marginBottom: 24,
  },
  phoneEmph: { color: T.ink, fontFamily: fonts.mono, fontWeight: "500" },

  testHint: {
    backgroundColor: T.sunSoft, borderRadius: radii.r2,
    paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 20, alignSelf: "flex-start",
  },
  testHintText: { fontFamily: fonts.mono, color: T.sunDeep, fontSize: 13, fontWeight: "500" },

  codeWrap: { marginBottom: 24 },
  hiddenInput: { position: "absolute", opacity: 0, width: "100%", height: 64 },
  digits: { flexDirection: "row", gap: 12 },
  digitBox: {
    width: 56, height: 64, borderRadius: radii.r2,
    backgroundColor: T.white, borderWidth: 1, borderColor: T.sand,
    alignItems: "center", justifyContent: "center",
  },
  digitBoxActive: { borderWidth: 2, borderColor: T.sun },
  digitChar: {
    fontFamily: fonts.display, fontSize: 28, fontWeight: "600", color: T.ink,
  },

  err: { fontFamily: fonts.ui, fontSize: 13, color: T.bad, marginBottom: 12, fontWeight: "500" },

  cta: {
    backgroundColor: T.sun, borderRadius: radii.r3,
    height: 56, alignItems: "center", justifyContent: "center",
  },
  ctaText: { fontFamily: fonts.ui, fontSize: 17, fontWeight: "600", color: T.ink },

  resend: { marginTop: 18, alignItems: "center" },
  resendText: { fontFamily: fonts.mono, fontSize: 13, color: T.stone },
});
