# AI Clinical Documentation Assistant Rewrite Plan

Treat this as a rewrite, not another patch on the current app.

## Immediate direction

1. Freeze the current product shape.
- Stop extending the current `appointments / reports / prescriptions` flow.
- Keep the repo, but replace the domain model.

2. Replace the database first.
- Create a new Supabase migration for `hospitals`, `doctors`, `patients`, `consultations`, and `recordings`.
- Do not keep `patients.age integer` as the source of truth.
  Use `date_of_birth date` and compute age in the UI.
- Add `doctor_user_id uuid unique references auth.users(id)` to `doctors`.
  Without that, auth and RLS will stay messy.
- Add `icd10_code`, `soap_note jsonb`, and `status` to `consultations`.
- Add `storage_path` to `recordings` instead of only `audio_url`.

3. Redo auth and tenancy.
- One authenticated user should map to one doctor row.
- One doctor row should map to one hospital.
- All RLS should flow from `doctors.hospital_id`, not from ad hoc metadata guesses.

4. Rewrite the app structure.
- Keep this repo on `Next.js 16`. Do not downgrade to 15 unless you have a hard reason.
- Replace the current routes with:
  - `/dashboard`
  - `/patients`
  - `/consultations`
  - `/notes`
  - `/settings`
- Remove the current appointment queue, prescriptions, and report pages from navigation.

5. Scaffold the backend features.
- `app/api/transcribe`
- `app/api/generate-note`
- `app/api/icd10`
- `app/api/discharge`
- `src/lib/gemini.ts`
- `src/lib/supabase.ts`

6. Build the MVP in this order.
- Auth
- Patients CRUD
- Doctors CRUD
- Consultations CRUD
- Recording upload
- Speech-to-text
- SOAP generation
- ICD-10 suggestions
- Discharge PDF

## What can be done right now in this repo

1. Write the full Supabase SQL migration and RLS scripts.
2. Restructure the Next.js app to the new routes.
3. Replace the current navigation and old modules.
4. Scaffold the Gemini and API handlers.
5. Set up the new data flow for patients and consultations.

## Best next move

- Start with the SQL migration and RLS first.
- Then rewrite the app shell and route structure around the new product.

## Recommended execution order

1. Database schema and RLS
2. Auth-to-doctor mapping
3. New route structure
4. CRUD pages for patients and consultations
5. Audio upload and transcription
6. Gemini SOAP generation
7. ICD-10 suggestions
8. PDF discharge summary
