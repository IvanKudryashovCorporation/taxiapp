import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  View, Text, TextInput, Pressable, FlatList, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Send } from "lucide-react-native";
import { useStore } from "../state";
import { api } from "../api";
import { radii, fonts, shadows } from "../theme";
import { useT } from "../hooks/useT";

function formatTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch { return ""; }
}

function Bubble({ msg }) {
  const T = useT();
  const s = useMemo(() => makeBubbleStyles(T), [T]);
  const mine = msg.sender_type === "passenger";
  return (
    <View style={[s.row, mine ? { alignItems: "flex-end" } : { alignItems: "flex-start" }]}>
      <View style={[s.body, mine ? s.mine : s.theirs]}>
        <Text style={[s.text, { color: T.ink }]}>{msg.text}</Text>
      </View>
      <Text style={s.time}>{formatTime(msg.created_at)}</Text>
    </View>
  );
}

export default function SupportChatScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const token      = useStore((s) => s.token);
  const T          = useT();
  const s          = useMemo(() => makeScreenStyles(T), [T]);
  const isTest     = token && token.startsWith("test-token-");

  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState("");
  const [sending, setSending]   = useState(false);
  const listRef = useRef(null);

  const load = useCallback(async () => {
    if (isTest) return;
    const items = await api.operatorChatHistory(0);
    setMessages(items);
  }, [isTest]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const send = async () => {
    const t = text.trim();
    if (!t || isTest) return;
    setSending(true);
    await api.operatorChatSend(t);
    setText("");
    await load();
    setSending(false);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
          <ArrowLeft size={22} color={T.ink} strokeWidth={1.8} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Поддержка</Text>
          <Text style={s.headerSub}>Служба поддержки</Text>
        </View>
        <View style={s.onlineDot} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => <Bubble msg={item} />}
          contentContainerStyle={{ paddingVertical: 16 }}
          ListEmptyComponent={
            <Text style={s.empty}>
              Напишите нам — операторы отвечают в течение 5 минут.
            </Text>
          }
        />
        <View style={[s.footer, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Сообщение оператору…"
            placeholderTextColor={T.stone}
            style={s.input}
            multiline
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <Pressable
            onPress={send}
            disabled={sending || !text.trim()}
            style={[s.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]}
          >
            {sending
              ? <ActivityIndicator color={T.ink} size="small" />
              : <Send size={18} color={T.ink} strokeWidth={2} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── StyleSheet factories ──────────────────────────────────────────────────

function makeBubbleStyles(T) {
  return StyleSheet.create({
    row:    { marginBottom: 6, paddingHorizontal: 16 },
    body:   { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.r3 },
    mine:   { backgroundColor: T.sun, borderBottomRightRadius: 4 },
    theirs: { backgroundColor: T.paper, borderBottomLeftRadius: 4, ...shadows.s1 },
    text:   { fontFamily: fonts.ui, fontSize: 15, lineHeight: 21 },
    time:   { fontFamily: fonts.monoReg || fonts.mono, fontSize: 11, color: T.stone, marginTop: 2 },
  });
}

function makeScreenStyles(T) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: T.paper2 },
    header: {
      flexDirection: "row", alignItems: "center", gap: 12,
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: T.white,
      borderBottomWidth: 1, borderBottomColor: T.sand,
    },
    backBtn:     { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: fonts.display, fontSize: 16, fontWeight: "700", color: T.ink },
    headerSub:   { fontFamily: fonts.ui, fontSize: 12, color: T.graphite },
    onlineDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: "#3D8A6A" },
    empty:       { fontFamily: fonts.ui, fontSize: 14, color: T.graphite, textAlign: "center", paddingHorizontal: 32, marginTop: 48, lineHeight: 22 },
    footer: {
      flexDirection: "row", alignItems: "flex-end", gap: 8,
      paddingHorizontal: 12, paddingTop: 8,
      backgroundColor: T.white, borderTopWidth: 1, borderTopColor: T.sand,
    },
    input: {
      flex: 1, backgroundColor: T.paper, color: T.ink,
      borderRadius: radii.r5, paddingHorizontal: 16, paddingVertical: 10,
      fontFamily: fonts.ui, fontSize: 15, maxHeight: 100,
      borderWidth: 1, borderColor: T.sand,
    },
    sendBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: T.sun, alignItems: "center", justifyContent: "center",
    },
  });
}
