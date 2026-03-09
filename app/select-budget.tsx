import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Wallet } from 'lucide-react-native';
import { useBudget, BudgetOption } from '@/providers/BudgetProvider';
import { router } from 'expo-router';

const OPTIONS: BudgetOption[] = ['$100', '$250', '$500', '$1000', '$2000+'];

export default function SelectBudgetScreen() {
  const { budget, setBudget } = useBudget();
  const [selected, setSelected] = useState<BudgetOption | null>(budget);

  const onContinue = async () => {
    if (!selected) {
      Alert.alert('Select monthly budget', 'Please choose one of the options.');
      return;
    }
    await setBudget(selected);
    router.replace('/');
  };

  return (
    <LinearGradient colors={["#020B1C", "#0A1A2F", "#071E2B", "#0C1425"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Wallet color="#F97316" size={24} />
            <Text style={styles.title}>Monthly spending budget</Text>
          </View>
          <Text style={styles.subtitle}>Pick the range that best matches how much you want to spend on clothes monthly. You can change this later in Settings.</Text>

          <View style={styles.optionsWrap}>
            {OPTIONS.map(opt => {
              const isActive = selected === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  testID={`budget-${opt}`}
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

          <TouchableOpacity testID="continue-budget" style={styles.continueBtn} onPress={onContinue}>
            <LinearGradient colors={["#F97316", "#EA580C"]} style={styles.continueInner} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={styles.continueText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.note}>You can always edit this in Profile → Settings.</Text>
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
  title: { color: '#E2E8F0', fontSize: 22, fontWeight: '800' as const },
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