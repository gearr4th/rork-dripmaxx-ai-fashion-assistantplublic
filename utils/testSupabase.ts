import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

export interface ConnectionTestResult {
  success: boolean;
  status?: number;
  response?: string;
  duration?: number;
  error?: string;
}

export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  console.log('\n=== Testing Supabase Connection ===');
  console.log('Platform:', Platform.OS);
  
  try {
    const startTime = Date.now();
    
    const { data, error } = await Promise.race([
      supabase.auth.getSession(),
      new Promise<{ data: null; error: Error }>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ]);
    
    const duration = Date.now() - startTime;
    console.log('Request completed in:', duration + 'ms');
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return {
        success: false,
        error: error.message,
        duration,
      };
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Session status:', data.session ? 'Active' : 'No active session');
    
    return {
      success: true,
      status: 200,
      response: 'Connected',
      duration,
    };
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error message:', errorMsg);
    
    if (typeof navigator !== 'undefined') {
      console.log('Browser online status:', navigator.onLine);
    }
    
    return {
      success: false,
      error: errorMsg,
    };
  }
}
