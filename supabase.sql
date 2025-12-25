-- Supabase schema para SiteDeInvestigação

-- Extensão UUID
create extension if not exists "pgcrypto";

-- Tabela de investigações (casos)
create table if not exists public.investigations (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Tabela de pistas (clues) associadas a uma investigação
create table if not exists public.clues (
  id uuid default gen_random_uuid() primary key,
  investigation_id uuid not null references public.investigations(id) on delete cascade,
  title text,
  content text,
  position jsonb,
  created_at timestamptz default now()
);

-- Tabela de notas livres
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  investigation_id uuid references public.investigations(id) on delete set null,
  content text,
  created_at timestamptz default now()
);

-- Índices úteis
create index if not exists idx_investigations_created_at on public.investigations(created_at);
create index if not exists idx_clues_investigation on public.clues(investigation_id);

-- Policy / roles: exemplo simples (ajuste no painel do Supabase conforme necessário)
-- Allow authenticated users to select investigations
-- NOTE: configure as needed no Supabase Auth Policies

-- Storage: pasta para anexos (imagens, áudios)
-- Use o painel Storage do Supabase para criar um bucket chamado `investigations-assets`.
