-- Akademik Skor production auth foundation.
-- Run this migration in Supabase SQL Editor before enabling the public app.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 2),
  email text not null,
  role text not null default 'student' check (role in ('student', 'teacher', 'institution', 'admin')),
  plan text not null default 'free' check (plan in ('free', 'premium')),
  goal text not null default 'TOEFL iBT preparation',
  email_verified boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_email_idx on public.profiles(lower(email));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, goal, email_verified)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    new.email,
    'student',
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'goal'), ''), 'TOEFL iBT preparation'),
    new.email_confirmed_at is not null
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_self_limited" on public.profiles;
create policy "profiles_update_self_limited"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (
  public.is_admin()
  or (id = auth.uid() and role = 'student' and plan = 'free')
);

revoke insert on public.profiles from anon, authenticated;

-- Grant an admin only from Supabase SQL Editor or a protected server process.
-- update public.profiles set role = 'admin' where email = 'your-admin@example.com';
