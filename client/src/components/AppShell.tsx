import type { PropsWithChildren } from "react";

import { useAuth } from "../lib/auth-context";

type AppShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-title-group">
          <div className="brand-row">
            <div className="brand-mark brand-mark-small">DO</div>
            <p className="eyebrow">Driver Operations</p>
          </div>
          <h1>{title}</h1>
          <p className="subtle">{subtitle}</p>
        </div>
        <div className="topbar-actions">
          <div className="pill">
            <strong>{user?.name}</strong>
            <span>{user?.role === "ADMIN" ? "Admin" : "Driver"}</span>
          </div>
          <button className="button button-secondary" onClick={logout} type="button">
            Log out
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
