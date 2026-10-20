import app from "./app.js";
import env from "./config/env.js";
import pool, { testConnection } from "./config/db.js";
import { deleteExpired as deleteExpiredInvites } from "./models/invite.model.js";
import { deleteExpiredRefreshTokens } from "./services/token.service.js";
import { deleteExpiredDemos } from "./models/demo.model.js";

const start = async () => {
  try {
    await testConnection();
    console.log("PostgreSQL connected");
  } catch (err) {
    console.error("Could not connect to PostgreSQL:", err.message);
    console.error("Check DATABASE_URL in backend/.env and that PostgreSQL is running.");
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}/api (${env.nodeEnv})`);
  });

  // Hourly cleanup of expired refresh tokens and invites
  const cleanup = setInterval(async () => {
    try {
      await deleteExpiredRefreshTokens();
      await deleteExpiredInvites();
      await deleteExpiredDemos();
    } catch (err) {
      console.error("Cleanup failed:", err.message);
    }
  }, 60 * 60 * 1000);
  cleanup.unref();

  // Clean shutdown: stop accepting requests, then close the database pool
  const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

start();
