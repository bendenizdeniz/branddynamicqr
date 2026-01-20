import { PrismaClient } from '@prisma/client';

export class OwnerService {
  constructor(private prisma: PrismaClient) {}

  async getAllOwners(search?: string) {
    return await this.prisma.owner.findMany({
      where: {
        is_deleted: false,
        OR: search ? [
          { name: { contains: search, mode: 'insensitive' } },
          { vkn: { contains: search, mode: 'insensitive' } }
        ] : undefined
      },
      include: {
        _count: {
          select: {
            brands: true,
            identities: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async createOwner(data: any) {
    return await this.prisma.owner.create({ data });
  }

  async updateOwner(id: number, data: any) {
    return await this.prisma.owner.update({
      where: { id },
      data
    });
  }

  async softDelete(id: number) {
    return await this.prisma.owner.update({
      where: { id },
      data: { is_deleted: true }
    });
  }
}