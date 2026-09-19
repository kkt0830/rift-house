create schema if not exists private;

create table if not exists private.admin_allowlist (
  email text primary key check (email = lower(trim(email))),
  role text not null default 'ADMIN' check (role in ('ADMIN', 'OWNER')),
  created_at timestamptz not null default now()
);

revoke all on private.admin_allowlist from public, anon, authenticated;

create or replace function private.grant_allowlisted_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed_role text;
begin
  select role into allowed_role
  from private.admin_allowlist
  where email = lower(trim(new.email));

  if allowed_role is not null then
    insert into public.admin_users (user_id, role)
    values (new.id, allowed_role)
    on conflict (user_id) do update set role = excluded.role;
  end if;
  return new;
end;
$$;

revoke all on function private.grant_allowlisted_admin() from public, anon, authenticated;

drop trigger if exists on_auth_user_grant_rifthouses_admin on auth.users;
create trigger on_auth_user_grant_rifthouses_admin
after insert or update of email on auth.users
for each row execute function private.grant_allowlisted_admin();
