import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart, Home, Briefcase, MapPin, Plus, ChevronRight } from "lucide-react-native";
import { T, radii } from "../theme";

const DEFAULT_FAVS = [
  { id: "home", type: "home", label: "Дом",    addr: null },
  { id: "work", type: "work", label: "Работа", addr: null },
];

function FavRow({ item }) {
  const Ico = item.type === "home" ? Home : item.type === "work" ? Briefcase : MapPin;
  const hasAddr = !!item.addr;
  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && { backgroundColor: T.paper }]}
      onPress={() => Alert.alert(item.label, "Редактирование адреса — в разработке")}
    >
      <View style={[s.rowIcon, hasAddr && s.rowIconActive]}>
        <Ico size={18} color={hasAddr ? T.sun : T.stone} strokeWidth={1.8} />
      </View>
      <View style={s.rowBody}>
        <Text style={s.rowLabel}>{item.label}</Text>
        <Text style={[s.rowAddr, !hasAddr && s.rowAddrHint]}>
          {item.addr || "Нажмите, чтобы добавить адрес"}
        </Text>
      </View>
      <ChevronRight size={16} color={T.mist} strokeWidth={1.5} />
    </Pressable>
  );
}

export default function FavoritesScreen() {
  const [favs] = useState(DEFAULT_FAVS);
  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.header}>
        <Heart size={22} color={T.ink} strokeWidth={1.8} />
        <Text style={s.title}>Избранное</Text>
      </View>
      <FlatList
        data={favs}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <FavRow item={item} />}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListFooterComponent={
          <Pressable
            style={({ pressed }) => [s.addRow, pressed && { opacity: 0.7 }]}
            onPress={() => Alert.alert("Добавить адрес", "В разработке")}
          >
            <View style={[s.rowIcon, s.rowIconActive]}>
              <Plus size={18} color={T.sun} strokeWidth={2} />
            </View>
            <Text style={s.addText}>Добавить место</Text>
          </Pressable>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.paper },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: T.sand, backgroundColor: T.white,
  },
  title:       { fontSize: 20, fontWeight: "700", color: T.ink },
  list:        { paddingBottom: 32 },
  row:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 14, backgroundColor: T.white },
  rowIcon:     { width: 40, height: 40, borderRadius: 20, backgroundColor: T.paper, alignItems: "center", justifyContent: "center" },
  rowIconActive: { backgroundColor: "rgba(242,166,90,0.14)" },
  rowBody:     { flex: 1 },
  rowLabel:    { fontSize: 14, fontWeight: "600", color: T.ink, marginBottom: 2 },
  rowAddr:     { fontSize: 12, color: T.graphite },
  rowAddrHint: { color: T.mist, fontStyle: "italic" },
  sep:         { height: 1, backgroundColor: T.paper, marginLeft: 74 },
  addRow:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 14, backgroundColor: T.white },
  addText:     { fontSize: 14, fontWeight: "500", color: T.sun },
});
