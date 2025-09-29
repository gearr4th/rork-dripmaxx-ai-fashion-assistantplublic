import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ExternalLink, ShoppingBag, Star, TrendingUp } from 'lucide-react-native';

interface Params {
  name?: string;
  brand?: string;
  price?: string;
  imageUrl?: string;
  reason?: string;
  category?: string;
  trendScore?: string;
  versatilityScore?: string;
}

export default function RecommendationDetails() {
  const p = useLocalSearchParams();

  const name = (p.name ?? '').toString();
  const brand = (p.brand ?? '').toString();
  const priceNum = Number(p.price ?? '0');
  const imageUrl = (p.imageUrl ?? '').toString();
  const reason = (p.reason ?? '').toString();
  const category = (p.category ?? '').toString();
  const trendScore = Number(p.trendScore ?? '0');
  const versatilityScore = Number(p.versatilityScore ?? '0');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Recommendation' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!!imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} />}
        <Text style={styles.title}>{name || 'Suggested Item'}</Text>
        {brand ? <Text style={styles.brand}>{brand}</Text> : null}
        {priceNum > 0 ? <Text style={styles.price}>${Math.round(priceNum)}</Text> : null}

        <View style={styles.row}>
          <TrendingUp color="#FFD700" size={18} />
          <Text style={styles.rowText}>Trend score: {trendScore}</Text>
        </View>
        <View style={styles.row}>
          <Star color="#FFD700" size={18} />
          <Text style={styles.rowText}>Versatility: {versatilityScore}</Text>
        </View>
        {category ? (
          <View style={styles.row}>
            <ShoppingBag color="#FFD700" size={18} />
            <Text style={styles.rowText}>Category: {category}</Text>
          </View>
        ) : null}

        {reason ? <Text style={styles.reason}>{reason}</Text> : null}

        <TouchableOpacity
          style={styles.cta}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.open('https://www.google.com/search?q=' + encodeURIComponent(`${brand || ''} ${name}`), '_blank');
            } else {
              Linking.openURL('https://www.google.com/search?q=' + encodeURIComponent(`${brand || ''} ${name}`));
            }
          }}
          accessibilityRole="button"
          testID="open-search"
        >
          <ExternalLink color="#000" size={18} />
          <Text style={styles.ctaText}>Find this online</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" testID="back-btn">
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 16, paddingBottom: 40 },
  image: { width: '100%', height: 260, borderRadius: 12, backgroundColor: '#111' },
  title: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 12 },
  brand: { color: '#AAA', fontSize: 14, marginTop: 4 },
  price: { color: '#FFD700', fontSize: 18, fontWeight: '800', marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  rowText: { color: '#EEE', fontSize: 14 },
  reason: { color: '#BBB', fontSize: 13, marginTop: 12, lineHeight: 18 },
  cta: { marginTop: 16, backgroundColor: '#FFD700', paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { color: '#000', fontWeight: '800', fontSize: 16 },
  back: { color: '#FFD700', marginTop: 16, textAlign: 'center', fontWeight: '700' },
});