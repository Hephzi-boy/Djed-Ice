"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ButtonFx, DataPill, MedosPage, Panel, buttonClassName } from "../_components/medos-ui";
import { useWorkspaceTheme } from "../_components/workspace-theme-context";
import { useWorkspaceUser } from "../_components/user-session-context";
import { fetchSettingsData, type SettingsData } from "@/lib/workspace-data";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const { displayName, role, roleLabel } = useWorkspaceUser();
  const { theme, setTheme } = useWorkspaceTheme();
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
        <Panel>
          <div className={`px-6 py-5 ${theme === "dark" ? "border-b border-slate-800" : "border-b border-slate-200"}`}>
            <h2 className={`text-[15px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-950"}`}>Access profile</h2>
            <p className={`mt-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
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
            <ThemeField theme={theme} onChange={setTheme} />
          </div>
        </Panel>

        {isAdmin ? (
          <Panel>
            <div className={`px-6 py-5 ${theme === "dark" ? "border-b border-slate-800" : "border-b border-slate-200"}`}>
              <h2 className={`text-[15px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-950"}`}>Hospital profile</h2>
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
          <Panel>
            <div className={`px-6 py-5 ${theme === "dark" ? "border-b border-slate-800" : "border-b border-slate-200"}`}>
              <h2 className={`text-[15px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-950"}`}>AI behavior</h2>
              <p className={`mt-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                Toggle state appears here when these settings are available.
              </p>
            </div>
            <div className={theme === "dark" ? "divide-y divide-slate-800" : "divide-y divide-slate-200"}>
              {(data?.behaviors || []).map((item) => (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-5 px-6 py-5"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-[15px] font-medium ${theme === "dark" ? "text-white" : "text-slate-950"}`}>{item.title}</p>
                      {item.enabled === null ? <DataPill>Unavailable</DataPill> : null}
                    </div>
                    <p className={`mt-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{item.detail}</p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={Boolean(item.enabled)}
                    className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full shadow-inner ${
                      item.enabled ? "bg-sky-600" : theme === "dark" ? "bg-slate-700" : "bg-slate-300"
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
          <Panel>
            <div className={`flex items-start justify-between gap-4 px-6 py-5 ${theme === "dark" ? "border-b border-slate-800" : "border-b border-slate-200"}`}>
              <div>
                <h2 className={`text-[15px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-950"}`}>Subscription</h2>
                <p className={`mt-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
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
                    plan.active
                      ? theme === "dark"
                        ? "border-sky-800 bg-sky-950/40"
                        : "border-sky-700 bg-sky-50"
                      : theme === "dark"
                        ? "border-slate-800 bg-slate-900"
                        : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-slate-950"}`}>{plan.name}</h3>
                    {plan.active ? <DataPill tone="blue">Active</DataPill> : null}
                  </div>
                  <p className={`mt-3 text-3xl font-semibold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
                    {plan.price || "--"}
                  </p>
                  <div className={`mt-4 space-y-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    <p>{plan.detail || "No doctor limit provided"}</p>
                    <p>{plan.usage || "No usage limit provided"}</p>
                  </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`px-6 py-8 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                No subscription plans are available yet.
              </p>
            )}
          </Panel>
        ) : null}

        <Panel>
          <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className={`text-[15px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-950"}`}>Session</h2>
              <p className={`mt-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
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
  const { theme } = useWorkspaceTheme();
  return (
    <label className="block">
      <span className={`mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </span>
      <input
        readOnly
        value={value}
        className={`h-11 w-full rounded-xl px-3 text-[15px] outline-none ${
          theme === "dark"
            ? "border border-slate-800 bg-slate-900 text-slate-100"
            : "border border-slate-200 bg-slate-50 text-slate-800"
        }`}
      />
    </label>
  );
}

function ThemeField({
  theme,
  onChange,
}: {
  theme: "light" | "dark";
  onChange: (theme: "light" | "dark") => void;
}) {
  return (
    <div className="block">
      <span className={`mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
        Background theme
      </span>
      <div className="grid grid-cols-2 gap-2">
        <ThemeOption
          label="White background"
          swatchClassName="bg-white"
          active={theme === "light"}
          theme={theme}
          onClick={() => onChange("light")}
        />
        <ThemeOption
          label="Black background"
          swatchClassName="bg-slate-950"
          active={theme === "dark"}
          theme={theme}
          onClick={() => onChange("dark")}
        />
      </div>
    </div>
  );
}

function ThemeOption({
  label,
  swatchClassName,
  active,
  theme,
  onClick,
}: {
  label: string;
  swatchClassName: string;
  active: boolean;
  theme: "light" | "dark";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${buttonClassName({ subtle: true, fullWidth: true })} h-auto min-h-11 justify-start px-3 py-3 shadow-none ${
        active
          ? theme === "dark"
            ? "border-sky-800 bg-sky-950/40 text-sky-100 ring-1 ring-sky-900/70"
            : "border-sky-200 bg-sky-50 text-sky-900 ring-1 ring-sky-100"
          : theme === "dark"
            ? "border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700 hover:bg-slate-800"
            : ""
      }`}
      aria-pressed={active}
    >
      <ButtonFx />
      <span className="relative z-10 flex items-center gap-3">
        <span
          className={`h-5 w-5 rounded-full border border-slate-300 shadow-sm ${swatchClassName}`}
        />
        <span className="text-sm font-medium">{label}</span>
      </span>
    </button>
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
