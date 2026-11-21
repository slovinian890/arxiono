-- Arxiono Community — database schema for Supabase
-- Run this once in your Supabase project's SQL Editor (Project > SQL Editor > New query).
-- Safe to re-run: every statement either creates-if-not-exists or replaces.

-- ========================= Tables =========================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24),
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 4000),
  image_url text,
  link text,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create index if not exists projects_created_at_idx on public.projects (created_at desc);
create index if not exists comments_project_id_idx on public.comments (project_id);
create index if not exists votes_project_id_idx on public.votes (project_id);
create index if not exists follows_following_id_idx on public.follows (following_id);

-- ===================== Auto-create profile =====================
-- When someone signs up, auth.users gets a row. This trigger copies the
-- chosen username (passed as signUp options.data.username) into profiles.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========================= Row Level Security =========================
-- The browser talks to Supabase directly with the public "anon" key, so RLS
-- is what actually enforces who can read/write what. Everything is publicly
-- readable (it's a public community feed); writes are restricted to the
-- authenticated owner of the row.

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;
alter table public.follows enable row level security;

drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are publicly readable" on public.profiles
  for select using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "projects are publicly readable" on public.projects;
create policy "projects are publicly readable" on public.projects
  for select using (true);

drop policy if exists "users can post their own projects" on public.projects;
create policy "users can post their own projects" on public.projects
  for insert with check (auth.uid() = user_id);

drop policy if exists "users can edit their own projects" on public.projects;
create policy "users can edit their own projects" on public.projects
  for update using (auth.uid() = user_id);

drop policy if exists "users can delete their own projects" on public.projects;
create policy "users can delete their own projects" on public.projects
  for delete using (auth.uid() = user_id);

drop policy if exists "comments are publicly readable" on public.comments;
create policy "comments are publicly readable" on public.comments
  for select using (true);

drop policy if exists "users can post their own comments" on public.comments;
create policy "users can post their own comments" on public.comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "users can delete their own comments" on public.comments;
create policy "users can delete their own comments" on public.comments
  for delete using (auth.uid() = user_id);

drop policy if exists "votes are publicly readable" on public.votes;
create policy "votes are publicly readable" on public.votes
  for select using (true);

drop policy if exists "users can cast their own votes" on public.votes;
create policy "users can cast their own votes" on public.votes
  for insert with check (auth.uid() = user_id);

drop policy if exists "users can change their own votes" on public.votes;
create policy "users can change their own votes" on public.votes
  for update using (auth.uid() = user_id);

drop policy if exists "users can remove their own votes" on public.votes;
create policy "users can remove their own votes" on public.votes
  for delete using (auth.uid() = user_id);

drop policy if exists "follows are publicly readable" on public.follows;
create policy "follows are publicly readable" on public.follows
  for select using (true);

drop policy if exists "users can follow as themselves" on public.follows;
create policy "users can follow as themselves" on public.follows
  for insert with check (auth.uid() = follower_id);

drop policy if exists "users can unfollow as themselves" on public.follows;
create policy "users can unfollow as themselves" on public.follows
  for delete using (auth.uid() = follower_id);

-- ========================= Storage (project images) =========================

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

drop policy if exists "project images are publicly readable" on storage.objects;
create policy "project images are publicly readable" on storage.objects
  for select using (bucket_id = 'project-images');

drop policy if exists "authenticated users can upload project images" on storage.objects;
create policy "authenticated users can upload project images" on storage.objects
  for insert with check (bucket_id = 'project-images' and auth.role() = 'authenticated');

drop policy if exists "users can delete their own project images" on storage.objects;
create policy "users can delete their own project images" on storage.objects
  for delete using (bucket_id = 'project-images' and owner = auth.uid());
