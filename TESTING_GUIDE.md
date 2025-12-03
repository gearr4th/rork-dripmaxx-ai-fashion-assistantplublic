# Testing Guide - Verify CloudSync & Auth Fixes

## Quick Verification Steps

### 1. Check Console on App Start
When you launch the app, you should see these logs:

```
[Supabase] ✅ Configuration loaded: https://qfvwpchklysqgmylhqvn...
[Auth] ========== LOADING USER SESSION ==========
[Auth] ✓ Found stored user: [email]
[CloudSync] ========== FETCHING CLOUD DATA ==========
[CloudSync] ✅ CLOUD DATA LOADED: { clothesCount: X, outfitsCount: Y }
```

**If you see errors**, they should now be clear and actionable (not `[object Object]`).

### 2. Test Authentication Flow
```bash
# Test 1: Sign In
1. Go to sign in page
2. Enter valid credentials
3. Check console for: "[Auth] ✅ tRPC login successful"
4. Should redirect to home page

# Test 2: Session Persistence
1. Sign in successfully
2. Reload the page (Ctrl+R or Cmd+R)
3. Should remain signed in
4. Check console for: "[Auth] ✓ Found stored user"

# Test 3: Sign Out & Back In
1. Sign out
2. Sign in again
3. Your data should still be there
```

### 3. Test CloudSync Flow
```bash
# Test 1: Add Data While Online
1. Sign in
2. Add a clothing item or outfit
3. Check console for: "[CloudSync] Successfully saved to cloud"
4. Sign out and sign back in
5. Data should persist

# Test 2: Offline Mode
1. Disconnect internet (airplane mode or disable wifi)
2. Try to sign in
3. Should see: "Unable to connect to cloud storage. App is running in offline mode."
4. App should still work locally
5. Reconnect internet
6. Sign in again - data should sync
```

### 4. Test Error Scenarios
```bash
# Test 1: Wrong Password
1. Try to sign in with wrong password
2. Should see clear error: "Invalid email or password..."
3. NOT: "JSON parse error" or "Unexpected character"

# Test 2: Network Error
1. Disconnect internet
2. Try to use the app
3. Should see: "Unable to connect to cloud storage..."
4. App should continue working in offline mode

# Test 3: Invalid Credentials in env file
1. Temporarily modify env file with invalid Supabase URL
2. Restart app
3. Should see: "[Supabase] ❌ Invalid Supabase credentials"
4. App should run in demo mode
5. Restore valid credentials and restart
```

## What to Look For

### ✅ Good Signs:
- No more `[object Object]` in error logs
- Clear error messages like "Unable to connect to cloud storage"
- App doesn't crash when network fails
- Data persists after sign out/sign in
- Session restored after app reload

### ❌ Bad Signs (Report These):
- Still seeing `[object Object]` errors
- App crashes when opening
- Login fails with unclear errors
- Data lost after sign out
- Session not restored after reload

## Common Issues & Solutions

### Issue: "Still getting 'Failed to fetch' errors"
**Solutions**:
1. Check internet connection
2. Verify Supabase project is active in dashboard
3. Check browser console for CORS errors
4. Try clearing browser cache and reload

### Issue: "Data lost after app restart"
**Solutions**:
1. Check if you're actually signed in (not demo mode)
2. Look for "[CloudSync] Successfully saved" logs when adding data
3. Verify Supabase credentials in `env` file
4. Check Supabase dashboard for saved data

### Issue: "Login fails with 'Network error'"
**Solutions**:
1. Backend might not be running (this is OK, auth falls back to direct Supabase)
2. Check for "[Auth] Backend unavailable, trying direct Supabase..."
3. Should succeed with direct Supabase authentication
4. If still failing, check Supabase credentials

## Debug Commands

### View Environment Variables:
Open browser console and run:
```javascript
console.log('SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL)
```

### Check Supabase Connection:
In browser console:
```javascript
// This should be available if you import supabase
import { supabase } from './lib/supabase'
console.log(await supabase.auth.getSession())
```

### View AsyncStorage (React Native):
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage'
console.log(await AsyncStorage.getItem('user'))
console.log(await AsyncStorage.getItem('accessToken'))
```

## Reporting Issues

If you still have problems, provide these details:

1. **Console Logs**: Copy all `[Supabase]`, `[CloudSync]`, and `[Auth]` messages
2. **Steps to Reproduce**: Exact steps that cause the error
3. **Error Message**: The full, exact error message
4. **Environment**: Web, iOS, or Android?
5. **Network Status**: Online or offline when error occurred?

## Success Criteria

The fixes are working correctly if:

1. ✅ No more confusing `[object Object]` error messages
2. ✅ Clear, human-readable error messages
3. ✅ App works in offline mode when network fails
4. ✅ Authentication persists after app restart
5. ✅ Data syncs to cloud and persists after sign out/in
6. ✅ App doesn't crash on network errors
