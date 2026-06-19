"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  CalendarIcon,
  MetricCard,
  MedosPage,
  Panel,
  PlusIcon,
  PrimaryButton,
} from "../_components/medos-ui";
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
  const [workspace, setWorkspace] = useState<AppointmentWorkspaceData | null>(null);
  const { session, role } = useWorkspaceUser();
  const { theme } = useWorkspaceTheme();
  const appointmentTimeRef = useRef<HTMLInputElement | null>(null);
  const intakeSectionRef = useRef<HTMLDivElement | null>(null);
  const queueSectionRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientName: "",
    visitReason: "",
    priority: priorities[2],
    appointmentDate: "",
  });

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const currentUserId = session.user.id;
      const filterDoctorId = role === "doctor" ? currentUserId : null;
      const data = await fetchAppointmentWorkspaceData(filterDoctorId);

      if (!active) {
        return;
      }

      setWorkspace(data);
      setLoading(false);
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

  async function reloadAppointments() {
    const data = await fetchAppointmentWorkspaceData(role === "doctor" ? session.user.id : null);
    setWorkspace(data);
  }

  async function handleCreateAppointment() {
    const selectedPatient = (workspace?.patients || []).find(
      (patient) => patient.label.toLowerCase() === form.patientName.trim().toLowerCase()
    );

    if (!selectedPatient || !form.visitReason || !form.appointmentDate) {
      setError("Patient, visit reason, and appointment time are required.");
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

  const canCreateAppointments =
    role === "admin" || role === "doctor" || role === "nurse" || role === "receptionist";
  const canEditQueue = role === "admin" || role === "doctor" || role === "nurse";
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
  const actionTargetRef = canCreateAppointments ? intakeSectionRef : queueSectionRef;

  return (
    <MedosPage
      sectionNumber="02"
      sectionTitle="Appointments"
      title={pageTitle}
      description={description}
      action={
        <PrimaryButton
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={() => actionTargetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          {actionLabel}
        </PrimaryButton>
      }
    >
      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          label="Total appointments"
          value={String(counts.total)}
          subtext={role === "doctor" ? "Assigned to you" : "Visible in your workspace"}
        />
        <MetricCard label="Pending" value={String(counts.pending)} subtext="Awaiting confirmation" tone="red" />
        <MetricCard label="Confirmed" value={String(counts.confirmed)} subtext="Ready for visit" />
        <MetricCard label="Completed" value={String(counts.completed)} subtext="Closed visits" tone="green" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Panel>
          <div ref={intakeSectionRef} className={`px-6 py-5 ${theme === "dark" ? "border-b border-slate-800" : "border-b border-slate-200"}`}>
            <h2 className={`text-[15px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
              {role === "receptionist" ? "Create appointment" : "Appointment intake"}
            </h2>
            <p className={`mt-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              {role === "receptionist"
                ? "Register a booking request and assign the visit time."
                : "Assign a patient, set urgency, and choose the appointment time."}
            </p>
          </div>

          <div className="space-y-4 px-6 py-5">
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
                <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  Start typing to search registered patients.
                </p>
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
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      aria-label="Open date and time picker"
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
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

            {canCreateAppointments ? (
              <PrimaryButton onClick={handleCreateAppointment} disabled={saving}>
                {saving ? "Saving..." : "Create appointment"}
              </PrimaryButton>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <div ref={queueSectionRef} className={`px-6 py-5 ${theme === "dark" ? "border-b border-slate-800" : "border-b border-slate-200"}`}>
            <h2 className={`text-[15px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-950"}`}>Appointment queue</h2>
            <p className={`mt-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              {canEditQueue
                ? "Update status and urgency directly from your queue."
                : "Track appointment status from the queue."}
            </p>
          </div>

          {loading ? (
            <p className={`px-6 py-8 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Loading appointments...</p>
          ) : workspace?.appointments.length ? (
            <div className={theme === "dark" ? "divide-y divide-slate-800" : "divide-y divide-slate-200"}>
              {workspace.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_140px_140px]"
                >
                  <div>
                    <p className={`text-[16px] font-medium ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
                      {appointment.patientName}
                    </p>
                    <p className={`mt-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      {appointment.visitReason || "No visit reason provided"}
                    </p>
                    <p className={`mt-2 text-xs font-medium uppercase tracking-[0.24em] ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                      {appointment.appointmentDate || "No appointment time"}
                    </p>
                  </div>

                  <label className="block">
                    <span className={`mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      Priority
                    </span>
                    {canEditQueue ? (
                      <select
                        value={appointment.priority}
                        onChange={(event) =>
                          handlePatchAppointment(appointment, { priority: event.target.value })
                        }
                        className={inputClassName(theme)}
                      >
                        {priorities.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className={`${inputClassName(theme)} flex items-center`}>
                        {appointment.priority}
                      </div>
                    )}
                  </label>

                  <label className="block">
                    <span className={`mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      Status
                    </span>
                    {canEditQueue ? (
                      <select
                        value={appointment.status}
                        onChange={(event) =>
                          handlePatchAppointment(appointment, { status: event.target.value })
                        }
                        className={inputClassName(theme)}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className={`${inputClassName(theme)} flex items-center`}>
                        {appointment.status}
                      </div>
                    )}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <p className={`px-6 py-8 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              No appointments are assigned yet.
            </p>
          )}
        </Panel>
      </div>
    </MedosPage>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { theme } = useWorkspaceTheme();
  return (
    <label className="block">
      <span className={`mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
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
      ? "border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-sky-700 focus:bg-slate-900"
      : "border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
  }`;
}
