import { Navigate, Route, Routes } from "react-router-dom";

import "./App.css";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./lib/auth-context";
import { AdminDashboard } from "./pages/AdminDashboard";
import { DriverDashboard } from "./pages/DriverDashboard";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

function HomeRedirect() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="center-card">Loading workspace...</div>;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return <Navigate replace to={user.role === "ADMIN" ? "/admin" : "/driver"} />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<HomeRedirect />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/register" />
      <Route
        path="/driver"
        element={
          <ProtectedRoute role="DRIVER">
            <DriverDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
