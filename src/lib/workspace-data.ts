import type { UserRole } from "./roles";
import { roleLabels } from "./roles";

const STORE_KEY = "hospital-ai.workspace.v1";
const AUTH_EVENT = "hospital-ai-auth-changed";
const DATA_EVENT = "hospital-ai-data-changed";

type StoredUser = {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
};

type StoredPatient = {
  id: string;
  full_name: string;
  gender: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  status: string;
  created_at: string;
  last_visit_at: string | null;
  illness: string | null;
};

type StoredAppointment = {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  visit_reason: string;
  priority: string;
  status: string;
  appointment_date: string;
  created_at: string;
  checkup_status: string | null;
  checkup_closed_at: string | null;
};

type StoredReport = {
  id: string;
  patient_id: string | null;
  patient_name: string;
  title: string;
  report_type: string;
  report: string;
  confidence: number;
  clinician_name: string | null;
  status: string;
  created_at: string;
};

type StoredActivity = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
};

type StoredPlan = {
  name: string;
  price: string;
  detail: string;
  usage: string;
  active: boolean;
};

type StoredWorkspaceSettings = {
  hospitalName: string;
  contactEmail: string;
  phone: string;
  address: string;
  behaviors: {
    requireApproval: boolean;
    logAi: boolean;
    showConfidence: boolean;
    patientView: boolean;
  };
};

type StoredPrescriptionTemplate = {
  drug: string;
  frequency: string;
  duration: string;
  title: string;
  interactionWarning: string;
  details: Array<{ label: string; text: string }>;
};

type StoredUsage = {
  current: number;
  limit: number;
  plan: string;
  resetAt: string;
};

type WorkspaceStore = {
  version: 1;
  users: StoredUser[];
  currentSession: WorkspaceSession | null;
  patients: StoredPatient[];
  appointments: StoredAppointment[];
  reports: StoredReport[];
  activities: StoredActivity[];
  plans: StoredPlan[];
  settings: StoredWorkspaceSettings;
  prescriptionTemplate: StoredPrescriptionTemplate;
  usage: StoredUsage;
};

export type WorkspaceSession = {
  access_token: string;
  expires_at: number | null;
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name?: string;
      role?: string;
    };
  };
};

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
  checkup_status: string | null;
  checkup_closed_at: string | null;
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
  illness: string | null;
  status: {
    label: string;
    tone: "red" | "green" | "amber" | "neutral";
  };
};

export type ReportWorkspaceData = {
  patients: Array<{
    id: string;
    label: string;
    illness: string | null;
    symptoms: string | null;
    treatment: string | null;
  }>;
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

type AuthSubscriptionHandlers = {
  onAuthChange?: (session: WorkspaceSession | null) => void;
  onDataChange?: () => void;
};

function nowIso() {
  return new Date().toISOString();
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function hoursAgo(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

function makeId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}${random.slice(0, 8).toUpperCase()}`;
}

function makeInitials(value: string | null): string {
  if (!value) {
    return "AI";
  }

  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "AI"
  );
}

function titleCase(value: string | null, fallback: string): string {
  if (!value) {
    return fallback;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
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
    return value;
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

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) {
    return null;
  }

  const birth = new Date(dateOfBirth);

  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

function normalizeStatusTone(value: string | null): "red" | "green" | "amber" | "neutral" {
  const status = value?.toLowerCase();

  if (!status) {
    return "neutral";
  }

  if (status.includes("care") || status.includes("active") || status.includes("critical")) {
    return "red";
  }

  if (status.includes("discharged") || status.includes("approved") || status.includes("completed")) {
    return "green";
  }

  if (status.includes("follow") || status.includes("pending") || status.includes("scheduled")) {
    return "amber";
  }

  return "neutral";
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

function patientLabel(patient: StoredPatient): string {
  const age = calculateAge(patient.date_of_birth);
  return age !== null ? `${patient.full_name} - ${age}y` : patient.full_name;
}

function getLatestAppointmentForPatient(
  appointments: StoredAppointment[],
  patientId: string
): StoredAppointment | null {
  return (
    [...appointments]
      .filter((appointment) => appointment.patient_id === patientId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null
  );
}

function buildTreatmentSeed(illness: string | null, symptoms: string | null) {
  const illnessLower = illness?.toLowerCase() || "";
  const symptomsLower = symptoms?.toLowerCase() || "";

  if (
    illnessLower.includes("bacterial") ||
    illnessLower.includes("respiratory") ||
    illnessLower.includes("infection") ||
    symptomsLower.includes("fever") ||
    symptomsLower.includes("sore throat") ||
    symptomsLower.includes("fatigue")
  ) {
    return [
      "Amoxicillin 500mg every 8 hours for 7 days after clinician confirmation.",
      "Hydration, rest, temperature monitoring, and infection follow-up review.",
    ].join(" ");
  }

  if (
    illnessLower.includes("hypertension") ||
    illnessLower.includes("diabetes") ||
    symptomsLower.includes("blood pressure") ||
    symptomsLower.includes("medication")
  ) {
    return [
      "Continue blood pressure and glucose control medications as prescribed.",
      "Monitor blood pressure twice daily, review glucose logs, and reinforce diet adherence.",
    ].join(" ");
  }

  if (
    illnessLower.includes("migraine") ||
    illnessLower.includes("headache") ||
    symptomsLower.includes("headache") ||
    symptomsLower.includes("pain")
  ) {
    return [
      "Use migraine-directed pain relief at onset and advise hydration, rest, and trigger avoidance.",
      "Review frequency of episodes and arrange follow-up if attacks persist.",
    ].join(" ");
  }

  return [
    "Provide symptomatic treatment based on the current assessment.",
    "Continue observation, hydration, and timely clinical follow-up.",
  ].join(" ");
}

function createSession(user: StoredUser): WorkspaceSession {
  return {
    access_token: makeId("token_"),
    expires_at: null,
    user: {
      id: user.id,
      email: user.email,
      user_metadata: {
        full_name: user.fullName,
        role: roleLabels[user.role],
      },
    },
  };
}

function defaultStore(): WorkspaceStore {
  return {
    version: 1,
    users: [],
    currentSession: null,
    patients: [
      {
        id: "PT-1001",
        full_name: "Amara Okafor",
        gender: "Female",
        phone: "+234 801 555 0101",
        date_of_birth: "1988-04-12",
        address: "12 Admiralty Way, Lekki",
        status: "Active care",
        created_at: daysAgo(1),
        last_visit_at: hoursAgo(4),
        illness: "Bacterial upper respiratory infection",
      },
      {
        id: "PT-1002",
        full_name: "David Mensah",
        gender: "Male",
        phone: "+234 809 555 0192",
        date_of_birth: "1979-09-03",
        address: "21 Isaac John Street, Ikeja",
        status: "Follow-up",
        created_at: daysAgo(3),
        last_visit_at: daysAgo(1),
        illness: "Hypertension with Type 2 Diabetes",
      },
      {
        id: "PT-1003",
        full_name: "Kemi Adeniyi",
        gender: "Female",
        phone: "+234 816 555 0144",
        date_of_birth: "1996-01-23",
        address: "4 GRA Road, Port Harcourt",
        status: "Discharged",
        created_at: daysAgo(5),
        last_visit_at: daysAgo(2),
        illness: "Migraine with tension headaches",
      },
    ],
    appointments: [
      {
        id: "AP-2001",
        patient_id: "PT-1001",
        doctor_id: null,
        visit_reason: "High fever, sore throat, and fatigue",
        priority: "Urgent",
        status: "Pending",
        appointment_date: daysFromNow(0),
        created_at: hoursAgo(3),
        checkup_status: null,
        checkup_closed_at: null,
      },
      {
        id: "AP-2002",
        patient_id: "PT-1002",
        doctor_id: null,
        visit_reason: "Blood pressure review and medication refill",
        priority: "Routine",
        status: "Confirmed",
        appointment_date: daysFromNow(1),
        created_at: hoursAgo(8),
        checkup_status: null,
        checkup_closed_at: null,
      },
      {
        id: "AP-2003",
        patient_id: "PT-1003",
        doctor_id: null,
        visit_reason: "Post-discharge checkup and lab review",
        priority: "Emergency",
        status: "Completed",
        appointment_date: daysAgo(1),
        created_at: daysAgo(1),
        checkup_status: null,
        checkup_closed_at: null,
      },
    ],
    reports: [
      {
        id: "RP-3001",
        patient_id: "PT-1001",
        patient_name: "Amara Okafor",
        title: "Summary - Amara Okafor",
        report_type: "Summary",
        report:
          "Patient presents with persistent fever, sore throat, and fatigue. Recommend malaria and CBC review alongside clinician examination.",
        confidence: 92,
        clinician_name: "Dr. Default",
        status: "approved",
        created_at: hoursAgo(6),
      },
    ],
    activities: [
      {
        id: "EV-4001",
        title: "Patient intake updated",
        description: "Amara Okafor triage details were refreshed.",
        created_at: hoursAgo(2),
      },
      {
        id: "EV-4002",
        title: "AI draft reviewed",
        description: "A discharge summary was reviewed by a clinician.",
        created_at: hoursAgo(5),
      },
      {
        id: "EV-4003",
        title: "Appointment confirmed",
        description: "David Mensah booking was confirmed for tomorrow.",
        created_at: hoursAgo(10),
      },
    ],
    plans: [
      {
        name: "Clinical AI Starter",
        price: "$49/mo",
        detail: "Up to 6 clinicians",
        usage: "80 AI generations per cycle",
        active: true,
      },
      {
        name: "Clinical AI Growth",
        price: "$129/mo",
        detail: "Up to 20 clinicians",
        usage: "300 AI generations per cycle",
        active: false,
      },
      {
        name: "Clinical AI Enterprise",
        price: "Custom",
        detail: "Unlimited departments",
        usage: "Custom usage envelope",
        active: false,
      },
    ],
    settings: {
      hospitalName: "Djed Ice General Hospital",
      contactEmail: "ops@djedice.health",
      phone: "+234 800 000 0000",
      address: "12 Clinical Crescent, Lagos",
      behaviors: {
        requireApproval: true,
        logAi: true,
        showConfidence: true,
        patientView: false,
      },
    },
    prescriptionTemplate: {
      drug: "",
      frequency: "",
      duration: "",
      title: "",
      interactionWarning: "",
      details: [],
    },
    usage: {
      current: 14,
      limit: 80,
      plan: "Clinical AI Starter",
      resetAt: daysFromNow(18),
    },
  };
}

function hasWindow() {
  return typeof window !== "undefined";
}

function dispatchAuthChange(session: WorkspaceSession | null) {
  if (!hasWindow()) {
    return;
  }

  window.dispatchEvent(new CustomEvent<WorkspaceSession | null>(AUTH_EVENT, { detail: session }));
}

function dispatchDataChange() {
  if (!hasWindow()) {
    return;
  }

  window.dispatchEvent(new Event(DATA_EVENT));
}

function sanitizeStore(value: Partial<WorkspaceStore> | null | undefined): WorkspaceStore {
  const fallback = defaultStore();

  if (!value) {
    return fallback;
  }

  return {
    version: 1,
    users: Array.isArray(value.users) ? value.users : fallback.users,
    currentSession: value.currentSession ?? null,
    patients: Array.isArray(value.patients) ? value.patients : fallback.patients,
    appointments: Array.isArray(value.appointments) ? value.appointments : fallback.appointments,
    reports: Array.isArray(value.reports) ? value.reports : fallback.reports,
    activities: Array.isArray(value.activities) ? value.activities : fallback.activities,
    plans: Array.isArray(value.plans) ? value.plans : fallback.plans,
    settings: value.settings
      ? {
          hospitalName: value.settings.hospitalName || fallback.settings.hospitalName,
          contactEmail: value.settings.contactEmail || fallback.settings.contactEmail,
          phone: value.settings.phone || fallback.settings.phone,
          address: value.settings.address || fallback.settings.address,
          behaviors: {
            requireApproval:
              value.settings.behaviors?.requireApproval ?? fallback.settings.behaviors.requireApproval,
            logAi: value.settings.behaviors?.logAi ?? fallback.settings.behaviors.logAi,
            showConfidence:
              value.settings.behaviors?.showConfidence ?? fallback.settings.behaviors.showConfidence,
            patientView:
              value.settings.behaviors?.patientView ?? fallback.settings.behaviors.patientView,
          },
        }
      : fallback.settings,
    prescriptionTemplate: value.prescriptionTemplate || fallback.prescriptionTemplate,
    usage: value.usage || fallback.usage,
  };
}

function readStore(): WorkspaceStore {
  if (!hasWindow()) {
    return defaultStore();
  }

  const raw = window.localStorage.getItem(STORE_KEY);

  if (!raw) {
    const seeded = defaultStore();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceStore>;
    return sanitizeStore(parsed);
  } catch {
    const seeded = defaultStore();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeStore(store: WorkspaceStore) {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  dispatchDataChange();
}

function updateStore(updater: (store: WorkspaceStore) => WorkspaceStore) {
  const nextStore = updater(readStore());
  writeStore(nextStore);
  return nextStore;
}

function appendActivity(store: WorkspaceStore, title: string, description: string | null) {
  store.activities = [
    {
      id: makeId("EV-"),
      title,
      description,
      created_at: nowIso(),
    },
    ...store.activities,
  ].slice(0, 20);
}

function getCurrentStoredUser(store: WorkspaceStore): StoredUser | null {
  const sessionUserId = store.currentSession?.user.id;

  if (!sessionUserId) {
    return null;
  }

  return store.users.find((user) => user.id === sessionUserId) || null;
}

export async function getWorkspaceSession(): Promise<WorkspaceSession | null> {
  return readStore().currentSession;
}

export async function signUpWorkspaceUser(input: {
  email: string;
  password: string;
  fullName: string;
  role: string;
}) {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const fullName = input.fullName.trim();
  const role = input.role.trim().toLowerCase() as UserRole;

  if (!email) {
    throw new Error("Email is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  if (!fullName) {
    throw new Error("Full name is required.");
  }

  if (!["admin", "doctor", "nurse", "receptionist"].includes(role)) {
    throw new Error("Select a valid role.");
  }

  const store = readStore();

  if (store.users.some((user) => user.email.toLowerCase() === email)) {
    throw new Error("An account with this email already exists.");
  }

  const user: StoredUser = {
    id: makeId("USR-"),
    email,
    password,
    fullName,
    role,
    createdAt: nowIso(),
  };
  const session = createSession(user);

  store.users = [user, ...store.users];
  store.currentSession = session;
  appendActivity(store, "Account created", `${fullName} joined the workspace as ${roleLabels[role]}.`);
  writeStore(store);
  dispatchAuthChange(session);

  return session;
}

export async function signInWorkspaceUser(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const store = readStore();
  const user = store.users.find((item) => item.email.toLowerCase() === email);

  if (!user || user.password !== password) {
    throw new Error("Invalid email or password.");
  }

  const session = createSession(user);
  store.currentSession = session;
  appendActivity(store, "User signed in", `${user.fullName} started a local workspace session.`);
  writeStore(store);
  dispatchAuthChange(session);

  return session;
}

export async function signOutWorkspaceUser() {
  const store = readStore();
  const currentUser = getCurrentStoredUser(store);

  if (currentUser) {
    appendActivity(store, "User signed out", `${currentUser.fullName} ended the current workspace session.`);
  }

  store.currentSession = null;
  writeStore(store);
  dispatchAuthChange(null);
}

export function subscribeToWorkspaceEvents(handlers: AuthSubscriptionHandlers) {
  if (!hasWindow()) {
    return () => undefined;
  }

  const authHandler = (event: Event) => {
    handlers.onAuthChange?.((event as CustomEvent<WorkspaceSession | null>).detail ?? null);
  };
  const dataHandler = () => {
    handlers.onDataChange?.();
  };
  const storageHandler = (event: StorageEvent) => {
    if (event.key === STORE_KEY) {
      handlers.onAuthChange?.(readStore().currentSession);
      handlers.onDataChange?.();
    }
  };

  window.addEventListener(AUTH_EVENT, authHandler);
  window.addEventListener(DATA_EVENT, dataHandler);
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(AUTH_EVENT, authHandler);
    window.removeEventListener(DATA_EVENT, dataHandler);
    window.removeEventListener("storage", storageHandler);
  };
}

export async function fetchShellData(): Promise<ShellData> {
  const store = readStore();
  const user = getCurrentStoredUser(store);
  const displayName = user?.fullName ?? null;
  const roleLabel = user ? roleLabels[user.role] : null;

  return {
    profile: {
      displayName,
      subtitle: [roleLabel, store.settings.hospitalName].filter(Boolean).join(" - ") || null,
      initials: makeInitials(displayName),
    },
    quota: {
      current: store.usage.current,
      limit: store.usage.limit,
      plan: store.usage.plan,
      resetLabel: formatDateLabel(store.usage.resetAt),
    },
  };
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const store = readStore();
  const pendingReports = store.reports.filter((report) => report.status.toLowerCase() !== "approved");
  const approvedReports = store.reports.filter((report) => report.status.toLowerCase() === "approved");
  const criticalCases = store.appointments.filter(
    (appointment) => normalizePriority(appointment.priority) === "rose"
  );
  const patientsToday = store.patients.filter((patient) => {
    const created = new Date(patient.created_at);
    const now = new Date();

    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate()
    );
  });

  return {
    workspaceName: store.settings.hospitalName,
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
        value: String(patientsToday.length || store.patients.length),
        subtext: patientsToday.length ? "Recorded today" : "Total records available",
      },
      {
        label: "AI drafts approved",
        value: String(approvedReports.length),
        subtext: approvedReports.length ? "Approved reports on record" : "No approvals yet",
        tone: "green",
      },
    ],
    reviews: pendingReports.slice(0, 6).map((report) => ({
      title: report.title,
      id: report.id,
      confidence: formatPercent(report.confidence),
    })),
    activity: store.activities.slice(0, 8).map((entry) => ({
      time: formatTimeLabel(entry.created_at),
      title: entry.title,
      meta: entry.description,
    })),
  };
}

export async function fetchTriageData(): Promise<TriageLane[]> {
  const store = readStore();
  const patientMap = new Map(store.patients.map((patient) => [patient.id, patient]));
  const groups: Record<"rose" | "amber" | "emerald", TriageLane> = {
    rose: { title: "Emergency", subtitle: "See immediately", tone: "rose", items: [] },
    amber: { title: "Urgent", subtitle: "Within 1 hour", tone: "amber", items: [] },
    emerald: { title: "Routine", subtitle: "Same-day OK", tone: "emerald", items: [] },
  };

  for (const appointment of store.appointments) {
    const patient = patientMap.get(appointment.patient_id);
    const tone = normalizePriority(appointment.priority);

    groups[tone].items.push({
      id: appointment.id,
      tag: titleCase(appointment.priority, groups[tone].title),
      name: patient?.full_name || "Unassigned patient",
      detail: appointment.visit_reason || null,
      note: appointment.status,
      wait: formatDateLabel(appointment.appointment_date),
    });
  }

  return [groups.rose, groups.amber, groups.emerald];
}

export async function fetchAppointmentWorkspaceData(
  doctorId?: string | null
): Promise<AppointmentWorkspaceData> {
  const store = readStore();
  const patients = [...store.patients]
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
    .map((patient) => ({
      id: patient.id,
      label: patient.full_name,
    }));

  const appointments = store.appointments
    .filter((appointment) =>
      doctorId ? !appointment.doctor_id || appointment.doctor_id === doctorId : true
    )
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
    .map((appointment) => ({
      id: appointment.id,
      patientId: appointment.patient_id,
      patientName:
        store.patients.find((patient) => patient.id === appointment.patient_id)?.full_name ||
        "Unassigned patient",
      visitReason: appointment.visit_reason,
      priority: appointment.priority,
      status: appointment.status,
      appointmentDate: appointment.appointment_date,
      checkup_status: appointment.checkup_status || null,
      checkup_closed_at: appointment.checkup_closed_at || null,
    }));

  return { patients, appointments };
}

export async function createAppointment(input: {
  patient_id: string;
  doctor_id: string | null;
  visit_reason: string;
  priority: string;
  status: string;
  appointment_date: string;
}) {
  updateStore((store) => {
    const patient = store.patients.find((item) => item.id === input.patient_id);

    store.appointments = [
      {
        id: makeId("AP-"),
        patient_id: input.patient_id,
        doctor_id: input.doctor_id,
        visit_reason: input.visit_reason,
        priority: input.priority,
        status: input.status,
        appointment_date: input.appointment_date,
        created_at: nowIso(),
        checkup_status: null,
        checkup_closed_at: null,
      },
      ...store.appointments,
    ];

    appendActivity(
      store,
      "Appointment created",
      `${patient?.full_name || "Patient"} was scheduled for ${formatDateLabel(input.appointment_date) || "a visit"}.`
    );

    return store;
  });
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
  updateStore((store) => {
    const appointment = store.appointments.find((item) => item.id === id);

    if (!appointment) {
      throw new Error("Appointment not found.");
    }

    if (input.priority) {
      appointment.priority = input.priority;
    }

    if (input.status) {
      appointment.status = input.status;
    }

    if (input.appointment_date) {
      appointment.appointment_date = input.appointment_date;
    }

    if (input.visit_reason) {
      appointment.visit_reason = input.visit_reason;
    }

    if (appointment.status.toLowerCase() === "completed") {
      const patient = store.patients.find((item) => item.id === appointment.patient_id);

      if (patient) {
        patient.last_visit_at = nowIso();
        patient.status = "Completed";
      }
    }

    appendActivity(
      store,
      "Appointment updated",
      `Queue state for ${appointment.patient_id} changed to ${appointment.status}.`
    );

    return store;
  });
}

export async function updateAppointmentCheckupStatus(appointmentId: string, status: string) {
  updateStore((store) => {
    const appointment = store.appointments.find((item) => item.id === appointmentId);
    if (appointment) {
      appointment.checkup_status = status;
      appointment.checkup_closed_at = status === "completed" ? nowIso() : null;
      appendActivity(
        store,
        "Checkup status updated",
        `Appointment ${appointmentId} checkup was marked as ${status}.`
      );
    }
    return store;
  });
}

export async function createPatient(input: {
  full_name: string;
  gender?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
}): Promise<{ id: string }> {
  const fullName = input.full_name.trim();

  if (!fullName) {
    throw new Error("Full name is required.");
  }

  const patientId = makeId("PT-");

  updateStore((store) => {
    const patient: StoredPatient = {
      id: patientId,
      full_name: fullName,
      gender: input.gender ?? null,
      phone: input.phone ?? null,
      date_of_birth: input.date_of_birth ?? null,
      address: input.address ?? null,
      status: "Registered",
      created_at: nowIso(),
      last_visit_at: null,
      illness: null,
    };

    store.patients = [patient, ...store.patients];
    appendActivity(store, "Patient registered", `${fullName} was added to the local workspace records.`);
    return store;
  });

  return { id: patientId };
}

export async function fetchPatientsData(): Promise<PatientRecord[]> {
  const store = readStore();

  return [...store.patients]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((patient) => {
      const age = calculateAge(patient.date_of_birth);
      const ageText =
        age !== null
          ? [String(age), patient.gender].filter(Boolean).join(" - ")
          : patient.gender || null;

      return {
        id: patient.id,
        name: patient.full_name,
        age: ageText,
        phone: patient.phone,
        lastVisit: formatDateLabel(patient.last_visit_at || patient.created_at),
        illness: patient.illness || null,
        status: {
          label: titleCase(patient.status, "Unknown"),
          tone: normalizeStatusTone(patient.status),
        },
      };
    });
}

export async function fetchReportsWorkspaceData(): Promise<ReportWorkspaceData> {
  const store = readStore();
  const latestReport = [...store.reports].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  return {
    patients: store.patients.map((patient) => {
      const latestAppointment = getLatestAppointmentForPatient(store.appointments, patient.id);
      const symptoms = latestAppointment?.visit_reason || null;

      return {
        id: patient.id,
        label: patientLabel(patient),
        illness: patient.illness || null,
        symptoms,
        treatment: buildTreatmentSeed(patient.illness || null, symptoms),
      };
    }),
    latestDraft: latestReport
      ? {
          title: latestReport.title,
          content: latestReport.report,
          identifier: latestReport.id,
          confidence: formatPercent(latestReport.confidence),
          clinician: latestReport.clinician_name,
        }
      : null,
  };
}

export async function fetchPrescriptionData(): Promise<PrescriptionData> {
  const template = readStore().prescriptionTemplate;

  return {
    drug: template.drug,
    frequency: template.frequency,
    duration: template.duration,
    title: template.title,
    interactionWarning: template.interactionWarning,
    details: template.details,
  };
}

export async function fetchSettingsData(): Promise<SettingsData> {
  const store = readStore();

  return {
    profile: {
      hospitalName: store.settings.hospitalName,
      contactEmail: store.settings.contactEmail,
      phone: store.settings.phone,
      address: store.settings.address,
    },
    behaviors: [
      {
        key: "require-approval",
        title: "Require clinician approval on every AI output",
        detail: "Reports, prescriptions, and triage overrides all need a signed approval.",
        enabled: store.settings.behaviors.requireApproval,
      },
      {
        key: "log-ai",
        title: "Log every AI input and output",
        detail: "Audit trail is recorded for compliance review.",
        enabled: store.settings.behaviors.logAi,
      },
      {
        key: "show-confidence",
        title: "Show confidence score on AI drafts",
        detail: "Surface model confidence so clinicians can weigh review depth.",
        enabled: store.settings.behaviors.showConfidence,
      },
      {
        key: "patient-view",
        title: "Allow patient-facing plain-language explanations",
        detail: "Enables the patient view in the Prescription Explainer.",
        enabled: store.settings.behaviors.patientView,
      },
    ],
    plans: store.plans.map((plan) => ({
      name: plan.name,
      price: plan.price,
      detail: plan.detail,
      usage: plan.usage,
      active: plan.active,
    })),
    usageLabel: `${store.usage.current} / ${store.usage.limit} used this cycle`,
  };
}

export async function generateReportDraft(input: {
  symptoms: string;
  treatment: string;
  patientId?: string | null;
  patientLabel?: string | null;
  reportType?: string | null;
}): Promise<string | null> {
  try {
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
    const report = typeof data.report === "string" ? data.report : null;

    if (report) {
      updateStore((store) => {
        const currentUser = getCurrentStoredUser(store);
        const selectedPatient = input.patientId
          ? store.patients.find((patient) => patient.id === input.patientId) || null
          : null;
        const patientName = selectedPatient?.full_name || input.patientLabel || "Patient";
        const reportType = input.reportType || "Summary";

        store.reports = [
          {
            id: makeId("RP-"),
            patient_id: input.patientId ?? null,
            patient_name: patientName,
            title: `${reportType} - ${patientName}`,
            report_type: reportType,
            report,
            confidence: Math.max(74, Math.min(98, 82 + Math.round(Math.random() * 14))),
            clinician_name: currentUser?.fullName || null,
            status: "draft",
            created_at: nowIso(),
          },
          ...store.reports,
        ].slice(0, 20);

        store.usage.current = Math.min(store.usage.limit, store.usage.current + 1);
        appendActivity(
          store,
          "AI draft generated",
          `${reportType} draft generated for ${patientName}.`
        );
        return store;
      });
    }

    return report;
  } catch {
    return null;
  }
}
