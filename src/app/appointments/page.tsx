"use client";

import { useEffect, useMemo, useState } from "react";

import { MetricCard, MedosPage, Panel, PlusIcon, PrimaryButton } from "../_components/medos-ui";
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientId: "",
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
    if (!form.patientId || !form.visitReason || !form.appointmentDate) {
      setError("Patient, visit reason, and appointment time are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createAppointment({
        patient_id: form.patientId,
        doctor_id: role === "doctor" ? session.user.id : null,
        visit_reason: form.visitReason,
        priority: role === "receptionist" ? "Routine" : form.priority,
        status: "Pending",
        appointment_date: form.appointmentDate,
      });

      setForm({
        patientId: "",
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
    role === "receptionist" ? "Front desk queue" : role === "nurse" ? "Care queue" : "Doctor queue";

  return (
    <MedosPage
      sectionNumber="02"
      sectionTitle="Appointments"
      title={pageTitle}
      description={description}
      action={
        <PrimaryButton icon={<PlusIcon className="h-4 w-4" />}>
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
        <Panel className="bg-white/95">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-[15px] font-semibold text-slate-950">
              {role === "receptionist" ? "Create appointment" : "Appointment intake"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {role === "receptionist"
                ? "Register a booking request and assign the visit time."
                : "Assign a patient, set urgency, and choose the appointment time."}
            </p>
          </div>

          <div className="space-y-4 px-6 py-5">
            <Field label="Patient">
              <select
                value={form.patientId}
                onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none"
              >
                <option value="">Select patient</option>
                {(workspace?.patients || []).map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Visit reason">
              <textarea
                value={form.visitReason}
                onChange={(event) => setForm((current) => ({ ...current, visitReason: event.target.value }))}
                className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none"
                placeholder="Describe the visit reason"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Priority">
                <select
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                  disabled={role === "receptionist"}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none"
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Appointment time">
                <input
                  type="datetime-local"
                  value={form.appointmentDate}
                  onChange={(event) => setForm((current) => ({ ...current, appointmentDate: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none"
                />
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

        <Panel className="bg-white/95">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-[15px] font-semibold text-slate-950">Appointment queue</h2>
            <p className="mt-1 text-sm text-slate-500">
              {canEditQueue
                ? "Update status and urgency directly from your queue."
                : "Track appointment status from the queue."}
            </p>
          </div>

          {loading ? (
            <p className="px-6 py-8 text-sm text-slate-500">Loading appointments...</p>
          ) : workspace?.appointments.length ? (
            <div className="divide-y divide-slate-200">
              {workspace.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_140px_140px]"
                >
                  <div>
                    <p className="text-[16px] font-medium text-slate-950">
                      {appointment.patientName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {appointment.visitReason || "No visit reason provided"}
                    </p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                      {appointment.appointmentDate || "No appointment time"}
                    </p>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                      Priority
                    </span>
                    {canEditQueue ? (
                      <select
                        value={appointment.priority}
                        onChange={(event) =>
                          handlePatchAppointment(appointment, { priority: event.target.value })
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none"
                      >
                        {priorities.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                        {appointment.priority}
                      </div>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                      Status
                    </span>
                    {canEditQueue ? (
                      <select
                        value={appointment.status}
                        onChange={(event) =>
                          handlePatchAppointment(appointment, { status: event.target.value })
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                        {appointment.status}
                      </div>
                    )}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-6 py-8 text-sm text-slate-500">
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
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
