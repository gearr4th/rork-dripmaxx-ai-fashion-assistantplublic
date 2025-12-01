-- Run this on your Supabase project to enable cross-device cloud sync
create table if not exists public.user_blobs (
  id uuid primary key,
  data jsonb not null,
  inserted_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp on public.user_blobs;
create trigger set_timestamp
before update on public.user_blobs
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.user_blobs enable row level security;

-- Policies: users can read/write only their row (id must match their auth.uid())
drop policy if exists "Allow user read own blob" on public.user_blobs;
create policy "Allow user read own blob"
  on public.user_blobs for select
  using (auth.uid() = id);

drop policy if exists "Allow user upsert own blob" on public.user_blobs;
create policy "Allow user upsert own blob"
  on public.user_blobs for insert
  with check (auth.uid() = id);

drop policy if exists "Allow user update own blob" on public.user_blobs;
create policy "Allow user update own blob"
  on public.user_blobs for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
