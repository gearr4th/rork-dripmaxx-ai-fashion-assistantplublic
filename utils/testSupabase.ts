import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Platform } from 'react-native';

export interface ConnectionTestResult {
  success: boolean;
  status?: number;
  response?: string;
  duration?: number;
  error?: string;
}

export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  console.log('[TestSupabase] === Testing Supabase Connection ===');
  console.log('[TestSupabase] Platform:', Platform.OS);

  if (!isSupabaseConfigured) {
    console.log('[TestSupabase] Supabase not configured');
    return {
      success: false,
      error: 'Supabase not configured',
    };
  }

  try {
    const startTime = Date.now();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout after 10s')), 10000)
    );

    const sessionPromise = supabase.auth.getSession();

    const { data, error } = await Promise.race([sessionPromise, timeoutPromise]);

    const duration = Date.now() - startTime;
    console.log('[TestSupabase] Request completed in:', duration + 'ms');

    if (error) {
      console.error('[TestSupabase] Connection failed:', error.message);
      return {
        success: false,
        error: error.message,
        duration,
      };
    }

    console.log('[TestSupabase] Connection successful!');
    console.log('[TestSupabase] Session status:', data.session ? 'Active' : 'No active session');

    return {
      success: true,
      status: 200,
      response: 'Connected',
      duration,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[TestSupabase] Connection test failed:', errorMsg);

    return {
      success: false,
      error: errorMsg,
    };
  }
}
