import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta?.target.join(', ') : 'field';
      return res.status(409).json({
        error: `A record with this ${target} already exists.`
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found.'
      });
    }
  }

  console.error('Unhandled server error:', err);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
}
