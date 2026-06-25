"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import {
  Modal,
  PlusIcon,
  PrimaryButton,
  SearchIcon,
} from "../_components/medos-ui";
import { useWorkspaceTheme } from "../_components/workspace-theme-context";
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
  const { theme } = useWorkspaceTheme();

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
    <div className="mx-auto max-w-[1220px] space-y-5">
      <section className="flex flex-col gap-4 rounded-[24px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_12px_34px_rgba(15,23,42,0.06)] sm:flex-row sm:items-start sm:justify-between sm:px-7">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight text-slate-950">Patients</h1>
          <p className="mt-2 text-[15px] leading-7 text-slate-600">{description}</p>
        </div>
        {canRegisterPatients ? (
          <PrimaryButton icon={<PlusIcon className="h-4 w-4" />} onClick={() => setCreateOpen(true)} className="h-10 self-start px-5 text-sm">
            Add New Patient
          </PrimaryButton>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-center">
            <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-500">
              <SearchIcon className="h-4 w-4 shrink-0" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Filter by Status, ID, or patient..."
                className="w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
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
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-sky-700 bg-sky-700 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50"
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
            <span className="text-xs font-medium text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as SortOption);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
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
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200">
                  {["Patient ID", "Name", "Age & Gender", "Phone", "Last Visit", "Status", "Actions"].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-4 text-left text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedPatients.map((patient) => (
                  <tr key={`${patient.id}-${patient.name}`} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-5 text-sm text-slate-500">{patient.id || "--"}</td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-semibold text-sky-700">
                          {makeInitials(patient.name)}
                        </div>
                        <p className="text-sm font-semibold text-slate-950">{patient.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-sm text-slate-600">{patient.age || "--"}</td>
                    <td className="px-4 py-5 text-sm text-slate-600">{patient.phone || "--"}</td>
                    <td className="px-4 py-5 text-sm text-slate-600">{patient.lastVisit || "--"}</td>
                    <td className="px-4 py-5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${statusBadgeClass(patient.status.tone)}`}>
                        {patient.status.label}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(patient)}
                        className="h-9 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
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
          <p className="px-6 py-8 text-sm text-slate-600">No patient records were found.</p>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
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
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr_1fr]">
        <SummaryCard
          label="Registry Overview"
          title={`+${patients.length}`}
          body={`${activeCareCount} patients currently in active care.`}
          accent="dark"
        />
        <SummaryCard
          label="Next Appointment"
          title={nextAppointment?.patientName || "No upcoming visit"}
          body={
            nextAppointment
              ? `${formatAppointmentLabel(nextAppointment.appointmentDate)} • ${nextAppointment.visitReason || "Visit scheduled"}`
              : "No appointment is currently queued."
          }
          accent="light"
        />
        <SummaryCard
          label="Clinical Note"
          title={highlightPatient?.name || "Patient review"}
          body={
            highlightPatient?.illness
              ? `Recent record suggests ${highlightPatient.illness.toLowerCase()}.`
              : "Review patient history before sending a case to prescriptions."
          }
          accent="blue"
        />
      </div>

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
              className={inputClassName(theme)}
            />
          </FormField>
          <FormField label="Gender">
            <select
              value={form.gender}
              onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
              className={inputClassName(theme)}
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
              className={inputClassName(theme)}
            />
          </FormField>
          <FormField label="Date of birth">
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))}
              className={inputClassName(theme)}
            />
          </FormField>
          <FormField label="Address" className="md:col-span-2">
            <textarea
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              className={`${inputClassName(theme)} min-h-24 py-3`}
            />
          </FormField>
        </div>
        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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
            <PrimaryButton
              onClick={() => handleOpenPrescription(activePatient)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Open in Prescription
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
    </div>
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
      ? "bg-slate-950 text-white"
      : accent === "blue"
        ? "bg-[#2f78e8] text-white"
        : "bg-white text-slate-950";

  const bodyClass = accent === "light" ? "text-slate-600" : "text-white/75";
  const borderClass = accent === "light" ? "border border-slate-200/80" : "border border-transparent";

  return (
    <div className={`rounded-[20px] px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] ${cardClass} ${borderClass}`}>
      <p className={`text-[10px] font-medium uppercase tracking-[0.22em] ${accent === "light" ? "text-slate-500" : "text-white/65"}`}>
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{title}</p>
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
      className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition ${
        active
          ? "bg-sky-700 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50"
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
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] text-slate-600">
        {label}
      </span>
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
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] text-slate-600">
        {label}
      </span>
      <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-[15px] text-slate-800">
        {value}
      </div>
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
      return "bg-rose-50 text-rose-700";
    case "green":
      return "bg-emerald-50 text-emerald-700";
    case "amber":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function inputClassName(theme: "light" | "dark") {
  return `h-11 w-full rounded-xl px-3 text-[15px] outline-none transition ${
    theme === "dark"
      ? "border border-slate-800 bg-slate-900 text-slate-900 placeholder:text-slate-500 focus:border-sky-700 focus:bg-slate-900"
      : "border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
  }`;
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
