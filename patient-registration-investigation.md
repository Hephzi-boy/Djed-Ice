# Patient Registration Investigation

The failure is not in the form UI. It is in the app-to-database contract.

## Primary finding

- [`src/lib/workspace-data.ts:534`](src/lib/workspace-data.ts) creates patients by inserting `full_name`, `phone`, `gender`, `date_of_birth`, `address`, and `user_id`.
- The repo's own product spec says the `patients` table is keyed by `hospital_id`, not `user_id`, at `AI-HOSPITAL-ASSISTANT-PRD.md:167` and `AI-HOSPITAL-ASSISTANT-PRD.md:171`.
- The signup/session flow only carries `full_name` and `role`, with no hospital/workspace identifier, at `src/app/_components/auth-panel.tsx:68` and `src/app/_components/app-shell.tsx:124`.

## What that means

- The app is not tenant-aware, but the database appears to be.
- The exact error text, `column "hospital_id" does not exist (42703)`, means some database-side object is still referencing `hospital_id`.
- Since the insert payload does not send `hospital_id`, the likely source is a Supabase RLS policy, trigger, view, or function on `patients`, or a schema drift between environments.
- Separately, the app code is also out of sync with the intended schema because it inserts `user_id` where the PRD expects `hospital_id`.

## Important limitation

- There are no migrations or schema files in this repo to verify the live table definition locally, so I cannot prove whether the broken object is the table, a policy, or a trigger from code alone.

## Secondary bug found

- `src/app/appointments/page.tsx:169` uses `patient.full_name` and `appointment.visit_reason`, but this page's data shape uses `patient.label` and `appointment.visitReason`. That navigation path is broken independently of the database error.

## Most likely fix path

1. Inspect the live Supabase `patients` table, RLS policies, triggers, and views for any `hospital_id` reference.
2. Decide on one schema model:
   - Multi-tenant: add `hospital_id` to auth/profile/session flow and insert it from the app.
   - Single-tenant or user-scoped: remove stale `hospital_id` references from DB policies/triggers/views.
3. Update `createPatient()` to match the real schema exactly.
4. Fix the broken field names in `appointments/page.tsx`.

## Conclusion

The app-side issue is real, but the immediate insert failure is almost certainly caused by a live Supabase schema/policy/trigger mismatch. Even if I patch the frontend now, patient creation will keep failing until the database-side `hospital_id` reference is corrected or the app is updated to supply the correct tenant field.



• I can do 1, 3, and 4, but with limits.

  1. I can inspect the repo for all hospital_id references right   
     now. I cannot inspect the live Supabase table/RLS/triggers/   
     views from this workspace unless you give me DB access or the 
     SQL/policy definitions.

  2. I can help you decide the schema model, but I should not      
     choose that alone without the real database design. That      
     decision depends on whether you actually want multi-tenant    
     hospital isolation.

  3. I can update createPatient(), but only after 1/2 confirm the  
     real schema. Otherwise it would be guesswork.

  4. I can fix the broken field names in /C:/Users/HP/Desktop/     
     Shnaps/hospital-ai/src/app/appointments/page.tsx immediately. 

  One more constraint: this session is currently read-only, so if  
  you want me to actually patch files, I need approval to write.   

  Best next move:

  - I fix 4 now.
  - You provide the Supabase schema/policies for patients, or let  
    me inspect them.

  - Then I patch 3 correctly.
