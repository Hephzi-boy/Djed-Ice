"use client";

import { createContext, useContext } from "react";

export type WorkspaceTheme = "light" | "dark";

const WorkspaceThemeContext = createContext<{
  theme: WorkspaceTheme;
  setTheme: (theme: WorkspaceTheme) => void;
}>({
  theme: "light",
  setTheme: () => {},
});

export function WorkspaceThemeProvider({
  theme,
  setTheme,
  children,
}: {
  theme: WorkspaceTheme;
  setTheme: (theme: WorkspaceTheme) => void;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </WorkspaceThemeContext.Provider>
  );
}

export function useWorkspaceTheme() {
  return useContext(WorkspaceThemeContext);
}
