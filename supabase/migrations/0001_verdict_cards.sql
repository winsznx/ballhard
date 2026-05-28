-- BALLHARD verdict_cards — public read-by-id + public insert, no update/delete.
-- Per CLAUDE.md §8. Apply via Supabase dashboard SQL editor for project qjuhgoazlprpixqqgzpe.

create table if not exists verdict_cards (
  id                text primary key,
  scenario_id       text not null,
  dodges_broken     int  not null check (dodges_broken >= 0),
  dodges_landed     int  not null check (dodges_landed >= 0),
  median_latency_ms int  not null check (median_latency_ms > 0),
  verdict_text      text not null,
  created_at        timestamptz not null default now()
);

create index if not exists verdict_cards_created_at_idx
  on verdict_cards (created_at desc);

alter table verdict_cards enable row level security;

drop policy if exists "anyone can read by id" on verdict_cards;
drop policy if exists "anyone can insert" on verdict_cards;

create policy "anyone can read by id"
  on verdict_cards for select
  using (true);

create policy "anyone can insert"
  on verdict_cards for insert
  with check (true);
