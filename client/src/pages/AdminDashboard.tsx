import { useCallback, useEffect, useState } from "react";

import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { ApiError, apiRequest } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import type { AdminDashboardData, ReviewStatus } from "../types/models";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const joinMeta = (...parts: Array<string | number>) => parts.join(" / ");

export function AdminDashboard() {
  const { token } = useAuth();
  useDocumentTitle("Admin Dashboard");
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [shiftForm, setShiftForm] = useState({
    title: "",
    date: "",
    startTime: "08:00",
    endTime: "16:00",
    location: "",
    capacity: "1",
    notes: "",
  });
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    const response = await apiRequest<AdminDashboardData>("/api/admin/dashboard", { token });
    setData(response);
  }, [token]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const runAction = async (key: string, action: () => Promise<void>) => {
    setBusyKey(key);
    setError(null);
    setMessage(null);

    try {
      await action();
      await loadDashboard();
    } catch (issue) {
      setError(issue instanceof ApiError ? issue.message : "Action failed.");
    } finally {
      setBusyKey(null);
    }
  };

  if (!data) {
    return <div className="center-card">Loading admin dashboard...</div>;
  }

  return (
    <AppShell
      title="Admin Operations Dashboard"
      subtitle="Monitor staffing, inspection health, and driver activity from one operational view."
    >
      <section className="metrics-grid">
        <article className="panel metric-card">
          <span>Drivers</span>
          <strong>{data.overview.totalDrivers}</strong>
        </article>
        <article className="panel metric-card">
          <span>Open slots</span>
          <strong>{data.overview.openSlots}</strong>
        </article>
        <article className="panel metric-card">
          <span>Pending inspections</span>
          <strong>{data.overview.pendingInspections}</strong>
        </article>
        <article className="panel metric-card">
          <span>Active shifts</span>
          <strong>{data.overview.activeShifts}</strong>
        </article>
      </section>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <section className="admin-grid">
        <div className="stack">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Shift planning</p>
                <h2>Create shift</h2>
              </div>
            </div>
            <form
              className="inspection-form"
              onSubmit={(event) => {
                event.preventDefault();
                void runAction("create-shift", async () => {
                  const response = await apiRequest<{ message: string }>("/api/admin/shifts", {
                    method: "POST",
                    token,
                    body: JSON.stringify({
                      ...shiftForm,
                      capacity: Number(shiftForm.capacity),
                    }),
                  });
                  setMessage(response.message);
                  setShiftForm({
                    title: "",
                    date: "",
                    startTime: "08:00",
                    endTime: "16:00",
                    location: "",
                    capacity: "1",
                    notes: "",
                  });
                });
              }}
            >
              <div className="two-column">
                <label className="field">
                  <span>Shift title</span>
                  <input
                    required
                    value={shiftForm.title}
                    onChange={(event) =>
                      setShiftForm((current) => ({ ...current, title: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Date</span>
                  <input
                    required
                    type="date"
                    value={shiftForm.date}
                    onChange={(event) =>
                      setShiftForm((current) => ({ ...current, date: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Start</span>
                  <input
                    required
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(event) =>
                      setShiftForm((current) => ({ ...current, startTime: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>End</span>
                  <input
                    required
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(event) =>
                      setShiftForm((current) => ({ ...current, endTime: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Location</span>
                  <input
                    required
                    value={shiftForm.location}
                    onChange={(event) =>
                      setShiftForm((current) => ({ ...current, location: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Capacity</span>
                  <input
                    max="10"
                    min="1"
                    required
                    type="number"
                    value={shiftForm.capacity}
                    onChange={(event) =>
                      setShiftForm((current) => ({ ...current, capacity: event.target.value }))
                    }
                  />
                </label>
              </div>
              <label className="field">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={shiftForm.notes}
                  onChange={(event) =>
                    setShiftForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </label>
              <button className="button" disabled={busyKey === "create-shift"} type="submit">
                {busyKey === "create-shift" ? "Saving..." : "Create shift"}
              </button>
            </form>
          </div>

          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Driver roster</p>
                <h2>Driver status</h2>
              </div>
            </div>
            <div className="table-list">
              {data.drivers.map((driver) => (
                <article className="table-row" key={driver.id}>
                  <div>
                    <strong>{driver.name}</strong>
                    <p className="subtle">{driver.email}</p>
                  </div>
                  <div className="table-meta">
                    <span>{driver.completedShifts} completed</span>
                    <StatusBadge value={driver.lastInspectionStatus} />
                    <span>{driver.activeShift ? "On shift" : "Available"}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Coverage</p>
                <h2>Upcoming shifts</h2>
              </div>
            </div>
            <div className="list">
              {data.shifts.map((shift) => (
                <article className="shift-card" key={shift.id}>
                  <div className="row-between">
                    <div>
                      <h3>{shift.title}</h3>
                      <p className="subtle">
                        {joinMeta(formatDate(shift.date), `${shift.startTime} - ${shift.endTime}`)}
                      </p>
                      <p className="subtle">
                        {joinMeta(shift.location, `${shift.claimedCount}/${shift.capacity} claimed`)}
                      </p>
                    </div>
                    <span className="pill">
                      <strong>{shift.remainingSpots}</strong>
                      <span>open</span>
                    </span>
                  </div>
                  {shift.claims.length > 0 ? (
                    <div className="avatars">
                      {shift.claims.map((claim) => (
                        <span className="mini-pill" key={claim.id}>
                          {claim.driver.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="subtle">No drivers have claimed this shift yet.</p>
                  )}
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Inspection queue</p>
                <h2>Recent inspections</h2>
              </div>
            </div>
            <div className="list">
              {data.inspections.map((inspection) => (
                <article className="claim-card" key={inspection.id}>
                  <div className="row-between">
                    <div>
                      <h3>{inspection.driver.name}</h3>
                      <p className="subtle">
                        {joinMeta(inspection.shift.title, formatDate(inspection.shift.date))}
                      </p>
                    </div>
                    <StatusBadge value={inspection.reviewStatus} />
                  </div>
                  <p className="subtle">
                    {joinMeta(
                      `Vehicle ${inspection.vehicleNumber}`,
                      `Mileage ${inspection.mileage}`,
                      `Fuel ${inspection.fuelPercent}%`,
                      `Cleanliness ${inspection.cleanliness}/5`,
                    )}
                  </p>
                  <p className="notes">{inspection.issues || "No issues reported."}</p>
                  <a className="text-link" href={inspection.photoUrl} rel="noreferrer" target="_blank">
                    Open uploaded photo
                  </a>
                  <div className="review-actions">
                    <textarea
                      placeholder="Review notes"
                      rows={2}
                      value={reviewNotes[inspection.id] ?? inspection.reviewNotes ?? ""}
                      onChange={(event) =>
                        setReviewNotes((current) => ({
                          ...current,
                          [inspection.id]: event.target.value,
                        }))
                      }
                    />
                    <div className="action-row">
                      {(["APPROVED", "FLAGGED", "PENDING"] as ReviewStatus[]).map((status) => (
                        <button
                          className="button button-secondary"
                          disabled={busyKey === `${inspection.id}-${status}`}
                          key={status}
                          onClick={() =>
                            void runAction(`${inspection.id}-${status}`, async () => {
                              const response = await apiRequest<{ message: string }>(
                                `/api/admin/inspections/${inspection.id}/review`,
                                {
                                  method: "PATCH",
                                  token,
                                  body: JSON.stringify({
                                    reviewStatus: status,
                                    reviewNotes: reviewNotes[inspection.id] ?? inspection.reviewNotes ?? "",
                                  }),
                                },
                              );
                              setMessage(response.message);
                            })
                          }
                          type="button"
                        >
                          {status.toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
