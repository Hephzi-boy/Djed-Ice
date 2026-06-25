# Supabase Patients DB Fix Checklist

## Confirmed live facts

- `public.patients` includes both `hospital_id` and `user_id`.
- `patients.hospital_id` is required.
- `public.profiles` does not include `hospital_id`.
- The app currently inserts `user_id` in [`src/lib/workspace-data.ts`](src/lib/workspace-data.ts) but does not insert `hospital_id`.
- The failing runtime error is `column "hospital_id" does not exist (42703)`.

## Most likely root cause

Some database-side logic for `patients` is still referencing `hospital_id` on the wrong object.

The strongest suspect is an RLS policy, trigger, or function that expects `profiles.hospital_id`, even though the live `profiles` table does not have that column.

## Immediate app fix already done

- Fixed the normalized field-name bug in [`src/app/appointments/page.tsx`](src/app/appointments/page.tsx).

## What to inspect in Supabase SQL Editor

Run these queries first:

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name in ('patients', 'profiles', 'doctors', 'hospitals')
order by table_name, ordinal_position;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'patients';

select trigger_name, event_manipulation, action_timing, action_statement
from information_schema.triggers
where event_object_schema = 'public' and event_object_table = 'patients';

select n.nspname as schema_name, p.proname as function_name, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where pg_get_functiondef(p.oid) ilike '%hospital_id%';
```

## Repair path A: keep the app multi-tenant

Use this if each user belongs to one hospital and patient access should stay hospital-scoped.

### 1. Add `hospital_id` to `profiles` if your policies expect it

```sql
alter table public.profiles
add column if not exists hospital_id uuid references public.hospitals(id);
```

### 2. Backfill `profiles.hospital_id`

If `doctors.doctor_user_id` maps auth users to hospitals:

```sql
update public.profiles p
set hospital_id = d.hospital_id
from public.doctors d
where d.doctor_user_id = p.id
  and p.hospital_id is null;
```

If you also store admins, nurses, or receptionists elsewhere, backfill those too before enforcing any policy that reads `profiles.hospital_id`.

### 3. Ensure the patient insert policy reads from a real source

Template:

```sql
drop policy if exists patients_insert_same_hospital on public.patients;

create policy patients_insert_same_hospital
on public.patients
for insert
to authenticated
with check (
  hospital_id = (
    select hospital_id
    from public.profiles
    where id = auth.uid()
  )
);
```

### 4. Update the app to send `hospital_id`

`createPatient()` should stop inserting only `user_id`. It should insert the current user's hospital identifier as well.

## Repair path B: stop using `profiles.hospital_id`

Use this if `profiles` is intentionally minimal and hospital membership should come from another table.

### 1. Replace any broken policy/function reference

If a policy or function currently does this:

```sql
select hospital_id from public.profiles where id = auth.uid()
```

replace it with a real mapping source, for example:

```sql
select hospital_id from public.doctors where doctor_user_id = auth.uid()
```

or another staff-membership table that actually exists for every authenticated role.

### 2. Keep `patients.hospital_id` required

Do not remove `patients.hospital_id` unless you are intentionally abandoning hospital scoping.

## App-side follow-up still needed

After the database-side source of truth is confirmed, update [`src/lib/workspace-data.ts`](src/lib/workspace-data.ts) so `createPatient()` inserts the real tenant key:

- `hospital_id` if the database is hospital-scoped
- only `user_id` if you intentionally remove hospital scoping from the database

At the moment, the app and database contract are still mismatched.

## Remaining blocker

The provided pooler connection string did not authenticate successfully from the CLI, so the exact current policy/trigger SQL could not be pulled automatically in this session.
