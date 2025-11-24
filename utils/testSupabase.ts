import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
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
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY configured:', Boolean(SUPABASE_ANON_KEY));
  console.log('SUPABASE_ANON_KEY length:', SUPABASE_ANON_KEY?.length);
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase not configured. Auth will fall back to demo mode.');
    return {
      success: false,
      error: 'Supabase not configured',
    };
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const url = `${SUPABASE_URL}/auth/v1/health`;
    console.log('Testing health endpoint:', url);
    console.log('Request starting at:', new Date().toISOString());
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    const duration = Date.now() - startTime;
    console.log('Request completed in:', duration + 'ms');
    console.log('Health check response status:', response.status);
    
    const text = await response.text();
    console.log('Health check response:', text);
    console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    
    if (response.ok) {
      console.log('✅ Supabase connection successful!');
    } else {
      console.warn('⚠️ Supabase responded but with error status');
    }
    
    return {
      success: response.ok,
      status: response.status,
      response: text,
      duration,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ Connection test failed:', error);
    console.error('Error type:', error?.constructor?.name);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error message:', errorMsg);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Connection timed out after 10 seconds');
    }
    
    if (typeof navigator !== 'undefined') {
      console.log('Browser online status:', navigator.onLine);
    }
    
    return {
      success: false,
      error: errorMsg,
    };
  }
}
