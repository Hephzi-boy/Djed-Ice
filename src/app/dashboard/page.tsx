"use client";

import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ButtonFx,
  Modal,
  Panel,
  PatientsIcon,
  PrimaryButton,
  QueueIcon,
  ReportIcon,
  SettingsIcon,
  buttonClassName,
} from "../_components/medos-ui";
import { useWorkspaceTheme } from "../_components/workspace-theme-context";
import { useWorkspaceUser } from "../_components/user-session-context";
import { fetchDashboardData, type DashboardData } from "@/lib/workspace-data";
import type { UserRole } from "@/lib/roles";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedAction, setSelectedAction] = useState<RoleAction | null>(null);
  const { role, displayName } = useWorkspaceUser();
  const { theme } = useWorkspaceTheme();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    fetchDashboardData().then((result) => {
      if (active) {
        setData(result);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const view = getDashboardView(role, displayName, data?.workspaceName);
  const metrics = data?.metrics.filter((metric) => view.metricLabels.includes(metric.label)) || [];
  const canOpenReports = role === "admin" || role === "doctor";
  const actions = useMemo(() => getRoleActions(role), [role]);

  return (
    <div className="mx-auto max-w-[1220px] space-y-5">
      <section className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white px-5 py-6 shadow-[0_12px_34px_rgba(15,23,42,0.06)] sm:px-7">
        <div className="absolute right-3 top-1/2 hidden h-40 w-40 -translate-y-1/2 rounded-full bg-slate-100 md:block" />
        <div className="absolute right-20 top-4 hidden h-10 w-10 rounded-full border border-slate-200 bg-white/70 md:block" />
        <div className="relative max-w-2xl">
          <h1 className="text-[30px] font-semibold tracking-tight text-slate-950 sm:text-[34px]">
            {view.title}
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-slate-600">
            {view.description}
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <DashboardMetricTile
            key={metric.label}
            label={metric.label}
            value={metric.value}
            subtext={metric.subtext}
            tone={metric.tone}
          />
        ))}
      </div>

      {actions.length ? (
        <Panel className="border-slate-200/80 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-[22px] font-semibold tracking-tight text-slate-950">Action center</h2>
            <p className="mt-1 text-sm text-slate-600">
              Use role-specific actions to move directly into the work assigned to this account.
            </p>
          </div>
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-3">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => setSelectedAction(action)}
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/40"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${action.iconTone}`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-950">{action.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{action.detail}</p>
                </div>
              </button>
            ))}
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Panel className="border-slate-200/80 bg-white">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight text-slate-950">{view.primaryTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">{view.primarySubtitle}</p>
            </div>
            {canOpenReports ? (
              <Link href="/reports" className="pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 hover:text-sky-800">
                Open reports
              </Link>
            ) : null}
          </div>
          <div className="space-y-3 px-4 py-4 sm:px-5">
            {canOpenReports && data?.reviews.length ? (
              data.reviews.map((item) => (
                <ReviewRow
                  key={`${item.id}-${item.title}`}
                  title={item.title}
                  identifier={item.id || "No identifier"}
                  confidence={item.confidence}
                />
              ))
            ) : (
              <RoleTasks role={role} />
            )}
          </div>
        </Panel>

        <Panel className="border-slate-200/80 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-[18px] font-semibold tracking-tight text-slate-950">{view.secondaryTitle}</h2>
            <p className="mt-1 max-w-[24ch] text-xs leading-5 text-slate-600">{view.secondarySubtitle}</p>
          </div>
          <div className="relative px-5 py-3">
            <div className="absolute bottom-6 left-[26px] top-6 w-px bg-slate-200" />
            {data?.activity.length ? (
              data.activity.map((entry, index) => (
                <ActivityRow
                  key={`${entry.time}-${entry.title}`}
                  time={entry.time}
                  title={entry.title}
                  meta={entry.meta}
                  emphasized={index === 0}
                />
              ))
            ) : (
              <EmptyState message="No audit activity has been recorded yet." />
            )}
          </div>
        </Panel>
      </div>

      <Modal
        open={Boolean(selectedAction)}
        onClose={() => setSelectedAction(null)}
        title={selectedAction?.title || "Role action"}
        description={selectedAction?.detail}
        footer={
          selectedAction ? (
            <>
              <PrimaryButton subtle onClick={() => setSelectedAction(null)}>
                Cancel
              </PrimaryButton>
              <PrimaryButton
                onClick={() => {
                  router.push(selectedAction.href);
                  setSelectedAction(null);
                }}
              >
                {selectedAction.cta}
              </PrimaryButton>
            </>
          ) : undefined
        }
      >
        <div className="space-y-3">
          {selectedAction?.points.map((point) => (
            <div
              key={point}
              className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                theme === "dark"
                  ? "border border-slate-800 bg-slate-900 text-slate-900"
                  : "border border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {point}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-6 py-6 text-sm text-slate-600">{message}</p>;
}

function DashboardMetricTile({
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

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className={`h-1 ${toneClass}`} />
      <div className="space-y-3 px-5 py-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
          {label}
        </p>
        <p className="text-4xl font-semibold tracking-tight text-slate-950">{value}</p>
        <p className="max-w-[14ch] text-sm leading-5 text-slate-600">{subtext}</p>
      </div>
    </div>
  );
}

function ReviewRow({
  title,
  identifier,
  confidence,
}: {
  title: string;
  identifier: string;
  confidence: string | null;
}) {
  const percent = parseConfidence(confidence);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <ReportIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-slate-950">{title}</p>
            <p className="mt-1 text-xs text-slate-500">{identifier}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-28">
            <div className="mb-1 flex items-center justify-end text-[11px] font-semibold text-slate-600">
              {confidence || "--"}
            </div>
            <div className="h-1.5 rounded-full bg-slate-200">
              <div className="h-1.5 rounded-full bg-sky-700 transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <Link
            href="/reports"
            className={`${buttonClassName({ subtle: true })} h-9 px-4 text-xs shadow-none`}
          >
            <ButtonFx />
            <span className="relative z-10">Review</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({
  time,
  title,
  meta,
  emphasized = false,
}: {
  time: string;
  title: string;
  meta: string | null;
  emphasized?: boolean;
}) {
  return (
    <div className="relative flex gap-3 py-3">
      <div className="relative z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white">
        <span
          className={`block rounded-full ${
            emphasized ? "h-4 w-4 border-2 border-sky-700" : "h-2.5 w-2.5 bg-slate-300"
          }`}
        >
          {emphasized ? <span className="m-auto mt-[3px] block h-1.5 w-1.5 rounded-full bg-sky-700" /> : null}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[12px] font-semibold leading-5 text-slate-900">{title}</p>
          <p className="shrink-0 text-[11px] font-medium text-slate-500">{time}</p>
        </div>
        {meta ? <p className="mt-1 text-[12px] leading-5 text-slate-600">{meta}</p> : null}
        {emphasized ? (
          <div className="mt-2 inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-medium text-sky-700">
            System suggested review
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RoleTasks({ role }: { role: UserRole | null }) {
  const tasks = {
    admin: [
      "Oversee hospital activity and subscription usage.",
      "Review staffing, records, and appointment flow.",
      "Access every operational module in the workspace.",
    ],
    doctor: [
      "Review patients and manage your appointments.",
      "Generate reports and AI-assisted summaries.",
      "Use prescription guidance during consultations.",
    ],
    nurse: [
      "Register patients and maintain current records.",
      "Support appointment flow and queue updates.",
      "Monitor patient status changes during care coordination.",
    ],
    receptionist: [
      "Register new patients at intake.",
      "Create appointments and confirm scheduling details.",
      "Track appointment status from the front desk.",
    ],
  } satisfies Record<Exclude<UserRole, null>, string[]>;

  const items = role ? tasks[role] : ["Role information is not available for this account."];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
        >
          <p className="text-sm text-slate-600">{item}</p>
        </div>
      ))}
    </div>
  );
}

type RoleAction = {
  id: string;
  title: string;
  detail: string;
  href: string;
  cta: string;
  points: string[];
  icon: typeof QueueIcon;
  iconTone: string;
};

function getRoleActions(role: UserRole | null): RoleAction[] {
  switch (role) {
    case "admin":
      return [
        {
          id: "hospital",
          title: "Manage hospital settings",
          detail: "Review profile, AI behavior, subscription state, and session controls.",
          href: "/settings",
          cta: "Open settings",
          icon: SettingsIcon,
          iconTone: "border-amber-100 bg-amber-50 text-amber-700",
          points: [
            "Update hospital-wide settings and review account scope.",
            "Monitor subscription usage and current plan state.",
            "Keep workspace controls aligned with operations.",
          ],
        },
        {
          id: "records",
          title: "Review patient operations",
          detail: "Check patient records and current registration activity.",
          href: "/patients",
          cta: "Open patients",
          icon: PatientsIcon,
          iconTone: "border-sky-100 bg-sky-50 text-sky-700",
          points: [
            "Inspect current patient records and intake flow.",
            "Review the operational side of registration and follow-up.",
          ],
        },
        {
          id: "analytics",
          title: "Inspect operational flow",
          detail: "Look through activity, triage volume, and document load.",
          href: "/appointments",
          cta: "Open appointments",
          icon: QueueIcon,
          iconTone: "border-emerald-100 bg-emerald-50 text-emerald-700",
          points: [
            "Review the appointment queue and current flow pressure.",
            "Use dashboard metrics to spot operational bottlenecks.",
          ],
        },
      ];
    case "doctor":
      return [
        {
          id: "appointments",
          title: "Manage appointments",
          detail: "Open the clinical queue and update patient visit status.",
          href: "/appointments",
          cta: "Open appointments",
          icon: QueueIcon,
          iconTone: "border-emerald-100 bg-emerald-50 text-emerald-700",
          points: [
            "Adjust visit priority and status as the queue changes.",
            "Keep assigned consultations moving with current clinical context.",
          ],
        },
        {
          id: "reports",
          title: "Create reports",
          detail: "Generate clinical drafts and review AI summaries.",
          href: "/reports",
          cta: "Open reports",
          icon: ReportIcon,
          iconTone: "border-sky-100 bg-sky-50 text-sky-700",
          points: [
            "Draft discharge, referral, or summary reports.",
            "Use AI output as a draft, then review before final use.",
          ],
        },
        {
          id: "patients",
          title: "View patients",
          detail: "Review patient records before and during consultation.",
          href: "/patients",
          cta: "Open patients",
          icon: PatientsIcon,
          iconTone: "border-indigo-100 bg-indigo-50 text-indigo-700",
          points: [
            "Search records quickly by name, ID, or phone.",
            "Inspect current status and last visit details.",
          ],
        },
      ];
    case "nurse":
      return [
        {
          id: "register",
          title: "Register patient",
          detail: "Open patient intake and add a new record.",
          href: "/patients",
          cta: "Open patients",
          icon: PatientsIcon,
          iconTone: "border-sky-100 bg-sky-50 text-sky-700",
          points: [
            "Capture core patient details needed for the clinical workflow.",
            "Keep records current for downstream doctor and reception use.",
          ],
        },
        {
          id: "queue",
          title: "Manage appointments",
          detail: "Support scheduling flow and update queue status.",
          href: "/appointments",
          cta: "Open appointments",
          icon: QueueIcon,
          iconTone: "border-emerald-100 bg-emerald-50 text-emerald-700",
          points: [
            "Adjust queue state as patient flow changes.",
            "Coordinate follow-through between intake and consultation.",
          ],
        },
        {
          id: "records",
          title: "Review patient records",
          detail: "Check patient records during care coordination.",
          href: "/patients",
          cta: "Open records",
          icon: PatientsIcon,
          iconTone: "border-indigo-100 bg-indigo-50 text-indigo-700",
          points: [
            "Search and inspect patient history visible to nursing staff.",
            "Track status changes during coordination and follow-up.",
          ],
        },
      ];
    case "receptionist":
      return [
        {
          id: "new-patient",
          title: "Register new patient",
          detail: "Start intake and create a patient record.",
          href: "/patients",
          cta: "Open patients",
          icon: PatientsIcon,
          iconTone: "border-sky-100 bg-sky-50 text-sky-700",
          points: [
            "Capture the essential registration details at the front desk.",
            "Prepare the patient record before appointment booking.",
          ],
        },
        {
          id: "new-appointment",
          title: "Create appointment",
          detail: "Book a visit and assign the appointment time.",
          href: "/appointments",
          cta: "Open appointments",
          icon: QueueIcon,
          iconTone: "border-emerald-100 bg-emerald-50 text-emerald-700",
          points: [
            "Create the booking request with the visit reason.",
            "Track status from intake through confirmation.",
          ],
        },
        {
          id: "status",
          title: "Check appointment status",
          detail: "Inspect the queue without touching clinical-only controls.",
          href: "/appointments",
          cta: "Review queue",
          icon: QueueIcon,
          iconTone: "border-amber-100 bg-amber-50 text-amber-700",
          points: [
            "Track pending, confirmed, and completed appointments.",
            "Stay aligned with the current front desk workload.",
          ],
        },
      ];
    default:
      return [];
  }
}

function parseConfidence(value: string | null) {
  const numeric = Number.parseInt(value?.replace("%", "") || "", 10);

  if (Number.isNaN(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, numeric));
}

function getDashboardView(
  role: UserRole | null,
  displayName: string,
  workspaceName: string | null | undefined
) {
  const place = workspaceName ? ` at ${workspaceName}` : "";

  switch (role) {
    case "admin":
      return {
        title: `Admin overview${place}`,
        description: "Monitor operational load, document flow, and workspace activity across the hospital.",
        primaryTitle: "Administrative priorities",
        primarySubtitle: "Role responsibilities and control points for the current workspace.",
        secondaryTitle: "Operational activity",
        secondarySubtitle: "Recent events recorded across the workspace.",
        metricLabels: ["Pending reports", "Critical triage", "Patients today", "AI drafts approved"],
      };
    case "doctor":
      return {
        title: `Doctor dashboard for ${displayName}`,
        description: "Review patient flow, pending documentation, and appointments assigned to your clinical work.",
        primaryTitle: "Awaiting your review",
        primarySubtitle: "Drafts and pending reports awaiting clinician review.",
        secondaryTitle: "Clinical activity",
        secondarySubtitle: "Recent actions affecting your day-to-day workflow.",
        metricLabels: ["Pending reports", "Critical triage", "Patients today", "AI drafts approved"],
      };
    case "nurse":
      return {
        title: `Nursing overview${place}`,
        description: "Track patient intake, appointment flow, and current operational activity for care support.",
        primaryTitle: "Nursing responsibilities",
        primarySubtitle: "Tasks available to nursing accounts in this workspace.",
        secondaryTitle: "Care activity",
        secondarySubtitle: "Recent activity relevant to patient coordination and queue updates.",
        metricLabels: ["Critical triage", "Patients today", "Pending reports"],
      };
    case "receptionist":
      return {
        title: `Front desk overview${place}`,
        description: "Focus on patient registration, appointment creation, and status tracking from intake.",
        primaryTitle: "Front desk responsibilities",
        primarySubtitle: "Actions available to reception accounts in this workspace.",
        secondaryTitle: "Scheduling activity",
        secondarySubtitle: "Recent activity related to arrivals, bookings, and status changes.",
        metricLabels: ["Patients today", "Critical triage"],
      };
    default:
      return {
        title: "Workspace overview",
        description: "Review the current workspace activity.",
        primaryTitle: "Workspace access",
        primarySubtitle: "Role information is required before the workspace can be tailored.",
        secondaryTitle: "Recent activity",
        secondarySubtitle: "Latest recorded activity for this workspace.",
        metricLabels: ["Patients today"],
      };
  }
}
