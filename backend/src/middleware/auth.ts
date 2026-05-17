import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from './errorHandler';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.session.userId) {
      throw new AppError('Authentication required', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { id: true, email: true, phone: true, name: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      throw new AppError('User not found or inactive', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    if (req.session.userId) {
      const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        select: { id: true, email: true, phone: true, name: true, role: true, isActive: true },
      });
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
}
