import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { JwtUtils } from '../utils/JwtUtils';

export class IdentityService {
  private prisma = new PrismaClient();

  // Testler için hızlıca Identity oluşturma (Kayıt)
  async createIdentity(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.identity.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async login(email: string, pass: string) {
    const identity = await this.prisma.identity.findUnique({
      where: { email },
    });

    if (!identity || !identity.is_active) {
      throw new Error('Identity not found or inactive');
    }

    const isMatch = await bcrypt.compare(pass, identity.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Token üretimi
    const token = JwtUtils.generateToken({
      identityId: identity.id,
      email: identity.email,
      role: identity.role,
      ownerId: identity.ownerId,
      brandId: identity.brandId,
      subvendorId: identity.subvendorId
    });

    return { token, role: identity.role };
  }
}