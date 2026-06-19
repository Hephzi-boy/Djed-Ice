import { supabase } from "./supabase";

type Row = Record<string, unknown>;

export type ShellData = {
  profile: {
    displayName: string | null;
    subtitle: string | null;
    initials: string;
  };
  quota: {
    current: number | null;
    limit: number | null;
    plan: string | null;
    resetLabel: string | null;
  } | null;
};

export type DashboardData = {
  workspaceName: string | null;
  metrics: Array<{
    label: string;
    value: string;
    subtext: string;
    tone?: "slate" | "red" | "green";
  }>;
  reviews: Array<{
    title: string;
    id: string;
    confidence: string | null;
  }>;
  activity: Array<{
    time: string;
    title: string;
    meta: string | null;
  }>;
};

export type TriageLane = {
  title: string;
  subtitle: string;
  tone: "rose" | "amber" | "emerald";
  items: Array<{
    id: string;
    tag: string;
    name: string;
    detail: string | null;
    note: string | null;
    wait: string | null;
  }>;
};

export type AppointmentRecord = {
  id: string;
  patientId: string | null;
  patientName: string;
  visitReason: string | null;
  priority: string;
  status: string;
  appointmentDate: string | null;
};

export type AppointmentWorkspaceData = {
  patients: Array<{ id: string; label: string }>;
  appointments: AppointmentRecord[];
};

export type PatientRecord = {
  id: string;
  name: string;
  age: string | null;
  phone: string | null;
  lastVisit: string | null;
  status: {
    label: string;
    tone: "red" | "green" | "amber" | "neutral";
  };
};

export type ReportWorkspaceData = {
  patients: Array<{ id: string; label: string }>;
  latestDraft: {
    title: string | null;
    content: string | null;
    identifier: string | null;
    confidence: string | null;
    clinician: string | null;
  } | null;
};

export type PrescriptionData = {
  drug: string | null;
  frequency: string | null;
  duration: string | null;
  title: string | null;
  interactionWarning: string | null;
  details: Array<{ label: string; text: string }>;
};

export type SettingsData = {
  profile: {
    hospitalName: string | null;
    contactEmail: string | null;
    phone: string | null;
    address: string | null;
  };
  behaviors: Array<{
    key: string;
    title: string;
    detail: string;
    enabled: boolean | null;
  }>;
  plans: Array<{
    name: string;
    price: string | null;
    detail: string | null;
    usage: string | null;
    active: boolean;
  }>;
  usageLabel: string | null;
};

const profileTables = ["profiles", "clinicians", "users"];
const subscriptionTables = ["subscriptions", "usage", "plans"];
const settingsTables = ["workspace_settings", "settings", "hospital_profile"];
const patientTables = ["patients"];
const triageTables = ["triage_queue", "triage_cases", "appointments"];
const reportTables = ["reports", "ai_reports"];
const activityTables = ["activity_logs", "audit_logs", "events"];
const prescriptionTables = ["prescriptions", "medications"];

async function readRows(tables: string[], limit = 20): Promise<Row[]> {
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(limit);

    if (!error && Array.isArray(data)) {
      return data as Row[];
    }
  }

  return [];
}

function getText(row: Row | null | undefined, keys: string[]): string | null {
  if (!row) {
    return null;
  }

  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
}

function getNumber(row: Row | null | undefined, keys: string[]): number | null {
  if (!row) {
    return null;
  }

  for (const key of keys) {
    const value = row[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function getBoolean(row: Row | null | undefined, keys: string[]): boolean | null {
  if (!row) {
    return null;
  }

  for (const key of keys) {
    const value = row[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }
    }
  }

  return null;
}

function getTimestamp(row: Row | null | undefined): string | null {
  return getText(row, [
    "created_at",
    "updated_at",
    "date",
    "timestamp",
    "time",
    "last_visit_at",
    "visited_at",
    "reset_date",
  ]);
}

function formatDateLabel(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTimeLabel(value: string | null): string {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 5);
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatPercent(value: number | null): string | null {
  if (value === null) {
    return null;
  }

  return `${Math.round(value)}%`;
}

function makeInitials(value: string | null): string {
  if (!value) {
    return "AI";
  }

  const parts = value.split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "AI";
}

function isToday(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function normalizePriority(value: string | null): "rose" | "amber" | "emerald" {
  const priority = value?.toLowerCase();

  if (priority === "emergency" || priority === "critical" || priority === "high") {
    return "rose";
  }

  if (priority === "urgent" || priority === "medium") {
    return "amber";
  }

  return "emerald";
}

function titleCase(value: string | null, fallback: string): string {
  if (!value) {
    return fallback;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function fetchShellData(): Promise<ShellData> {
  const [profiles, subscriptions] = await Promise.all([
    readRows(profileTables, 1),
    readRows(subscriptionTables, 1),
  ]);

  const profileRow = profiles[0];
  const subscriptionRow = subscriptions[0];
  const displayName = getText(profileRow, ["full_name", "display_name", "name"]);
  const role = getText(profileRow, ["role", "title"]);
  const department = getText(profileRow, ["department", "team"]);
  const current = getNumber(subscriptionRow, ["current_usage", "used", "usage", "count"]);
  const limit = getNumber(subscriptionRow, ["limit", "quota", "max_usage", "total"]);

  return {
    profile: {
      displayName,
      subtitle: [role, department].filter(Boolean).join(" - ") || null,
      initials: makeInitials(displayName),
    },
    quota: subscriptionRow
      ? {
          current,
          limit,
          plan: getText(subscriptionRow, ["plan_name", "name"]),
          resetLabel: formatDateLabel(getTimestamp(subscriptionRow)),
        }
      : null,
  };
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [settingsRows, reportRows, triageRows, patientRows, activityRows] =
    await Promise.all([
      readRows(settingsTables, 1),
      readRows(reportTables, 30),
      readRows(triageTables, 40),
      readRows(patientTables, 100),
      readRows(activityTables, 20),
    ]);

  const pendingReports = reportRows.filter((row) => {
    const status = getText(row, ["status"]);
    return !status || !["approved", "signed", "complete", "completed"].includes(status.toLowerCase());
  });
  const approvedReports = reportRows.filter((row) => {
    const status = getText(row, ["status"]);
    return Boolean(status && ["approved", "signed", "complete", "completed"].includes(status.toLowerCase()));
  });
  const criticalCases = triageRows.filter((row) => normalizePriority(getText(row, ["priority", "status"])) === "rose");
  const patientsToday = patientRows.filter((row) => isToday(getTimestamp(row)));

  const reviews = pendingReports.slice(0, 6).map((row) => ({
    title:
      getText(row, ["title"]) ||
      [getText(row, ["report_type"]), getText(row, ["patient_name", "name"])]
        .filter(Boolean)
        .join(" - ") ||
      "Draft report",
    id: getText(row, ["external_id", "patient_id", "id"]) || "",
    confidence: formatPercent(getNumber(row, ["confidence", "confidence_score"])),
  }));

  const activity = activityRows.slice(0, 8).map((row) => ({
    time: formatTimeLabel(getTimestamp(row)),
    title: getText(row, ["title", "action", "event_name"]) || "Activity recorded",
    meta: getText(row, ["meta", "description", "details"]),
  }));

  return {
    workspaceName: getText(settingsRows[0], ["hospital_name", "organization_name", "name"]),
    metrics: [
      {
        label: "Pending reports",
        value: String(pendingReports.length),
        subtext: pendingReports.length ? "Awaiting clinician review" : "No pending drafts",
      },
      {
        label: "Critical triage",
        value: String(criticalCases.length),
        subtext: criticalCases.length ? "Immediate review required" : "No critical cases",
        tone: "red",
      },
      {
        label: "Patients today",
        value: String(patientsToday.length || patientRows.length),
        subtext: patientsToday.length ? "Recorded today" : "Total records available",
      },
      {
        label: "AI drafts approved",
        value: String(approvedReports.length),
        subtext: approvedReports.length ? "Approved reports on record" : "No approvals yet",
        tone: "green",
      },
    ],
    reviews,
    activity,
  };
}

export async function fetchTriageData(): Promise<TriageLane[]> {
  const rows = await readRows(triageTables, 60);

  const groups: Record<"rose" | "amber" | "emerald", TriageLane> = {
    rose: { title: "Emergency", subtitle: "See immediately", tone: "rose", items: [] },
    amber: { title: "Urgent", subtitle: "Within 1 hour", tone: "amber", items: [] },
    emerald: { title: "Routine", subtitle: "Same-day OK", tone: "emerald", items: [] },
  };

  for (const row of rows) {
    const tone = normalizePriority(getText(row, ["priority", "status"]));

    groups[tone].items.push({
      id: getText(row, ["id", "patient_id"]) || cryptoRandom(),
      tag: titleCase(getText(row, ["priority", "status"]), groups[tone].title),
      name: getText(row, ["patient_name", "name"]) || "Unassigned patient",
      detail:
        [getText(row, ["symptoms", "reason", "summary"]), getText(row, ["age"])]
          .filter(Boolean)
          .join(" - ") || null,
      note: getText(row, ["note", "ai_note", "recommendation"]),
      wait: getText(row, ["wait_time", "elapsed", "queue_time"]),
    });
  }

  return [groups.rose, groups.amber, groups.emerald];
}

export async function fetchAppointmentWorkspaceData(
  doctorId?: string | null
): Promise<AppointmentWorkspaceData> {
  const patientQuery = supabase.from("patients").select("*").limit(200);
  let appointmentQuery = supabase
    .from("appointments")
    .select("*")
    .order("appointment_date", { ascending: true })
    .limit(200);

  if (doctorId) {
    appointmentQuery = appointmentQuery.eq("doctor_id", doctorId);
  }

  const [{ data: patientRows }, { data: appointmentRows }] = await Promise.all([
    patientQuery,
    appointmentQuery,
  ]);

  const patientMap = new Map<string, string>();

  for (const row of (patientRows as Row[] | null) || []) {
    const id = getText(row, ["id"]);
    const name = getText(row, ["full_name", "patient_name", "name"]);

    if (id && name) {
      patientMap.set(id, name);
    }
  }

  return {
    patients: ((patientRows as Row[] | null) || []).map((row) => ({
      id: getText(row, ["id"]) || cryptoRandom(),
      label: getText(row, ["full_name", "patient_name", "name"]) || "Unnamed patient",
    })),
    appointments: ((appointmentRows as Row[] | null) || []).map((row) => {
      const patientId = getText(row, ["patient_id"]);
      return {
        id: getText(row, ["id"]) || cryptoRandom(),
        patientId,
        patientName:
          (patientId ? patientMap.get(patientId) : null) ||
          getText(row, ["patient_name", "name"]) ||
          "Unassigned patient",
        visitReason: getText(row, ["visit_reason", "reason"]),
        priority: titleCase(getText(row, ["priority"]), "Routine"),
        status: titleCase(getText(row, ["status"]), "Pending"),
        appointmentDate: getText(row, ["appointment_date", "date", "time"]),
      };
    }),
  };
}

export async function createAppointment(input: {
  patient_id: string;
  doctor_id: string | null;
  visit_reason: string;
  priority: string;
  status: string;
  appointment_date: string;
}) {
  const { error } = await supabase.from("appointments").insert(input);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateAppointment(
  id: string,
  input: Partial<{
    priority: string;
    status: string;
    appointment_date: string;
    visit_reason: string;
  }>
) {
  const { error } = await supabase.from("appointments").update(input).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createPatient(input: {
  full_name: string;
  gender?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
}) {
  const { error } = await supabase.from("patients").insert(input);

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchPatientsData(): Promise<PatientRecord[]> {
  const rows = await readRows(patientTables, 100);

  return rows.map((row) => ({
    id: getText(row, ["external_id", "patient_id", "id"]) || "",
    name: getText(row, ["full_name", "patient_name", "name"]) || "Unnamed patient",
    age:
      [getText(row, ["age"]), getText(row, ["gender", "sex"])]
        .filter(Boolean)
        .join(" - ") || null,
    phone: getText(row, ["phone", "phone_number", "contact_phone"]),
    lastVisit: formatDateLabel(getTimestamp(row)),
    status: {
      label: titleCase(getText(row, ["status"]), "Unknown"),
      tone: normalizeStatusTone(getText(row, ["status"])),
    },
  }));
}

function normalizeStatusTone(value: string | null): "red" | "green" | "amber" | "neutral" {
  const status = value?.toLowerCase();

  if (!status) {
    return "neutral";
  }

  if (status.includes("care") || status.includes("active")) {
    return "red";
  }

  if (status.includes("discharged") || status.includes("approved")) {
    return "green";
  }

  if (status.includes("follow") || status.includes("pending")) {
    return "amber";
  }

  return "neutral";
}

export async function fetchReportsWorkspaceData(): Promise<ReportWorkspaceData> {
  const [patients, reports] = await Promise.all([
    readRows(patientTables, 100),
    readRows(reportTables, 10),
  ]);

  const latestReport = reports[0];

  return {
    patients: patients.map((row) => ({
      id: getText(row, ["external_id", "patient_id", "id"]) || cryptoRandom(),
      label:
        [getText(row, ["full_name", "patient_name", "name"]), getText(row, ["age"])]
          .filter(Boolean)
          .join(" - ") || "Patient",
    })),
    latestDraft: latestReport
      ? {
          title: getText(latestReport, ["title", "report_type"]),
          content: getText(latestReport, ["report", "content", "summary", "draft"]),
          identifier: getText(latestReport, ["external_id", "patient_id", "id"]),
          confidence: formatPercent(getNumber(latestReport, ["confidence", "confidence_score"])),
          clinician: getText(latestReport, ["clinician_name", "doctor_name", "approved_by"]),
        }
      : null,
  };
}

export async function fetchPrescriptionData(): Promise<PrescriptionData> {
  const rows = await readRows(prescriptionTables, 1);
  const row = rows[0];

  return {
    drug: getText(row, ["drug_name", "medication", "name"]),
    frequency: getText(row, ["frequency", "dosage_frequency"]),
    duration: getText(row, ["duration"]),
    title: getText(row, ["title", "summary"]),
    interactionWarning: getText(row, ["interaction_warning", "warning", "alert"]),
    details: [
      { label: "Class", text: getText(row, ["drug_class", "class"]) || "" },
      { label: "Indication", text: getText(row, ["indication"]) || "" },
      { label: "Monitoring", text: getText(row, ["monitoring"]) || "" },
      {
        label: "Notable adverse effects",
        text: getText(row, ["adverse_effects", "side_effects"]) || "",
      },
      {
        label: "Contraindications",
        text: getText(row, ["contraindications"]) || "",
      },
    ].filter((item) => item.text),
  };
}

export async function fetchSettingsData(): Promise<SettingsData> {
  const [settingsRows, subscriptionRows] = await Promise.all([
    readRows(settingsTables, 1),
    readRows(subscriptionTables, 10),
  ]);
  const row = settingsRows[0];
  const firstSubscription = subscriptionRows[0];

  return {
    profile: {
      hospitalName: getText(row, ["hospital_name", "organization_name", "name"]),
      contactEmail: getText(row, ["contact_email", "email"]),
      phone: getText(row, ["phone", "contact_phone"]),
      address: getText(row, ["address"]),
    },
    behaviors: [
      {
        key: "require-approval",
        title: "Require clinician approval on every AI output",
        detail: "Reports, prescriptions, and triage overrides all need a signed approval.",
        enabled: getBoolean(row, ["require_approval", "require_clinician_approval"]),
      },
      {
        key: "log-ai",
        title: "Log every AI input and output",
        detail: "Audit trail is recorded for compliance review.",
        enabled: getBoolean(row, ["log_ai_io", "log_ai_usage"]),
      },
      {
        key: "show-confidence",
        title: "Show confidence score on AI drafts",
        detail: "Surface model confidence so clinicians can weigh review depth.",
        enabled: getBoolean(row, ["show_confidence", "show_confidence_score"]),
      },
      {
        key: "patient-view",
        title: "Allow patient-facing plain-language explanations",
        detail: "Enables the patient view in the Prescription Explainer.",
        enabled: getBoolean(row, ["allow_patient_explanations", "patient_view_enabled"]),
      },
    ],
    plans: subscriptionRows.map((subscription) => ({
      name: getText(subscription, ["plan_name", "name"]) || "Plan",
      price: getText(subscription, ["price_label", "price"]),
      detail: getText(subscription, ["doctor_limit_label", "doctor_limit"]),
      usage: getText(subscription, ["usage_limit_label", "usage_limit"]),
      active: Boolean(getBoolean(subscription, ["active", "is_active"])),
    })),
    usageLabel:
      firstSubscription && getNumber(firstSubscription, ["current_usage", "used"]) !== null
        ? `${getNumber(firstSubscription, ["current_usage", "used"])} / ${
            getNumber(firstSubscription, ["limit", "quota", "usage_limit"]) ?? "--"
          } used this cycle`
        : null,
  };
}

export async function generateReportDraft(input: {
  symptoms: string;
  diagnosis: string;
  treatment: string;
}): Promise<string | null> {
  const response = await fetch("/api/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { report?: string };

  return typeof data.report === "string" ? data.report : null;
}

function cryptoRandom(): string {
  return Math.random().toString(36).slice(2, 10);
}
