import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function AuthCallback() {
  const params = useLocalSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/select-age' as any);
    }, 500);
    return () => clearTimeout(timer);
  }, [params]);

  return (
    <View style={styles.c} testID="auth-callback-loading">
      <ActivityIndicator color="#FFD700" />
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
});