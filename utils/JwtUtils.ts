import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

// Token içine koyacağımız bilgilerin tipi
export interface TokenPayload {
    identityId: number;
    email: string;
    role: Role;
    ownerId?: number | null;
    brandId?: number | null;
    subvendorId?: number | null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';
const EXPIRE_TIME = '24h';

export class JwtUtils {
    // Kullanıcı giriş yaptığında ona verilecek token'ı üretir
    static generateToken(payload: TokenPayload): string {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRE_TIME });
    }

    // Gelen token geçerli mi kontrol eder ve içindeki payload'u döner
    static verifyToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, JWT_SECRET) as TokenPayload;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
}