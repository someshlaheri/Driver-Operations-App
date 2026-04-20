export type Role = "ADMIN" | "DRIVER";
export type ClaimStatus = "CLAIMED" | "STARTED" | "COMPLETED";
export type ReviewStatus = "PENDING" | "APPROVED" | "FLAGGED";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Shift = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  notes: string | null;
  claimedCount: number;
  remainingSpots: number;
  myClaimId: string | null;
  claims: Array<{
    id: string;
    status: ClaimStatus;
    driver: {
      id: string;
      name: string;
      email: string;
    };
  }>;
};

export type Claim = {
  id: string;
  status: ClaimStatus;
  claimedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  shift: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    capacity: number;
    notes: string | null;
  };
  driver: {
    id: string;
    name: string;
    email: string;
  } | null;
  inspection: {
    id: string;
    vehicleNumber: string;
    mileage: number;
    fuelPercent: number;
    cleanliness: number;
    issues: string;
    reviewStatus: ReviewStatus;
    reviewNotes: string | null;
    submittedAt: string;
    photoUrl: string;
  } | null;
};

export type DriverDashboardData = {
  shifts: Shift[];
  myClaims: Claim[];
  stats: {
    claimed: number;
    active: number;
    completed: number;
  };
};

export type AdminDashboardData = {
  overview: {
    totalDrivers: number;
    openSlots: number;
    pendingInspections: number;
    activeShifts: number;
  };
  drivers: Array<{
    id: string;
    name: string;
    email: string;
    completedShifts: number;
    activeShift: boolean;
    lastInspectionStatus: ReviewStatus;
  }>;
  shifts: Shift[];
  inspections: Array<{
    id: string;
    vehicleNumber: string;
    mileage: number;
    fuelPercent: number;
    cleanliness: number;
    issues: string;
    reviewStatus: ReviewStatus;
    reviewNotes: string | null;
    submittedAt: string;
    photoUrl: string;
    driver: {
      id: string;
      name: string;
      email: string;
    };
    shift: {
      id: string;
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      location: string;
    };
  }>;
  recentClaims: Claim[];
};
