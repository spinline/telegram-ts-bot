import "dotenv/config";

interface EnvConfig {
  // API
  API_BASE_URL: string;
  API_TOKEN: string;

  // Telegram
  BOT_TOKEN: string;
  MINI_APP_URL: string;

  // Server
  PORT: number;
  PUBLIC_BASE_URL: string;

  // Squad
  INTERNAL_SQUAD_UUID: string;

  // Webhook
  WEBHOOK_SECRET: string;

  // Admin
  ADMIN_TELEGRAM_IDS: number[];

  // Internal
  INTERNAL_NOTIFY_TOKEN?: string;
}

function parseEnv(): EnvConfig {
  const adminIds = process.env.ADMIN_TELEGRAM_IDS
    ? process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => parseInt(id.trim()))
    : [];

  return {
    API_BASE_URL: process.env.API_BASE_URL || "",
    API_TOKEN: process.env.API_TOKEN || "",
    BOT_TOKEN: process.env.BOT_TOKEN || "",
    MINI_APP_URL: process.env.MINI_APP_URL || "",
    PORT: parseInt(process.env.PORT || "3000"),
    PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || "",
    INTERNAL_SQUAD_UUID: process.env.INTERNAL_SQUAD_UUID || "",
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || "",
    ADMIN_TELEGRAM_IDS: adminIds,
    INTERNAL_NOTIFY_TOKEN: process.env.INTERNAL_NOTIFY_TOKEN,
  };
}

export const env = parseEnv();

// Validate critical env vars
if (!env.BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is required!");
  process.exit(1);
}

if (!env.API_BASE_URL || !env.API_TOKEN) {
  console.error("❌ API_BASE_URL and API_TOKEN are required!");
  process.exit(1);
}

