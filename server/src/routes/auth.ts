import { Router } from "express";
import { z } from "zod";

import { hashPassword, signToken, verifyPassword } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { serializeUser } from "../utils/serializers.js";

const ADMIN_REGISTRATION_CODE = "OPS-ADMIN-2026";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.email(),
    role: z.enum(["DRIVER", "ADMIN"]).default("DRIVER"),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
    adminCode: z.string().trim().optional(),
  })
  .refine((payload) => payload.password === payload.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((payload) => payload.role === "DRIVER" || payload.adminCode, {
    path: ["adminCode"],
    message: "Admin registration code is required for admin accounts.",
  });

export const authRouter = Router();

authRouter.post("/register", async (request, response) => {
  const payload = registerSchema.parse(request.body);
  const email = payload.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    response.status(409).json({ message: "An account with this email already exists." });
    return;
  }

  if (payload.role === "ADMIN" && payload.adminCode !== ADMIN_REGISTRATION_CODE) {
    response.status(403).json({ message: "Invalid admin registration code." });
    return;
  }

  const passwordHash = await hashPassword(payload.password);

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email,
      passwordHash,
      role: payload.role,
    },
  });

  const safeUser = serializeUser(user);

  response.status(201).json({
    token: signToken(safeUser),
    user: safeUser,
  });
});

authRouter.post("/login", async (request, response) => {
  const payload = loginSchema.parse(request.body);

  const user = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
  });

  if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
    response.status(401).json({ message: "Invalid email or password." });
    return;
  }

  const safeUser = serializeUser(user);

  response.json({
    token: signToken(safeUser),
    user: safeUser,
  });
});

authRouter.get("/me", requireAuth, async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.authUser!.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    response.status(404).json({ message: "User not found." });
    return;
  }

  response.json({ user });
});
