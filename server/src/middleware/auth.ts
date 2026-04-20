import type { NextFunction, Request, Response } from "express";

import { verifyToken } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        email: string;
        name: string;
        role: "ADMIN" | "DRIVER";
      };
    }
  }
}

export const requireAuth = (request: Request, response: Response, next: NextFunction) => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    response.status(401).json({ message: "Authentication required." });
    return;
  }

  try {
    const token = authorization.replace("Bearer ", "");
    const payload = verifyToken(token);

    request.authUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };

    next();
  } catch {
    response.status(401).json({ message: "Session expired. Please log in again." });
  }
};

export const requireRole =
  (role: "ADMIN" | "DRIVER") =>
  (request: Request, response: Response, next: NextFunction) => {
    if (!request.authUser || request.authUser.role !== role) {
      response.status(403).json({ message: "You do not have access to this resource." });
      return;
    }

    next();
  };
