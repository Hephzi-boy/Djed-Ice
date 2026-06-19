# AI Hospital Assistant

## Product Requirements & Technical Documentation

### Version

1.0

### Tech Stack

- Frontend: Next.js 15 + TypeScript
- Backend: Next.js API Routes
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- AI Engine: Gemini 2.5 Pro
- Styling: Tailwind CSS + ShadCN UI
- Hosting: Vercel

---

## 1. Project Overview

The AI Hospital Assistant is a web-based platform that helps hospitals, clinics, and healthcare facilities automate administrative and medical documentation tasks using Artificial Intelligence.

The system is not intended to replace doctors.

The system assists healthcare workers by:

- Generating medical reports
- Prioritizing patient appointments
- Explaining prescriptions
- Managing patient records
- Generating discharge summaries
- Providing hospital analytics

---

## 2. High-Level System Architecture

```text
Patient/Doctor/Nurse
          |
          |
      Next.js
          |
          |
    API Routes
          |
    -----------------
    |               |
Supabase        Gemini AI
(Database)      (AI Engine)
```

### System Flow

1. User logs in.
2. User performs an action.
3. Next.js sends data to API Route.
4. API Route validates request.
5. API Route saves or fetches data from Supabase.
6. If AI is required:
   - API Route sends prompt to Gemini.
   - Gemini returns result.
7. Result is stored in Supabase.
8. Result is displayed on dashboard.

---

## 3. User Roles

### Admin

Responsibilities:

- Manage hospital
- Manage doctors
- Manage nurses
- View analytics
- Manage subscriptions

Permissions:

- Full access

### Doctor

Responsibilities:

- View patients
- Create reports
- Generate AI summaries
- Manage appointments

Permissions:

- Medical access only

### Nurse

Responsibilities:

- Register patients
- Manage appointments
- View patient records

Permissions:

- Limited access

### Receptionist

Responsibilities:

- Create appointments
- Register new patients
- Check appointment status

Permissions:

- Front desk access only

---

## 4. Authentication Module

Purpose:

Provides secure login and access control.

Technology:

- Supabase Auth

Required:

- Email
- Password
- User Role

Database table: `profiles`

```sql
id
email
role
hospital_id
created_at
```

### How It Works

1. User signs up.
2. Supabase creates account.
3. Profile record created.
4. User role assigned.
5. System determines accessible pages.

---

## 5. Patient Management Module

Purpose:

Stores patient information.

Database table: `patients`

```sql
id
hospital_id
full_name
gender
phone
date_of_birth
address
created_at
```

Functions:

- Create patient
- Update patient
- Search patient
- View patient history

### How It Works

1. Receptionist registers patient.
2. Data stored in Supabase.
3. Doctors retrieve patient information during consultation.

---

## 6. Appointment Management Module

Purpose:

Manage hospital appointments.

Database table: `appointments`

```sql
id
patient_id
doctor_id
visit_reason
priority
status
appointment_date
created_at
```

Functions:

- Create appointment
- Reschedule appointment
- Cancel appointment
- Prioritize appointment

Statuses:

- Pending
- Confirmed
- Completed
- Cancelled

### How It Works

1. Appointment created.
2. Patient assigned to doctor.
3. Appointment appears on dashboard.

---

## 7. AI Medical Report Generator

Purpose:

Generate professional medical reports.

Requires:

- Gemini API Key
- Patient Information
- Diagnosis
- Symptoms
- Treatment

Database table: `ai_reports`

```sql
id
patient_id
doctor_id
report_type
input_data
generated_report
created_at
```

### How It Works

1. Doctor enters:
   - Symptoms
   - Diagnosis
   - Treatment
2. Next.js sends request to API.
3. API sends prompt to Gemini.
4. Gemini generates report.
5. Report stored in Supabase.
6. Doctor reviews report.
7. Doctor approves final version.

Output examples:

- Clinical Report
- Referral Letter
- Medical Summary
- Discharge Summary

---

## 8. AI Appointment Prioritization

Purpose:

Identify urgent patients automatically.

Required inputs:

- Age
- Symptoms
- Visit Reason

### How It Works

1. Patient data submitted.
2. Gemini categorizes:
   - Emergency
   - Urgent
   - Routine

Example:

- Chest Pain -> Emergency

Benefits:

- Faster response
- Better queue management

---

## 9. AI Prescription Explanation

Purpose:

Explain medication in simple language.

Required:

- Medication Name
- Dosage

### How It Works

1. Doctor selects medication.
2. Gemini generates:
   - Usage instructions
   - Side effects
   - Warnings

Output example:

- Take twice daily after meals.
- Possible side effects:
  - Dizziness
  - Nausea

---

## 10. AI Lab Result Summarizer

Future feature.

Purpose:

Convert complex laboratory reports into easy-to-understand summaries.

Input:

- PDF Upload
- Lab Results

Output:

- Summary
- Recommendations
- Follow-up Suggestions

Required:

- File Upload System
- Gemini PDF Processing

---

## 11. Dashboard Analytics

Purpose:

Provide hospital management insights.

Metrics:

- Total Patients
- Daily Visits
- Weekly Visits
- Monthly Visits
- Revenue
- Appointments

Database sources:

- patients
- appointments
- ai_reports

### How It Works

1. Dashboard queries Supabase.
2. Data displayed as:
   - Cards
   - Charts
   - Tables

---

## 12. Subscription Management

Purpose:

Charge hospitals monthly.

Payment Provider:

- Paystack

Plans:

### Starter

- 3 Doctors
- 500 Reports

### Professional

- 15 Doctors
- 5000 Reports

### Enterprise

- Unlimited

Database table: `subscriptions`

```sql
id
hospital_id
plan
status
expires_at
created_at
```

### How It Works

1. Hospital chooses plan.
2. Paystack processes payment.
3. Subscription updated.
4. Limits applied.

---

## 13. AI Usage Tracking

Purpose:

Track AI consumption.

Database table: `ai_usage`

```sql
id
hospital_id
doctor_id
feature_name
tokens_used
created_at
```

Benefits:

- Billing
- Monitoring
- Abuse Prevention

---

## 14. File Storage

Purpose:

Store hospital documents.

Technology:

- Supabase Storage

Files:

- Patient Images
- Medical Documents
- Lab Reports
- Referral Documents

Required:

- Storage Bucket

Examples:

- patient-files
- lab-results

---

## 15. Security Requirements

Required:

- HTTPS
- Authentication
- Role Permissions
- Data Encryption
- Audit Logs

Medical data should never be publicly accessible.

All API routes must verify:

- User identity
- User role
- Hospital ownership

---

## 16. Deployment

Frontend:

- Vercel

Backend:

- Next.js API Routes

Database:

- Supabase

AI:

- Gemini

Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
PAYSTACK_SECRET_KEY=
```

---

## 17. MVP Development Roadmap

### Week 1

- Project Setup
- Authentication
- Roles

### Week 2

- Patients Module
- Appointment Module

### Week 3

- AI Report Generator

### Week 4

- Dashboard
- Deployment

### Week 5

- Payment Integration

### Week 6

- Hospital Pilot Testing

---

## Final Goal

Create a hospital productivity platform that reduces paperwork, improves patient management, assists doctors with documentation, and generates recurring SaaS revenue through monthly subscriptions.
