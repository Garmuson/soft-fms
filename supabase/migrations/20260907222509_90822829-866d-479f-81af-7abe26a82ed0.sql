create type public.device_kind as enum ('tracker','monitor','tablet');
create type public.device_status as enum ('active','faulty','spare','retired');

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  serial text not null unique,
  kind public.device_kind not null,
  model text not null default '',
  hub_id integer references public.hubs(id) on delete set null,
  machine_id uuid references public.machines(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  sim_number text,
  status public.device_status not null default 'active',
  installed_at date,
  warranty_end date,
  last_checkin timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.devices to authenticated;
grant all on public.devices to service_role;
alter table public.devices enable row level security;

create policy "devices read" on public.devices for select to authenticated
  using (public.can_read_all() or hub_id is null or hub_id = public.my_hub_id());
create policy "devices hq manage" on public.devices for all to authenticated
  using (public.is_hq()) with check (public.is_hq());
create policy "devices hub update" on public.devices for update to authenticated
  using (hub_id = public.my_hub_id() and public.has_role(auth.uid(),'hub_supervisor'))
  with check (hub_id = public.my_hub_id() and public.has_role(auth.uid(),'hub_supervisor'));

create index devices_hub_idx on public.devices(hub_id);
create index devices_kind_idx on public.devices(kind);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text not null default '',
  action text not null,
  entity text not null,
  entity_ref text,
  hub_id integer references public.hubs(id) on delete set null,
  detail text,
  created_at timestamptz not null default now()
);

grant select, insert on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;

create policy "audit read" on public.audit_log for select to authenticated
  using (public.can_read_all() or hub_id = public.my_hub_id() or actor_id = auth.uid());
create policy "audit insert own" on public.audit_log for insert to authenticated
  with check (actor_id = auth.uid());

create index audit_log_created_idx on public.audit_log(created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger devices_touch before update on public.devices
  for each row execute function public.touch_updated_at();