import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import path from "node:path";

import { PrismaClient, Role } from "../generated/prisma/client.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const createShiftDate = (daysFromToday: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date;
};

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const driverPasswordHash = await bcrypt.hash("Driver@123", 10);

  await prisma.vehicleInspection.deleteMany();
  await prisma.shiftClaim.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      {
        name: "Fleet Admin",
        email: "admin@driverops.dev",
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
      },
      {
        name: "Aarav Sharma",
        email: "driver1@driverops.dev",
        passwordHash: driverPasswordHash,
        role: Role.DRIVER,
      },
      {
        name: "Priya Rao",
        email: "driver2@driverops.dev",
        passwordHash: driverPasswordHash,
        role: Role.DRIVER,
      },
    ],
  });

  await prisma.shift.createMany({
    data: [
      {
        title: "Morning Airport Route",
        date: createShiftDate(0),
        startTime: "06:00",
        endTime: "14:00",
        location: "North Hub",
        capacity: 2,
        notes: "Arrive 15 minutes early for dispatch briefing.",
      },
      {
        title: "Downtown Delivery Loop",
        date: createShiftDate(1),
        startTime: "08:00",
        endTime: "16:00",
        location: "Central Depot",
        capacity: 1,
        notes: "Photo-confirm high-value handoffs.",
      },
      {
        title: "Evening Shuttle Coverage",
        date: createShiftDate(2),
        startTime: "14:00",
        endTime: "22:00",
        location: "Airport Terminal B",
        capacity: 2,
        notes: "Monitor weather alerts before departure.",
      },
      {
        title: "Weekend Overflow Route",
        date: createShiftDate(3),
        startTime: "10:00",
        endTime: "18:00",
        location: "South Yard",
        capacity: 1,
        notes: "Inspect spare tire kit before shift start.",
      },
      {
        title: "Corporate Pickup Rotation",
        date: createShiftDate(4),
        startTime: "07:00",
        endTime: "15:00",
        location: "Business District",
        capacity: 1,
        notes: "Maintain guest-ready vehicle interior.",
      },
      {
        title: "Late Night Relay",
        date: createShiftDate(5),
        startTime: "18:00",
        endTime: "02:00",
        location: "Logistics Hub",
        capacity: 2,
        notes: "Fuel to at least 80 percent before departure.",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
