-- ============================================================
-- Barbearia — schema + Row Level Security (RLS)
-- ============================================================
create extension if not exists "uuid-ossp";

-- ---------- USERS ----------
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('client','admin')) default 'client',
  created_at timestamptz not null default now()
);

-- ---------- BARBERS ----------
create table if not exists barbers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role_title text not null default 'Barbeiro',
  initials text not null,
  color text not null default 'amber',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- SERVICES (each belongs to one barber) ----------
create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  barber_id uuid not null references barbers(id) on delete cascade,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  duration_min integer not null check (duration_min > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- WORKING HOURS (per barber, per weekday, can have multiple ranges e.g. only afternoon) ----------
-- weekday: 0 = domingo ... 6 = sabado
create table if not exists working_hours (
  id uuid primary key default uuid_generate_v4(),
  barber_id uuid not null references barbers(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

-- ---------- BLOCKED SLOTS (per barber; whole day OR a specific time range) ----------
create table if not exists blocked_slots (
  id uuid primary key default uuid_generate_v4(),
  barber_id uuid not null references barbers(id) on delete cascade,
  date date not null,
  start_time time,          -- null + null start/end = dia inteiro bloqueado
  end_time time,
  reason text,
  created_at timestamptz not null default now(),
  check ((start_time is null and end_time is null) or (start_time is not null and end_time is not null and end_time > start_time))
);

-- ---------- APPOINTMENTS ----------
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references users(id) on delete cascade,
  barber_id uuid not null references barbers(id),
  service_id uuid not null references services(id),
  date date not null,
  time time not null,
  duration_min integer not null,
  note text,
  status text not null check (status in ('confirmado','concluido','cancelado')) default 'confirmado',
  created_at timestamptz not null default now()
);

create index if not exists idx_appointments_barber_date on appointments(barber_id, date);
create index if not exists idx_appointments_client on appointments(client_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Backend connects as role `barbearia_app` (NOT superuser) and sets,
-- per request, two session variables coming from the verified JWT:
--   app.user_id  -> uuid of the logged in user (or '' if anonymous)
--   app.role     -> 'admin' | 'client' | 'anon'
-- ============================================================

do $$ begin
  if not exists (select from pg_roles where rolname = 'barbearia_app') then
    create role barbearia_app login password 'barbearia_app_pw';
  end if;
end $$;

grant usage on schema public to barbearia_app;
grant select, insert, update, delete on all tables in schema public to barbearia_app;
alter default privileges in schema public grant select, insert, update, delete on tables to barbearia_app;

-- Public catalog tables: everyone can read; only admin can write
alter table barbers enable row level security;
alter table services enable row level security;
alter table working_hours enable row level security;
alter table blocked_slots enable row level security;
alter table users enable row level security;
alter table appointments enable row level security;

drop policy if exists barbers_read on barbers;
create policy barbers_read on barbers for select using (true);
drop policy if exists barbers_write on barbers;
create policy barbers_write on barbers for all
  using (current_setting('app.role', true) = 'admin')
  with check (current_setting('app.role', true) = 'admin');

drop policy if exists services_read on services;
create policy services_read on services for select using (true);
drop policy if exists services_write on services;
create policy services_write on services for all
  using (current_setting('app.role', true) = 'admin')
  with check (current_setting('app.role', true) = 'admin');

drop policy if exists working_hours_read on working_hours;
create policy working_hours_read on working_hours for select using (true);
drop policy if exists working_hours_write on working_hours;
create policy working_hours_write on working_hours for all
  using (current_setting('app.role', true) = 'admin')
  with check (current_setting('app.role', true) = 'admin');

drop policy if exists blocked_slots_read on blocked_slots;
create policy blocked_slots_read on blocked_slots for select using (true);
drop policy if exists blocked_slots_write on blocked_slots;
create policy blocked_slots_write on blocked_slots for all
  using (current_setting('app.role', true) = 'admin')
  with check (current_setting('app.role', true) = 'admin');

-- Users: a person can only see/update their own row; admin sees all
drop policy if exists users_self on users;
create policy users_self on users for select
  using (current_setting('app.role', true) = 'admin' or id::text = current_setting('app.user_id', true));
drop policy if exists users_update_self on users;
create policy users_update_self on users for update
  using (current_setting('app.role', true) = 'admin' or id::text = current_setting('app.user_id', true));
drop policy if exists users_insert on users;
create policy users_insert on users for insert with check (true); -- signup

-- Appointments: client sees/edits only their own; admin sees/edits all
drop policy if exists appointments_select on appointments;
create policy appointments_select on appointments for select
  using (current_setting('app.role', true) = 'admin' or client_id::text = current_setting('app.user_id', true));

drop policy if exists appointments_insert on appointments;
create policy appointments_insert on appointments for insert
  with check (
    current_setting('app.role', true) = 'admin'
    or client_id::text = current_setting('app.user_id', true)
  );

drop policy if exists appointments_update on appointments;
create policy appointments_update on appointments for update
  using (current_setting('app.role', true) = 'admin' or client_id::text = current_setting('app.user_id', true));

-- ============================================================
-- Função auxiliar de autenticação
-- RLS bloqueia leitura da tabela users para usuários anônimos
-- (correto: ninguém deveria conseguir listar a tabela de usuários
-- sem estar autenticado). Login/cadastro, porém, precisam localizar
-- o registro pelo e-mail ANTES de existir uma sessão. Resolvemos
-- isso com uma função SECURITY DEFINER, de propriedade do dono da
-- tabela (bypassa RLS), que devolve só o necessário para autenticar.
-- ============================================================
create or replace function auth_lookup_user(p_email text)
returns table(id uuid, name text, email text, password_hash text, role text)
language sql security definer
set search_path = public
as $$
  select id, name, email, password_hash, role from users where email = p_email;
$$;

revoke all on function auth_lookup_user(text) from public;
grant execute on function auth_lookup_user(text) to barbearia_app;
