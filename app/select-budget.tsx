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
    <LinearGradient colors={["#0A0A0A", "#1A1A2E", "#0A0A0A"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Wallet color="#FFD700" size={24} />
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
            <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.continueInner} start={{x:0,y:0}} end={{x:1,y:0}}>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: '#FFF', fontSize: 22, fontWeight: '700' },
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