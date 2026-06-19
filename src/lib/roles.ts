export type UserRole =
  | "admin"
  | "doctor"
  | "nurse"
  | "receptionist";

export type RouteKey =
  | "dashboard"
  | "appointments"
  | "patients"
  | "reports"
  | "prescriptions"
  | "settings";

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  doctor: "Doctor",
  nurse: "Nurse",
  receptionist: "Receptionist",
};

export const routeRoleMap: Record<RouteKey, UserRole[]> = {
  dashboard: ["admin", "doctor", "nurse", "receptionist"],
  appointments: ["admin", "doctor", "nurse", "receptionist"],
  patients: ["admin", "doctor", "nurse", "receptionist"],
  reports: ["admin", "doctor"],
  prescriptions: ["admin", "doctor"],
  settings: ["admin", "doctor", "nurse", "receptionist"],
};

export function normalizeRole(value?: string | null): UserRole | null {
  const normalized = value?.trim().toLowerCase();

  if (
    normalized === "admin" ||
    normalized === "doctor" ||
    normalized === "nurse" ||
    normalized === "receptionist"
  ) {
    return normalized;
  }

  return null;
}

export function getRouteKey(pathname: string): RouteKey | null {
  if (pathname.startsWith("/appointments")) return "appointments";
  if (pathname.startsWith("/patients")) return "patients";
  if (pathname.startsWith("/reports")) return "reports";
  if (pathname.startsWith("/prescriptions")) return "prescriptions";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/dashboard")) return "dashboard";

  return null;
}

export function canAccessRoute(role: UserRole | null, pathname: string): boolean {
  const routeKey = getRouteKey(pathname);

  if (!routeKey) {
    return true;
  }

  if (!role) {
    return false;
  }

  return routeRoleMap[routeKey].includes(role);
}

export function getAllowedRouteKeys(role: UserRole | null): RouteKey[] {
  if (!role) {
    return [];
  }

  return (Object.keys(routeRoleMap) as RouteKey[]).filter((key) =>
    routeRoleMap[key].includes(role)
  );
}
