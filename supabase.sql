-- 1. Tabela de Investigações (Os quadros)
create table if not exists investigations (
  id uuid default uuid_generate_v4() primary key,
  title text not null default 'Novo Caso',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  description text,
  gm_id uuid references auth.users(id) -- Opcional, para saber quem criou
);

-- 2. Tabela de Cartas (Pistas)
create table if not exists investigation_cards (
  id uuid default uuid_generate_v4() primary key,
  investigation_id uuid references investigations(id) on delete cascade not null,
  title text,
  description_public text,
  description_hidden text,
  image_url text,
  x float default 0,
  y float default 0,
  z_index int default 0,
  tags text[],
  visibility text,
  insights jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Conexões (Linhas)
create table if not exists investigation_connections (
  id uuid default uuid_generate_v4() primary key,
  investigation_id uuid references investigations(id) on delete cascade not null,
  from_card_id uuid references investigation_cards(id) on delete cascade not null,
  to_card_id uuid references investigation_cards(id) on delete cascade not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Storage (Habilitar upload de imagens)
insert into storage.buckets (id, name, public) values ('investigation-assets', 'investigation-assets', true);
create policy "Public Access" on storage.objects for select using ( bucket_id = 'investigation-assets' );
create policy "Auth Upload" on storage.objects for insert with check ( auth.role() = 'anon' or auth.role() = 'authenticated' );
