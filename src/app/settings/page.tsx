"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ButtonFx, buttonClassName } from "../_components/medos-ui";
import { useWorkspaceTheme } from "../_components/workspace-theme-context";
import { useWorkspaceUser } from "../_components/user-session-context";
import {
  fetchSettingsData,
  signOutWorkspaceUser,
  type SettingsData,
} from "@/lib/workspace-data";

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
    await signOutWorkspaceUser();
    router.replace("/login");
  }

  const accessScope = getScopeLabel(role);
  const loginStamp = useMemo(() => formatLastLogin(), []);
  const loginLocation = data?.profile.address || "Clinical workspace access";
  const privacyNote = role === "admin"
    ? "Your access includes workspace controls. Administrative actions are logged and audited in real-time for compliance."
    : "You are accessing HIPAA-regulated data. All actions are logged and audited in real-time to ensure compliance.";

  return (
    <div className="mx-auto max-w-[980px] space-y-5">
      <section className="rounded-[24px] border border-slate-200/80 bg-white px-6 py-5 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
        <h1 className="text-[30px] font-semibold tracking-tight text-slate-950">Account settings</h1>
        <p className="mt-2 text-[15px] leading-7 text-slate-600">
          Review your access scope and manage your current session for the clinical workflow.
        </p>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-[18px] font-semibold tracking-tight text-slate-950">Access profile</h2>
          <p className="mt-1 text-sm text-slate-600">
            Your visible pages and actions depend on the role attached to this account.
          </p>
        </div>

        <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
          <Field label="User" value={displayName} />
          <Field label="Role" value={roleLabel} />
          <Field label="Scope" value={accessScope} />
          <ThemeField theme={theme} onChange={setTheme} />
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200/80 bg-white px-6 py-5 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-slate-950">Session</h2>
            <p className="mt-1 text-sm text-slate-600">
              Sign out of the current workspace session on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? "Signing out..." : "Log out"}
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative overflow-hidden rounded-[20px] border border-slate-200/80 bg-[#dfe7ff] px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="absolute bottom-0 right-4 h-24 w-24 rounded-full border border-white/30 bg-white/10" />
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-sky-700">Patient Privacy Notice</p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">Patient Privacy Notice</p>
          <p className="mt-2 max-w-[52ch] text-sm leading-6 text-slate-700">{privacyNote}</p>
          <button
            type="button"
            className="mt-4 text-sm font-medium text-sky-700 transition hover:text-sky-800"
          >
            View Security Protocols →
          </button>
        </div>

        <div className="rounded-[20px] border border-slate-200/80 bg-white px-5 py-5 text-center shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <span className="text-base">◔</span>
          </div>
          <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">Last Login</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{loginStamp}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{loginLocation}</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
        {label}
      </span>
      <input
        readOnly
        value={value}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[15px] text-slate-800 outline-none"
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
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
        Background theme
      </span>
      <div className="grid gap-2 sm:grid-cols-2">
        <ThemeOption
          label="White Background"
          swatchClassName="bg-white"
          active={theme === "light"}
          theme={theme}
          onClick={() => onChange("light")}
        />
        <ThemeOption
          label="Dark mode"
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
      className={`${buttonClassName({ subtle: true, fullWidth: true })} h-12 justify-start px-3 shadow-none ${
        active
          ? theme === "dark"
            ? "border-sky-800 bg-sky-950/40 text-sky-900 ring-1 ring-sky-900/70"
            : "border-sky-500 bg-white text-sky-900 ring-2 ring-sky-500/20"
          : "border-slate-200 bg-white text-slate-700"
      }`}
      aria-pressed={active}
    >
      <ButtonFx />
      <span className="relative z-10 flex items-center gap-3">
        <span className={`h-4 w-4 rounded-full border border-slate-300 ${swatchClassName}`} />
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

function formatLastLogin() {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}
