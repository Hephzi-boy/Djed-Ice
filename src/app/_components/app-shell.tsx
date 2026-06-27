"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  fetchShellData,
  getWorkspaceSession,
  subscribeToWorkspaceEvents,
  type ShellData,
  type WorkspaceSession,
} from "@/lib/workspace-data";
import { canAccessRoute, normalizeRole, roleLabels } from "@/lib/roles";
import {
  BellIcon,
  DashboardIcon,
  PatientsIcon,
  PillIcon,
  QueueIcon,
  ReportIcon,
  SearchIcon,
  SettingsIcon,
  StatusPulse,
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
  const [session, setSession] = useState<WorkspaceSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isHeaderCondensed, setIsHeaderCondensed] = useState(false);
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

    async function refreshShell() {
      const shell = await fetchShellData();

      if (!active) {
        return;
      }

      setShellData(shell);
    }

    async function load() {
      const [currentSession, shell] = await Promise.all([
        getWorkspaceSession(),
        fetchShellData(),
      ]);

      if (!active) {
        return;
      }

      setSession(currentSession);
      setShellData(shell);
      setAuthChecked(true);
    }

    load();

    const unsubscribe = subscribeToWorkspaceEvents({
      onAuthChange(nextSession) {
        if (!active) {
          return;
        }

        setSession(nextSession);
        setAuthChecked(true);
        void refreshShell();
      },
      onDataChange() {
        if (!active) {
          return;
        }

        void refreshShell();
      },
    });

    return () => {
      active = false;
      unsubscribe();
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
  }, [authChecked, isAuthRoute, router, session]);

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
  const initials =
    shellData?.profile.initials && shellData.profile.displayName === displayName
      ? shellData.profile.initials
      : makeInitials(displayName);
  const allowedNavigation = navigation.filter((item) =>
    canAccessRoute(normalizedRole, item.href)
  );
  const activePage = useMemo(() => getPageDetails(pathname), [pathname]);
  const todayLabel = useMemo(() => formatToday(), []);

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

  useEffect(() => {
    if (typeof window === "undefined" || isAuthRoute) {
      return;
    }

    let frame = 0;

    const syncCondensedState = () => {
      frame = 0;
      setIsHeaderCondensed(window.scrollY > 8);
    };

    const handleScroll = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(syncCondensedState);
    };

    syncCondensedState();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [isAuthRoute, pathname]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (!authChecked || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="med-surface-strong rounded-[28px] px-6 py-5 text-sm text-[color:var(--muted)]">
          Preparing secure clinical workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[color:var(--foreground)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[296px] shrink-0 xl:block">
          <div className="sticky top-0 flex h-screen flex-col px-5 py-5">
            <div className="med-hero rounded-[26px] px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0">
                  <Image
                    src="/djed-ice.svg"
                    alt="Djed Ice Med logo"
                    fill
                    className="object-contain"
                    sizes="48px"
                    priority
                  />
                </div>
                <div>
                  <p className="text-[1.15rem] font-extrabold tracking-[-0.04em] text-[color:var(--foreground-soft)]">
                    Djed Ice
                  </p>
                  <p className="med-label mt-0.5">Med and Clinical AI</p>
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-[color:var(--muted)]">
                A calmer command center for triage, documentation, prescriptions, and patient flow.
              </p>
            </div>

            <nav className="no-scrollbar mt-5 flex-1 space-y-2 overflow-y-auto">
              {allowedNavigation.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-[22px] border px-4 py-3 transition ${
                      active
                        ? "border-[color:var(--border-strong)] bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(37,99,235,0.14))] shadow-[var(--shadow-soft)]"
                        : "border-transparent bg-transparent hover:border-[color:var(--border-subtle)] hover:bg-[color:var(--surface-elevated)]"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                        active
                          ? "border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] text-[color:var(--accent-strong)]"
                          : "border-[color:var(--border-subtle)] bg-[color:var(--surface)] text-[color:var(--muted)]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[color:var(--foreground-soft)]">{item.label}</p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {getPageDetails(item.href).eyebrow}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="med-surface-strong rounded-[20px] px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="med-label">AI quota</p>
                  <p className="mt-0.5 text-[0.9rem] font-bold tracking-[-0.03em] text-[color:var(--foreground-soft)]">
                    {shellData?.quota?.current !== null &&
                    shellData?.quota?.current !== undefined &&
                    shellData?.quota?.limit !== null &&
                    shellData?.quota?.limit !== undefined
                      ? `${shellData.quota.current}/${shellData.quota.limit}`
                      : "--/--"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-sky-200/70 bg-sky-500/10 px-2 py-1 text-[10px] font-semibold text-sky-700">
                  <StatusPulse />
                  <span>{shellData?.quota?.plan || "Active plan"}</span>
                </div>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[color:var(--surface-muted)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong))] transition-all"
                  style={{ width: `${usagePercent ?? 0}%` }}
                />
              </div>
              <p className="mt-1 text-[9px] leading-4 text-[color:var(--muted)]">
                {shellData?.quota?.resetLabel ? `Quota resets ${shellData.quota.resetLabel}.` : "Live usage updates appear here."}
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
            <div
              className={`relative ml-auto transition-[height] duration-300 ease-out ${
                isHeaderCondensed ? "h-12 w-12" : "h-[104px] w-full lg:h-[96px]"
              }`}
            >
              <div
                className={`med-surface absolute inset-0 rounded-[28px] px-4 py-4 transition-[opacity,transform,filter] duration-300 ease-out sm:px-5 ${
                  isHeaderCondensed
                    ? "pointer-events-none scale-[0.92] -translate-y-2 opacity-0 blur-[3px]"
                    : "scale-100 translate-y-0 opacity-100 blur-0"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="med-kicker">{activePage.eyebrow}</span>
                      <span className="hidden text-xs text-[color:var(--muted)] sm:inline">{todayLabel}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <h2 className="truncate text-[1.45rem] font-extrabold tracking-[-0.04em] text-[color:var(--foreground-soft)]">
                        {activePage.title}
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:min-w-[440px] lg:flex-row lg:items-center lg:justify-end">
                    <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] px-4 py-3">
                      <SearchIcon className="h-4 w-4 shrink-0 text-[color:var(--muted)]" />
                      <input
                        type="search"
                        placeholder="Search patients, reports, or appointments..."
                        className="w-full bg-transparent text-sm text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--muted-soft)]"
                      />
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Notifications"
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] text-[color:var(--muted)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--foreground)]"
                      >
                        <BellIcon className="h-4 w-4" />
                      </button>
                      <Link
                        href="/settings"
                        aria-label="Settings"
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] text-[color:var(--muted)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--foreground)]"
                      >
                        <SettingsIcon className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="med-surface-strong hidden min-w-[220px] items-center gap-3 rounded-[24px] px-3 py-2.5 sm:flex">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-sm font-bold text-white">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[color:var(--foreground-soft)]">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-[color:var(--muted)]">{roleLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`absolute right-0 top-0 transition-[opacity,transform] duration-300 ease-out ${
                  isHeaderCondensed
                    ? "opacity-100 translate-y-0 scale-100"
                    : "pointer-events-none opacity-0 translate-y-3 scale-75"
                }`}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-sm font-bold text-white shadow-[0_16px_36px_rgba(8,47,73,0.22)]"
                  aria-label={`${displayName} ${roleLabel}`}
                  title={`${displayName} - ${roleLabel}`}
                >
                  {initials}
                </div>
              </div>
            </div>
          </header>

          <main className="min-h-[calc(100vh-5rem)] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
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

      <nav className="fixed bottom-4 left-4 right-4 z-30 xl:hidden">
        <div className="med-surface mx-auto flex max-w-xl items-center justify-between rounded-[28px] px-2 py-2">
          {allowedNavigation.slice(0, 5).map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[20px] px-2 py-2 text-center transition ${
                  active
                    ? "bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(37,99,235,0.16))] text-[color:var(--foreground-soft)]"
                    : "text-[color:var(--muted)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
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

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());
}

function getPageDetails(pathname: string) {
  if (pathname.startsWith("/appointments")) {
    return {
      title: "Appointment Flow",
      eyebrow: "Queue Management",
    };
  }

  if (pathname.startsWith("/patients")) {
    return {
      title: "Patient Registry",
      eyebrow: "Records",
    };
  }

  if (pathname.startsWith("/reports")) {
    return {
      title: "Clinical Reports",
      eyebrow: "AI Documentation",
    };
  }

  if (pathname.startsWith("/prescriptions")) {
    return {
      title: "Prescription Guidance",
      eyebrow: "Medication Review",
    };
  }

  if (pathname.startsWith("/settings")) {
    return {
      title: "Workspace Settings",
      eyebrow: "Access and Theme",
    };
  }

  return {
    title: "Clinical Dashboard",
    eyebrow: "Hospital Command",
  };
}
