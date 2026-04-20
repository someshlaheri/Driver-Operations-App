import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { endOfRange, startOfToday } from "../utils/date.js";
import { serializeClaim, serializeInspectionReview, serializeShift } from "../utils/serializers.js";

const shiftSchema = z.object({
  title: z.string().min(3),
  date: z.iso.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().min(2),
  capacity: z.coerce.number().int().min(1).max(10),
  notes: z.string().max(500).optional().or(z.literal("")),
});

const inspectionReviewSchema = z.object({
  reviewStatus: z.enum(["PENDING", "APPROVED", "FLAGGED"]),
  reviewNotes: z.string().max(500).optional().or(z.literal("")),
});

const toShiftDate = (value: string) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/dashboard", async (_request, response) => {
  const start = startOfToday();
  const end = endOfRange(start, 7);

  const [drivers, shifts, inspections, claims] = await Promise.all([
    prisma.user.findMany({
      where: { role: "DRIVER" },
      orderBy: { name: "asc" },
      include: {
        shiftClaims: {
          include: {
            shift: true,
            inspection: true,
          },
        },
      },
    }),
    prisma.shift.findMany({
      where: {
        date: {
          gte: start,
          lt: end,
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        claims: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.vehicleInspection.findMany({
      orderBy: { submittedAt: "desc" },
      take: 20,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        claim: {
          include: {
            shift: true,
          },
        },
      },
    }),
    prisma.shiftClaim.findMany({
      include: {
        shift: true,
        inspection: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { claimedAt: "desc" },
      take: 20,
    }),
  ]);

  response.json({
    overview: {
      totalDrivers: drivers.length,
      openSlots: shifts.reduce((total, shift) => total + Math.max(shift.capacity - shift.claims.length, 0), 0),
      pendingInspections: inspections.filter((inspection) => inspection.reviewStatus === "PENDING").length,
      activeShifts: claims.filter((claim) => claim.status === "STARTED").length,
    },
    drivers: drivers.map((driver) => ({
      id: driver.id,
      name: driver.name,
      email: driver.email,
      completedShifts: driver.shiftClaims.filter((claim) => claim.status === "COMPLETED").length,
      activeShift: driver.shiftClaims.some((claim) => claim.status === "STARTED"),
      lastInspectionStatus:
        driver.shiftClaims
          .flatMap((claim) => (claim.inspection ? [claim.inspection.reviewStatus] : []))
          .at(-1) ?? "PENDING",
    })),
    shifts: shifts.map((shift) => serializeShift(shift)),
    inspections: inspections.map((inspection) => serializeInspectionReview(inspection)),
    recentClaims: claims.map((claim) => serializeClaim(claim)),
  });
});

adminRouter.post("/shifts", async (request, response) => {
  const payload = shiftSchema.parse(request.body);

  const shift = await prisma.shift.create({
    data: {
      title: payload.title,
      date: toShiftDate(payload.date),
      startTime: payload.startTime,
      endTime: payload.endTime,
      location: payload.location,
      capacity: payload.capacity,
      notes: payload.notes || null,
    },
  });

  response.status(201).json({ shiftId: shift.id, message: "Shift created." });
});

adminRouter.patch("/shifts/:shiftId", async (request, response) => {
  const payload = shiftSchema.partial().parse(request.body);

  const existingShift = await prisma.shift.findUnique({
    where: { id: request.params.shiftId },
  });

  if (!existingShift) {
    response.status(404).json({ message: "Shift not found." });
    return;
  }

  await prisma.shift.update({
    where: { id: existingShift.id },
    data: {
      title: payload.title ?? undefined,
      date: payload.date ? toShiftDate(payload.date) : undefined,
      startTime: payload.startTime ?? undefined,
      endTime: payload.endTime ?? undefined,
      location: payload.location ?? undefined,
      capacity: payload.capacity ?? undefined,
      notes: payload.notes === undefined ? undefined : payload.notes || null,
    },
  });

  response.json({ message: "Shift updated." });
});

adminRouter.patch("/inspections/:inspectionId/review", async (request, response) => {
  const payload = inspectionReviewSchema.parse(request.body);

  const inspection = await prisma.vehicleInspection.findUnique({
    where: { id: request.params.inspectionId },
  });

  if (!inspection) {
    response.status(404).json({ message: "Inspection not found." });
    return;
  }

  await prisma.vehicleInspection.update({
    where: { id: inspection.id },
    data: {
      reviewStatus: payload.reviewStatus,
      reviewNotes: payload.reviewNotes || null,
    },
  });

  response.json({ message: "Inspection review updated." });
});
