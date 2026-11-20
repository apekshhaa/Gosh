import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDatabase } from '../db/connect.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import mongoose from 'mongoose';

const provisionSchema = z.object({
  ADMIN_NAME: z.string().trim().min(1).max(100),
  ADMIN_EMAIL: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  ADMIN_PASSWORD: z.string().min(16).max(128),
});

async function provisionFirstAdmin() {
  if (!process.argv.includes('--confirm')) {
    throw new Error('Confirmation flag is required. Run the documented command with -- --confirm.');
  }
  const input = provisionSchema.parse(process.env);
  await connectDatabase(env.MONGODB_URI);
  if (await User.exists({ role: 'admin' })) throw new Error('An administrator already exists; refusing first-admin provisioning.');
  if (await User.exists({ email: input.ADMIN_EMAIL })) throw new Error('That email already belongs to an account; choose an unused administrator email.');
  const passwordHash = await bcrypt.hash(input.ADMIN_PASSWORD, 12);
  await User.create({ name: input.ADMIN_NAME, email: input.ADMIN_EMAIL, passwordHash, role: 'admin' });
  console.log('First administrator provisioned. Credentials were not printed.');
}

try {
  await provisionFirstAdmin();
} catch (error) {
  const safeMessage = error instanceof z.ZodError
    ? `configuration validation failed: ${error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`
    : error instanceof Error && (error.message.startsWith('Confirmation flag') || error.message.startsWith('An administrator already exists') || error.message.startsWith('That email already belongs'))
      ? error.message
      : 'database or unexpected error; sensitive details were not logged';
  console.error('Administrator provisioning failed:', safeMessage);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
