"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { DataPill, MedosPage, Panel } from "../_components/medos-ui";
import { useWorkspaceUser } from "../_components/user-session-context";
import { fetchSettingsData, type SettingsData } from "@/lib/workspace-data";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const { displayName, role, roleLabel } = useWorkspaceUser();
  const [data, setData] = useState<SettingsData | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    fetchSettingsData().then((result) => {
      if (active) {
        setData(result);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const isAdmin = role === "admin";

  return (
    <MedosPage
      sectionNumber="06"
      sectionTitle="Settings"
      title={isAdmin ? "Workspace settings" : "Account settings"}
      description={
        isAdmin
          ? "Manage workspace profile, AI behavior, subscription details, and session access."
          : "Review your access scope and manage your current session."
      }
    >
      <div className="grid max-w-5xl gap-6">
        <Panel className="bg-white/95">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-[15px] font-semibold text-slate-950">Access profile</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your visible pages and actions depend on the role attached to this account.
            </p>
          </div>
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
            <Field label="User" value={displayName} />
            <Field label="Role" value={roleLabel} />
            <Field
              label="Scope"
              value={getScopeLabel(role)}
            />
            <Field
              label="Workspace access"
              value={getAccessLabel(role)}
            />
          </div>
        </Panel>

        {isAdmin ? (
          <Panel className="bg-white/95">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-[15px] font-semibold text-slate-950">Hospital profile</h2>
            </div>
            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
              <Field label="Hospital name" value={data?.profile.hospitalName || ""} />
              <Field label="Contact email" value={data?.profile.contactEmail || ""} />
              <Field label="Phone" value={data?.profile.phone || ""} />
              <Field label="Address" value={data?.profile.address || ""} />
            </div>
          </Panel>
        ) : null}

        {isAdmin ? (
          <Panel className="bg-white/95">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-[15px] font-semibold text-slate-950">AI behavior</h2>
              <p className="mt-1 text-sm text-slate-500">
                Toggle state appears here when these settings are available.
              </p>
            </div>
            <div className="divide-y divide-slate-200">
              {(data?.behaviors || []).map((item) => (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-5 px-6 py-5"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-medium text-slate-950">{item.title}</p>
                      {item.enabled === null ? <DataPill>Unavailable</DataPill> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={Boolean(item.enabled)}
                    className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full shadow-inner ${
                      item.enabled ? "bg-sky-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                        item.enabled ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        ) : null}

        {isAdmin ? (
          <Panel className="bg-white/95">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-950">Subscription</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {data?.usageLabel || "No subscription usage record was found."}
                </p>
              </div>
            </div>
            {data?.plans.length ? (
              <div className="grid gap-4 px-6 py-5 md:grid-cols-3">
                {data.plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`rounded-2xl border p-4 shadow-sm ${
                      plan.active ? "border-sky-700 bg-sky-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-950">{plan.name}</h3>
                      {plan.active ? <DataPill tone="blue">Active</DataPill> : null}
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      {plan.price || "--"}
                    </p>
                    <div className="mt-4 space-y-1 text-sm text-slate-500">
                      <p>{plan.detail || "No doctor limit provided"}</p>
                      <p>{plan.usage || "No usage limit provided"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-6 py-8 text-sm text-slate-500">
                No subscription plans are available yet.
              </p>
            )}
          </Panel>
        ) : null}

        <Panel className="bg-white/95">
          <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-950">Session</h2>
              <p className="mt-1 text-sm text-slate-500">
                Sign out of the current workspace session.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Signing out..." : "Log out"}
            </button>
          </div>
        </Panel>
      </div>
    </MedosPage>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
        {label}
      </span>
      <input
        readOnly
        value={value}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[15px] text-slate-800 outline-none"
      />
    </label>
  );
}

function getScopeLabel(role: string | null) {
  switch (role) {
    case "admin":
      return "Full workspace control";
    case "doctor":
      return "Medical workflow access";
    case "nurse":
      return "Patient and appointment support";
    case "receptionist":
      return "Front desk scheduling access";
    default:
      return "Role assignment required";
  }
}

function getAccessLabel(role: string | null) {
  switch (role) {
    case "admin":
      return "Dashboard, patients, appointments, reports, prescriptions, settings";
    case "doctor":
      return "Dashboard, patients, appointments, reports, prescriptions, settings";
    case "nurse":
      return "Dashboard, patients, appointments, settings";
    case "receptionist":
      return "Dashboard, patients, appointments, settings";
    default:
      return "No workspace access is assigned yet";
  }
}
