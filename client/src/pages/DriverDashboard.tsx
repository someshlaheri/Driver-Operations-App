import { useCallback, useEffect, useState } from "react";

import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { ApiError, apiRequest } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import type { Claim, DriverDashboardData } from "../types/models";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const joinMeta = (...parts: Array<string | number>) => parts.join(" / ");

export function DriverDashboard() {
  const { token } = useAuth();
  useDocumentTitle("Driver Dashboard");
  const [data, setData] = useState<DriverDashboardData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspectionForms, setInspectionForms] = useState<
    Record<
      string,
      {
        vehicleNumber: string;
        mileage: string;
        fuelPercent: string;
        cleanliness: string;
        issues: string;
        photo: File | null;
      }
    >
  >({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    const response = await apiRequest<DriverDashboardData>("/api/driver/dashboard", { token });
    setData(response);
  }, [token]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const runAction = async (key: string, action: () => Promise<void>) => {
    setMessage(null);
    setError(null);
    setBusyKey(key);

    try {
      await action();
      await loadDashboard();
    } catch (issue) {
      setError(issue instanceof ApiError ? issue.message : "Action failed.");
    } finally {
      setBusyKey(null);
    }
  };

  const submitInspection = async (claim: Claim) => {
    const form = inspectionForms[claim.id];
    if (!form?.photo) {
      setError("Please attach a vehicle photo before submitting.");
      return;
    }

    const body = new FormData();
    body.append("vehicleNumber", form.vehicleNumber);
    body.append("mileage", form.mileage);
    body.append("fuelPercent", form.fuelPercent);
    body.append("cleanliness", form.cleanliness);
    body.append("issues", form.issues);
    body.append("photo", form.photo);

    await runAction(`inspection-${claim.id}`, async () => {
      const response = await apiRequest<{ message: string }>(`/api/driver/claims/${claim.id}/inspection`, {
        method: "POST",
        body,
        token,
      });
      setMessage(response.message);
      setInspectionForms((current) => ({
        ...current,
        [claim.id]: {
          vehicleNumber: "",
          mileage: "",
          fuelPercent: "100",
          cleanliness: "5",
          issues: "",
          photo: null,
        },
      }));
    });
  };

  if (!data) {
    return <div className="center-card">Loading driver dashboard...</div>;
  }

  return (
    <AppShell
      title="Driver Dashboard"
      subtitle="Review open work, move through the shift flow, and keep inspection records complete."
    >
      <section className="metrics-grid metrics-grid-compact">
        <article className="panel metric-card">
          <span>Claimed</span>
          <strong>{data.stats.claimed}</strong>
        </article>
        <article className="panel metric-card">
          <span>Active</span>
          <strong>{data.stats.active}</strong>
        </article>
        <article className="panel metric-card">
          <span>Completed</span>
          <strong>{data.stats.completed}</strong>
        </article>
      </section>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <section className="dashboard-grid">
        <div className="stack">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Upcoming week</p>
                <h2>Available shifts</h2>
              </div>
            </div>
            <div className="list">
              {data.shifts.map((shift) => (
                <article className="shift-card" key={shift.id}>
                  <div className="shift-main">
                    <div>
                      <h3>{shift.title}</h3>
                      <p className="subtle">
                        {joinMeta(formatDate(shift.date), `${shift.startTime} - ${shift.endTime}`)}
                      </p>
                      <p className="subtle">
                        {joinMeta(shift.location, `${shift.remainingSpots} spots left`)}
                      </p>
                    </div>
                    <button
                      className="button"
                      disabled={busyKey === shift.id || !!shift.myClaimId || shift.remainingSpots === 0}
                      onClick={() =>
                        void runAction(shift.id, async () => {
                          const response = await apiRequest<{ message: string }>(
                            `/api/driver/shifts/${shift.id}/claim`,
                            {
                              method: "POST",
                              token,
                            },
                          );
                          setMessage(response.message);
                        })
                      }
                      type="button"
                    >
                      {shift.myClaimId
                        ? "Claimed"
                        : busyKey === shift.id
                          ? "Claiming..."
                          : shift.remainingSpots === 0
                            ? "Full"
                            : "Claim shift"}
                    </button>
                  </div>
                  {shift.notes ? <p className="notes">{shift.notes}</p> : null}
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Operational flow</p>
                <h2>My claims</h2>
              </div>
            </div>
            <div className="list">
              {data.myClaims.length === 0 ? (
                <p className="subtle">Claim a shift to see it here.</p>
              ) : (
                data.myClaims.map((claim) => {
                  const form = inspectionForms[claim.id] ?? {
                    vehicleNumber: "",
                    mileage: "",
                    fuelPercent: "100",
                    cleanliness: "5",
                    issues: "",
                    photo: null,
                  };

                  return (
                    <article className="claim-card" key={claim.id}>
                      <div className="row-between">
                        <div>
                          <h3>{claim.shift.title}</h3>
                          <p className="subtle">
                            {joinMeta(
                              formatDate(claim.shift.date),
                              `${claim.shift.startTime} - ${claim.shift.endTime}`,
                            )}
                          </p>
                        </div>
                        <StatusBadge value={claim.status} />
                      </div>

                      <div className="action-row">
                        <button
                          className="button"
                          disabled={claim.status !== "CLAIMED" || busyKey === `start-${claim.id}`}
                          onClick={() =>
                            void runAction(`start-${claim.id}`, async () => {
                              const response = await apiRequest<{ message: string }>(
                                `/api/driver/claims/${claim.id}/start`,
                                {
                                  method: "POST",
                                  token,
                                },
                              );
                              setMessage(response.message);
                            })
                          }
                          type="button"
                        >
                          {busyKey === `start-${claim.id}` ? "Starting..." : "Start shift"}
                        </button>
                        <button
                          className="button button-secondary"
                          disabled={
                            claim.status !== "STARTED" || !claim.inspection || busyKey === `end-${claim.id}`
                          }
                          onClick={() =>
                            void runAction(`end-${claim.id}`, async () => {
                              const response = await apiRequest<{ message: string }>(
                                `/api/driver/claims/${claim.id}/end`,
                                {
                                  method: "POST",
                                  token,
                                },
                              );
                              setMessage(response.message);
                            })
                          }
                          type="button"
                        >
                          {busyKey === `end-${claim.id}` ? "Ending..." : "End shift"}
                        </button>
                      </div>

                      {claim.status === "STARTED" && !claim.inspection ? (
                        <form
                          className="inspection-form"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void submitInspection(claim);
                          }}
                        >
                          <h4>Daily vehicle inspection</h4>
                          <div className="two-column">
                            <label className="field">
                              <span>Vehicle number</span>
                              <input
                                required
                                value={form.vehicleNumber}
                                onChange={(event) =>
                                  setInspectionForms((current) => ({
                                    ...current,
                                    [claim.id]: { ...form, vehicleNumber: event.target.value },
                                  }))
                                }
                              />
                            </label>
                            <label className="field">
                              <span>Mileage</span>
                              <input
                                required
                                min="0"
                                type="number"
                                value={form.mileage}
                                onChange={(event) =>
                                  setInspectionForms((current) => ({
                                    ...current,
                                    [claim.id]: { ...form, mileage: event.target.value },
                                  }))
                                }
                              />
                            </label>
                            <label className="field">
                              <span>Fuel %</span>
                              <input
                                required
                                max="100"
                                min="0"
                                type="number"
                                value={form.fuelPercent}
                                onChange={(event) =>
                                  setInspectionForms((current) => ({
                                    ...current,
                                    [claim.id]: { ...form, fuelPercent: event.target.value },
                                  }))
                                }
                              />
                            </label>
                            <label className="field">
                              <span>Cleanliness (1-5)</span>
                              <input
                                required
                                max="5"
                                min="1"
                                type="number"
                                value={form.cleanliness}
                                onChange={(event) =>
                                  setInspectionForms((current) => ({
                                    ...current,
                                    [claim.id]: { ...form, cleanliness: event.target.value },
                                  }))
                                }
                              />
                            </label>
                          </div>
                          <label className="field">
                            <span>Notes / issues</span>
                            <textarea
                              rows={3}
                              value={form.issues}
                              onChange={(event) =>
                                setInspectionForms((current) => ({
                                  ...current,
                                  [claim.id]: { ...form, issues: event.target.value },
                                }))
                              }
                            />
                          </label>
                          <label className="field">
                            <span>Vehicle photo</span>
                            <input
                              accept="image/*"
                              required
                              type="file"
                              onChange={(event) =>
                                setInspectionForms((current) => ({
                                  ...current,
                                  [claim.id]: {
                                    ...form,
                                    photo: event.target.files?.[0] ?? null,
                                  },
                                }))
                              }
                            />
                          </label>
                          <button
                            className="button"
                            disabled={busyKey === `inspection-${claim.id}`}
                            type="submit"
                          >
                            {busyKey === `inspection-${claim.id}` ? "Submitting..." : "Submit inspection"}
                          </button>
                        </form>
                      ) : null}

                      {claim.inspection ? (
                        <div className="inspection-summary">
                          <div className="row-between">
                            <h4>Inspection submitted</h4>
                            <StatusBadge value={claim.inspection.reviewStatus} />
                          </div>
                          <p className="subtle">
                            {joinMeta(
                              `Vehicle ${claim.inspection.vehicleNumber}`,
                              `${claim.inspection.fuelPercent}% fuel`,
                              `Cleanliness ${claim.inspection.cleanliness}/5`,
                            )}
                          </p>
                          <a
                            className="text-link"
                            href={claim.inspection.photoUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View uploaded photo
                          </a>
                          {claim.inspection.reviewNotes ? (
                            <p className="notes">{claim.inspection.reviewNotes}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
