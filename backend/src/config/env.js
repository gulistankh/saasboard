import dotenv from "dotenv";

dotenv.config();

const required = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("Check your backend/.env file.");
  process.exit(1);
}

if (
  process.env.JWT_ACCESS_SECRET.length < 32 ||
  process.env.JWT_REFRESH_SECRET.length < 32
) {
  console.error("JWT secrets must be at least 32 characters long.");
  process.exit(1);
}

if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
  console.error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.");
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV || "development";

const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: Number(process.env.PORT) || 5000,
  // Public address of the API, used to build image URLs
  publicUrl:
    process.env.API_PUBLIC_URL ||
    `http://localhost:${Number(process.env.PORT) || 5000}`,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  databaseUrl: process.env.DATABASE_URL,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: "15m",
    refreshExpiresDays: 7,
  },

  // Lifetimes of the one-time links sent by email
  tokens: {
    verifyEmailHours: 24,
    resetPasswordHours: 1,
    inviteDays: 7,
  },

  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "SaaSBoard <no-reply@saasboard.local>",
  },
};

export default env;
