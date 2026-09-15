import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    username: string;
    role: string;
    mustChangePassword?: boolean;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized: Session missing or expired' });
  }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized: Session missing or expired' });
    }

    const userRole = req.session.role;
    // 'Admin' has global superuser access
    if (userRole && (userRole === 'Admin' || allowedRoles.includes(userRole))) {
      return next();
    }

    return res.status(403).json({
      error: `Forbidden: Insufficient privileges. Required one of [${allowedRoles.join(', ')}], current role is '${userRole}'`
    });
  };
}
