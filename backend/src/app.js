import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { AVATAR_DIR } from "./middleware/upload.middleware.js";
import env from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import routes from "./routes/index.js";


const app = express();

// Behind a proxy (Render, Railway, Nginx) the limiter needs the real client IP.
// Uncomment when you deploy:
app.set("trust proxy", 1);

app.disable("x-powered-by");
app.use(helmet());

// Only your frontend may call the API, and cookies are allowed
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

// Small body limit: no endpoint needs more than a few KB
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Development only: print every request and its status code
if (!env.isProduction) {
  app.use((req, res, next) => {
    res.on("finish", () => console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode}`));
    next();
  });
}

// Profile pictures. Helmet blocks cross-origin image loading by default,
// and the frontend (port 5173) is a different origin, so allow it here only.
app.use(
  "/uploads/avatars",
  (req, res, next) => {
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(AVATAR_DIR, { maxAge: "7d", immutable: true })
);

app.use("/api", routes);

// Order matters: 404 first, error handler last
app.use(notFound);
app.use(errorHandler);

export default app;
