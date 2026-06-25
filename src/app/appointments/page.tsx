"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CalendarIcon,
  Modal,
  Panel,
  PlusIcon,
  PrimaryButton,
} from "../_components/medos-ui";
import { createPatient } from "@/lib/workspace-data";
import { useWorkspaceTheme } from "../_components/workspace-theme-context";
import { useWorkspaceUser } from "../_components/user-session-context";
import {
  createAppointment,
  fetchAppointmentWorkspaceData,
  type AppointmentRecord,
  type AppointmentWorkspaceData,
  updateAppointment,
} from "@/lib/workspace-data";

const priorities = ["Emergency", "Urgent", "Routine"];
const statuses = ["Pending", "Confirmed", "Completed", "Cancelled"];

export default function AppointmentsPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<AppointmentWorkspaceData | null>(null);
  const { session, role } = useWorkspaceUser();
  const { theme } = useWorkspaceTheme();
  const appointmentTimeRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientSaving, setPatientSaving] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [patientForm, setPatientForm] = useState({
    fullName: "",
    gender: "",
    phone: "",
    dateOfBirth: "",
    address: "",
  });
  const [form, setForm] = useState({
    patientName: "",
    visitReason: "",
    priority: priorities[2],
    appointmentDate: "",
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const currentUserId = session.user.id;
        const filterDoctorId = role === "doctor" ? currentUserId : null;
        const data = await fetchAppointmentWorkspaceData(filterDoctorId);

        if (!active) {
          return;
        }

        setWorkspace(data);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [role, session.user.id]);

  const counts = useMemo(() => {
    const appointments = workspace?.appointments || [];
    return {
      total: appointments.length,
      pending: appointments.filter((item) => item.status === "Pending").length,
      confirmed: appointments.filter((item) => item.status === "Confirmed").length,
      completed: appointments.filter((item) => item.status === "Completed").length,
    };
  }, [workspace]);

  const visibleAppointments = useMemo(() => {
    const appointments = workspace?.appointments || [];
    return appointments.filter((item) => item.checkup_status !== "completed");
  }, [workspace]);

  async function reloadAppointments() {
    const data = await fetchAppointmentWorkspaceData(role === "doctor" ? session.user.id : null);
    setWorkspace(data);
  }

  async function handleCreateAppointment() {
    const selectedPatient = (workspace?.patients || []).find(
      (patient) => patient.label.toLowerCase() === form.patientName.trim().toLowerCase()
    );

    if (!form.patientName.trim()) {
      setError("Patient name is required.");
      return;
    }

    if (!selectedPatient) {
      setError("Patient name must match a registered patient in the system.");
      return;
    }

    if (!form.visitReason.trim()) {
      setError("Visit reason is required.");
      return;
    }

    if (!form.appointmentDate) {
      setError("Appointment time is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createAppointment({
        patient_id: selectedPatient.id,
        doctor_id: role === "doctor" ? session.user.id : null,
        visit_reason: form.visitReason,
        priority: role === "receptionist" ? "Routine" : form.priority,
        status: "Pending",
        appointment_date: form.appointmentDate,
      });

      setForm({
        patientName: "",
        visitReason: "",
        priority: priorities[2],
        appointmentDate: "",
      });
      setIsIntakeModalOpen(false);
      await reloadAppointments();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create appointment.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePatchAppointment(
    appointment: AppointmentRecord,
    patch: Partial<{ priority: string; status: string }>
  ) {
    try {
      await updateAppointment(appointment.id, patch);
      await reloadAppointments();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update appointment.");
    }
  }

  function handleSelectPatient(appointment: AppointmentRecord) {
    if (role === "doctor") {
      const patient = workspace?.patients.find((p) => p.id === appointment.patientId);
      if (patient) {
        router.push(`/prescriptions?patientId=${patient.id}&patientName=${encodeURIComponent(patient.label)}&visitReason=${encodeURIComponent(appointment.visitReason || "")}&appointmentId=${appointment.id}`);
      }
    }
  }

  async function handleCreatePatient() {
    if (!patientForm.fullName.trim()) {
      setPatientError("Full name is required.");
      return;
    }

    setPatientSaving(true);
    setPatientError(null);

    try {
      const newPatient = await createPatient({
        full_name: patientForm.fullName.trim(),
        gender: patientForm.gender || null,
        phone: patientForm.phone || null,
        date_of_birth: patientForm.dateOfBirth || null,
        address: patientForm.address || null,
      });

      await reloadAppointments();

      if (newPatient && (role === "nurse" || role === "admin" || role === "receptionist")) {
        console.log("AI auto-fetching medications and prescriptions for patient:", newPatient.id);
      }

      setForm((current) => ({ ...current, patientName: patientForm.fullName.trim() }));

      setIsPatientModalOpen(false);
      setPatientForm({
        fullName: "",
        gender: "",
        phone: "",
        dateOfBirth: "",
        address: "",
      });
    } catch (createError) {
      setPatientError(createError instanceof Error ? createError.message : "Could not create patient.");
    } finally {
      setPatientSaving(false);
    }
  }

  const canEditQueue = role === "admin" || role === "doctor" || role === "nurse";
  const canCreatePatients = role === "admin" || role === "nurse" || role === "receptionist";
  const pageTitle =
    role === "doctor"
      ? "Manage appointments"
      : role === "nurse"
        ? "Coordinate appointments"
        : role === "receptionist"
          ? "Book appointments"
          : "Appointment operations";
  const description =
    role === "doctor"
      ? "Schedule visits, adjust urgency, and keep your appointment queue moving."
      : role === "nurse"
        ? "Support scheduling, queue changes, and appointment follow-through."
        : role === "receptionist"
          ? "Create appointments and track status from the front desk."
          : "Oversee appointments across the workspace.";
  const actionLabel =
    role === "receptionist" ? "New booking" : role === "nurse" ? "Open intake" : "Open intake";

  return (
    <div className="mx-auto max-w-[1220px] space-y-5">
      <section className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_12px_34px_rgba(15,23,42,0.06)] sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[30px] font-semibold tracking-tight text-slate-950">{pageTitle}</h1>
            <p className="mt-2 text-[15px] leading-7 text-slate-600">{description}</p>
          </div>
          <PrimaryButton
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setIsIntakeModalOpen(true)}
            className="h-10 self-start px-5 text-sm"
          >
            {actionLabel}
          </PrimaryButton>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AppointmentMetricTile
          label="Total appointments"
          value={String(counts.total)}
          subtext={role === "doctor" ? "Assigned to you" : "Visible in your workspace"}
        />
        <AppointmentMetricTile label="Pending" value={String(counts.pending)} subtext="Awaiting confirmation" tone="red" />
        <AppointmentMetricTile label="Confirmed" value={String(counts.confirmed)} subtext="Ready for visit" tone="green" />
        <AppointmentMetricTile label="Completed" value={String(counts.completed)} subtext="Closed visits" tone="green" />
      </div>

      <Panel className="border-slate-200/80 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-[22px] font-semibold tracking-tight text-slate-950">Appointment queue</h2>
          <p className="mt-1 text-sm text-slate-600">
            {canEditQueue
              ? "Update status and urgency directly from your queue."
              : "Track appointment status from the queue."}
          </p>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-sm text-slate-600">Loading appointments...</p>
        ) : visibleAppointments.length ? (
          <div className="divide-y divide-slate-200">
            {visibleAppointments.map((appointment) => (
              <div key={appointment.id} className="px-6 py-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[28px] font-semibold tracking-tight text-slate-950">
                      {appointment.patientName}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {appointment.visitReason || "No visit reason provided"}
                    </p>
                    <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                      {appointment.appointmentDate || "No appointment time"}
                    </p>
                  </div>

                  {role === "doctor" ? (
                    <PrimaryButton
                      subtle
                      onClick={() => handleSelectPatient(appointment)}
                      className="h-10 self-start border-sky-700 bg-white px-5 text-sky-700 hover:bg-sky-50"
                    >
                      Select Patient
                    </PrimaryButton>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-4 md:max-w-[520px] md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.22em] text-slate-600">
                      Priority
                    </span>
                    {canEditQueue ? (
                      <select
                        value={appointment.priority}
                        onChange={(event) =>
                          handlePatchAppointment(appointment, { priority: event.target.value })
                        }
                        className={queueInputClassName(theme)}
                      >
                        {priorities.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className={`${queueInputClassName(theme)} flex items-center`}>
                        {appointment.priority}
                      </div>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.22em] text-slate-600">
                      Status
                    </span>
                    {canEditQueue ? (
                      <select
                        value={appointment.status}
                        onChange={(event) =>
                          handlePatchAppointment(appointment, { status: event.target.value })
                        }
                        className={queueInputClassName(theme)}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className={`${queueInputClassName(theme)} flex items-center`}>
                        {appointment.status}
                      </div>
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`px-6 py-8 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            No appointments are assigned yet.
          </p>
        )}
      </Panel>

      <Modal
        open={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        title={role === "receptionist" ? "Create appointment" : "Appointment intake"}
        description={role === "receptionist"
          ? "Register a booking request and assign the visit time."
          : "Assign a patient, set urgency, and choose the appointment time."}
        footer={
          <>
            <PrimaryButton subtle onClick={() => setIsIntakeModalOpen(false)}>
              Cancel
            </PrimaryButton>
            <PrimaryButton onClick={handleCreateAppointment} disabled={saving}>
              {saving ? "Saving..." : "Create appointment"}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Patient">
            <div className="space-y-2">
              <input
                list="patient-options"
                value={form.patientName}
                onChange={(event) => setForm((current) => ({ ...current, patientName: event.target.value }))}
                placeholder="Type patient name"
                className={inputClassName(theme)}
              />
              <datalist id="patient-options">
                {(workspace?.patients || []).map((patient) => (
                  <option key={patient.id} value={patient.label} />
                ))}
              </datalist>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Start typing to search registered patients.
                </p>
                {canCreatePatients ? (
                  <button
                    type="button"
                    onClick={() => setIsPatientModalOpen(true)}
                    className="text-xs font-medium text-sky-700 hover:text-sky-800"
                  >
                    + Create new patient
                  </button>
                ) : null}
              </div>
            </div>
          </Field>

          <Field label="Visit reason">
            <textarea
              value={form.visitReason}
              onChange={(event) => setForm((current) => ({ ...current, visitReason: event.target.value }))}
              className={`${inputClassName(theme)} min-h-24 py-3`}
              placeholder="Describe the visit reason"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Priority">
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                disabled={role === "receptionist"}
                className={inputClassName(theme)}
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Appointment time">
              <div className="space-y-2">
                <div className="relative">
                  <input
                    ref={appointmentTimeRef}
                    type="datetime-local"
                    value={form.appointmentDate}
                    min={getMinDateTimeValue()}
                    step={900}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, appointmentDate: event.target.value }))
                    }
                    className={`${inputClassName(theme)} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => openNativeDateTimePicker(appointmentTimeRef.current)}
                    className={`absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border shadow-none transition ${
                      theme === "dark"
                        ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    aria-label="Open date and time picker"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  Choose the visit date and time in 15-minute steps.
                </p>
              </div>
            </Field>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false);
          setPatientError(null);
        }}
        title="Register new patient"
        description="Quickly add a patient for urgent cases requiring immediate attention."
        footer={
          <>
            <PrimaryButton subtle onClick={() => setIsPatientModalOpen(false)}>
              Cancel
            </PrimaryButton>
            <PrimaryButton onClick={handleCreatePatient} disabled={patientSaving}>
              {patientSaving ? "Saving..." : "Create patient"}
            </PrimaryButton>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name">
            <input
              value={patientForm.fullName}
              onChange={(event) => setPatientForm((current) => ({ ...current, fullName: event.target.value }))}
              className={inputClassName(theme)}
            />
          </Field>
          <Field label="Gender">
            <select
              value={patientForm.gender}
              onChange={(event) => setPatientForm((current) => ({ ...current, gender: event.target.value }))}
              className={inputClassName(theme)}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </Field>
          <Field label="Phone">
            <input
              value={patientForm.phone}
              onChange={(event) => setPatientForm((current) => ({ ...current, phone: event.target.value }))}
              className={inputClassName(theme)}
            />
          </Field>
          <Field label="Date of birth">
            <div className="relative">
              <input
                type="date"
                value={patientForm.dateOfBirth}
                onChange={(event) => setPatientForm((current) => ({ ...current, dateOfBirth: event.target.value }))}
                className={`${inputClassName(theme)} pr-12`}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.querySelector('input[type="date"]') as HTMLInputElement;
                  if (input) input.showPicker();
                }}
                className={`absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border shadow-none transition ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
                aria-label="Open date picker"
              >
                <CalendarIcon className="h-4 w-4" />
              </button>
            </div>
          </Field>
          <Field label="Address" className="md:col-span-2">
            <textarea
              value={patientForm.address}
              onChange={(event) => setPatientForm((current) => ({ ...current, address: event.target.value }))}
              className={`${inputClassName(theme)} min-h-24 py-3`}
            />
          </Field>
        </div>
        {patientError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {patientError}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function AppointmentMetricTile({
  label,
  value,
  subtext,
  tone = "slate",
}: {
  label: string;
  value: string;
  subtext: string;
  tone?: "slate" | "red" | "green";
}) {
  const toneClass =
    tone === "red"
      ? "bg-rose-500"
      : tone === "green"
        ? "bg-emerald-500"
        : "bg-sky-600";
  const valueClass =
    tone === "red" ? "text-rose-600" : tone === "green" ? "text-emerald-600" : "text-slate-950";

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className={`h-1 ${toneClass}`} />
      <div className="space-y-3 px-5 py-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
          {label}
        </p>
        <p className={`text-4xl font-semibold tracking-tight ${valueClass}`}>{value}</p>
        <p className="max-w-[14ch] text-sm leading-5 text-slate-600">{subtext}</p>
      </div>
    </div>
  );
}

function Field({
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

function getMinDateTimeValue() {
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);

  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  const hours = `${now.getHours()}`.padStart(2, "0");
  const minutes = `${now.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function openNativeDateTimePicker(input: HTMLInputElement | null) {
  if (!input) {
    return;
  }

  const pickerInput = input as HTMLInputElement & {
    showPicker?: () => void;
  };

  if (typeof pickerInput.showPicker === "function") {
    pickerInput.showPicker();
    return;
  }

  pickerInput.focus();
}

function inputClassName(theme: "light" | "dark") {
  return `h-11 w-full rounded-xl px-3 text-sm outline-none transition ${
    theme === "dark"
      ? "border border-slate-800 bg-slate-900 text-slate-900 placeholder:text-slate-500 focus:border-sky-700 focus:bg-slate-900"
      : "border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
  }`;
}

function queueInputClassName(theme: "light" | "dark") {
  return `h-11 w-full rounded-lg px-3 text-sm outline-none transition ${
    theme === "dark"
      ? "border border-slate-800 bg-slate-900 text-slate-900 placeholder:text-slate-500 focus:border-sky-700 focus:bg-slate-900"
      : "border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
  }`;
}
