-- ===== roles & profiles =====
create type public.app_role as enum ('hq_admin','hub_supervisor','field_operator','ministry_analyst');
create type public.machine_type as enum ('motor_grader','front_end_loader','excavator','dump_truck','compactor','other');
create type public.machine_status as enum ('active','idle','maintenance','alert','offline');
create type public.project_status as enum ('active','delayed','critical','complete');
create type public.alert_level as enum ('critical','warning','info');
create type public.wo_status as enum ('assigned','in_progress','completed','cancelled');
create type public.wo_priority as enum ('low','medium','high');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  hub_id integer,
  avatar_url text,
  last_login timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.my_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.user_roles where user_id = auth.uid() limit 1
$$;

create or replace function public.my_hub_id()
returns integer language sql stable security definer set search_path = public as $$
  select hub_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_hq()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(),'hq_admin')
$$;

create or replace function public.can_read_all()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(),'hq_admin') or public.has_role(auth.uid(),'ministry_analyst')
$$;

create or replace function public.can_write_hub(_hub_id integer)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(),'hq_admin')
      or (public.has_role(auth.uid(),'hub_supervisor') and _hub_id = public.my_hub_id())
$$;

create or replace function public.can_read_hub(_hub_id integer)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_read_all() or _hub_id = public.my_hub_id()
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ===== hubs =====
create table public.hubs (
  id integer primary key,
  name text not null,
  county text not null,
  supervisor_id uuid references public.profiles(id) on delete set null,
  machine_count integer not null default 19,
  lat_center numeric(9,6) not null,
  lng_center numeric(9,6) not null,
  created_at timestamptz not null default now()
);
alter table public.profiles add constraint profiles_hub_fk foreign key (hub_id) references public.hubs(id) on delete set null;

-- ===== projects =====
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hub_id integer not null references public.hubs(id) on delete cascade,
  status public.project_status not null default 'active',
  progress_pct integer not null default 0,
  machines_assigned integer not null default 0,
  km_coverage numeric(8,2) not null default 0,
  deadline date,
  description text,
  created_at timestamptz not null default now()
);

-- ===== machines =====
create table public.machines (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null unique,
  hub_id integer not null references public.hubs(id) on delete cascade,
  type public.machine_type not null,
  status public.machine_status not null default 'active',
  operator_id uuid references public.profiles(id) on delete set null,
  current_project_id uuid references public.projects(id) on delete set null,
  fuel_level integer not null default 100,
  engine_hours_today numeric(6,2) not null default 0,
  engine_hours_lifetime numeric(9,2) not null default 0,
  lat numeric(9,6),
  lng numeric(9,6),
  speed_kmh numeric(6,2) not null default 0,
  ignition_on boolean not null default false,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index machines_hub_idx on public.machines(hub_id);
create index machines_status_idx on public.machines(status);

create table public.machine_project_assignments (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles(id) on delete set null,
  unassigned_at timestamptz
);

create table public.fuel_logs (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  hub_id integer not null references public.hubs(id) on delete cascade,
  operator_id uuid references public.profiles(id) on delete set null,
  volume_litres numeric(8,2) not null,
  cost_usd numeric(10,2) not null default 0,
  fuel_level_before integer,
  fuel_level_after integer,
  location_lat numeric(9,6),
  location_lng numeric(9,6),
  is_flagged boolean not null default false,
  flag_reason text,
  logged_at timestamptz not null default now(),
  notes text
);
create index fuel_logs_hub_idx on public.fuel_logs(hub_id, logged_at desc);

create table public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  hub_id integer not null references public.hubs(id) on delete cascade,
  type text not null default 'preventive',
  status text not null default 'scheduled',
  description text,
  parts_used text,
  labour_hours numeric(6,2) default 0,
  technician_name text,
  scheduled_at timestamptz not null default now(),
  completed_at timestamptz,
  cost_usd numeric(10,2),
  notes text
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references public.machines(id) on delete cascade,
  hub_id integer not null references public.hubs(id) on delete cascade,
  level public.alert_level not null default 'warning',
  type text not null,
  message text not null,
  is_acknowledged boolean not null default false,
  acknowledged_by uuid references public.profiles(id) on delete set null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);
create index alerts_hub_idx on public.alerts(hub_id, created_at desc);

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  hub_id integer not null references public.hubs(id) on delete cascade,
  operator_id uuid references public.profiles(id) on delete set null,
  type text not null default 'pre_deployment',
  overall_status text not null default 'pass',
  checklist_json jsonb not null default '[]'::jsonb,
  photo_urls text[] not null default '{}',
  notes text,
  submitted_at timestamptz not null default now()
);

create table public.gps_tracks (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  lat numeric(9,6) not null,
  lng numeric(9,6) not null,
  speed_kmh numeric(6,2) not null default 0,
  engine_on boolean not null default true,
  fuel_level integer,
  recorded_at timestamptz not null default now()
);
create index gps_tracks_machine_idx on public.gps_tracks(machine_id, recorded_at desc);

create table public.geofences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hub_id integer not null references public.hubs(id) on delete cascade,
  machine_id uuid references public.machines(id) on delete cascade,
  polygon_json jsonb not null default '{}'::jsonb,
  alert_on_exit boolean not null default true,
  alert_on_entry boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  hub_id integer not null references public.hubs(id) on delete cascade,
  machine_id uuid references public.machines(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  operator_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  status public.wo_status not null default 'assigned',
  priority public.wo_priority not null default 'medium',
  scheduled_date date not null default current_date,
  completed_at timestamptz,
  completion_notes text,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  hub_id integer references public.hubs(id) on delete cascade,
  generated_by uuid references public.profiles(id) on delete set null,
  period_start date,
  period_end date,
  data_json jsonb not null default '{}'::jsonb,
  pdf_url text,
  generated_at timestamptz not null default now()
);

-- ===== grants =====
grant select, insert, update, delete on
  public.profiles, public.user_roles, public.hubs, public.projects, public.machines,
  public.machine_project_assignments, public.fuel_logs, public.maintenance_records,
  public.alerts, public.inspections, public.gps_tracks, public.geofences,
  public.work_orders, public.reports
to authenticated;
grant all on
  public.profiles, public.user_roles, public.hubs, public.projects, public.machines,
  public.machine_project_assignments, public.fuel_logs, public.maintenance_records,
  public.alerts, public.inspections, public.gps_tracks, public.geofences,
  public.work_orders, public.reports
to service_role;

-- ===== RLS =====
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.hubs enable row level security;
alter table public.projects enable row level security;
alter table public.machines enable row level security;
alter table public.machine_project_assignments enable row level security;
alter table public.fuel_logs enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.alerts enable row level security;
alter table public.inspections enable row level security;
alter table public.gps_tracks enable row level security;
alter table public.geofences enable row level security;
alter table public.work_orders enable row level security;
alter table public.reports enable row level security;

create policy "profiles readable" on public.profiles for select to authenticated
  using (id = auth.uid() or public.can_read_all() or hub_id = public.my_hub_id());
create policy "profiles self update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_hq()) with check (id = auth.uid() or public.is_hq());
create policy "profiles hq insert" on public.profiles for insert to authenticated
  with check (public.is_hq());
create policy "profiles hq delete" on public.profiles for delete to authenticated
  using (public.is_hq());

create policy "roles readable" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.can_read_all());
create policy "roles hq manage" on public.user_roles for all to authenticated
  using (public.is_hq()) with check (public.is_hq());

create policy "hubs readable" on public.hubs for select to authenticated using (true);
create policy "hubs hq manage" on public.hubs for all to authenticated
  using (public.is_hq()) with check (public.is_hq());

create policy "projects read" on public.projects for select to authenticated
  using (public.can_read_hub(hub_id));
create policy "projects write" on public.projects for insert to authenticated
  with check (public.can_write_hub(hub_id));
create policy "projects update" on public.projects for update to authenticated
  using (public.can_write_hub(hub_id)) with check (public.can_write_hub(hub_id));
create policy "projects delete" on public.projects for delete to authenticated
  using (public.is_hq());

create policy "machines read" on public.machines for select to authenticated
  using (public.can_read_hub(hub_id) or operator_id = auth.uid());
create policy "machines insert" on public.machines for insert to authenticated
  with check (public.can_write_hub(hub_id));
create policy "machines update" on public.machines for update to authenticated
  using (public.can_write_hub(hub_id) or operator_id = auth.uid())
  with check (public.can_write_hub(hub_id) or operator_id = auth.uid());
create policy "machines delete" on public.machines for delete to authenticated
  using (public.is_hq());

create policy "mpa read" on public.machine_project_assignments for select to authenticated
  using (exists (select 1 from public.machines m where m.id = machine_id and public.can_read_hub(m.hub_id)));
create policy "mpa write" on public.machine_project_assignments for all to authenticated
  using (exists (select 1 from public.machines m where m.id = machine_id and public.can_write_hub(m.hub_id)))
  with check (exists (select 1 from public.machines m where m.id = machine_id and public.can_write_hub(m.hub_id)));

create policy "fuel read" on public.fuel_logs for select to authenticated
  using (public.can_read_hub(hub_id));
create policy "fuel insert" on public.fuel_logs for insert to authenticated
  with check (public.can_write_hub(hub_id) or (hub_id = public.my_hub_id() and operator_id = auth.uid()));
create policy "fuel update" on public.fuel_logs for update to authenticated
  using (public.can_write_hub(hub_id)) with check (public.can_write_hub(hub_id));
create policy "fuel delete" on public.fuel_logs for delete to authenticated using (public.is_hq());

create policy "maint read" on public.maintenance_records for select to authenticated
  using (public.can_read_hub(hub_id));
create policy "maint write" on public.maintenance_records for insert to authenticated
  with check (public.can_write_hub(hub_id));
create policy "maint update" on public.maintenance_records for update to authenticated
  using (public.can_write_hub(hub_id)) with check (public.can_write_hub(hub_id));
create policy "maint delete" on public.maintenance_records for delete to authenticated using (public.is_hq());

create policy "alerts read" on public.alerts for select to authenticated
  using (public.can_read_hub(hub_id));
create policy "alerts insert" on public.alerts for insert to authenticated
  with check (public.can_write_hub(hub_id) or hub_id = public.my_hub_id());
create policy "alerts update" on public.alerts for update to authenticated
  using (public.can_write_hub(hub_id)) with check (public.can_write_hub(hub_id));
create policy "alerts delete" on public.alerts for delete to authenticated using (public.is_hq());

create policy "insp read" on public.inspections for select to authenticated
  using (public.can_read_hub(hub_id));
create policy "insp insert" on public.inspections for insert to authenticated
  with check (public.can_write_hub(hub_id) or (hub_id = public.my_hub_id() and operator_id = auth.uid()));
create policy "insp update" on public.inspections for update to authenticated
  using (public.can_write_hub(hub_id)) with check (public.can_write_hub(hub_id));

create policy "gps read" on public.gps_tracks for select to authenticated
  using (exists (select 1 from public.machines m where m.id = machine_id and (public.can_read_hub(m.hub_id) or m.operator_id = auth.uid())));
create policy "gps write" on public.gps_tracks for insert to authenticated
  with check (exists (select 1 from public.machines m where m.id = machine_id and (public.can_write_hub(m.hub_id) or m.operator_id = auth.uid())));

create policy "geo read" on public.geofences for select to authenticated
  using (public.can_read_hub(hub_id));
create policy "geo write" on public.geofences for all to authenticated
  using (public.can_write_hub(hub_id)) with check (public.can_write_hub(hub_id));

create policy "wo read" on public.work_orders for select to authenticated
  using (public.can_read_hub(hub_id) or operator_id = auth.uid());
create policy "wo insert" on public.work_orders for insert to authenticated
  with check (public.can_write_hub(hub_id) or (hub_id = public.my_hub_id() and operator_id = auth.uid()));
create policy "wo update" on public.work_orders for update to authenticated
  using (public.can_write_hub(hub_id) or operator_id = auth.uid())
  with check (public.can_write_hub(hub_id) or operator_id = auth.uid());
create policy "wo delete" on public.work_orders for delete to authenticated using (public.is_hq());

create policy "reports read" on public.reports for select to authenticated
  using (hub_id is null or public.can_read_hub(hub_id));
create policy "reports write" on public.reports for insert to authenticated
  with check (public.is_hq() or public.can_write_hub(hub_id));
create policy "reports delete" on public.reports for delete to authenticated using (public.is_hq());

-- realtime
alter publication supabase_realtime add table public.machines;
alter publication supabase_realtime add table public.alerts;
alter table public.machines replica identity full;
alter table public.alerts replica identity full;