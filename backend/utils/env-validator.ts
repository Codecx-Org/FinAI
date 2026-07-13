/**
 * Environment variable validator.
 * Called at startup — throws immediately if any required var is missing.
 * Dotenv must have already run before this is called.
 */
export const validateEnv = () => {
  // Auto-fill DIRECT_URL from DATABASE_URL if not set (Prisma accelerate compat)
  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }

  const required = [
    'DATABASE_URL',
    'DIRECT_URL',
    'JWT_SECRET',
    'REDIS_URL',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n  ${missing.join('\n  ')}\n\nCopy .env.example to .env and fill in the values.`
    );
  }

  // Warn about recommended vars that are missing
  const recommended = [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET',
    'MPESA_CALLBACK_URL',
    'AI_SERVICE_URL',
    'INTERNAL_API_SECRET',
  ];

  const missingOptional = recommended.filter((key) => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(
      `⚠️  Optional environment variables not set (some features may be unavailable):\n  ${missingOptional.join(', ')}`
    );
  }

  console.log('✅ Environment variables validated');
};
