-- family_homework: pre-camp homework submissions from /family/
-- Page is gated by a shared family password (sessionStorage on /family/login).
-- API has no auth; data is non-sensitive and rate-limited at form level.
create table if not exists family_homework (
  id uuid primary key default gen_random_uuid(),
  site text not null default 'starsnatwalker',
  email text not null,
  player_slug text,
  player_name text,
  schools text,
  last_camp text,
  last_video text,
  coach_outreach text,
  honest_sentence text,
  teammate_role text,
  created_at timestamptz not null default now()
);

create index if not exists family_homework_email_idx on family_homework (email);
create index if not exists family_homework_player_idx on family_homework (player_slug);
create index if not exists family_homework_created_idx on family_homework (created_at desc);
