-- Enable gen_random_uuid (pgcrypto)
create extension if not exists "pgcrypto";

-- Polls table
create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  created_at timestamptz default now()
);

-- Options table
create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  label text not null,
  votes integer default 0,
  created_at timestamptz default now()
);

-- Votes table to track per-vote entries (optional but useful)
create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  option_id uuid references poll_options(id) on delete cascade,
  voter_identifier text, -- hashed ip/cookie/user_id or null for anon
  created_at timestamptz default now()
);

-- Index to help with dedupe (only for non-null voter identifiers)
create unique index if not exists poll_votes_poll_voter on poll_votes(poll_id, voter_identifier) where voter_identifier is not null;
