-- Skema Catatan Uang (Fase 0)
-- Tempel seluruh isi file ini ke Supabase Dashboard > SQL Editor, lalu Run.
-- Aman dijalankan ulang: semua objek dibuat dengan IF NOT EXISTS / DROP POLICY IF EXISTS.

-- ============================================================
-- 1. Fungsi utilitas
-- ============================================================

-- Mengisi server_updated_at otomatis setiap INSERT dan UPDATE.
create or replace function public.set_server_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.server_updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- 2. Tabel
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name varchar,
  currency varchar not null default 'IDR',
  created_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name varchar not null,
  initial_balance bigint not null default 0,
  is_archived boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name varchar not null,
  type varchar not null,
  icon varchar,
  is_archived boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  wallet_id uuid not null references public.wallets (id),
  to_wallet_id uuid references public.wallets (id),
  category_id uuid references public.categories (id),
  type varchar not null,
  amount bigint not null,
  note text,
  transaction_date date not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  month date not null,
  amount_limit bigint not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  client_updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  constraint budgets_user_category_month_key unique (user_id, category_id, month)
);

-- ============================================================
-- 3. Constraint aturan bisnis
-- ============================================================

alter table public.transactions drop constraint if exists transactions_amount_positive;
alter table public.transactions add constraint transactions_amount_positive check (amount > 0);

alter table public.transactions drop constraint if exists transactions_type_valid;
alter table public.transactions add constraint transactions_type_valid
  check (type in ('income', 'expense', 'transfer'));

alter table public.categories drop constraint if exists categories_type_valid;
alter table public.categories add constraint categories_type_valid
  check (type in ('income', 'expense'));

alter table public.transactions drop constraint if exists transactions_transfer_rules;
alter table public.transactions add constraint transactions_transfer_rules check (
  (
    type = 'transfer'
    and to_wallet_id is not null
    and to_wallet_id <> wallet_id
    and category_id is null
  )
  or
  (
    type <> 'transfer'
    and to_wallet_id is null
    and category_id is not null
  )
);

alter table public.budgets drop constraint if exists budgets_amount_positive;
alter table public.budgets add constraint budgets_amount_positive check (amount_limit > 0);

alter table public.budgets drop constraint if exists budgets_month_first_day;
alter table public.budgets add constraint budgets_month_first_day check (extract(day from month) = 1);

-- ============================================================
-- 4. Indeks
-- ============================================================

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);
create index if not exists transactions_user_server_updated_idx
  on public.transactions (user_id, server_updated_at);
create index if not exists wallets_user_server_updated_idx
  on public.wallets (user_id, server_updated_at);
create index if not exists categories_user_server_updated_idx
  on public.categories (user_id, server_updated_at);
create index if not exists budgets_user_server_updated_idx
  on public.budgets (user_id, server_updated_at);

-- ============================================================
-- 5. Trigger server_updated_at
-- ============================================================

drop trigger if exists set_server_updated_at on public.profiles;
create trigger set_server_updated_at before insert or update on public.profiles
  for each row execute function public.set_server_updated_at();

drop trigger if exists set_server_updated_at on public.wallets;
create trigger set_server_updated_at before insert or update on public.wallets
  for each row execute function public.set_server_updated_at();

drop trigger if exists set_server_updated_at on public.categories;
create trigger set_server_updated_at before insert or update on public.categories
  for each row execute function public.set_server_updated_at();

drop trigger if exists set_server_updated_at on public.transactions;
create trigger set_server_updated_at before insert or update on public.transactions
  for each row execute function public.set_server_updated_at();

drop trigger if exists set_server_updated_at on public.budgets;
create trigger set_server_updated_at before insert or update on public.budgets
  for each row execute function public.set_server_updated_at();

-- ============================================================
-- 6. Data bawaan saat pengguna baru mendaftar
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  insert into public.wallets (id, user_id, name)
  values (gen_random_uuid(), new.id, 'Dompet Utama');

  insert into public.categories (id, user_id, name, type)
  values
    (gen_random_uuid(), new.id, 'Makan', 'expense'),
    (gen_random_uuid(), new.id, 'Transport', 'expense'),
    (gen_random_uuid(), new.id, 'Belanja', 'expense'),
    (gen_random_uuid(), new.id, 'Tagihan', 'expense'),
    (gen_random_uuid(), new.id, 'Lainnya', 'expense'),
    (gen_random_uuid(), new.id, 'Gaji', 'income'),
    (gen_random_uuid(), new.id, 'Lainnya', 'income');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 7. Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

-- profiles: pemilik baris = auth.uid()
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Tabel lain: user_id = auth.uid(). Tidak ada policy DELETE (soft delete).
do $$
declare
  t text;
begin
  foreach t in array array['wallets', 'categories', 'transactions', 'budgets']
  loop
    execute format('drop policy if exists %I_select_own on public.%I', t, t);
    execute format(
      'create policy %I_select_own on public.%I for select using (user_id = auth.uid())',
      t, t
    );

    execute format('drop policy if exists %I_insert_own on public.%I', t, t);
    execute format(
      'create policy %I_insert_own on public.%I for insert with check (user_id = auth.uid())',
      t, t
    );

    execute format('drop policy if exists %I_update_own on public.%I', t, t);
    execute format(
      'create policy %I_update_own on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t, t
    );
  end loop;
end;
$$;
