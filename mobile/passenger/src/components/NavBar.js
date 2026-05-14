import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Home, List, Heart, User } from "lucide-react-native";
import { T } from "../theme";

const TABS = [
  { id: "create",  label: "Главная",   LIcon: Home  },
  { id: "ride",    label: "Заказы",    LIcon: List  },
  { id: "fav",     label: "Избранное", LIcon: Heart },
  { id: "profile", label: "Профиль",   LIcon: User  },
];

export default function NavBar({ active }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  return (
    <View style={[s.root, { paddingBottom: insets.bottom + 4 }]}>
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <Pressable key={t.id} style={s.item} onPress={() => navigation.navigate(t.id)} hitSlop={8}>
            <t.LIcon size={24} color={isActive ? T.sun : T.stone} strokeWidth={isActive ? 2.2 : 1.6} />
            <Text style={[s.label, isActive && s.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flexDirection: "row", borderTopWidth: 1, borderTopColor: T.sand, backgroundColor: T.white, paddingTop: 8 },
  item:        { flex: 1, alignItems: "center", gap: 3 },
  label:       { fontSize: 10, fontWeight: "500", color: T.stone },
  labelActive: { color: T.sun, fontWeight: "700" },
});
