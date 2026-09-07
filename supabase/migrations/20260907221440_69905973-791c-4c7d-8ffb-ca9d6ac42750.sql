delete from public.machines m
using (
  select id from (
    select id,
           row_number() over (partition by hub_id, type order by unit_id) as rn,
           type
    from public.machines
  ) t
  where (type = 'front_end_loader' and rn = 4)
     or (type = 'excavator' and rn = 3)
     or (type = 'dump_truck' and rn = 4)
     or (type = 'compactor' and rn = 3)
) d
where m.id = d.id;

update public.hubs set machine_count = 15;