-- SKX — comptes clients (Supabase)
-- À coller dans Supabase → SQL Editor → Run, une seule fois.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text, last_name text, phone text,
  address text, zip text, city text,
  cart jsonb not null default '[]',
  wishlist jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Chaque client gère son profil" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete set null,
  ref text not null,
  data jsonb not null,
  total numeric(10,2) not null,
  status text not null default 'Reçue',
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "Un client crée ses commandes" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "Un client lit ses commandes" on public.orders
  for select using (auth.uid() = user_id);
-- L'équipe voit et met à jour toutes les commandes (colonne « status ») depuis le tableau de bord Supabase.
