import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2 } from 'lucide-react-native';
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
    setAgeGroup(selected);
    router.replace('/');
  };

  return (
    <LinearGradient colors={["#0A0A0A", "#1A1A2E", "#0A0A0A"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Choose your age group</Text>
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
            <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.continueInner} start={{x:0,y:0}} end={{x:1,y:0}}>
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
  title: { color: '#FFF', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#AAA', fontSize: 14 },
  optionsWrap: { gap: 12 },
  option: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  optionText: { color: '#EEE', fontSize: 16, fontWeight: '600' },
  optionTextActive: { color: '#0A0A0A' },
  continueBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  continueInner: { padding: 16, alignItems: 'center', justifyContent: 'center' },
  continueText: { color: '#000', fontSize: 18, fontWeight: '800' },
  note: { color: '#777', fontSize: 12, textAlign: 'center', marginTop: 6 },
});