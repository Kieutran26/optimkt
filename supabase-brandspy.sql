-- 1. Add user_id column if it doesn't exist yet
-- This handles the case where the table was created by a previous script but without the column
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'brand_spy_analyses' and column_name = 'user_id') then
    alter table brand_spy_analyses add column user_id uuid references auth.users default auth.uid();
  end if;
end $$;

-- 2. Enable RLS (idempotent)
alter table brand_spy_analyses enable row level security;

-- 3. Drop existing policies to ensure clean state (avoids "policy already exists" errors)
drop policy if exists "Allow all access to brand_spy_analyses" on brand_spy_analyses;
drop policy if exists "Users can view their own analyses" on brand_spy_analyses;
drop policy if exists "Users can insert their own analyses" on brand_spy_analyses;
drop policy if exists "Users can update their own analyses" on brand_spy_analyses;
drop policy if exists "Users can delete their own analyses" on brand_spy_analyses;

-- 4. Re-create policies with correct permissions
create policy "Users can view their own analyses"
  on brand_spy_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own analyses"
  on brand_spy_analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own analyses"
  on brand_spy_analyses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own analyses"
  on brand_spy_analyses for delete
  using (auth.uid() = user_id);
