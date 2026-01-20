import { PrismaClient, Prisma } from "@prisma/client";

export class BrandService {
  private prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Tüm markaları getir (Filtreleme dahil)
  async getAllBrands(search?: string) {
    return await this.prisma.brand.findMany({
      where: {
        is_deleted: false,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { official_name: { contains: search, mode: "insensitive" } },
            { vkn: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        owner: { select: { id: true, name: true } }, // Owner bilgisini de çekiyoruz
        _count: {
          select: {
            subvendors: true,
            category_products: true,
            identities: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  // Yeni Marka Oluştur
  async createBrand(data: any) {
    return await this.prisma.brand.create({
      data: {
        ext_id: data.ext_id || `BRD-${Date.now()}`,
        name: data.name,
        official_name: data.official_name || null,
        vkn: data.vkn,
        address: data.address || null,
        icon: data.icon || null,
        thumbnail: data.thumbnail || null,
        phone: data.phone || null,
        coordX: data.coordX || null,
        coordY: data.coordY || null,
        // İlişki: OwnerId zorunlu olduğu için kontrol ediyoruz
        owner: { connect: { id: Number(data.ownerId || 1) } },
      },
    });
  }

  // Marka Güncelle (Tüm proplar dinamik)
  async updateBrand(id: number, data: any) {
    return await this.prisma.brand.update({
      where: { id: Number(id) },
      data: {
        name: data.name,
        official_name: data.official_name,
        vkn: data.vkn,
        phone: data.phone,
        address: data.address,
        icon: data.icon,
        thumbnail: data.thumbnail,
        coordX: data.coordX,
        coordY: data.coordY,
        // is_deleted yanlışlıkla güncellenmesin diye buraya eklemiyoruz
        // ownerId güncellenmek istenirse:
        ...(data.ownerId && { owner: { connect: { id: Number(data.ownerId) } } }),
      },
    });
  }

  // Soft Delete
  async softDelete(id: number) {
    return await this.prisma.brand.update({
      where: { id: Number(id) },
      data: { is_deleted: true },
    });
  }
}