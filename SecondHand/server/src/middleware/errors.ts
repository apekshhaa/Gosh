import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export const notFoundHandler: RequestHandler = (_req, res) => { res.status(404).json({ error: 'Route not found' }); };

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (typeof (error as { status?: unknown }).status === 'number' && [400, 409, 503].includes((error as { status: number }).status)) { res.status((error as { status: number }).status).json({ error: error.message }); return; }
  if (error instanceof ZodError) { res.status(400).json({ error: 'Invalid request', details: error.issues.map(({ path, message }) => ({ path: path.join('.'), message })) }); return; }
  if (error instanceof mongoose.Error.ValidationError) { res.status(400).json({ error: 'Invalid data', details: Object.values(error.errors).map((item) => item.message) }); return; }
  if (error instanceof mongoose.Error.CastError) { res.status(400).json({ error: 'Invalid identifier' }); return; }
  if ((error as { code?: number }).code === 11000) { res.status(409).json({ error: 'A record with this value already exists' }); return; }
  console.error('Request failed', error instanceof Error ? error.name : 'Unknown error');
  res.status(500).json({ error: 'Internal server error' });
};
