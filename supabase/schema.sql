-- ============================================================
-- SameThing — tam veritabanı şeması
-- ============================================================

-- Uzantılar
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- TABLOLAR
-- ============================================================

-- app_config: eşik değerleri
create table if not exists app_config (
  key   text primary key,
  value text not null
);
insert into app_config (key, value) values
  ('rare_max_similarity', '0.01'),
  ('rare_min_votes',      '20'),
  ('featured_hours',      '48'),
  ('featured_limit',      '12'),
  ('strike_mute_hours',   '24'),
  ('strike_limit',        '3')
on conflict (key) do nothing;

-- profiles
create table if not exists profiles (
  id               uuid primary key references auth.users on delete cascade,
  username         text unique not null,
  emoji            text not null default '🙂',
  bio              text,
  plan             text not null default 'simplething' check (plan in ('simplething','premiumthing')),
  feed_lang        text not null default 'tr',
  allow_mentions   boolean not null default true,
  open_to_chat     boolean not null default false,
  notify_same      boolean not null default true,
  notify_nah       boolean not null default false,
  notify_comment   boolean not null default true,
  notify_reply     boolean not null default true,
  notify_mention   boolean not null default true,
  notify_only_one  boolean not null default true,
  notify_marketing boolean not null default false,
  strikes          integer not null default 0,
  muted_until      timestamptz,
  created_at       timestamptz not null default now()
);

-- things
create table if not exists things (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references profiles(id) on delete cascade,
  title            text,
  body             text not null,
  tags             text[] not null default '{}',
  lang             text not null default 'tr',
  is_anonymous     boolean not null default false,
  comments_closed  boolean not null default false,
  ai_simplified    boolean not null default false,
  hidden           boolean not null default false,
  hidden_reason    text,
  created_at       timestamptz not null default now()
);

-- votes
create table if not exists votes (
  id        uuid primary key default uuid_generate_v4(),
  thing_id  uuid not null references things(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  value     text not null check (value in ('same','nah')),
  created_at timestamptz not null default now(),
  unique (thing_id, user_id)
);

-- comments
create table if not exists comments (
  id           uuid primary key default uuid_generate_v4(),
  thing_id     uuid not null references things(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  parent_id    uuid references comments(id) on delete cascade,
  body         text not null,
  is_anonymous boolean not null default false,
  pinned       boolean not null default false,
  hidden       boolean not null default false,
  created_at   timestamptz not null default now()
);

-- notifications
create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null check (type in ('same','nah','comment','reply','mention','only_one')),
  thing_id   uuid references things(id) on delete cascade,
  actor_id   uuid references profiles(id) on delete set null,
  preview    text,
  pinned     boolean not null default false,
  dismissed  boolean not null default false,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- reports
create table if not exists reports (
  id         uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  thing_id   uuid references things(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  reason     text not null check (reason in ('spam','hate','sexual','violence','doxxing','other')),
  detail     text,
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- VIEW'LAR
-- ============================================================

-- thing_stats: her thing için oy sayıları ve similarity
create or replace view thing_stats as
select
  t.id,
  count(v.id) filter (where v.value = 'same') as same_votes,
  count(v.id) filter (where v.value = 'nah')  as nah_votes,
  count(v.id)                                  as total_votes,
  case
    when count(v.id) = 0 then null
    else round(
      count(v.id) filter (where v.value = 'same')::numeric
      / count(v.id)::numeric,
      4
    )
  end as similarity
from things t
left join votes v on v.thing_id = t.id
group by t.id;

-- rare_things: similarity <= rare_max_similarity ve total_votes >= rare_min_votes
create or replace view rare_things as
select ts.id
from thing_stats ts
cross join (
  select
    (select value from app_config where key = 'rare_max_similarity')::numeric as max_sim,
    (select value from app_config where key = 'rare_min_votes')::integer      as min_votes
) cfg
where ts.total_votes >= cfg.min_votes
  and ts.similarity  <= cfg.max_sim;

-- featured_things: son N saat, oy×2 + yorum×3 skoru, ilk M
create or replace view featured_things as
with cfg as (
  select
    (select value from app_config where key = 'featured_hours')::integer  as hours,
    (select value from app_config where key = 'featured_limit')::integer  as lim
),
scored as (
  select
    t.id,
    coalesce(ts.total_votes,0) * 2
    + count(distinct c.id) * 3 as score
  from things t
  cross join cfg
  left join thing_stats ts on ts.id = t.id
  left join comments c on c.thing_id = t.id and not c.hidden
  where t.created_at >= now() - (cfg.hours || ' hours')::interval
    and not t.hidden
  group by t.id, ts.total_votes, cfg.lim
)
select s.id
from scored s
cross join cfg
order by s.score desc
limit cfg.lim;

-- profile_stats
create or replace view profile_stats as
select
  p.id as profile_id,
  count(distinct t.id)                                   as things_count,
  count(distinct t.id) filter (where t.id in (select id from rare_things)) as rare_count
from profiles p
left join things t on t.user_id = p.id and not t.hidden
group by p.id;

-- things_feed: ana feed view'u
create or replace view things_feed as
select
  t.id,
  t.user_id,
  t.title,
  t.body,
  t.tags,
  t.lang,
  t.is_anonymous,
  t.comments_closed,
  t.ai_simplified,
  t.hidden,
  t.hidden_reason,
  t.created_at,
  case when t.is_anonymous then null else p.username end as username,
  case when t.is_anonymous then null else p.emoji    end as emoji,
  coalesce(ts.total_votes, 0)  as total_votes,
  coalesce(ts.same_votes,  0)  as same_votes,
  ts.similarity,
  count(distinct c.id)         as comment_count,
  (t.id in (select id from rare_things))     as is_rare,
  (t.id in (select id from featured_things)) as is_featured
from things t
join profiles p on p.id = t.user_id
left join thing_stats ts on ts.id = t.id
left join comments c on c.thing_id = t.id and not c.hidden
group by t.id, p.username, p.emoji, ts.total_votes, ts.same_votes, ts.similarity;

-- comments_view
create or replace view comments_view as
select
  c.id,
  c.thing_id,
  c.parent_id,
  c.body,
  c.is_anonymous,
  c.pinned,
  c.hidden,
  c.created_at,
  case when c.is_anonymous then null else c.user_id  end as user_id,
  case when c.is_anonymous then null else p.username end as username,
  case when c.is_anonymous then null else p.emoji    end as emoji,
  (c.user_id = t.user_id) as is_creator
from comments c
join profiles p on p.id = c.user_id
join things   t on t.id = c.thing_id;

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

alter table profiles      enable row level security;
alter table things        enable row level security;
alter table votes         enable row level security;
alter table comments      enable row level security;
alter table notifications enable row level security;
alter table reports       enable row level security;

-- profiles
create policy "profiles: public read"
  on profiles for select using (true);

create policy "profiles: own insert"
  on profiles for insert with check (auth.uid() = id);

create policy "profiles: own update"
  on profiles for update using (auth.uid() = id);

create policy "profiles: own delete"
  on profiles for delete using (auth.uid() = id);

-- things
create policy "things: public read"
  on things for select
  using (not hidden or auth.uid() = user_id);

create policy "things: auth insert"
  on things for insert
  with check (auth.uid() = user_id);

create policy "things: own update"
  on things for update
  using (auth.uid() = user_id);

create policy "things: own delete"
  on things for delete
  using (auth.uid() = user_id);

-- votes (oy kesin — update/delete yok)
create policy "votes: own read"
  on votes for select
  using (auth.uid() = user_id);

create policy "votes: auth insert"
  on votes for insert
  with check (auth.uid() = user_id);

-- comments
create policy "comments: public read"
  on comments for select
  using (not hidden or auth.uid() = user_id);

create policy "comments: auth insert"
  on comments for insert
  with check (auth.uid() = user_id);

create policy "comments: own update"
  on comments for update
  using (auth.uid() = user_id);

create policy "comments: own delete"
  on comments for delete
  using (auth.uid() = user_id);

-- notifications
create policy "notifications: own read"
  on notifications for select
  using (auth.uid() = user_id);

create policy "notifications: own update"
  on notifications for update
  using (auth.uid() = user_id);

-- reports
create policy "reports: auth insert"
  on reports for insert
  with check (auth.uid() = reporter_id);

-- ============================================================
-- TRIGGER'LAR VE FONKSİYONLAR
-- ============================================================

-- Yeni kullanıcı kaydında otomatik profil oluştur
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  base_username text;
  final_username text;
  counter       integer := 0;
begin
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
  if length(base_username) < 3 then
    base_username := 'user' || substr(new.id::text, 1, 6);
  end if;
  final_username := base_username;
  loop
    exit when not exists (select 1 from profiles where username = final_username);
    counter := counter + 1;
    final_username := base_username || counter::text;
  end loop;
  insert into profiles (id, username, emoji)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'emoji', '🙂')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Muted kullanıcı post engeli
create or replace function guard_muted()
returns trigger language plpgsql security definer as $$
begin
  if exists (
    select 1 from profiles
    where id = new.user_id
      and muted_until is not null
      and muted_until > now()
  ) then
    raise exception 'You are temporarily muted.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_muted_things on things;
create trigger guard_muted_things
  before insert on things
  for each row execute function guard_muted();

drop trigger if exists guard_muted_comments on comments;
create trigger guard_muted_comments
  before insert on comments
  for each row execute function guard_muted();

-- Pin limiti (en fazla 3)
create or replace function guard_pin_limit()
returns trigger language plpgsql security definer as $$
begin
  if new.pinned then
    if (
      select count(*) from comments
      where thing_id = new.thing_id and pinned = true and id <> new.id
    ) >= 3 then
      raise exception 'Pin limit reached (max 3).';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_pin_limit_trigger on comments;
create trigger guard_pin_limit_trigger
  before update on comments
  for each row execute function guard_pin_limit();

-- Strike / mute mekanizması
create or replace function strike_user(target_id uuid)
returns void language plpgsql security definer as $$
declare
  new_strikes integer;
  mute_hours  integer;
begin
  select (select value from app_config where key = 'strike_mute_hours')::integer into mute_hours;
  update profiles
  set strikes = strikes + 1
  where id = target_id
  returning strikes into new_strikes;

  if new_strikes >= (select value::integer from app_config where key = 'strike_limit') then
    update profiles
    set muted_until = now() + (mute_hours || ' hours')::interval,
        strikes     = 0
    where id = target_id;
  end if;
end;
$$;

-- Bildirim oluşturma fonksiyonu (tercih kontrolü dahil)
create or replace function create_notification(
  p_user_id  uuid,
  p_type     text,
  p_thing_id uuid default null,
  p_actor_id uuid default null,
  p_preview  text default null
) returns void language plpgsql security definer as $$
declare
  pref boolean;
  col  text;
begin
  -- Kendi kendine bildirim yok
  if p_user_id = p_actor_id then return; end if;

  col := case p_type
    when 'same'     then 'notify_same'
    when 'nah'      then 'notify_nah'
    when 'comment'  then 'notify_comment'
    when 'reply'    then 'notify_reply'
    when 'mention'  then 'notify_mention'
    when 'only_one' then 'notify_only_one'
    else null
  end;

  if col is null then return; end if;

  execute format('select %I from profiles where id = $1', col)
    into pref using p_user_id;

  if not coalesce(pref, false) then return; end if;

  insert into notifications (user_id, type, thing_id, actor_id, preview)
  values (p_user_id, p_type, p_thing_id, p_actor_id, p_preview);
end;
$$;

-- Oy sonrası bildirim + only_one kontrolü
create or replace function after_vote()
returns trigger language plpgsql security definer as $$
declare
  thing_owner uuid;
  thing_body  text;
begin
  select user_id, body into thing_owner, thing_body
  from things where id = new.thing_id;

  -- same/nah bildirimi
  perform create_notification(
    thing_owner,
    new.value,
    new.thing_id,
    new.user_id,
    left(thing_body, 80)
  );

  -- only_one: rare eşiğini yeni mi geçti?
  if exists (select 1 from rare_things where id = new.thing_id) then
    if not exists (
      select 1 from notifications
      where thing_id = new.thing_id and type = 'only_one'
    ) then
      perform create_notification(
        thing_owner,
        'only_one',
        new.thing_id,
        null,
        left(thing_body, 80)
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists after_vote_trigger on votes;
create trigger after_vote_trigger
  after insert on votes
  for each row execute function after_vote();

-- Yorum sonrası bildirim + @mention
create or replace function after_comment()
returns trigger language plpgsql security definer as $$
declare
  thing_owner uuid;
  thing_body  text;
  parent_owner uuid;
  mention_username text;
  mention_uid      uuid;
  allow_m          boolean;
begin
  select user_id, body into thing_owner, thing_body
  from things where id = new.thing_id;

  -- thing sahibine comment bildirimi
  if new.parent_id is null then
    perform create_notification(
      thing_owner, 'comment', new.thing_id, new.user_id, left(new.body, 80)
    );
  else
    -- reply: parent yorum sahibine
    select user_id into parent_owner from comments where id = new.parent_id;
    perform create_notification(
      parent_owner, 'reply', new.thing_id, new.user_id, left(new.body, 80)
    );
  end if;

  -- @mention tarama
  for mention_username in
    select (regexp_matches(new.body, '@([A-Za-z0-9_]+)', 'g'))[1]
  loop
    select id, allow_mentions into mention_uid, allow_m
    from profiles where username = mention_username;

    if mention_uid is not null and allow_m then
      perform create_notification(
        mention_uid, 'mention', new.thing_id, new.user_id, left(new.body, 80)
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists after_comment_trigger on comments;
create trigger after_comment_trigger
  after insert on comments
  for each row execute function after_comment();

-- Hesap silme
create or replace function delete_account()
returns void language plpgsql security definer as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- ============================================================
-- İNDEKSLER
-- ============================================================

create index if not exists idx_things_user_id    on things(user_id);
create index if not exists idx_things_created_at on things(created_at desc);
create index if not exists idx_things_lang        on things(lang);
create index if not exists idx_things_tags        on things using gin(tags);
create index if not exists idx_votes_thing_id     on votes(thing_id);
create index if not exists idx_votes_user_id      on votes(user_id);
create index if not exists idx_comments_thing_id  on comments(thing_id);
create index if not exists idx_notif_user_id      on notifications(user_id);
create index if not exists idx_notif_dismissed    on notifications(user_id, dismissed);
