# Supabase Setup Guide

## 🎯 Complete Authentication Setup

This guide will help you set up Supabase authentication with email verification for DripMaxx AI.

## Step 1: Create/Access Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create a free account
3. Your project details:
   - **Project URL**: `https://qfvwpchklysqgmylhqvn.supabase.co`
   - **Anon Key**: Already configured in `utils/config.ts`

## Step 2: Configure Email Authentication

### IMPORTANT: Email Configuration Options

You have two options:

**Option A: Disable Email Confirmation (Recommended for Testing)**

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Under **Email Auth**:
   - ✅ **Enable email signup**
   - ❌ **DISABLE email confirmations** (turn this OFF)
4. Click **Save**
5. Users can signup and login immediately without email verification

**Option B: Enable Email Confirmation (For Production)**

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Under **Email Auth**, enable:
   - ✅ **Enable email confirmations**
   - ✅ **Enable email signup**
4. Click **Save**
5. Configure SMTP settings (see below) OR accept rate limits on free tier

⚠️ **Note**: Supabase free tier has email sending rate limits. If you hit the limit, the app will still create accounts but show a message about email being unavailable.

### Configure Email Templates (Optional but Recommended)

1. In Authentication settings, go to **Email Templates**
2. Customize the **Confirm signup** template:
   ```html
   <h2>Welcome to DripMaxx AI!</h2>
   <p>Click the link below to verify your email:</p>
   <p><a href="{{ .ConfirmationURL }}">Verify Email</a></p>
   ```

### Configure Site URL

1. In Authentication settings, find **Site URL**
2. For development: `exp://192.168.x.x:8081` (your local IP)
3. For production: Your app's deep link URL
4. Click **Save**

## Step 3: Set Up Database Tables

Run these SQL scripts in your Supabase SQL Editor:

### 3.1 User Profiles Table

Copy and paste the contents of `supabase_user_profiles.sql`:

```sql
-- This creates:
-- ✅ user_profiles table for additional user data
-- ✅ Automatic profile creation on signup
-- ✅ Row Level Security policies
```

### 3.2 User Data Sync Table (Already Created)

You already have `supabase_user_blobs.sql` - make sure it's applied:

```sql
-- This enables:
-- ✅ Cross-device data sync
-- ✅ Clothes, outfits, and history storage
-- ✅ Secure per-user data access
```

## Step 4: Test Your Setup

### Test Signup:

1. Open your app
2. Go to Sign Up
3. Enter a **real email address** you can access
4. Fill in name, password (6+ chars), and age
5. Submit the form

**Expected Result:**
- ✅ Account created message
- ✅ "Please check your email to verify" message
- 📧 Verification email sent to your inbox

### Test Email Verification:

1. Check your email inbox
2. Look for email from Supabase
3. Click the verification link
4. You should see a success page

### Test Login:

1. Before verifying email:
   - Should show: "⚠️ Please verify your email address before signing in"
2. After verifying email:
   - Should successfully log in
   - User data saved to database

## Step 5: Verify Database

1. Go to **Table Editor** in Supabase
2. Check these tables:

**auth.users**:
- Should have your user with `email_confirmed_at` timestamp (after verification)

**public.user_profiles**:
- Should have your profile with name and age

**public.user_blobs**:
- Will be created when you save clothes/outfits

## 🔧 Troubleshooting

### Emails Not Sending

**Check Email Settings:**
1. Dashboard → Settings → Authentication
2. Verify SMTP is configured (Supabase provides default SMTP for free tier)
3. Check spam folder

**For Development:**
If emails aren't working, you can:
1. Disable email confirmation temporarily:
   - Go to Auth Settings
   - Uncheck "Enable email confirmations"
   - Users can login immediately after signup

### "Network Request Failed" Error

**Fixed!** The app now uses proper Supabase client library instead of raw fetch calls.

**If you still see this:**
1. Check your internet connection
2. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `utils/config.ts`
3. Check Supabase project is not paused (free tier pauses after inactivity)

### User Data Not Saving

1. Verify RLS policies are created (run SQL scripts)
2. Check browser console for errors
3. Go to Supabase Dashboard → Logs → API to see requests

## ✅ What's Working Now

1. ✅ **Proper Supabase Integration**: Uses `@supabase/supabase-js` library
2. ✅ **Email Verification**: Users get verification emails
3. ✅ **Clear Error Messages**: No more "Network error" - specific errors shown
4. ✅ **Account Already Exists**: Properly detects and informs user
5. ✅ **Email Not Verified**: Blocks login until email is verified
6. ✅ **Database Storage**: All user data saved to Supabase
7. ✅ **Token Management**: Access/refresh tokens stored securely

## 📝 Error Messages Users Will See

- **Signup with existing email**: "An account with this email already exists. Please sign in instead."
- **Login before verification**: "⚠️ Please verify your email address before signing in. Check your inbox for the verification link."
- **Wrong password**: "Invalid email or password. Please check your credentials and try again."
- **Too many attempts**: "Too many login attempts. Please try again in a few minutes."

## 🚀 Next Steps

After auth is working:

1. **Test the full flow**:
   - Signup → Verify email → Login → Use app

2. **Configure production URLs** when ready to launch

3. **Set up password reset** (optional):
   - Use `supabase.auth.resetPasswordForEmail()`
   - Configure reset template in Email Templates

## 🎉 You're Ready!

Your authentication system is now:
- ✅ Production-ready
- ✅ Secure with RLS
- ✅ Email verified
- ✅ Database-backed
- ✅ Error-handled

Test it out and everything should work perfectly!
