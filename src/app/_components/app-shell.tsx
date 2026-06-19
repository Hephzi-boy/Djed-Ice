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
  ButtonFx,
  DashboardIcon,
  PatientsIcon,
  PillIcon,
  QueueIcon,
  ReportIcon,
  SettingsIcon,
  StatusPulse,
  buttonClassName,
} from "./medos-ui";
import { WorkspaceUserProvider } from "./user-session-context";
import {
  WorkspaceThemeProvider,
  type WorkspaceTheme,
} from "./workspace-theme-context";

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
  const [theme, setTheme] = useState<WorkspaceTheme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const storedTheme = window.localStorage.getItem("workspace-theme");
    return storedTheme === "dark" ? "dark" : "light";
  });
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("workspace-theme", theme);
    document.documentElement.dataset.workspaceTheme = theme;
  }, [theme]);

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
      <div
        className={`flex min-h-screen items-center justify-center px-4 ${
          theme === "dark" ? "bg-[#020617]" : "bg-[#edf3f8]"
        }`}
      >
        <div
          className={`rounded-2xl px-6 py-4 text-sm shadow-sm ${
            theme === "dark"
              ? "border border-slate-800 bg-slate-950 text-slate-400"
              : "border border-slate-200 bg-white text-slate-500"
          }`}
        >
          Checking session...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        theme === "dark" ? "bg-[#020617] text-slate-100" : "bg-[#edf3f8] text-slate-900"
      }`}
    >
      <div className="flex min-h-screen">
        <aside
          className={`sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col lg:flex ${
            theme === "dark"
              ? "border-r border-slate-800 bg-slate-950"
              : "border-r border-slate-200 bg-white"
          }`}
        >
          <div
            className={`flex items-center gap-3 px-6 py-6 ${
              theme === "dark" ? "border-b border-slate-800" : "border-b border-slate-200"
            }`}
          >
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
              <p
                className={`text-[22px] font-semibold leading-none ${
                  theme === "dark" ? "text-white" : "text-slate-950"
                }`}
              >
                Djed Ice
              </p>
              <p
                className={`mt-1 text-[10px] uppercase tracking-[0.28em] ${
                  theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Med &amp; Clinical
              </p>
              <p
                className={`mt-1 text-[10px] uppercase tracking-[0.28em] ${
                  theme === "dark" ? "text-slate-500" : "text-slate-400"
                }`}
              >
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
                  className={`${buttonClassName({ subtle: true })} h-11 justify-start px-3.5 shadow-none ${
                    active
                      ? theme === "dark"
                        ? "border-[#d8c7af] bg-[#e8ddcd] text-slate-950 ring-1 ring-[#d8c7af]"
                        : "border-sky-100 bg-sky-50 text-sky-900 ring-1 ring-sky-100"
                      : theme === "dark"
                        ? "border-[#eadfce] bg-[#f6f0e7] text-slate-900 hover:border-[#d8c7af] hover:bg-[#eee4d6] hover:text-slate-950"
                        : "border-transparent bg-transparent text-slate-600 hover:border-sky-100 hover:bg-sky-50/80 hover:text-slate-950"
                  }`}
                >
                  <ButtonFx />
                  <span
                    className={`relative z-10 inline-flex items-center gap-3 ${
                      theme === "dark"
                        ? active
                          ? "!text-slate-950"
                          : "!text-slate-900"
                        : active
                          ? "text-sky-900"
                          : "text-slate-600"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active
                          ? theme === "dark"
                            ? "!text-slate-900"
                            : "text-sky-700"
                          : theme === "dark"
                            ? "!text-slate-700"
                            : ""
                      }`}
                    />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div
            className={`mt-auto px-4 py-5 ${
              theme === "dark"
                ? "border-t border-slate-800 bg-slate-950"
                : "border-t border-slate-200 bg-white"
            }`}
          >
            <div
              className={`rounded-2xl px-4 py-4 shadow-sm ${
                theme === "dark"
                  ? "border border-slate-800 bg-slate-900"
                  : "border border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <p
                  className={`text-[10px] font-medium uppercase tracking-[0.28em] ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  AI quota
                </p>
                <p
                  className={`text-xs font-medium ${
                    theme === "dark" ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  {shellData?.quota?.current !== null &&
                  shellData?.quota?.current !== undefined &&
                  shellData?.quota?.limit !== null &&
                  shellData?.quota?.limit !== undefined
                    ? `${shellData.quota.current}/${shellData.quota.limit}`
                    : "--/--"}
                </p>
              </div>
              <div className={`mt-3 h-2 rounded-full ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"}`}>
                <div
                  className="h-2 rounded-full bg-sky-700 transition-all"
                  style={{ width: `${usagePercent ?? 0}%` }}
                />
              </div>
              <p className={`mt-3 text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                {shellData?.quota?.plan || "Waiting for usage data"}
                {shellData?.quota?.resetLabel ? ` - resets ${shellData.quota.resetLabel}` : ""}
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={`sticky top-0 z-20 backdrop-blur ${
              theme === "dark"
                ? "border-b border-slate-800 bg-slate-950/95"
                : "border-b border-slate-200 bg-white/95"
            }`}
          >
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.28em] shadow-sm ${
                  theme === "dark"
                    ? "border border-emerald-900/70 bg-emerald-950/60 text-slate-300"
                    : "border border-emerald-100 bg-emerald-50 text-slate-500"
                }`}
              >
                <StatusPulse />
                <span>System operational</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    {displayName}
                  </p>
                  <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    {roleLabel}
                  </p>
                </div>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    theme === "dark" ? "bg-sky-900 text-sky-100" : "bg-sky-100 text-slate-700"
                  }`}
                >
                  {initials}
                </div>
              </div>
            </div>
          </header>

          <main
            className={`min-h-[calc(100vh-4rem)] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 ${
              theme === "dark" ? "bg-[#020617]" : "bg-[#f3f7fb]"
            }`}
          >
            <WorkspaceThemeProvider theme={theme} setTheme={setTheme}>
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
            </WorkspaceThemeProvider>
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
