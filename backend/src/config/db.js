import pg from "pg";
import env from "./env.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// An idle client can fail (for example if PostgreSQL restarts).
// Log it instead of crashing the whole server.
pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err.message);
});

// Run a single query: query("SELECT * FROM users WHERE id = $1", [id])
// Always pass values as the second argument (never build SQL with string
// concatenation), so SQL injection is impossible.
export const query = (text, params) => pool.query(text, params);

// Run several queries as one all-or-nothing transaction.
// Usage:
//   await withTransaction(async (client) => {
//     await client.query("INSERT ...", [...]);
//     await client.query("UPDATE ...", [...]);
//   });
// If anything throws, every change is rolled back.
export const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Rollback failed:", rollbackErr.message);
    }
    throw err;
  } finally {
    client.release();
  }
};

// Used at startup to confirm the database is reachable
export const testConnection = async () => {
  const { rows } = await pool.query("SELECT NOW() AS now");
  return rows[0].now;
};

export default pool;
