import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        console.log('[AuthCallback] OAuth callback - redirecting to age selection');
        router.replace('/select-age' as any);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'OAuth failed';
        console.error('[AuthCallback] OAuth error', msg);
        setError(msg);
      }
    };
    void run();
  }, []);

  return (
    <View style={styles.c} testID="auth-callback-loading">
      {error ? <Text style={styles.error}>Error: {error}</Text> : <ActivityIndicator color="#F97316" />}
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#020B1C' },
  error: { color: '#EF4444', fontSize: 14 },
});