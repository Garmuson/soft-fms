
create sequence if not exists public.driver_staff_seq start 1;

create or replace function public.assign_staff_no()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.staff_no := 'DRV-' || lpad(nextval('public.driver_staff_seq')::text, 4, '0');
  else
    new.staff_no := old.staff_no;
  end if;
  return new;
end; $$;
revoke execute on function public.assign_staff_no() from public, anon, authenticated;

drop trigger if exists drivers_staff_no on public.drivers;
create trigger drivers_staff_no before insert or update on public.drivers
for each row execute function public.assign_staff_no();

alter table public.drivers alter column staff_no set default '';
create unique index if not exists drivers_staff_no_key on public.drivers(staff_no);

alter table public.driver_assignments
  add column if not exists status text not null default 'assigned',
  add column if not exists project_id uuid references public.projects(id) on delete set null;
update public.driver_assignments set status = 'completed' where unassigned_at is not null and status = 'assigned';

create or replace function public.validate_assignment()
returns trigger language plpgsql security definer set search_path = public as $$
declare mtype text; certs text[];
begin
  if new.status not in ('assigned','in_progress','completed','cancelled') then
    raise exception 'Invalid assignment status %', new.status;
  end if;
  select type::text into mtype from public.machines where id = new.machine_id;
  select certified_types into certs from public.drivers where id = new.driver_id;
  if mtype is null or certs is null or not (mtype = any(certs)) then
    raise exception 'This driver is certified for % only. Please select a compatible machine.',
      coalesce(nullif(array_to_string(certs, ', '), ''), 'no machine type');
  end if;
  return new;
end; $$;
revoke execute on function public.validate_assignment() from public, anon, authenticated;

drop trigger if exists driver_assignments_competency on public.driver_assignments;
create trigger driver_assignments_competency
before insert or update of driver_id, machine_id, status on public.driver_assignments
for each row execute function public.validate_assignment();

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.profiles(id) on delete cascade,
  machine_id uuid not null references public.machines(id) on delete cascade,
  hub_id integer not null references public.hubs(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.shifts to authenticated;
grant all on public.shifts to service_role;
alter table public.shifts enable row level security;
create unique index shifts_one_active on public.shifts(operator_id) where ended_at is null;
create policy "Operators manage own shifts" on public.shifts for all to authenticated
  using (operator_id = auth.uid()) with check (operator_id = auth.uid());
create policy "Scoped staff read shifts" on public.shifts for select to authenticated
  using (public.can_read_hub(hub_id));
