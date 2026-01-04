-- Create brand_spy_analyses table
create table if not exists brand_spy_analyses (
  id uuid default gen_random_uuid() primary key,
  platform text not null,
  target_url text not null,
  brand_name text not null,
  profile jsonb not null,
  posts jsonb not null,
  ads jsonb not null,
  analysis jsonb not null,
  evaluation jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table brand_spy_analyses enable row level security;

-- Create policy to allow all access (for now, can be restricted later)
create policy "Allow all access to brand_spy_analyses"
  on brand_spy_analyses for all
  using (true)
  with check (true);
