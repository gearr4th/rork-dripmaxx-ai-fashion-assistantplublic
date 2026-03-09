import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Users } from 'lucide-react-native';
import { useSession, AgeGroup } from '@/providers/SessionProvider';
import { router } from 'expo-router';

const OPTIONS: AgeGroup[] = ['1-10','11-13','13-18','18-25','25-35','35+'];

export default function SelectAgeScreen() {
  const { ageGroup, setAgeGroup } = useSession();
  const [selected, setSelected] = useState<AgeGroup | null>(ageGroup);

  const onContinue = () => {
    if (!selected) {
      Alert.alert('Select age group', 'Please choose an age group to tailor trends.');
      return;
    }
    void setAgeGroup(selected);
    router.replace('/');
  };

  return (
    <LinearGradient colors={["#020B1C", "#0A1A2F", "#071E2B", "#0C1425"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Users color="#F97316" size={24} />
            <Text style={styles.title}>Choose your age group</Text>
          </View>
          <Text style={styles.subtitle}>We use this only for this session to surface the right TikTok/Instagram trends.</Text>

          <View style={styles.optionsWrap}>
            {OPTIONS.map(opt => {
              const isActive = selected === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  testID={`age-${opt}`}
                  style={[styles.option, isActive && styles.optionActive]}
                  onPress={() => setSelected(opt)}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{opt}</Text>
                  {isActive && <CheckCircle2 color="#0A0A0A" size={20} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity testID="continue-age" style={styles.continueBtn} onPress={onContinue}>
            <LinearGradient colors={["#F97316", "#EA580C"]} style={styles.continueInner} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={styles.continueText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.note}>Demo mode: we won’t save this. You’ll be asked again next time.</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 16 },
  headerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  title: { color: '#E2E8F0', fontSize: 24, fontWeight: '800' as const },
  subtitle: { color: '#64748B', fontSize: 14, lineHeight: 20 },
  optionsWrap: { gap: 12 },
  option: {
    backgroundColor: 'rgba(8, 30, 50, 0.6)' as const,
    borderColor: 'rgba(249, 115, 22, 0.15)' as const,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  optionActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  optionText: { color: '#CBD5E1', fontSize: 16, fontWeight: '600' as const },
  optionTextActive: { color: '#FFFFFF' },
  continueBtn: { borderRadius: 14, overflow: 'hidden' as const, marginTop: 8 },
  continueInner: { padding: 16, alignItems: 'center' as const, justifyContent: 'center' as const },
  continueText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' as const },
  note: { color: '#475569', fontSize: 12, textAlign: 'center' as const, marginTop: 6 },
});