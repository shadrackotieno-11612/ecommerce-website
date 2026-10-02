import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.ts';
import { User } from '../types/index.ts';

const FALLBACK_JWT_SECRET = 'zawadi_kenya_secure_jwt_token_secret_key_2026';
const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_JWT_SECRET;

// Warn if JWT_SECRET is not configured in production mode
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn(
    '[Security Warning] JWT_SECRET environment variable is not configured. Using secure fallback secret. Set JWT_SECRET in environment for custom keys.'
  );
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Authentication service not properly configured.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token. Please sign in again.' });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  authenticateToken(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Administrative privileges are required for this action.',
      });
    }
    next();
  });
}
