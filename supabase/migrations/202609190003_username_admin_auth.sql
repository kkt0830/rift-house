create extension if not exists pgcrypto;

create table if not exists private.admin_credentials (
  username text primary key check (username = lower(trim(username))),
  password_hash text not null,
  role text not null default 'ADMIN' check (role in ('ADMIN', 'OWNER')),
  created_at timestamptz not null default now()
);

create table if not exists private.admin_sessions (
  token_hash text primary key,
  username text not null references private.admin_credentials(username) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

revoke all on private.admin_credentials, private.admin_sessions from public, anon, authenticated;

create or replace function public.admin_login(p_username text, p_password text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := lower(trim(p_username));
  stored_hash text;
  raw_token text;
begin
  select password_hash into stored_hash
  from private.admin_credentials
  where username = normalized;
  if stored_hash is null or extensions.crypt(p_password, stored_hash) <> stored_hash then
    return null;
  end if;
  delete from private.admin_sessions where expires_at <= now();
  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into private.admin_sessions (token_hash, username, expires_at)
  values (encode(extensions.digest(raw_token, 'sha256'), 'hex'), normalized, now() + interval '12 hours');
  return raw_token;
end;
$$;

create or replace function public.admin_session_role(p_token text)
returns text
language sql
security definer
set search_path = ''
as $$
  select c.role || ':' || c.username
  from private.admin_sessions s
  join private.admin_credentials c on c.username = s.username
  where s.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and s.expires_at > now();
$$;

create or replace function public.admin_logout(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from private.admin_sessions
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;

revoke all on function public.admin_login(text, text) from public;
revoke all on function public.admin_session_role(text) from public;
revoke all on function public.admin_logout(text) from public;
grant execute on function public.admin_login(text, text) to anon, authenticated;
grant execute on function public.admin_session_role(text) to anon, authenticated;
grant execute on function public.admin_logout(text) to anon, authenticated;
