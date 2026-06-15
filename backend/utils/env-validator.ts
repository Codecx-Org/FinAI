import dotenv from 'dotenv';
dotenv.config();

export const validateEnv = () => {
  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }

  const requiredEnv = [
    'DATABASE_URL',
    'DIRECT_URL',
    'JWT_SECRET',
    // 'PORT',
    'REDIS_URL'
  ];

  const missing = requiredEnv.filter(env => !process.env[env]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ Environment variables validated');
};
