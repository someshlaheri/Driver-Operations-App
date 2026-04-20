import { Router } from "express";
import multer from "multer";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { endOfRange, startOfToday } from "../utils/date.js";
import { serializeClaim, serializeShift } from "../utils/serializers.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const inspectionSchema = z.object({
  vehicleNumber: z.string().min(2),
  mileage: z.coerce.number().int().min(0),
  fuelPercent: z.coerce.number().int().min(0).max(100),
  cleanliness: z.coerce.number().int().min(1).max(5),
  issues: z.string().max(1000).default(""),
});

export const driverRouter = Router();

driverRouter.use(requireAuth, requireRole("DRIVER"));

driverRouter.get("/dashboard", async (request, response) => {
  const start = startOfToday();
  const end = endOfRange(start, 7);
  const userId = request.authUser!.id;

  const [shifts, claims] = await Promise.all([
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
    prisma.shiftClaim.findMany({
      where: {
        driverId: userId,
      },
      orderBy: [{ shift: { date: "asc" } }, { shift: { startTime: "asc" } }],
      include: {
        shift: true,
        inspection: true,
      },
    }),
  ]);

  response.json({
    shifts: shifts.map((shift) => serializeShift(shift, userId)),
    myClaims: claims.map((claim) => serializeClaim(claim)),
    stats: {
      claimed: claims.filter((claim) => claim.status === "CLAIMED").length,
      active: claims.filter((claim) => claim.status === "STARTED").length,
      completed: claims.filter((claim) => claim.status === "COMPLETED").length,
    },
  });
});

driverRouter.post("/shifts/:shiftId/claim", async (request, response) => {
  const shiftId = String(request.params.shiftId);
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      claims: true,
    },
  });

  if (!shift) {
    response.status(404).json({ message: "Shift not found." });
    return;
  }

  const existingClaim = shift.claims.find((claim) => claim.driverId === request.authUser!.id);
  if (existingClaim) {
    response.status(400).json({ message: "You have already claimed this shift." });
    return;
  }

  if (shift.claims.length >= shift.capacity) {
    response.status(400).json({ message: "This shift is already full." });
    return;
  }

  await prisma.shiftClaim.create({
    data: {
      shiftId: shift.id,
      driverId: request.authUser!.id,
    },
  });

  response.status(201).json({ message: "Shift claimed successfully." });
});

driverRouter.post("/claims/:claimId/start", async (request, response) => {
  const claimId = String(request.params.claimId);
  const claim = await prisma.shiftClaim.findUnique({
    where: { id: claimId },
  });

  if (!claim || claim.driverId !== request.authUser!.id) {
    response.status(404).json({ message: "Shift claim not found." });
    return;
  }

  if (claim.status !== "CLAIMED") {
    response.status(400).json({ message: "Only claimed shifts can be started." });
    return;
  }

  await prisma.shiftClaim.update({
    where: { id: claim.id },
    data: {
      status: "STARTED",
      startedAt: new Date(),
    },
  });

  response.json({ message: "Shift started." });
});

driverRouter.post(
  "/claims/:claimId/inspection",
  upload.single("photo"),
  async (request, response) => {
    const claimId = String(request.params.claimId);
    const claim = await prisma.shiftClaim.findUnique({
      where: { id: claimId },
      include: {
        inspection: true,
      },
    });

    if (!claim || claim.driverId !== request.authUser!.id) {
      response.status(404).json({ message: "Shift claim not found." });
      return;
    }

    if (claim.status !== "STARTED") {
      response.status(400).json({ message: "Start the shift before submitting an inspection." });
      return;
    }

    if (claim.inspection) {
      response.status(400).json({ message: "An inspection already exists for this shift." });
      return;
    }

    if (!request.file) {
      response.status(400).json({ message: "A vehicle photo is required." });
      return;
    }

    const payload = inspectionSchema.parse(request.body);

    await prisma.vehicleInspection.create({
      data: {
        claimId: claim.id,
        driverId: request.authUser!.id,
        vehicleNumber: payload.vehicleNumber,
        mileage: payload.mileage,
        fuelPercent: payload.fuelPercent,
        cleanliness: payload.cleanliness,
        issues: payload.issues,
        photoData: Uint8Array.from(request.file.buffer),
        photoMimeType: request.file.mimetype,
      },
    });

    response.status(201).json({ message: "Inspection submitted." });
  },
);

driverRouter.post("/claims/:claimId/end", async (request, response) => {
  const claimId = String(request.params.claimId);
  const claim = await prisma.shiftClaim.findUnique({
    where: { id: claimId },
    include: {
      inspection: true,
    },
  });

  if (!claim || claim.driverId !== request.authUser!.id) {
    response.status(404).json({ message: "Shift claim not found." });
    return;
  }

  if (claim.status !== "STARTED") {
    response.status(400).json({ message: "Only started shifts can be completed." });
    return;
  }

  if (!claim.inspection) {
    response.status(400).json({ message: "Submit the inspection before ending the shift." });
    return;
  }

  await prisma.shiftClaim.update({
    where: { id: claim.id },
    data: {
      status: "COMPLETED",
      endedAt: new Date(),
    },
  });

  response.json({ message: "Shift completed." });
});
