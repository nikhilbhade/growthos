-- Application-owned user profile provisioned from Supabase Auth.
-- auth.users remains the identity source of truth; this table contains only the
-- fields the GrowthOS application needs to display and onboard a user.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  onboarding_status text not null default 'pending'
    check (onboarding_status in ('pending', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "users can read their own profile" on public.user_profiles;
create policy "users can read their own profile"
  on public.user_profiles for select
  using (user_id = auth.uid());

drop policy if exists "users can update their own profile" on public.user_profiles;
create policy "users can update their own profile"
  on public.user_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_profiles (user_id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.user_profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- Provision profiles for users who signed in before this migration existed.
insert into public.user_profiles (user_id, email, full_name, avatar_url, created_at)
select
  id,
  coalesce(email, ''),
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  coalesce(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture'),
  created_at
from auth.users
on conflict (user_id) do nothing;
