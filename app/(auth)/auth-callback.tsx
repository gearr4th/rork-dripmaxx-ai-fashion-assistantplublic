import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Alert, Text } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useAuth } from '@/providers/AuthProvider';

export default function AuthCallback() {
  const { completeOAuthFromRedirect } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        let url: string | null = null;
        if (Platform.OS === 'web') {
          url = window.location.href as unknown as string;
        } else {
          url = await Linking.getInitialURL();
        }
        if (!url) {
          throw new Error('Missing redirect URL');
        }
        await completeOAuthFromRedirect(url);
        router.replace('/select-age' as any);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'OAuth failed';
        console.error('[AuthCallback] OAuth error', msg);
        setError(msg);
        Alert.alert('Authentication', msg);
      }
    };
    void run();
  }, [completeOAuthFromRedirect]);

  return (
    <View style={styles.c} testID="auth-callback-loading">
      {error ? <Text style={styles.error}>Error: {error}</Text> : <ActivityIndicator color="#FFD700" />}
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  error: { color: '#ff6b6b', fontSize: 14 },
});