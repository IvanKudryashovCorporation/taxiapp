// ChatScreen — спека §6.2.8.
// Тёмная тема: header c avatar пассажира, бабблы (свои справа sun/ink, чужие слева ink2/paper2),
// время моноширинно, footer input с send в круге.
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../state";
import { api } from "../api";
import { T, fonts, radii } from "../theme";
import { Icon } from "../components/Icon";
import { Send } from "lucide-react-native";

function formatTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch { return ""; }
}

function Bubble({ msg, mine }) {
  return (
    <View style={[s.bubbleRow, mine ? { alignItems: "flex-end" } : { alignItems: "flex-start" }]}>
      <View style={[
        s.bubble,
        mine ? s.bubbleMine : s.bubbleTheirs,
      ]}>
        <Text style={[s.bubbleText, mine ? { color: T.ink } : { color: T.paper2 }]}>
          {msg.text}
        </Text>
      </View>
      <Text style={s.bubbleTime}>{formatTime(msg.created_at)}</Text>
    </View>
  );
}

export default function ChatScreen({ route }) {
  const currentOrder = useStore((st) => st.currentOrder);
  const order = route?.params?.order || currentOrder;
  const token  = useStore((st) => st.token);
  const [mode, setMode] = useState(order ? "ride" : "operator");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const isTestToken = token && token.startsWith("test-token-");

  const load = useCallback(async () => {
    if (isTestToken) return;
    try {
      if (mode === "operator") {
        const items = await api.operatorChatHistory(0);
        setMessages(items);
      } else if (order?.public_id) {
        const items = await api.rideChatHistory(order.public_id, 0);
        setMessages(items);
      } else {
        setMessages([]);
      }
    } catch {}
  }, [mode, order?.public_id, isTestToken]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  const send = async () => {
    const t = text.trim();
    if (!t || isTestToken) return;
    setSending(true);
    try {
      if (mode === "operator") await api.operatorChatSend(t);
      else if (order?.public_id) await api.rideChatSend(order.public_id, t);
      setText("");
      await load();
    } catch {}
    setSending(false);
  };

  const paxName = order?.passenger_full_name || "Пассажир";
  const initials = paxName.split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{mode === "operator" ? "Оператор" : paxName}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
            <View style={s.okDot} />
            <Text style={s.online}>онлайн</Text>
          </View>
        </View>
      </View>

      {/* Mode tabs (operator/passenger) */}
      <View style={s.tabsWrap}>
        <Pressable
          onPress={() => setMode("operator")}
          style={[s.tab, mode === "operator" && s.tabActive]}
        >
          <Text style={[s.tabText, mode === "operator" && s.tabTextActive]}>Оператор</Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("ride")}
          style={[s.tab, mode === "ride" && s.tabActive]}
          disabled={!order}
        >
          <Text style={[
            s.tabText,
            mode === "ride" && s.tabTextActive,
            !order && { opacity: 0.4 },
          ]}>С пассажиром</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={s.thread}>
          {messages.length === 0
            ? <Text style={s.empty}>Сообщений пока нет.</Text>
            : messages.map((m) => (
              <Bubble key={m.id} msg={m} mine={m.sender_type === "driver"} />
            ))}
        </ScrollView>

        <View style={s.footer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={mode === "operator" ? "Сообщение оператору" : "Сообщение пассажиру"}
            placeholderTextColor={T.stone}
            style={s.input}
          />
          <Pressable
            onPress={send}
            disabled={sending || !text.trim()}
            style={[s.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]}
          >
            {sending
              ? <ActivityIndicator color={T.ink} />
              : <Send size={18} color={T.ink} strokeWidth={2} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.ink },

  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.ink3,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: T.ink2, alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.display, fontSize: 14, fontWeight: "600", color: T.paper2 },
  name: { fontFamily: fonts.ui, fontSize: 16, fontWeight: "600", color: T.white },
  okDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.ok },
  online: { fontFamily: fonts.ui, fontSize: 11, color: T.mist },

  tabsWrap: {
    flexDirection: "row", gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  tab: {
    flex: 1, height: 36, borderRadius: radii.r2,
    alignItems: "center", justifyContent: "center",
    backgroundColor: T.ink2, borderWidth: 1, borderColor: T.ink3,
  },
  tabActive: { backgroundColor: T.ink3 },
  tabText: { fontFamily: fonts.ui, fontSize: 13, color: T.mist, fontWeight: "500" },
  tabTextActive: { color: T.paper2 },

  thread: { padding: 16, gap: 6 },
  empty: { fontFamily: fonts.ui, color: T.stone, textAlign: "center", marginTop: 40 },

  bubbleRow: { marginBottom: 4 },
  bubble: {
    maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: radii.r3,
  },
  bubbleMine: {
    backgroundColor: T.sun,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: T.ink2,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontFamily: fonts.mono, fontSize: 11, color: T.stone, marginTop: 2 },

  footer: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: T.ink3,
    backgroundColor: T.ink,
  },
  input: {
    flex: 1, backgroundColor: T.ink2, color: T.white,
    borderRadius: radii.r5, paddingHorizontal: 16, paddingVertical: 12,
    fontFamily: fonts.ui, fontSize: 15,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: T.sun, alignItems: "center", justifyContent: "center",
  },
});
