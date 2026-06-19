"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Modal,
  DataPill,
  MedosPage,
  Panel,
  PlusIcon,
  PrimaryButton,
  SearchIcon,
} from "../_components/medos-ui";
import { useWorkspaceTheme } from "../_components/workspace-theme-context";
import { useWorkspaceUser } from "../_components/user-session-context";
import { createPatient, fetchPatientsData, type PatientRecord } from "@/lib/workspace-data";

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    phone: "",
    dateOfBirth: "",
    address: "",
  });
  const { role } = useWorkspaceUser();
  const { theme } = useWorkspaceTheme();

  useEffect(() => {
    let active = true;

    loadPatients().then((result) => {
      if (active) {
        setPatients(result);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return patients;
    }

    return patients.filter((patient) =>
      [patient.id, patient.name, patient.phone].filter(Boolean).join(" ").toLowerCase().includes(term)
    );
  }, [patients, query]);

  const canRegisterPatients = role === "admin" || role === "nurse" || role === "receptionist";
  const description =
    role === "doctor"
      ? "Search and review patient records during consultations."
      : role === "nurse"
        ? "Register patients and maintain current patient records."
        : role === "receptionist"
          ? "Register new patients and check patient details before scheduling."
          : "Manage patient records across the hospital workspace.";

  async function loadPatients() {
    const result = await fetchPatientsData();
    setPatients(result);
    return result;
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
      sectionTitle="Registry"
      title="Patients"
      description={description}
      action={
        canRegisterPatients ? (
          <PrimaryButton icon={<PlusIcon className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
            New patient
          </PrimaryButton>
        ) : undefined
      }
    >
      <Panel>
        <div className={`px-4 py-4 ${theme === "dark" ? "border-b border-slate-800" : "border-b border-slate-200"}`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label
              className={`flex h-11 flex-1 items-center gap-3 rounded-xl px-3 ${
                theme === "dark"
                  ? "border border-slate-800 bg-slate-900 text-slate-400"
                  : "border border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              <SearchIcon className="h-4 w-4" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, ID, or phone..."
                className={`flex-1 bg-transparent text-[15px] outline-none ${
                  theme === "dark"
                    ? "text-slate-100 placeholder:text-slate-500"
                    : "text-slate-800 placeholder:text-slate-400"
                }`}
              />
            </label>
            <p className={`px-1 text-[11px] font-medium uppercase tracking-[0.24em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              {filteredPatients.length} of {patients.length}
            </p>
          </div>
        </div>

        {filteredPatients.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className={`text-left ${theme === "dark" ? "border-b border-slate-800" : "border-b border-slate-200"}`}>
                  {["ID", "Name", "Age", "Phone", "Last visit", "Status", ""].map((heading) => (
                    <th
                      key={heading || "actions"}
                      className={`px-4 py-4 text-[10px] font-medium uppercase tracking-[0.28em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr
                    key={`${patient.id}-${patient.name}`}
                    className={`transition last:border-b-0 ${
                      theme === "dark"
                        ? "border-b border-slate-800 hover:bg-slate-900/80"
                        : "border-b border-slate-200 hover:bg-slate-50/70"
                    }`}
                  >
                    <td className={`px-4 py-4 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      {patient.id || "--"}
                    </td>
                    <td className={`px-4 py-4 text-[15px] font-medium ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
                      {patient.name}
                    </td>
                    <td className={`px-4 py-4 text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>{patient.age || "--"}</td>
                    <td className={`px-4 py-4 text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>{patient.phone || "--"}</td>
                    <td className={`px-4 py-4 text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                      {patient.lastVisit || "--"}
                    </td>
                    <td className="px-4 py-4">
                      <DataPill tone={patient.status.tone}>{patient.status.label}</DataPill>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <PrimaryButton subtle onClick={() => setSelectedPatient(patient)}>
                        Open
                      </PrimaryButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`px-6 py-8 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            No patient records were found.
          </p>
        )}
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
          <FormField label="Full name" theme={theme}>
            <input
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              className={inputClassName(theme)}
            />
          </FormField>
          <FormField label="Gender" theme={theme}>
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
          <FormField label="Phone" theme={theme}>
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className={inputClassName(theme)}
            />
          </FormField>
          <FormField label="Date of birth" theme={theme}>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))}
              className={inputClassName(theme)}
            />
          </FormField>
          <FormField label="Address" theme={theme} className="md:col-span-2">
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
        open={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
        title={selectedPatient?.name || "Patient details"}
        description="Patient record details currently available in the workspace."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ReadField label="Patient ID" value={selectedPatient?.id || "--"} theme={theme} />
          <ReadField label="Status" value={selectedPatient?.status.label || "--"} theme={theme} />
          <ReadField label="Age / gender" value={selectedPatient?.age || "--"} theme={theme} />
          <ReadField label="Phone" value={selectedPatient?.phone || "--"} theme={theme} />
          <ReadField label="Last visit" value={selectedPatient?.lastVisit || "--"} theme={theme} className="md:col-span-2" />
        </div>
      </Modal>
    </MedosPage>
  );
}

function FormField({
  label,
  children,
  theme,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  theme: "light" | "dark";
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={`mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </span>
      {children}
    </label>
  );
}

function ReadField({
  label,
  value,
  theme,
  className = "",
}: {
  label: string;
  value: string;
  theme: "light" | "dark";
  className?: string;
}) {
  return (
    <div className={className}>
      <span className={`mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </span>
      <div className={`${inputClassName(theme)} flex items-center`}>
        {value}
      </div>
    </div>
  );
}

function inputClassName(theme: "light" | "dark") {
  return `h-11 w-full rounded-xl px-3 text-[15px] outline-none transition ${
    theme === "dark"
      ? "border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-sky-700 focus:bg-slate-900"
      : "border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
  }`;
}
