import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../state";
import { api } from "../api";
import { colors, radius } from "../theme";
import ChatBubble from "../components/ChatBubble";

export default function ChatScreen() {
  const currentOrder = useStore((s) => s.currentOrder);
  const token        = useStore((s) => s.token);
  const [mode, setMode] = useState(currentOrder ? "ride" : "operator");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const isTestToken = token && token.startsWith("test-token-");

  const load = useCallback(async () => {
    if (isTestToken) return;   // не дёргаем API с тест-токеном
    try {
      if (mode === "operator") {
        const items = await api.operatorChatHistory(0);
        setMessages(items);
      } else if (currentOrder?.public_id) {
        const items = await api.rideChatHistory(currentOrder.public_id, 0);
        setMessages(items);
      } else {
        setMessages([]);
      }
    } catch {}
  }, [mode, currentOrder?.public_id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    // Auto-switch to ride chat when new order appears
    if (currentOrder && mode === "operator") setMode("ride");
    if (!currentOrder && mode === "ride") setMode("operator");
  }, [currentOrder]);

  const send = async () => {
    const t = text.trim();
    if (!t || isTestToken) return;
    setSending(true);
    try {
      if (mode === "operator") await api.operatorChatSend(t);
      else if (currentOrder?.public_id) await api.rideChatSend(currentOrder.public_id, t);
      setText("");
      await load();
    } catch {}
    setSending(false);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setMode("operator")}
          style={[styles.tab, mode === "operator" && styles.tabActive]}
        >
          <Text style={[styles.tabText, mode === "operator" && styles.tabTextActive]}>
            Оператор
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("ride")}
          style={[styles.tab, mode === "ride" && styles.tabActive]}
          disabled={!currentOrder}
        >
          <Text
            style={[
              styles.tabText,
              mode === "ride" && styles.tabTextActive,
              !currentOrder && { opacity: 0.4 },
            ]}
          >
            С пассажиром
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 20 }}>
          {messages.length === 0 ? (
            <Text style={styles.muted}>Сообщений пока нет.</Text>
          ) : (
            messages.map((m) => (
              <ChatBubble
                key={m.id}
                text={m.text}
                mine={
                  m.sender_type === "driver" ||
                  (mode === "operator" && m.sender_type === "driver")
                }
              />
            ))
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={mode === "operator" ? "Сообщение оператору" : "Сообщение пассажиру"}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          <Pressable onPress={send} style={styles.sendBtn} disabled={sending}>
            {sending ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={{ color: colors.accentText, fontWeight: "800" }}>→</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tabs: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.md,
    marginHorizontal: 4,
    backgroundColor: colors.cardAlt,
  },
  tabActive: { backgroundColor: colors.accent },
  tabText: { color: colors.textMuted, fontWeight: "700" },
  tabTextActive: { color: colors.accentText },
  muted: { color: colors.textDim, textAlign: "center", marginTop: 40 },
  inputRow: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.sheet,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 8,
  },
  sendBtn: {
    width: 48,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
});
