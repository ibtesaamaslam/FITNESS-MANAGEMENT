
-- 1. Enable UUID extension for unique IDs
create extension if not exists "uuid-ossp";

-- 2. Create GYMS Table (IF NOT EXISTS)
create table if not exists public.gyms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  "logoBase64" text,
  "adminPassword" text default 'admin',
  "subscriptionStatus" text default 'trial',
  "planName" text default 'Pro',
  "subscriptionPrice" numeric default 5000,
  "trialEndsAt" date,
  "nextBillingDate" date,
  "createdAt" timestamp with time zone default timezone('utc'::text, now()),
  "contactPhone" text
);

-- 3. Create MEMBERS Table (IF NOT EXISTS)
create table if not exists public.members (
  id uuid primary key default uuid_generate_v4(),
  "gymId" uuid references public.gyms(id) on delete cascade,
  "registrationNo" text not null,
  name text not null,
  age int,
  phone text,
  plan text default 'Monthly',
  fee numeric default 0,
  "feePaid" boolean default false,
  "joinDate" date,
  "expiryDate" date,
  "photoBase64" text,
  "remindersEnabled" boolean default false,
  attendance jsonb default '{}'::jsonb
);

-- 4. Create PAYMENTS Table (IF NOT EXISTS)
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  "gymId" uuid references public.gyms(id) on delete cascade,
  "memberId" uuid references public.members(id) on delete set null,
  "memberName" text,
  date date,
  amount numeric,
  method text,
  "invoiceMockUrl" text
);

-- 5. Create VISITORS Table (IF NOT EXISTS)
create table if not exists public.visitors (
  id uuid primary key default uuid_generate_v4(),
  "gymId" uuid references public.gyms(id) on delete cascade,
  name text,
  phone text,
  date date,
  purpose text,
  note text
);

-- 6. Enable Realtime (Safe to run multiple times)
alter publication supabase_realtime add table public.gyms;
alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.visitors;

-- 7. Security Policies (Drop first to avoid errors, then recreate)
alter table public.gyms enable row level security;
drop policy if exists "Public Access Gyms" on public.gyms;
create policy "Public Access Gyms" on public.gyms for all using (true);

alter table public.members enable row level security;
drop policy if exists "Public Access Members" on public.members;
create policy "Public Access Members" on public.members for all using (true);

alter table public.payments enable row level security;
drop policy if exists "Public Access Payments" on public.payments;
create policy "Public Access Payments" on public.payments for all using (true);

alter table public.visitors enable row level security;
drop policy if exists "Public Access Visitors" on public.visitors;
create policy "Public Access Visitors" on public.visitors for all using (true);

-- 8. Storage Buckets
insert into storage.buckets (id, name, public) 
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "Public Access Storage" on storage.objects;
create policy "Public Access Storage" on storage.objects for all using (true);
