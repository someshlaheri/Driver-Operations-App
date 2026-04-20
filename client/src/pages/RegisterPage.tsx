import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";

import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import type { Role } from "../types/models";

export function RegisterPage() {
  const { register, user } = useAuth();
  useDocumentTitle("Register");
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "DRIVER" as Role,
    password: "",
    confirmPassword: "",
    adminCode: "",
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
      await register(
        form.name,
        form.email,
        form.role,
        form.password,
        form.confirmPassword,
        form.role === "ADMIN" ? form.adminCode : undefined,
      );
    } catch (issue) {
      setError(issue instanceof ApiError ? issue.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-aside">
        <div className="brand-mark">DO</div>
        <p className="eyebrow">Driver Operations</p>
        <h1>Create an account for drivers or operations staff.</h1>
        <p className="subtle auth-lead">
          Driver registration is open. Admin registration is available too, but requires an
          internal code so elevated access stays controlled.
        </p>
        <div className="auth-note-list">
          <div className="auth-note-card">
            <strong>Quick setup</strong>
            <span>Create an account and enter the workflow immediately.</span>
          </div>
          <div className="auth-note-card">
            <strong>Clear permissions</strong>
            <span>Shift capacity, inspection steps, and role access are enforced by the API.</span>
          </div>
          <div className="auth-note-card">
            <strong>Operations visibility</strong>
            <span>Claims and inspections feed directly into the admin workspace for review.</span>
          </div>
        </div>
      </section>

      <section className="auth-card-wrap">
        <form className="panel auth-panel" onSubmit={submit}>
          <div className="auth-panel-head">
            <div>
              <p className="eyebrow">Create account</p>
              <h2>Create workspace account</h2>
            </div>
            <p className="subtle">
              Already have an account? <Link className="inline-link" to="/login">Sign in</Link>
            </p>
          </div>

          <label className="field">
            <span>Full name</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
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
            <span>Account type</span>
            <select
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as Role,
                  adminCode: event.target.value === "ADMIN" ? current.adminCode : "",
                }))
              }
            >
              <option value="DRIVER">Driver</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          {form.role === "ADMIN" ? (
            <label className="field">
              <span>Admin registration code</span>
              <input
                required
                type="password"
                value={form.adminCode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, adminCode: event.target.value }))
                }
              />
            </label>
          ) : null}
          <div className="two-column auth-columns">
            <label className="field">
              <span>Password</span>
              <input
                required
                minLength={8}
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input
                required
                minLength={8}
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
              />
            </label>
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : `Create ${form.role === "ADMIN" ? "admin" : "driver"} account`}
          </button>
        </form>
      </section>
    </div>
  );
}
