import type { ClaimStatus, ReviewStatus } from "../types/models";

type StatusBadgeProps = {
  value: ClaimStatus | ReviewStatus;
};

export function StatusBadge({ value }: StatusBadgeProps) {
  return <span className={`status status-${value.toLowerCase()}`}>{value.toLowerCase()}</span>;
}
