import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../services/roomService';

export const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch((err: unknown) => {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, message: err.issues[0]?.message ?? '参数不正确' });
        return;
      }
      if (err instanceof AppError) {
        res.status(err.status).json({ success: false, message: err.message, ...err.extra });
        return;
      }
      next(err);
    });
  };
