create table if not exists public.app_state (
  id text primary key check (id = 'global'),
  data jsonb not null,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

insert into public.app_state (id, data)
values (
  'global',
  '{"version":1,"players":[],"matches":[],"events":[],"ratingEvents":[],"migrations":["v0.1.1-remove-demo"]}'::jsonb
)
on conflict (id) do nothing;

alter table public.app_state enable row level security;
grant select, update on public.app_state to anon, authenticated;

create policy "shared state is readable"
on public.app_state for select
to anon, authenticated
using (id = 'global');

create policy "community can update shared state"
on public.app_state for update
to anon, authenticated
using (id = 'global')
with check (id = 'global');

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'ADMIN' check (role in ('ADMIN', 'OWNER')),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
grant select on public.admin_users to authenticated;

create policy "admins can read their own membership"
on public.admin_users for select
to authenticated
using ((select auth.uid()) = user_id);

alter publication supabase_realtime add table public.app_state;
