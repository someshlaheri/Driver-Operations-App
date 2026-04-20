import type {
  InspectionReviewStatus,
  Shift,
  ShiftClaim,
  User,
  VehicleInspection,
} from "../../generated/prisma/client.js";

export const serializeUser = (user: Pick<User, "id" | "name" | "email" | "role">) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

type ClaimWithRelations = ShiftClaim & {
  shift: Shift;
  inspection: VehicleInspection | null;
  driver?: Pick<User, "id" | "name" | "email">;
};

export const serializeClaim = (claim: ClaimWithRelations) => ({
  id: claim.id,
  status: claim.status,
  claimedAt: claim.claimedAt.toISOString(),
  startedAt: claim.startedAt?.toISOString() ?? null,
  endedAt: claim.endedAt?.toISOString() ?? null,
  shift: {
    id: claim.shift.id,
    title: claim.shift.title,
    date: claim.shift.date.toISOString(),
    startTime: claim.shift.startTime,
    endTime: claim.shift.endTime,
    location: claim.shift.location,
    capacity: claim.shift.capacity,
    notes: claim.shift.notes,
  },
  driver: claim.driver
    ? {
        id: claim.driver.id,
        name: claim.driver.name,
        email: claim.driver.email,
      }
    : null,
  inspection: claim.inspection
    ? {
        id: claim.inspection.id,
        vehicleNumber: claim.inspection.vehicleNumber,
        mileage: claim.inspection.mileage,
        fuelPercent: claim.inspection.fuelPercent,
        cleanliness: claim.inspection.cleanliness,
        issues: claim.inspection.issues,
        reviewStatus: claim.inspection.reviewStatus,
        reviewNotes: claim.inspection.reviewNotes,
        submittedAt: claim.inspection.submittedAt.toISOString(),
        photoUrl: `/api/inspections/${claim.inspection.id}/photo`,
      }
    : null,
});

type ShiftWithClaims = Shift & {
  claims: (ShiftClaim & { driver: Pick<User, "id" | "name" | "email"> })[];
};

export const serializeShift = (shift: ShiftWithClaims, currentUserId?: string) => ({
  id: shift.id,
  title: shift.title,
  date: shift.date.toISOString(),
  startTime: shift.startTime,
  endTime: shift.endTime,
  location: shift.location,
  capacity: shift.capacity,
  notes: shift.notes,
  claimedCount: shift.claims.length,
  remainingSpots: Math.max(shift.capacity - shift.claims.length, 0),
  myClaimId: shift.claims.find((claim) => claim.driverId === currentUserId)?.id ?? null,
  claims: shift.claims.map((claim) => ({
    id: claim.id,
    status: claim.status,
    driver: {
      id: claim.driver.id,
      name: claim.driver.name,
      email: claim.driver.email,
    },
  })),
});

export const serializeInspectionReview = (
  inspection: VehicleInspection & {
    driver: Pick<User, "id" | "name" | "email">;
    claim: ShiftClaim & { shift: Shift };
  },
) => ({
  id: inspection.id,
  vehicleNumber: inspection.vehicleNumber,
  mileage: inspection.mileage,
  fuelPercent: inspection.fuelPercent,
  cleanliness: inspection.cleanliness,
  issues: inspection.issues,
  reviewStatus: inspection.reviewStatus as InspectionReviewStatus,
  reviewNotes: inspection.reviewNotes,
  submittedAt: inspection.submittedAt.toISOString(),
  photoUrl: `/api/inspections/${inspection.id}/photo`,
  driver: inspection.driver,
  shift: {
    id: inspection.claim.shift.id,
    title: inspection.claim.shift.title,
    date: inspection.claim.shift.date.toISOString(),
    startTime: inspection.claim.shift.startTime,
    endTime: inspection.claim.shift.endTime,
    location: inspection.claim.shift.location,
  },
});
