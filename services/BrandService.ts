import { PrismaClient } from '@prisma/client';

export class BrandService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Tüm markaları listele
  async getAllBrands() {
    return await this.prisma.brand.findMany({
      where: {
        is_deleted: false,
      },
      select: {
        id: true,
        name: true, // Prisma şemanızda 'name' veya 'ext_id' hangisiyse onu seçin
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}