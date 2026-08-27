create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'enquiry_status'
  ) then
    create type public.enquiry_status as enum (
      'submitted',
      'under_review',
      'awaiting_information',
      'invited',
      'declined',
      'closed'
    );
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.retreat_enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  submission_key uuid not null,
  status public.enquiry_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  admin_notes text,
  name text not null,
  email text not null,
  retreat_type text not null,
  guest_count integer,
  travelling_from text,
  preferred_timing text,
  brought_here text not null,
  hoping_to_discover text,
  constraint retreat_enquiries_submission_key_user_id_key unique (user_id, submission_key),
  constraint retreat_enquiries_guest_count_positive check (
    guest_count is null or guest_count > 0
  ),
  constraint retreat_enquiries_retreat_type_check check (
    retreat_type in ('Solo', 'Couples', 'Private Group', 'I am not sure yet')
  )
);

insert into public.profiles (id, email, display_name, created_at, updated_at)
select
  users.id,
  users.email,
  nullif(users.raw_user_meta_data ->> 'display_name', ''),
  coalesce(users.created_at, now()),
  now()
from auth.users
on conflict (id) do nothing;

create index if not exists retreat_enquiries_user_id_idx
  on public.retreat_enquiries (user_id);

create index if not exists retreat_enquiries_user_submitted_at_idx
  on public.retreat_enquiries (user_id, submitted_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_retreat_enquiries_updated_at on public.retreat_enquiries;
create trigger set_retreat_enquiries_updated_at
before update on public.retreat_enquiries
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

revoke execute on function public.handle_new_user_profile() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.retreat_enquiries enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can view their own retreat enquiries" on public.retreat_enquiries;
create policy "Users can view their own retreat enquiries"
on public.retreat_enquiries
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own submitted retreat enquiries" on public.retreat_enquiries;
create policy "Users can create their own submitted retreat enquiries"
on public.retreat_enquiries
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'submitted'
  and admin_notes is null
);

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, insert on public.retreat_enquiries to authenticated;
