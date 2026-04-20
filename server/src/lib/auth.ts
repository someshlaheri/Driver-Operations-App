import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../env.js";
import type { AuthUser } from "../types.js";

type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: AuthUser["role"];
};

export const hashPassword = (value: string) => bcrypt.hash(value, 10);

export const verifyPassword = (value: string, hash: string) => bcrypt.compare(value, hash);

export const signToken = (user: AuthUser) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    } satisfies JwtPayload,
    env.JWT_SECRET,
    { expiresIn: "7d" },
  );

export const verifyToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as JwtPayload;
