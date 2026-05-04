-- Run this on your Supabase project SQL editor to create user profiles table
-- This stores additional user data beyond what auth.users provides

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

-- Grant permissions
grant select, insert, update on public.user_profiles to authenticated;

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, name, age)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce((new.raw_user_meta_data->>'age')::integer, null)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile automatically on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
