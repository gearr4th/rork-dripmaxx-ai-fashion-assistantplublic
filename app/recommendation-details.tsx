import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ExternalLink, ShoppingBag, Star, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
    <LinearGradient colors={['#020B1C', '#0A1A2F', '#071E2B', '#0C1425']} style={styles.container}>
      <Stack.Screen options={{ title: 'Recommendation', headerStyle: { backgroundColor: '#020B1C' }, headerTintColor: '#E2E8F0' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!!imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} />}
        <Text style={styles.title}>{name || 'Suggested Item'}</Text>
        {brand ? <Text style={styles.brand}>{brand}</Text> : null}
        {priceNum > 0 ? <Text style={styles.price}>${Math.round(priceNum)}</Text> : null}

        <View style={styles.row}>
          <TrendingUp color="#FB923C" size={18} />
          <Text style={styles.rowText}>Trend score: {trendScore}</Text>
        </View>
        <View style={styles.row}>
          <Star color="#FB923C" size={18} />
          <Text style={styles.rowText}>Versatility: {versatilityScore}</Text>
        </View>
        {category ? (
          <View style={styles.row}>
            <ShoppingBag color="#FB923C" size={18} />
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
              void Linking.openURL('https://www.google.com/search?q=' + encodeURIComponent(`${brand || ''} ${name}`));
            }
          }}
          accessibilityRole="button"
          testID="open-search"
        >
          <ExternalLink color="#FFF" size={18} />
          <Text style={styles.ctaText}>Find this online</Text>
        </TouchableOpacity>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  image: { width: '100%', height: 260, borderRadius: 14, backgroundColor: 'rgba(8, 30, 50, 0.5)' },
  title: { color: '#E2E8F0', fontSize: 20, fontWeight: '800' as const, marginTop: 12 },
  brand: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  price: { color: '#FB923C', fontSize: 18, fontWeight: '800' as const, marginTop: 6 },
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginTop: 10 },
  rowText: { color: '#CBD5E1', fontSize: 14 },
  reason: { color: '#94A3B8', fontSize: 13, marginTop: 12, lineHeight: 18 },
  cta: { marginTop: 16, backgroundColor: '#F97316', paddingVertical: 12, borderRadius: 14, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8 },
  ctaText: { color: '#FFFFFF', fontWeight: '800' as const, fontSize: 16 },
});