"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DataPill,
  MedosPage,
  Panel,
  PlusIcon,
  PrimaryButton,
  SearchIcon,
} from "../_components/medos-ui";
import { useWorkspaceUser } from "../_components/user-session-context";
import { fetchPatientsData, type PatientRecord } from "@/lib/workspace-data";

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [query, setQuery] = useState("");
  const { role } = useWorkspaceUser();

  useEffect(() => {
    let active = true;

    fetchPatientsData().then((result) => {
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

  return (
    <MedosPage
      sectionNumber="03"
      sectionTitle="Registry"
      title="Patients"
      description={description}
      action={
        canRegisterPatients ? (
          <PrimaryButton icon={<PlusIcon className="h-4 w-4" />}>New patient</PrimaryButton>
        ) : undefined
      }
    >
      <Panel className="bg-white/95">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="flex h-11 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-500">
              <SearchIcon className="h-4 w-4" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, ID, or phone..."
                className="flex-1 bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>
            <p className="px-1 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">
              {filteredPatients.length} of {patients.length}
            </p>
          </div>
        </div>

        {filteredPatients.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  {["ID", "Name", "Age", "Phone", "Last visit", "Status", ""].map((heading) => (
                    <th
                      key={heading || "actions"}
                      className="px-4 py-4 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500"
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
                    className="border-b border-slate-200 transition hover:bg-slate-50/70 last:border-b-0"
                  >
                    <td className="px-4 py-4 text-sm text-slate-500">{patient.id || "--"}</td>
                    <td className="px-4 py-4 text-[15px] font-medium text-slate-950">
                      {patient.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{patient.age || "--"}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{patient.phone || "--"}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {patient.lastVisit || "--"}
                    </td>
                    <td className="px-4 py-4">
                      <DataPill tone={patient.status.tone}>{patient.status.label}</DataPill>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        className="text-sm font-medium text-sky-700 transition hover:text-sky-800"
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
          <p className="px-6 py-8 text-sm text-slate-500">
            No patient records were found.
          </p>
        )}
      </Panel>
    </MedosPage>
  );
}
