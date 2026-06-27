"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import {
  MedosPage,
  Modal,
  Panel,
  PanelHeader,
  PlusIcon,
  PrimaryButton,
  SearchIcon,
} from "../_components/medos-ui";
import { useWorkspaceUser } from "../_components/user-session-context";
import {
  createPatient,
  fetchAppointmentWorkspaceData,
  fetchPatientsData,
  type AppointmentWorkspaceData,
  type PatientRecord,
} from "@/lib/workspace-data";

const PAGE_SIZE = 4;
const STATUS_ORDER = ["Registered", "Active care", "Follow-up", "Discharged", "Completed"];
const SORT_OPTIONS = [
  { value: "last-visit", label: "Last Visit" },
  { value: "name", label: "Name A-Z" },
  { value: "status", label: "Status" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export default function PatientsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentWorkspaceData | null>(null);
  const [query, setQuery] = useState(() => searchParams.get("patientName") || "");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("last-visit");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [deepLinkDismissed, setDeepLinkDismissed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    phone: "",
    dateOfBirth: "",
    address: "",
  });
  const { role, session } = useWorkspaceUser();

  useEffect(() => {
    let active = true;

    async function load() {
      const doctorId = role === "doctor" ? session?.user.id || null : null;
      const [patientRecords, appointmentData] = await Promise.all([
        fetchPatientsData(),
        fetchAppointmentWorkspaceData(doctorId),
      ]);

      if (!active) {
        return;
      }

      setPatients(patientRecords);
      setAppointments(appointmentData);
    }

    load();

    return () => {
      active = false;
    };
  }, [role, session]);

  const deepLinkedPatient =
    !deepLinkDismissed && searchParams.get("patientId")
      ? patients.find((patient) => patient.id === searchParams.get("patientId")) || null
      : null;
  const activePatient = selectedPatient || deepLinkedPatient;
  const activePatientAppointment = useMemo(() => {
    if (!activePatient) {
      return null;
    }

    return getLatestPatientAppointment(appointments, activePatient.id);
  }, [activePatient, appointments]);

  function handleOpenPrescription(patient: PatientRecord | null) {
    if (!patient) {
      return;
    }

    const patientWithIllness = patients.find((item) => item.id === patient.id);
    const patientAppointment = getLatestPatientAppointment(appointments, patient.id);
    router.push(
      `/prescriptions?patientId=${patient.id}&patientName=${encodeURIComponent(patient.name)}&illness=${encodeURIComponent(patientWithIllness?.illness || "")}&visitReason=${encodeURIComponent(patientAppointment?.visitReason || "")}&appointmentId=${encodeURIComponent(patientAppointment?.id || "")}`
    );
  }

  const statusOptions = useMemo(() => {
    const existing = Array.from(new Set(patients.map((patient) => patient.status.label)));
    const ordered = [
      ...STATUS_ORDER.filter((status) => existing.includes(status)),
      ...existing.filter((status) => !STATUS_ORDER.includes(status)),
    ];

    return ["All", ...ordered];
  }, [patients]);

  const processedPatients = useMemo(() => {
    const term = query.trim().toLowerCase();

    let result = patients.filter((patient) => {
      const matchesQuery = term
        ? [patient.id, patient.name, patient.phone, patient.age]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(term)
        : true;
      const matchesStatus =
        statusFilter === "All" ? true : patient.status.label.toLowerCase() === statusFilter.toLowerCase();

      return matchesQuery && matchesStatus;
    });

    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "status") {
      result = [...result].sort((a, b) => a.status.label.localeCompare(b.status.label));
    }

    return result;
  }, [patients, query, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(processedPatients.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedPatients = processedPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const canRegisterPatients = role === "admin" || role === "nurse" || role === "receptionist";
  const description =
    role === "doctor"
      ? "Manage and review patient records during consultations."
      : role === "nurse"
        ? "Register patients and maintain their current records."
        : role === "receptionist"
          ? "Register new patients and inspect patient details before scheduling."
          : "Manage patient records across the hospital workspace.";

  const statusCounts = useMemo(() => {
    return patients.reduce<Record<string, number>>((accumulator, patient) => {
      accumulator[patient.status.label] = (accumulator[patient.status.label] || 0) + 1;
      return accumulator;
    }, {});
  }, [patients]);

  const activeCareCount = statusCounts["Active care"] || 0;
  const nextAppointment = useMemo(() => {
    const upcoming = (appointments?.appointments || [])
      .filter((appointment) => appointment.appointmentDate && appointment.status !== "Completed")
      .sort((a, b) => (a.appointmentDate || "").localeCompare(b.appointmentDate || ""));

    return upcoming[0] || null;
  }, [appointments]);

  const highlightPatient = pagedPatients[0] || patients[0] || null;

  async function loadPatients() {
    const doctorId = role === "doctor" ? session?.user.id || null : null;
    const [patientRecords, appointmentData] = await Promise.all([
      fetchPatientsData(),
      fetchAppointmentWorkspaceData(doctorId),
    ]);
    setPatients(patientRecords);
    setAppointments(appointmentData);
  }

  async function handleCreatePatient() {
    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createPatient({
        full_name: form.fullName.trim(),
        gender: form.gender || null,
        phone: form.phone || null,
        date_of_birth: form.dateOfBirth || null,
        address: form.address || null,
      });
      await loadPatients();
      setCreateOpen(false);
      setForm({
        fullName: "",
        gender: "",
        phone: "",
        dateOfBirth: "",
        address: "",
      });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create patient.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MedosPage
      sectionNumber="03"
      sectionTitle="Patient Records"
      title="Patients"
      description={description}
      action={
        canRegisterPatients ? (
          <PrimaryButton icon={<PlusIcon className="h-4 w-4" />} onClick={() => setCreateOpen(true)} className="h-11 px-5">
            Add new patient
          </PrimaryButton>
        ) : undefined
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr_1fr]">
        <SummaryCard
          label="Registry overview"
          title={`+${patients.length}`}
          body={`${activeCareCount} patients currently in active care.`}
          accent="dark"
        />
        <SummaryCard
          label="Next appointment"
          title={nextAppointment?.patientName || "No upcoming visit"}
          body={
            nextAppointment
              ? `${formatAppointmentLabel(nextAppointment.appointmentDate)} | ${nextAppointment.visitReason || "Visit scheduled"}`
              : "No appointment is currently queued."
          }
          accent="light"
        />
        <SummaryCard
          label="Clinical note"
          title={highlightPatient?.name || "Patient review"}
          body={
            highlightPatient?.illness
              ? `Recent record suggests ${highlightPatient.illness.toLowerCase()}.`
              : "Review patient history before sending a case to prescriptions."
          }
          accent="blue"
        />
      </div>

      <Panel>
        <PanelHeader
          title="Patient directory"
          subtitle="Filter by name, status, or recent visits, then open a record for detail."
        />

        <div className="flex flex-col gap-4 border-b border-[color:var(--border-subtle)] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-center">
            <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] px-4 text-[color:var(--muted)]">
              <SearchIcon className="h-4 w-4 shrink-0" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search patient, phone, age, or ID"
                className="w-full bg-transparent text-[15px] text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--muted-soft)]"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => {
                const active = statusFilter === status;
                const count = status === "All" ? patients.length : statusCounts[status] || 0;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusFilter(status);
                      setPage(1);
                    }}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? "border-[color:var(--accent-strong)] bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white"
                        : "border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] text-[color:var(--muted)] hover:border-[color:var(--border-strong)]"
                    }`}
                  >
                    {status}
                    {status !== "All" ? ` ${count}` : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-auto">
            <span className="med-label">Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as SortOption);
                setPage(1);
              }}
              className="med-select h-11 w-[160px]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {pagedPatients.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[color:var(--surface-muted)]">
                <tr className="border-b border-[color:var(--border-subtle)]">
                  {["Patient ID", "Name", "Age and Gender", "Phone", "Last Visit", "Status", "Actions"].map((heading) => (
                    <th key={heading} className="px-4 py-4 text-left">
                      <span className="med-label">{heading}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedPatients.map((patient) => (
                  <tr
                    key={`${patient.id}-${patient.name}`}
                    className="border-b border-[color:var(--border-subtle)] last:border-b-0 hover:bg-[color:var(--surface-elevated)]"
                  >
                    <td className="whitespace-nowrap px-4 py-5 text-sm text-[color:var(--muted)]">{patient.id || "--"}</td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-xs font-semibold text-sky-700">
                          {makeInitials(patient.name)}
                        </div>
                        <p className="text-sm font-semibold text-[color:var(--foreground-soft)]">{patient.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-sm text-[color:var(--muted)]">{patient.age || "--"}</td>
                    <td className="px-4 py-5 text-sm text-[color:var(--muted)]">{patient.phone || "--"}</td>
                    <td className="px-4 py-5 text-sm text-[color:var(--muted)]">{patient.lastVisit || "--"}</td>
                    <td className="px-4 py-5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${statusBadgeClass(patient.status.tone)}`}>
                        {patient.status.label}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(patient)}
                        className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--border-strong)]"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-8 text-sm text-[color:var(--muted)]">No patient records were found.</p>
        )}

        <div className="flex flex-col gap-3 border-t border-[color:var(--border-subtle)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[color:var(--muted)]">
            Showing {pagedPatients.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}-
            {Math.min(currentPage * PAGE_SIZE, processedPatients.length)} of {processedPatients.length} patients
          </p>
          <div className="flex items-center gap-2 self-end">
            <PagerButton onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1}>
              &lt;
            </PagerButton>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <PagerButton key={pageNumber} active={pageNumber === currentPage} onClick={() => setPage(pageNumber)}>
                {pageNumber}
              </PagerButton>
            ))}
            <PagerButton onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages}>
              &gt;
            </PagerButton>
          </div>
        </div>
      </Panel>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setError(null);
        }}
        title="Register patient"
        description="Capture the core patient details needed for registration and follow-up."
        footer={
          <>
            <PrimaryButton subtle onClick={() => setCreateOpen(false)}>
              Cancel
            </PrimaryButton>
            <PrimaryButton onClick={handleCreatePatient} disabled={saving}>
              {saving ? "Saving..." : "Create patient"}
            </PrimaryButton>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Full name">
            <input
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              className="med-input"
            />
          </FormField>
          <FormField label="Gender">
            <select
              value={form.gender}
              onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
              className="med-select"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </FormField>
          <FormField label="Phone">
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="med-input"
            />
          </FormField>
          <FormField label="Date of birth">
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))}
              className="med-input"
            />
          </FormField>
          <FormField label="Address" className="md:col-span-2">
            <textarea
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              className="med-textarea"
            />
          </FormField>
        </div>
        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(activePatient)}
        onClose={() => {
          setSelectedPatient(null);
          setDeepLinkDismissed(true);
        }}
        title={activePatient?.name || "Patient details"}
        description="Patient record details currently available in the workspace."
        footer={
          activePatient ? (
            <PrimaryButton onClick={() => handleOpenPrescription(activePatient)}>
              Open in prescription
            </PrimaryButton>
          ) : null
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ReadField label="Patient ID" value={activePatient?.id || "--"} />
          <ReadField label="Status" value={activePatient?.status.label || "--"} />
          <ReadField label="Age / gender" value={activePatient?.age || "--"} />
          <ReadField label="Phone" value={activePatient?.phone || "--"} />
          <ReadField label="Last visit" value={activePatient?.lastVisit || "--"} className="md:col-span-2" />
          <ReadField
            label="Latest visit reason"
            value={activePatientAppointment?.visitReason || activePatient?.illness || "--"}
            className="md:col-span-2"
          />
        </div>
      </Modal>
    </MedosPage>
  );
}

function SummaryCard({
  label,
  title,
  body,
  accent,
}: {
  label: string;
  title: string;
  body: string;
  accent: "dark" | "light" | "blue";
}) {
  const cardClass =
    accent === "dark"
      ? "bg-[#0b2136] text-white"
      : accent === "blue"
        ? "bg-[linear-gradient(135deg,#0ea5b7,#2563eb)] text-white"
        : "med-surface-strong text-[color:var(--foreground-soft)]";

  const bodyClass = accent === "light" ? "text-[color:var(--muted)]" : "text-white/80";
  const borderClass = accent === "light" ? "" : "border border-transparent";

  return (
    <div className={`rounded-[24px] px-5 py-5 shadow-[var(--shadow-soft)] ${cardClass} ${borderClass}`}>
      <p className={`text-[10px] font-medium uppercase tracking-[0.22em] ${accent === "light" ? "text-[color:var(--muted)]" : "text-white/70"}`}>
        {label}
      </p>
      <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em]">{title}</p>
      <p className={`mt-3 text-sm leading-6 ${bodyClass}`}>{body}</p>
    </div>
  );
}

function PagerButton({
  children,
  onClick,
  disabled = false,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-semibold transition ${
        active
          ? "bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white"
          : "border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] text-[color:var(--muted)] hover:border-[color:var(--border-strong)]"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="med-label mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function ReadField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="med-label mb-2 block">{label}</span>
      <div className="med-input flex h-12 items-center">{value}</div>
    </div>
  );
}

function makeInitials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "PT"
  );
}

function formatAppointmentLabel(value: string | null) {
  if (!value) {
    return "No schedule";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusBadgeClass(tone: PatientRecord["status"]["tone"]) {
  switch (tone) {
    case "red":
      return "bg-rose-500/10 text-rose-700";
    case "green":
      return "bg-emerald-500/10 text-emerald-700";
    case "amber":
      return "bg-amber-500/10 text-amber-700";
    default:
      return "bg-slate-500/10 text-[color:var(--muted)]";
  }
}

function getLatestPatientAppointment(
  appointments: AppointmentWorkspaceData | null,
  patientId: string
) {
  return (
    [...(appointments?.appointments || [])]
      .filter((appointment) => appointment.patientId === patientId)
      .sort((left, right) => (right.appointmentDate || "").localeCompare(left.appointmentDate || ""))[0] || null
  );
}
