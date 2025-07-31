import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User'; // Import User model

export interface AuthRequest extends Request {
  user?: User | null; // Add user property to Request object
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret'); // Replace with actual secret or better env handling

      // Attach user to the request (excluding password)
      req.user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });

      next();
    } catch (error: unknown) {
      console.error('Auth error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};