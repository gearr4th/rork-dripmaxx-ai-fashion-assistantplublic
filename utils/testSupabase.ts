import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export async function testSupabaseConnection() {
  console.log('=== Testing Supabase Connection ===');
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY length:', SUPABASE_ANON_KEY?.length);
  
  try {
    const url = `${SUPABASE_URL}/auth/v1/health`;
    console.log('Testing health endpoint:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    });
    
    console.log('Health check response status:', response.status);
    const text = await response.text();
    console.log('Health check response:', text);
    
    return {
      success: response.ok,
      status: response.status,
      response: text,
    };
  } catch (error) {
    console.error('Connection test failed:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
