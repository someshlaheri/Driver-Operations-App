import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";

import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export function LoginPage() {
  const { login, user } = useAuth();
  useDocumentTitle("Sign In");
  const [form, setForm] = useState({
    email: "driver1@driverops.dev",
    password: "Driver@123",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate replace to={user.role === "ADMIN" ? "/admin" : "/driver"} />;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(form.email, form.password);
    } catch (issue) {
      setError(issue instanceof ApiError ? issue.message : "Unable to log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-aside">
        <div className="brand-mark">DO</div>
        <p className="eyebrow">Driver Operations</p>
        <h1>Keep dispatch, shift check-ins, and vehicle inspections in one place.</h1>
        <p className="subtle auth-lead">
          A simple internal workspace for drivers and operations staff. Drivers claim shifts and
          upload inspection details, while admins monitor coverage and review compliance.
        </p>
        <div className="auth-note-list">
          <div className="auth-note-card">
            <strong>Driver demo</strong>
            <span>driver1@driverops.dev / Driver@123</span>
          </div>
          <div className="auth-note-card">
            <strong>Admin demo</strong>
            <span>admin@driverops.dev / Admin@123</span>
          </div>
          <div className="auth-note-card">
            <strong>Typical flow</strong>
            <span>Claim a shift, start work, submit inspection evidence, and close the shift.</span>
          </div>
        </div>
      </section>

      <section className="auth-card-wrap">
        <form className="panel auth-panel" onSubmit={submit}>
          <div className="auth-panel-head">
            <div>
              <p className="eyebrow">Welcome back</p>
              <h2>Sign in</h2>
            </div>
            <p className="subtle">
              New driver? <Link className="inline-link" to="/register">Create an account</Link>
            </p>
          </div>

          <label className="field">
            <span>Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
            />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Open workspace"}
          </button>
        </form>
      </section>
    </div>
  );
}
