"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CalendarIcon,
  MedosPage,
  MetricCard,
  Modal,
  Panel,
  PanelHeader,
  PlusIcon,
  PrimaryButton,
} from "../_components/medos-ui";
import { createPatient } from "@/lib/workspace-data";
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
        router.push(
          `/prescriptions?patientId=${patient.id}&patientName=${encodeURIComponent(patient.label)}&visitReason=${encodeURIComponent(appointment.visitReason || "")}&appointmentId=${appointment.id}`
        );
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
    <MedosPage
      sectionNumber="02"
      sectionTitle="Queue Management"
      title={pageTitle}
      description={description}
      action={
        <PrimaryButton icon={<PlusIcon className="h-4 w-4" />} onClick={() => setIsIntakeModalOpen(true)} className="h-11 px-5">
          {actionLabel}
        </PrimaryButton>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total appointments" value={String(counts.total)} subtext={role === "doctor" ? "Assigned to you" : "Visible in workspace"} />
        <MetricCard label="Pending" value={String(counts.pending)} subtext="Awaiting confirmation" tone="red" />
        <MetricCard label="Confirmed" value={String(counts.confirmed)} subtext="Ready for visit" tone="green" />
        <MetricCard label="Completed" value={String(counts.completed)} subtext="Closed visits" tone="green" />
      </div>

      <Panel>
        <PanelHeader
          title="Appointment queue"
          subtitle={
            canEditQueue
              ? "Update status and urgency directly from your queue."
              : "Track appointment status from the queue."
          }
          right={<span className="med-label hidden sm:inline">{visibleAppointments.length} active visits</span>}
        />

        {loading ? (
          <p className="px-6 py-8 text-sm text-[color:var(--muted)]">Loading appointments...</p>
        ) : visibleAppointments.length ? (
          <div className="grid gap-4 px-5 py-5 lg:grid-cols-2">
            {visibleAppointments.map((appointment) => (
              <div key={appointment.id} className="med-surface-strong rounded-[26px] p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[1.45rem] font-bold tracking-[-0.04em] text-[color:var(--foreground-soft)]">
                        {appointment.patientName}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                        {appointment.visitReason || "No visit reason provided"}
                      </p>
                    </div>
                    <span className="med-chip med-chip--accent whitespace-nowrap">
                      {appointment.appointmentDate || "No time set"}
                    </span>
                  </div>

                  {role === "doctor" ? (
                    <PrimaryButton subtle onClick={() => handleSelectPatient(appointment)} className="h-10 self-start px-5">
                      Select patient
                    </PrimaryButton>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="med-label mb-2 block">Priority</span>
                      {canEditQueue ? (
                        <select
                          value={appointment.priority}
                          onChange={(event) =>
                            handlePatchAppointment(appointment, { priority: event.target.value })
                          }
                          className="med-select"
                        >
                          {priorities.map((priority) => (
                            <option key={priority} value={priority}>
                              {priority}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="med-input flex items-center">{appointment.priority}</div>
                      )}
                    </label>

                    <label className="block">
                      <span className="med-label mb-2 block">Status</span>
                      {canEditQueue ? (
                        <select
                          value={appointment.status}
                          onChange={(event) =>
                            handlePatchAppointment(appointment, { status: event.target.value })
                          }
                          className="med-select"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="med-input flex items-center">{appointment.status}</div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-6 py-8 text-sm text-[color:var(--muted)]">No appointments are assigned yet.</p>
        )}
      </Panel>

      <Modal
        open={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        title={role === "receptionist" ? "Create appointment" : "Appointment intake"}
        description={
          role === "receptionist"
            ? "Register a booking request and assign the visit time."
            : "Assign a patient, set urgency, and choose the appointment time."
        }
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
                className="med-input"
              />
              <datalist id="patient-options">
                {(workspace?.patients || []).map((patient) => (
                  <option key={patient.id} value={patient.label} />
                ))}
              </datalist>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-[color:var(--muted)]">Start typing to search registered patients.</p>
                {canCreatePatients ? (
                  <button
                    type="button"
                    onClick={() => setIsPatientModalOpen(true)}
                    className="text-xs font-semibold text-[color:var(--accent-strong)]"
                  >
                    Create new patient
                  </button>
                ) : null}
              </div>
            </div>
          </Field>

          <Field label="Visit reason">
            <textarea
              value={form.visitReason}
              onChange={(event) => setForm((current) => ({ ...current, visitReason: event.target.value }))}
              className="med-textarea"
              placeholder="Describe the visit reason"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Priority">
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                disabled={role === "receptionist"}
                className="med-select"
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
                    className="med-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => openNativeDateTimePicker(appointmentTimeRef.current)}
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] transition hover:border-[color:var(--border-strong)]"
                    aria-label="Open date and time picker"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-[color:var(--muted)]">Choose the visit date and time in 15-minute steps.</p>
              </div>
            </Field>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
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
              className="med-input"
            />
          </Field>
          <Field label="Gender">
            <select
              value={patientForm.gender}
              onChange={(event) => setPatientForm((current) => ({ ...current, gender: event.target.value }))}
              className="med-select"
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
              className="med-input"
            />
          </Field>
          <Field label="Date of birth">
            <div className="relative">
              <input
                type="date"
                value={patientForm.dateOfBirth}
                onChange={(event) => setPatientForm((current) => ({ ...current, dateOfBirth: event.target.value }))}
                className="med-input pr-12"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.querySelector('input[type="date"]') as HTMLInputElement;
                  if (input) input.showPicker();
                }}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] transition hover:border-[color:var(--border-strong)]"
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
              className="med-textarea"
            />
          </Field>
        </div>
        {patientError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
            {patientError}
          </div>
        ) : null}
      </Modal>
    </MedosPage>
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
      <span className="med-label mb-2 block">{label}</span>
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
