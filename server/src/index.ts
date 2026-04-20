import path from "node:path";

import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";

import { env } from "./env.js";
import { prisma } from "./lib/prisma.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { driverRouter } from "./routes/driver.js";

const clientDist = path.resolve(process.cwd(), "../client/dist");

const app = express();

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/driver", driverRouter);
app.use("/api/admin", adminRouter);

app.get("/api/inspections/:inspectionId/photo", async (request, response) => {
  const inspection = await prisma.vehicleInspection.findUnique({
    where: { id: request.params.inspectionId },
    select: {
      photoData: true,
      photoMimeType: true,
    },
  });

  if (!inspection) {
    response.status(404).send("Not found");
    return;
  }

  response.setHeader("Content-Type", inspection.photoMimeType);
  response.send(Buffer.from(inspection.photoData));
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Invalid request.",
      details: error.issues.map((issue) => issue.message),
    });
    return;
  }

  console.error(error);
  response.status(500).json({ message: "Something went wrong." });
});

app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});
