create or replace function public.compute_love_dna()
returns public.love_dna_profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result public.love_dna_profiles;
  answer_count integer;
  s numeric;
  d numeric;
  a numeric;
  v numeric;
  m numeric;
  dna_code text;
  dna_clan text;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;

  select
    count(*),
    coalesce(avg(value) filter (where axis = 'S'), 50),
    coalesce(avg(value) filter (where axis = 'D'), 50),
    coalesce(avg(value) filter (where axis = 'A'), 50),
    coalesce(avg(value) filter (where axis = 'V'), 50),
    coalesce(avg(value) filter (where axis = 'M'), 50)
  into answer_count, s, d, a, v, m
  from public.love_dna_responses
  where user_id = auth.uid();

  if answer_count < 40 then raise exception 'INSUFFICIENT_ANSWERS'; end if;

  dna_code :=
    case when s >= 50 then 'S' else 's' end ||
    case when d >= 50 then 'D' else 'd' end ||
    case when a >= 50 then 'A' else 'a' end ||
    case when v >= 50 then 'V' else 'v' end ||
    case when m >= 50 then 'M' else 'm' end;

  dna_clan := case
    when s >= 65 and m >= 55 then 'Explorer'
    when d >= 60 and v >= 55 then 'Dreamer'
    when a <= 45 and v >= 55 then 'Thinker'
    when a >= 60 and m >= 50 then 'Caregiver'
    when d <= 45 and a >= 55 then 'Protector'
    else 'Builder'
  end;

  insert into public.love_dna_profiles (
    user_id, code, clan, axis_s, axis_d, axis_a, axis_v, axis_m, answered_count
  ) values (
    auth.uid(), dna_code, dna_clan, round(s, 2), round(d, 2), round(a, 2),
    round(v, 2), round(m, 2), answer_count
  )
  on conflict (user_id) do update set
    code = excluded.code,
    clan = excluded.clan,
    axis_s = excluded.axis_s,
    axis_d = excluded.axis_d,
    axis_a = excluded.axis_a,
    axis_v = excluded.axis_v,
    axis_m = excluded.axis_m,
    answered_count = excluded.answered_count,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

revoke all on function public.compute_love_dna() from public;
grant execute on function public.compute_love_dna() to authenticated;
