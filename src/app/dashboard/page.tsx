"use client";

import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ButtonFx,
  DataPill,
  MedosPage,
  MetricCard,
  Modal,
  Panel,
  PanelHeader,
  PrimaryButton,
  ReportIcon,
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
    <MedosPage
      sectionNumber="01"
      sectionTitle="Overview"
      title={view.title}
      description={view.description}
    >
      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            subtext={metric.subtext}
            tone={metric.tone}
          />
        ))}
      </div>

      {actions.length ? (
        <Panel>
          <PanelHeader
            title="Action center"
            subtitle="Use role-specific actions to move directly into the work assigned to this account."
          />
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => setSelectedAction(action)}
                className={`${buttonClassName({ subtle: true, fullWidth: true })} h-auto min-h-28 items-start justify-start px-4 py-4 text-left shadow-none ${
                  theme === "dark"
                    ? "border-slate-800 bg-slate-900 text-slate-100 hover:border-slate-700 hover:bg-slate-800"
                    : "border-slate-200 bg-slate-50 text-slate-900 hover:border-sky-100 hover:bg-sky-50"
                }`}
              >
                <ButtonFx />
                <span className="relative z-10 space-y-2">
                  <span className={`block text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
                    {action.title}
                  </span>
                  <span className={`block text-sm leading-6 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    {action.detail}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <PanelHeader
            title={view.primaryTitle}
            subtitle={view.primarySubtitle}
            right={
              canOpenReports ? (
                <Link href="/reports" className="text-sm font-medium text-sky-700 hover:text-sky-800">
                  Open reports
                </Link>
              ) : null
            }
          />
          <div>
            {canOpenReports && data?.reviews.length ? (
              data.reviews.map((item) => (
                <div
                  key={`${item.id}-${item.title}`}
                  className={`flex flex-col gap-4 px-6 py-5 first:border-t-0 md:flex-row md:items-center md:justify-between ${
                    theme === "dark" ? "border-t border-slate-800" : "border-t border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sky-700 ${theme === "dark" ? "bg-sky-950" : "bg-sky-50"}`}>
                      <ReportIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={`text-[17px] font-medium ${theme === "dark" ? "text-white" : "text-slate-950"}`}>{item.title}</p>
                      <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{item.id || "No identifier"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.confidence ? <DataPill tone="blue">{item.confidence}</DataPill> : null}
                    <Link
                      href="/reports"
                      className={`${buttonClassName({ subtle: true })} h-10 px-4 shadow-none ${
                        theme === "dark"
                          ? "border-slate-800 bg-slate-900 text-slate-100 hover:border-slate-700 hover:bg-slate-800"
                          : ""
                      }`}
                    >
                      <ButtonFx />
                      <span className="relative z-10">Review</span>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <RoleTasks role={role} />
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title={view.secondaryTitle} subtitle={view.secondarySubtitle} />
          <div>
            {data?.activity.length ? (
              data.activity.map((entry) => (
                <div
                  key={`${entry.time}-${entry.title}`}
                  className={`grid grid-cols-[64px_minmax(0,1fr)] gap-3 px-6 py-5 first:border-t-0 ${
                    theme === "dark" ? "border-t border-slate-800" : "border-t border-slate-200"
                  }`}
                >
                  <p className={`pt-0.5 text-xs font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{entry.time}</p>
                  <div>
                    <p className={`text-[15px] font-medium ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{entry.title}</p>
                    {entry.meta ? <p className={`mt-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{entry.meta}</p> : null}
                  </div>
                </div>
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
                  ? "border border-slate-800 bg-slate-900 text-slate-300"
                  : "border border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {point}
            </div>
          ))}
        </div>
      </Modal>
    </MedosPage>
  );
}

function EmptyState({ message }: { message: string }) {
  const { theme } = useWorkspaceTheme();
  return <p className={`px-6 py-6 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{message}</p>;
}

function RoleTasks({ role }: { role: UserRole | null }) {
  const { theme } = useWorkspaceTheme();
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
    <div className="space-y-0">
      {items.map((item) => (
        <div
          key={item}
          className={`px-6 py-5 first:border-t-0 ${
            theme === "dark" ? "border-t border-slate-800" : "border-t border-slate-200"
          }`}
        >
          <p className={`text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>{item}</p>
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
