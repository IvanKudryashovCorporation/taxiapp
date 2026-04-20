import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../state";
import { searchCity } from "../api";
import { colors, radius } from "../theme";

const POPULAR = [
  { label: "Москва",          region: "Московская область",        lat: 55.7558, lon: 37.6173 },
  { label: "Санкт-Петербург", region: "Ленинградская область",      lat: 59.9311, lon: 30.3609 },
  { label: "Новосибирск",     region: "Новосибирская область",      lat: 54.9885, lon: 82.9207 },
  { label: "Екатеринбург",    region: "Свердловская область",       lat: 56.8519, lon: 60.6122 },
  { label: "Казань",          region: "Республика Татарстан",       lat: 55.8304, lon: 49.0661 },
  { label: "Нижний Новгород", region: "Нижегородская область",      lat: 56.2965, lon: 43.9361 },
  { label: "Челябинск",       region: "Челябинская область",        lat: 55.1644, lon: 61.4368 },
  { label: "Самара",          region: "Самарская область",          lat: 53.2001, lon: 50.1500 },
  { label: "Уфа",             region: "Республика Башкортостан",    lat: 54.7388, lon: 55.9721 },
  { label: "Ростов-на-Дону",  region: "Ростовская область",         lat: 47.2357, lon: 39.7015 },
  { label: "Красноярск",      region: "Красноярский край",          lat: 56.0153, lon: 92.8932 },
  { label: "Пермь",           region: "Пермский край",              lat: 58.0105, lon: 56.2502 },
  { label: "Воронеж",         region: "Воронежская область",        lat: 51.6720, lon: 39.1843 },
  { label: "Волгоград",       region: "Волгоградская область",      lat: 48.7070, lon: 44.5170 },
  { label: "Краснодар",       region: "Краснодарский край",         lat: 45.0355, lon: 38.9753 },
  { label: "Омск",            region: "Омская область",             lat: 54.9910, lon: 73.3686 },
  { label: "Тюмень",          region: "Тюменская область",          lat: 57.1553, lon: 65.5343 },
  { label: "Иркутск",         region: "Иркутская область",          lat: 52.2978, lon: 104.2964 },
  { label: "Хабаровск",       region: "Хабаровский край",           lat: 48.4827, lon: 135.0840 },
  { label: "Владивосток",     region: "Приморский край",            lat: 43.1332, lon: 131.9113 },
  { label: "Ярославль",       region: "Ярославская область",        lat: 57.6261, lon: 39.8845 },
  { label: "Барнаул",         region: "Алтайский край",             lat: 53.3547, lon: 83.7699 },
  { label: "Ульяновск",       region: "Ульяновская область",        lat: 54.3282, lon: 48.3866 },
  { label: "Иваново",         region: "Ивановская область",         lat: 57.0004, lon: 40.9739 },
  { label: "Брянск",          region: "Брянская область",           lat: 53.2435, lon: 34.3636 },
  { label: "Тула",            region: "Тульская область",           lat: 54.1929, lon: 37.6172 },
  { label: "Рязань",          region: "Рязанская область",          lat: 54.6269, lon: 39.6916 },
  { label: "Тверь",           region: "Тверская область",           lat: 56.8584, lon: 35.9006 },
  { label: "Кемерово",        region: "Кемеровская область",        lat: 55.3545, lon: 86.0631 },
  { label: "Томск",           region: "Томская область",            lat: 56.4846, lon: 84.9480 },
];

export default function CityScreen({ navigation }) {
  const setCity = useStore((s) => s.setCity);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const onSearch = (text) => {
    setQuery(text);
    clearTimeout(timer.current);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const res = await searchCity(text.trim());
      setResults(res);
      setLoading(false);
    }, 500);
  };

  const select = async (city) => {
    await setCity({ name: city.label, lat: city.lat, lon: city.lon });
    navigation.reset({ index: 0, routes: [{ name: "Main" }] });
  };

  const displayList = query.trim().length >= 2 ? results : POPULAR;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>ДОБРО ПОЖАЛОВАТЬ</Text>
          <Text style={styles.title}>Ваш город</Text>
          <Text style={styles.subtitle}>
            Укажите город, чтобы адреса на карте подтягивались рядом с вами
          </Text>
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={onSearch}
            placeholder="Введите название города"
            placeholderTextColor={colors.textMuted}
            autoFocus
            returnKeyType="search"
          />
          {loading && <ActivityIndicator color={colors.textMuted} style={{ marginRight: 8 }} />}
        </View>

        {query.trim().length >= 2 && !loading && results.length === 0 && (
          <Text style={styles.empty}>Город не найден. Попробуйте другое написание.</Text>
        )}

        <FlatList
          data={displayList}
          keyExtractor={(item, i) => `${item.label}${i}`}
          renderItem={({ item, index }) => (
            <Pressable
              style={({ pressed }) => [styles.cityItem, pressed && { opacity: 0.7 }]}
              onPress={() => select(item)}
            >
              <View style={styles.cityRow}>
                <View style={styles.cityDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cityName}>{item.label}</Text>
                  {!!item.region && (
                    <Text style={styles.cityRegion}>{item.region}</Text>
                  )}
                </View>
                <Text style={styles.arrow}>›</Text>
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: 20 },

  hero: { paddingTop: 16, marginBottom: 22 },
  kicker: { color: colors.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  title: { color: colors.text, fontSize: 32, fontWeight: "800", marginTop: 8 },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 8, lineHeight: 20 },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.sheet,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 14,
  },

  empty: { color: colors.textMuted, textAlign: "center", marginTop: 16, fontSize: 14 },

  list: { flex: 1 },
  cityItem: {
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  cityRow: { flexDirection: "row", alignItems: "center" },
  cityDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.accent,
    marginRight: 12,
  },
  cityName: { color: colors.text, fontSize: 16, fontWeight: "600" },
  cityRegion: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  arrow: { color: colors.textMuted, fontSize: 22, fontWeight: "300", marginLeft: 8 },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 20 },
});
