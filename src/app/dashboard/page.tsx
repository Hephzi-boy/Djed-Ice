"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  DataPill,
  MedosPage,
  MetricCard,
  Panel,
  PanelHeader,
  ReportIcon,
} from "../_components/medos-ui";
import { useWorkspaceUser } from "../_components/user-session-context";
import { fetchDashboardData, type DashboardData } from "@/lib/workspace-data";
import type { UserRole } from "@/lib/roles";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const { role, displayName } = useWorkspaceUser();

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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="bg-white/95">
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
                  className="flex flex-col gap-4 border-t border-slate-200 px-6 py-5 first:border-t-0 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                      <ReportIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[17px] font-medium text-slate-950">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.id || "No identifier"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.confidence ? <DataPill tone="blue">{item.confidence}</DataPill> : null}
                    <Link
                      href="/reports"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <RoleTasks role={role} />
            )}
          </div>
        </Panel>

        <Panel className="bg-white/95">
          <PanelHeader title={view.secondaryTitle} subtitle={view.secondarySubtitle} />
          <div>
            {data?.activity.length ? (
              data.activity.map((entry) => (
                <div
                  key={`${entry.time}-${entry.title}`}
                  className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 border-t border-slate-200 px-6 py-5 first:border-t-0"
                >
                  <p className="pt-0.5 text-xs font-medium text-slate-500">{entry.time}</p>
                  <div>
                    <p className="text-[15px] font-medium text-slate-900">{entry.title}</p>
                    {entry.meta ? <p className="mt-1 text-sm text-slate-500">{entry.meta}</p> : null}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="No audit activity has been recorded yet." />
            )}
          </div>
        </Panel>
      </div>
    </MedosPage>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-6 py-6 text-sm text-slate-500">{message}</p>;
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
    <div className="space-y-0">
      {items.map((item) => (
        <div
          key={item}
          className="border-t border-slate-200 px-6 py-5 first:border-t-0"
        >
          <p className="text-sm text-slate-600">{item}</p>
        </div>
      ))}
    </div>
  );
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
