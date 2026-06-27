"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ButtonFx, MedosPage, PrimaryButton, buttonClassName } from "../_components/medos-ui";
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
  const privacyNote =
    role === "admin"
      ? "Your access includes workspace controls. Administrative actions are logged and audited in real time for compliance."
      : "You are accessing sensitive patient data. All actions are logged and audited in real time to ensure compliance.";

  return (
    <MedosPage
      sectionNumber="06"
      sectionTitle="Access and Theme"
      title="Account settings"
      description="Review your access scope, switch workspace appearance, and manage the current secure session."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_320px]">
        <div className="space-y-5">
          <section className="med-surface rounded-[28px] overflow-hidden">
            <div className="border-b border-[color:var(--border-subtle)] px-6 py-5">
              <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[color:var(--foreground-soft)]">Access profile</h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
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

          <section className="med-hero rounded-[28px] px-6 py-5">
            <p className="med-kicker">Patient privacy notice</p>
            <p className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[color:var(--foreground-soft)]">Security stays visible</p>
            <p className="mt-3 max-w-[56ch] text-sm leading-7 text-[color:var(--muted)]">{privacyNote}</p>
            <button type="button" className="mt-4 text-sm font-semibold text-[color:var(--accent-strong)]">
              View security protocols
            </button>
          </section>
        </div>

        <div className="space-y-5">
          <section className="med-surface rounded-[28px] px-6 py-5">
            <p className="med-label">Last login</p>
            <p className="mt-3 text-xl font-bold tracking-[-0.04em] text-[color:var(--foreground-soft)]">{loginStamp}</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{loginLocation}</p>
          </section>

          <section className="med-surface rounded-[28px] px-6 py-5">
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[color:var(--foreground-soft)]">Session</h2>
            <p className="mt-1 text-sm leading-7 text-[color:var(--muted)]">
              Sign out of the current workspace session on this device.
            </p>
            <PrimaryButton onClick={handleLogout} disabled={loggingOut} className="mt-5 h-11 w-full bg-[linear-gradient(135deg,#fb7185,#dc2626)] border-0">
              {loggingOut ? "Signing out..." : "Log out"}
            </PrimaryButton>
          </section>
        </div>
      </div>
    </MedosPage>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="med-label mb-2 block">{label}</span>
      <input readOnly value={value} className="med-input" />
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
      <span className="med-label mb-2 block">Background theme</span>
      <div className="grid gap-2 sm:grid-cols-2">
        <ThemeOption
          label="Airy light"
          swatchClassName="bg-white"
          active={theme === "light"}
          onClick={() => onChange("light")}
        />
        <ThemeOption
          label="Deep night"
          swatchClassName="bg-slate-950"
          active={theme === "dark"}
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
  onClick,
}: {
  label: string;
  swatchClassName: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${buttonClassName({ subtle: true, fullWidth: true })} h-12 justify-start px-3 shadow-none ${
        active ? "border-[color:var(--border-strong)] bg-[color:var(--surface-strong)]" : ""
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
