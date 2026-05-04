# 🚀 Production Launch - Authentication Setup Guide

## ✅ COMPLETE THIS BEFORE LAUNCH TOMORROW

Your auth code is ready for production. Follow these steps to configure Supabase properly.

---

## Step 1: Configure Supabase Email Settings (CRITICAL)

### Go to your Supabase Dashboard
1. **URL**: https://supabase.com/dashboard/project/qfvwpchklysqgmylhqvn
2. Click on **Authentication** in the left sidebar
3. Click on **Providers** (or **Settings** if you don't see Providers)

### Configure Email Provider

You'll see **Email** in the list of auth providers. Click to configure:

#### ✅ REQUIRED SETTINGS:

1. **Enable Email Provider**: ✅ Turn ON
2. **Confirm email**: Choose based on your needs:
   - **For immediate launch without email delays**: ❌ Turn OFF
   - **For production with email verification**: ✅ Turn ON

#### 🎯 RECOMMENDED FOR LAUNCH: Confirm Email OFF

**Why?** 
- Supabase free tier has rate limits on confirmation emails (4 emails/hour)
- You've already hit this rate limit in testing
- With confirmation OFF, users can signup and login immediately
- You can enable it later after launch

**Settings:**
```
Enable Email provider: ✅ ON
Confirm email: ❌ OFF (Recommended for launch)
Secure email change: ✅ ON (optional but recommended)
```

4. **Click SAVE**

---

## Step 2: Configure Site URL

Still in **Authentication** settings:

1. Find **Site URL** or **URL Configuration**
2. Set to your production URL:
   - For Expo Go: `exp://` + your device IP (e.g., `exp://192.168.1.100:8081`)
   - For production app: Your app's deep link URL (e.g., `dripmaxx://`)
   - For web: Your website URL (e.g., `https://dripmaxx.app`)

3. Add **Redirect URLs**:
   ```
   exp://*/*
   dripmaxx://*/*
   https://yourdomain.com/**
   ```

4. **Click SAVE**

---

## Step 3: Set Up Database Tables

### Go to SQL Editor in Supabase

1. In Supabase Dashboard, click **SQL Editor** in left sidebar
2. Click **New Query**

### Run Script 1: User Profiles Table

Copy and paste this entire script:

```sql
-- User Profiles Table
create table if not exists public.user_profiles (
  id uuid references auth.users(id) primary key,
  name text,
  age integer,
  budget text,
  preferences jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Trigger to update updated_at timestamp
create or replace function public.set_user_profile_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_profile_timestamp on public.user_profiles;
create trigger set_user_profile_timestamp
before update on public.user_profiles
for each row execute procedure public.set_user_profile_updated_at();

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Policies: users can only read/write their own profile
drop policy if exists "Users can view own profile" on public.user_profiles;
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, name, age)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce((new.raw_user_meta_data->>'age')::integer, null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile automatically on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Click RUN** (or press F5)

### Run Script 2: User Data Sync Table

Create new query and paste:

```sql
-- User data blobs for cross-device sync
create table if not exists public.user_blobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  key text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(user_id, key)
);

-- Indexes for performance
create index if not exists user_blobs_user_id_idx on public.user_blobs(user_id);
create index if not exists user_blobs_key_idx on public.user_blobs(key);

-- Enable RLS
alter table public.user_blobs enable row level security;

-- Policies
drop policy if exists "Users can view own data" on public.user_blobs;
create policy "Users can view own data"
  on public.user_blobs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own data" on public.user_blobs;
create policy "Users can insert own data"
  on public.user_blobs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own data" on public.user_blobs;
create policy "Users can update own data"
  on public.user_blobs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own data" on public.user_blobs;
create policy "Users can delete own data"
  on public.user_blobs for delete
  using (auth.uid() = user_id);

-- Trigger for updated_at
create or replace function public.set_user_blob_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_blob_timestamp on public.user_blobs;
create trigger set_user_blob_timestamp
before update on public.user_blobs
for each row execute procedure public.set_user_blob_updated_at();
```

**Click RUN**

---

## Step 4: Verify Configuration

### Check Tables Were Created:

1. Go to **Table Editor** in Supabase Dashboard
2. You should see:
   - ✅ `user_profiles` table
   - ✅ `user_blobs` table

### Test the Flow:

1. **Clear your test data** (if you have rate limit issues):
   - In Table Editor, go to `auth.users`
   - Delete test accounts (optional)

2. **Test Signup**:
   - Open your app
   - Go to Sign Up screen
   - Use a REAL email you can access
   - Fill in: Name, Email, Password (6+ chars), Age
   - Click "Create Account"
   
   **Expected Result:**
   - If confirmation is OFF: "Account created! You can start using the app now."
   - If confirmation is ON: "Please check your email to verify your account."

3. **Check Database**:
   - Go to Table Editor → `auth.users`
   - Your user should appear with:
     - ✅ `email` field populated
     - ✅ `raw_user_meta_data` contains name and age
     - ✅ `email_confirmed_at` is NULL (if confirm OFF) or has timestamp (after verify)
   
   - Go to `user_profiles` table:
     - ✅ Profile created automatically with your name and age

4. **Test Login**:
   - Go to Login screen
   - Enter your email and password
   - Should successfully log in and show home screen

5. **Test Data Persistence**:
   - Add some clothes or create an outfit
   - Log out and log back in
   - Your data should still be there (saved in `user_blobs`)

---

## 🔥 Production Checklist

Before launching tomorrow, verify:

- [ ] **Email confirmation setting decided** (OFF recommended for launch)
- [ ] **Site URL configured** with your production URL
- [ ] **Redirect URLs added** for deep linking
- [ ] **Both SQL scripts run successfully** (user_profiles + user_blobs)
- [ ] **Tables visible** in Table Editor
- [ ] **Test signup creates user** in auth.users table
- [ ] **Test signup creates profile** in user_profiles table
- [ ] **Test login works** after signup
- [ ] **Test data saves** (clothes/outfits persist after logout)
- [ ] **Demo account works** (demo@dripmaxx.ai / password)

---

## 🎯 Launch Day Flow

### For Users:

**With Email Confirmation OFF (Recommended):**
1. User signs up → Account created immediately
2. User logs in → Works immediately
3. User adds clothes → Saved to Supabase
4. User logs out and in → Data persists

**With Email Confirmation ON:**
1. User signs up → "Check your email" message
2. User opens email → Clicks verification link
3. User logs in → Works after verification
4. User adds clothes → Saved to Supabase

### What Gets Saved:

- **auth.users**: Email, password hash, metadata (name, age)
- **user_profiles**: Name, age, budget, preferences
- **user_blobs**: Clothes, outfits, wardrobe data, outfit history

---

## 🆘 Troubleshooting

### "Too many signup attempts"
- **Cause**: Supabase rate limit (4 emails/hour on free tier)
- **Fix**: Turn OFF email confirmation, or wait 1 hour
- **Prevention**: Use email confirmation OFF for launch

### "Error sending confirmation email"
- **Cause**: SMTP not configured or rate limit hit
- **Fix**: Your code already handles this - user account is still created
- **Note**: User sees message but can still login if confirmation is OFF

### Users not appearing in database
- **Check**: Did you run both SQL scripts?
- **Check**: Are RLS policies created? (Run scripts again to be sure)
- **Check**: In Table Editor → auth.users, do you see the user?

### Login says "verify your email" but I can't
- **Fix**: Go to Auth settings → Turn OFF email confirmation
- **Alternative**: Manually update user in database:
  ```sql
  update auth.users 
  set email_confirmed_at = now() 
  where email = 'user@example.com';
  ```

### Data not persisting
- **Check**: user_blobs table exists
- **Check**: RLS policies are enabled
- **Check**: console logs for errors

---

## 📱 Post-Launch Monitoring

### Check these in Supabase Dashboard:

1. **Authentication → Users**
   - Monitor new signups
   - Check email_confirmed_at status

2. **Table Editor → user_profiles**
   - Verify profiles are being created

3. **Table Editor → user_blobs**
   - Verify user data is being saved

4. **Logs → API**
   - Monitor for errors
   - Check authentication attempts

---

## ✅ You're Ready to Launch!

Your authentication system is production-ready with:
- ✅ Secure password hashing (handled by Supabase)
- ✅ Row Level Security for data isolation
- ✅ Automatic profile creation
- ✅ Cross-device data sync
- ✅ Clear error messages
- ✅ Rate limit handling
- ✅ Demo account fallback

**Recommended: Turn OFF email confirmation for smooth launch!**

Good luck with your launch tomorrow! 🚀
