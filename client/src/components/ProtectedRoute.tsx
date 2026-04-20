import { Navigate } from "react-router-dom";

import { useAuth } from "../lib/auth-context";
import type { Role } from "../types/models";

type ProtectedRouteProps = {
  children: React.ReactNode;
  role: Role;
};

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="center-card">Loading workspace...</div>;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (user.role !== role) {
    return <Navigate replace to={user.role === "ADMIN" ? "/admin" : "/driver"} />;
  }

  return <>{children}</>;
}
