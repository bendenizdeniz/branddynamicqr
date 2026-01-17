import { Request, Response, NextFunction } from 'express';
import { JwtUtils, TokenPayload } from '../utils/JwtUtils';

// Express Request tipini genişleterek içine 'user' ekliyoruz
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export class AuthMiddleware {
  // Sadece Token geçerli mi diye bakar
  static async verify(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = JwtUtils.verifyToken(token);
      req.user = decoded; // Token içindeki tüm hiyerarşiyi req.user'a attık
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  }

  // Belirli rolleri kontrol eder (Örn: Sadece ADMIN veya BRAND girebilir)
  static checkRole(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission' });
      }
      next();
    };
  }
}