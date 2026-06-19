"use client";

import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";

import type { UserRole } from "@/lib/roles";

export type WorkspaceUser = {
  session: Session;
  role: UserRole | null;
  displayName: string;
  roleLabel: string;
  initials: string;
};

const WorkspaceUserContext = createContext<WorkspaceUser | null>(null);

export function WorkspaceUserProvider({
  value,
  children,
}: {
  value: WorkspaceUser;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceUserContext.Provider value={value}>
      {children}
    </WorkspaceUserContext.Provider>
  );
}

export function useWorkspaceUser() {
  const value = useContext(WorkspaceUserContext);

  if (!value) {
    throw new Error("useWorkspaceUser must be used inside WorkspaceUserProvider.");
  }

  return value;
}
