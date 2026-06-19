"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { fetchShellData, type ShellData } from "@/lib/workspace-data";
import { canAccessRoute, normalizeRole, roleLabels } from "@/lib/roles";
import { supabase } from "@/lib/supabase";
import {
  DashboardIcon,
  PatientsIcon,
  PillIcon,
  QueueIcon,
  ReportIcon,
  SettingsIcon,
  StatusPulse,
} from "./medos-ui";
import { WorkspaceUserProvider } from "./user-session-context";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/appointments", label: "Triage Queue", icon: QueueIcon },
  { href: "/patients", label: "Patients", icon: PatientsIcon },
  { href: "/reports", label: "AI Reports", icon: ReportIcon },
  { href: "/prescriptions", label: "Prescriptions", icon: PillIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [shellData, setShellData] = useState<ShellData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    let active = true;

    async function load() {
      const [{ data: sessionData }, shell] = await Promise.all([
        supabase.auth.getSession(),
        fetchShellData(),
      ]);

      if (!active) {
        return;
      }

      setSession(sessionData.session);
      setShellData(shell);
      setAuthChecked(true);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) {
        return;
      }

      setSession(nextSession);
      setAuthChecked(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const usagePercent =
    shellData?.quota?.current !== null &&
    shellData?.quota?.current !== undefined &&
    shellData?.quota?.limit
      ? Math.max(
          0,
          Math.min(100, Math.round((shellData.quota.current / shellData.quota.limit) * 100))
        )
      : null;

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    if (!isAuthRoute && !session) {
      router.replace("/login");
      return;
    }

    if (isAuthRoute && session) {
      router.replace("/dashboard");
    }
  }, [authChecked, isAuthRoute, pathname, router, session]);

  const metadata = session?.user.user_metadata as
    | { full_name?: string; role?: string }
    | undefined;
  const normalizedRole = normalizeRole(metadata?.role);
  const displayName =
    metadata?.full_name ||
    shellData?.profile.displayName ||
    session?.user.email?.split("@")[0] ||
    "Workspace user";
  const roleLabel =
    (normalizedRole ? roleLabels[normalizedRole] : null) ||
    shellData?.profile.subtitle ||
    "Unassigned role";
  const initials = shellData?.profile.initials && shellData.profile.displayName === displayName
    ? shellData.profile.initials
    : makeInitials(displayName);
  const allowedNavigation = navigation.filter((item) =>
    canAccessRoute(normalizedRole, item.href)
  );

  useEffect(() => {
    if (!authChecked || !session || isAuthRoute) {
      return;
    }

    if (!normalizedRole) {
      if (pathname !== "/settings") {
        router.replace("/settings");
      }
      return;
    }

    if (!canAccessRoute(normalizedRole, pathname)) {
      router.replace("/dashboard");
    }
  }, [authChecked, isAuthRoute, normalizedRole, pathname, router, session]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (!authChecked || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#edf3f8] px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-500 shadow-sm">
          Checking session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf3f8] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
            <div className="relative h-14 w-14 shrink-0">
              <Image
                src="/djed-ice.svg"
                alt="Djed Ice Med logo"
                fill
                className="object-contain"
                sizes="56px"
                priority
              />
            </div>
            <div>
              <p className="text-[22px] font-semibold leading-none text-slate-950">
                Djed Ice
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-slate-500">
                Med &amp; Clinical
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-slate-400">
                AI Assistant
              </p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5">
            {allowedNavigation.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-11 items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium transition ${
                    active
                      ? "bg-sky-50 text-sky-900 ring-1 ring-sky-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-sky-700" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-200 bg-white px-4 py-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                  AI quota
                </p>
                <p className="text-xs font-medium text-slate-700">
                  {shellData?.quota?.current !== null &&
                  shellData?.quota?.current !== undefined &&
                  shellData?.quota?.limit !== null &&
                  shellData?.quota?.limit !== undefined
                    ? `${shellData.quota.current}/${shellData.quota.limit}`
                    : "--/--"}
                </p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-sky-700 transition-all"
                  style={{ width: `${usagePercent ?? 0}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {shellData?.quota?.plan || "Waiting for usage data"}
                {shellData?.quota?.resetLabel ? ` - resets ${shellData.quota.resetLabel}` : ""}
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
              <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500 shadow-sm">
                <StatusPulse />
                <span>System operational</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-slate-900">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {roleLabel}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-slate-700">
                  {initials}
                </div>
              </div>
            </div>
          </header>

          <main className="min-h-[calc(100vh-4rem)] flex-1 bg-[#f3f7fb] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <WorkspaceUserProvider
              value={{
                session,
                role: normalizedRole,
                displayName,
                roleLabel,
                initials,
              }}
            >
              {children}
            </WorkspaceUserProvider>
          </main>
        </div>
      </div>
    </div>
  );
}

function makeInitials(value: string): string {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "AI"
  );
}
