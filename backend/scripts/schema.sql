-- ============================================================
-- Golf Charity Subscription Platform — Supabase Schema (FIXED)
-- Run this entire file in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── STEP 1: CHARITIES (must be created BEFORE users) ────────────────────────
create table if not exists charities (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  logo_url    text,
  website_url text,
  is_featured boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── STEP 2: USERS (references charities) ────────────────────────────────────
create table if not exists users (
  id                          uuid primary key default uuid_generate_v4(),
  email                       text unique not null,
  password_hash               text not null,
  first_name                  text not null,
  last_name                   text not null,
  role                        text not null default 'subscriber'
                              check (role in ('subscriber', 'admin')),
  is_active                   boolean not null default true,

  -- Subscription
  subscription_status         text not null default 'inactive'
                              check (subscription_status in (
                                'inactive','active','trialing',
                                'past_due','lapsed','cancelling','cancelled'
                              )),
  subscription_plan           text check (subscription_plan in ('monthly','yearly')),
  subscription_renewal_date   timestamptz,
  stripe_customer_id          text unique,
  stripe_subscription_id      text unique,

  -- Charity
  charity_id                  uuid references charities(id) on delete set null,
  charity_contribution_percent integer not null default 10
                              check (charity_contribution_percent between 10 and 100),

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ─── STEP 3: SCORES ───────────────────────────────────────────────────────────
create table if not exists scores (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  score_value integer not null check (score_value between 1 and 45),
  played_at   date not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_scores_user_id  on scores(user_id);
create index if not exists idx_scores_played_at on scores(played_at desc);

-- ─── STEP 4: DRAWS ────────────────────────────────────────────────────────────
create table if not exists draws (
  id                  uuid primary key default uuid_generate_v4(),
  draw_month          date not null unique,
  status              text not null default 'draft'
                      check (status in ('draft','published','archived')),
  draw_mode           text not null default 'random'
                      check (draw_mode in ('random','weighted')),
  weighted_bias       text default 'most'
                      check (weighted_bias in ('most','least')),
  draw_numbers        integer[],
  total_pool          numeric(12,2) not null default 0,
  jackpot_carry_over  numeric(12,2) not null default 0,
  jackpot_rolled_over numeric(12,2) not null default 0,
  created_by          uuid references users(id),
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── STEP 5: DRAW WINNERS ─────────────────────────────────────────────────────
create table if not exists draw_winners (
  id           uuid primary key default uuid_generate_v4(),
  draw_id      uuid not null references draws(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  match_tier   integer not null check (match_tier in (3,4,5)),
  prize_amount numeric(12,2) not null,
  status       text not null default 'pending_verification'
               check (status in (
                 'pending_verification','proof_submitted',
                 'approved','rejected','paid'
               )),
  proof_url    text,
  reviewed_by  uuid references users(id),
  reviewed_at  timestamptz,
  paid_at      timestamptz,
  paid_by      uuid references users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique(draw_id, user_id, match_tier)
);

create index if not exists idx_draw_winners_draw_id on draw_winners(draw_id);
create index if not exists idx_draw_winners_user_id on draw_winners(user_id);
create index if not exists idx_draw_winners_status  on draw_winners(status);

-- ─── STEP 6: PAYMENTS ─────────────────────────────────────────────────────────
create table if not exists payments (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references users(id) on delete cascade,
  stripe_invoice_id    text unique,
  amount               numeric(12,2) not null,
  pool_contribution    numeric(12,2) not null default 0,
  charity_contribution numeric(12,2) not null default 0,
  paid_at              timestamptz not null default now(),
  created_at           timestamptz not null default now()
);

create index if not exists idx_payments_user_id on payments(user_id);

-- ─── STEP 7: ROW LEVEL SECURITY ───────────────────────────────────────────────
alter table charities    enable row level security;
alter table users        enable row level security;
alter table scores       enable row level security;
alter table draws        enable row level security;
alter table draw_winners enable row level security;
alter table payments     enable row level security;

-- Public can read active charities
create policy "charities_public_read"
  on charities for select
  using (is_active = true);

-- Public can read published draws
create policy "draws_public_read"
  on draws for select
  using (status = 'published');

-- ─── STEP 8: UPDATED_AT TRIGGER ───────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();

create trigger trg_scores_updated_at
  before update on scores
  for each row execute function set_updated_at();

create trigger trg_draws_updated_at
  before update on draws
  for each row execute function set_updated_at();

create trigger trg_draw_winners_updated_at
  before update on draw_winners
  for each row execute function set_updated_at();

create trigger trg_charities_updated_at
  before update on charities
  for each row execute function set_updated_at();

-- ─── STEP 9: SEED CHARITIES ───────────────────────────────────────────────────
insert into charities (id, name, description, logo_url, is_featured, is_active) values
  (
    uuid_generate_v4(),
    'MacMillan Cancer Support',
    'Providing specialist health care, information and financial support to people affected by cancer.',
    'https://placehold.co/80x80?text=MC',
    true,
    true
  ),
  (
    uuid_generate_v4(),
    'British Heart Foundation',
    'The UK''s leading heart charity, funding research to save and improve lives.',
    'https://placehold.co/80x80?text=BHF',
    true,
    true
  ),
  (
    uuid_generate_v4(),
    'Alzheimer''s Society',
    'The UK''s leading dementia charity providing care, information and research.',
    'https://placehold.co/80x80?text=AS',
    false,
    true
  ),
  (
    uuid_generate_v4(),
    'RNLI',
    'Saving lives at sea around the coasts of the UK and Ireland.',
    'https://placehold.co/80x80?text=RNLI',
    false,
    true
  ),
  (
    uuid_generate_v4(),
    'Comic Relief',
    'A major UK charity that strives to create a just world, free from poverty.',
    'https://placehold.co/80x80?text=CR',
    false,
    true
  );

-- ─── DONE ─────────────────────────────────────────────────────────────────────
-- All tables created successfully. Now run: npm run seed (in backend)