-- Periksa bahwa RLS aktif di semua tabel publik (Fase 0).
-- Jalankan di Supabase Dashboard > SQL Editor. Semua baris harus rls_enabled = true.
-- Juga memastikan tidak ada policy DELETE pada tabel milik pengguna.

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;

-- Daftar policy (periksa tidak ada cmd = 'DELETE').
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Ringkasan policy DELETE (harus 0 baris).
select count(*) as delete_policy_count
from pg_policies
where schemaname = 'public'
  and cmd = 'DELETE';
