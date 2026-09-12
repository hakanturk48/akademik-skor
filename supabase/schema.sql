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

-- Central content workspace used by the admin panel.
-- admin_workspaces keeps drafts, review items, revision history, and audit records.
-- published_content_snapshots is the public read-only snapshot consumed by student pages.

create table if not exists public.admin_workspaces (
  key text primary key default 'main',
  state jsonb not null,
  revision integer not null default 0 check (revision >= 0),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.published_content_snapshots (
  key text primary key default 'main',
  state jsonb not null,
  revision integer not null default 0 check (revision >= 0),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_workspaces_updated_at_idx on public.admin_workspaces(updated_at desc);
create index if not exists published_content_snapshots_updated_at_idx on public.published_content_snapshots(updated_at desc);

drop trigger if exists admin_workspaces_set_updated_at on public.admin_workspaces;
create trigger admin_workspaces_set_updated_at
before update on public.admin_workspaces
for each row execute procedure public.set_updated_at();

drop trigger if exists published_content_snapshots_set_updated_at on public.published_content_snapshots;
create trigger published_content_snapshots_set_updated_at
before update on public.published_content_snapshots
for each row execute procedure public.set_updated_at();

alter table public.admin_workspaces enable row level security;
alter table public.published_content_snapshots enable row level security;

drop policy if exists "admin_workspaces_select_admin" on public.admin_workspaces;
create policy "admin_workspaces_select_admin"
on public.admin_workspaces for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_workspaces_insert_admin" on public.admin_workspaces;
create policy "admin_workspaces_insert_admin"
on public.admin_workspaces for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin_workspaces_update_admin" on public.admin_workspaces;
create policy "admin_workspaces_update_admin"
on public.admin_workspaces for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "published_content_select_public" on public.published_content_snapshots;
create policy "published_content_select_public"
on public.published_content_snapshots for select
to anon, authenticated
using (true);

drop policy if exists "published_content_insert_admin" on public.published_content_snapshots;
create policy "published_content_insert_admin"
on public.published_content_snapshots for insert
to authenticated
with check (public.is_admin());

drop policy if exists "published_content_update_admin" on public.published_content_snapshots;
create policy "published_content_update_admin"
on public.published_content_snapshots for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update on public.admin_workspaces to authenticated;
grant select on public.published_content_snapshots to anon, authenticated;
grant insert, update on public.published_content_snapshots to authenticated;
