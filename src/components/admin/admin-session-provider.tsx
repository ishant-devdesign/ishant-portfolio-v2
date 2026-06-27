"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AdminContext, AdminViewMode } from "@/lib/auth/types";
import { ClientEffects } from "../layout/client-effects";

type AdminSessionContextValue = AdminContext & {
  viewMode: AdminViewMode;
  setViewMode: (mode: AdminViewMode) => void;
  toggleViewMode: () => void;
};

const AdminSessionContext = createContext<AdminSessionContextValue>({
  user: null,
  isAllowedAdmin: false,
  authEnabled: false,
  viewMode: "public",
  setViewMode: () => undefined,
  toggleViewMode: () => undefined,
});

export function useAdminSession() {
  return useContext(AdminSessionContext);
}

export function AdminSessionProvider({
  children,
  initialAdmin,
}: {
  children: React.ReactNode;
  initialAdmin: AdminContext;
}) {
  const [viewMode, setViewMode] = useState<AdminViewMode>(
    initialAdmin.isAllowedAdmin ? "admin" : "public",
  );

  useEffect(() => {
    document.body.dataset.adminView = viewMode;
    return () => {
      delete document.body.dataset.adminView;
    };
  }, [viewMode]);

  const value = useMemo(
    () => ({
      ...initialAdmin,
      viewMode,
      setViewMode,
      toggleViewMode: () =>
        setViewMode((current) => (current === "admin" ? "public" : "admin")),
    }),
    [initialAdmin, viewMode],
  );

  return (
    <AdminSessionContext.Provider value={value}>
      <ClientEffects />
      {children}
    </AdminSessionContext.Provider>
  );
}
