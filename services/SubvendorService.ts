import { PrismaClient, Prisma } from "@prisma/client";

export class SubvendorService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Listeleme ve Filtreleme
  async getAllSubvendors(filter: { searchKeyword?: string; brandId?: number; status?: boolean }) {
    const where: Prisma.SubvendorWhereInput = {
      is_deleted: false,
      ...(filter.brandId && { brandId: Number(filter.brandId) }),
      ...(filter.status !== undefined && { is_active: filter.status }),
      ...(filter.searchKeyword && {
        OR: [
          { name: { contains: filter.searchKeyword, mode: 'insensitive' } },
          { phone: { contains: filter.searchKeyword, mode: 'insensitive' } },
          { city: { contains: filter.searchKeyword, mode: 'insensitive' } }
        ]
      })
    };

    return await this.prisma.subvendor.findMany({
      where,
      include: {
        brand: { select: { name: true } },
        defaultLanguage: { select: { name: true, code: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  // Durum Güncelleme (Toggle)
  async toggleStatus(id: number, status: boolean) {
    return await this.prisma.subvendor.update({
      where: { id: Number(id) },
      data: { is_active: status }
    });
  }

  // Soft Delete
  async softDelete(id: number) {
    return await this.prisma.subvendor.update({
      where: { id: Number(id) },
      data: { is_deleted: true }
    });
  }
// Yeni Kayıt
async createSubvendor(data: any) {
  return await this.prisma.subvendor.create({
    data: {
      // ext_id Prisma'da @unique ve zorunlu olduğu için mutlaka gelmeli
      ext_id: data.ext_id || `SUB-${Date.now()}`, 
      name: data.name,
      official_name: data.official_name || null,
      phone: data.phone || null,
      vkn: data.vkn || null,
      city: data.city || null,
      district: data.district || null,
      address_detail: data.address_detail || null,
      is_active: data.is_active ?? true,
      is_franchise: data.is_franchise ?? false,
      employee_volume: data.employee_volume ? Number(data.employee_volume) : 0,
      // Sayısal değerleri kontrol ederek gönderiyoruz
      latitude: (data.latitude && !isNaN(parseFloat(data.latitude))) ? parseFloat(data.latitude) : null,
      longitude: (data.longitude && !isNaN(parseFloat(data.longitude))) ? parseFloat(data.longitude) : null,
      
      // brandId yoksa veya geçersizse hata fırlatmak yerine null kontrolü
      brand: { 
        connect: { id: Number(data.brandId) } 
      },
      defaultLanguage: { 
        connect: { id: Number(data.languageId || 1) } 
      }
    }
  });
}

// Güncelleme
async update(id: number, data: any) {
  // brandId veya languageId gelmişse sayı olduklarından emin oluyoruz
  const brandConnect = data.brandId ? { brand: { connect: { id: Number(data.brandId) } } } : {};
  const langConnect = data.languageId ? { defaultLanguage: { connect: { id: Number(data.languageId) } } } : {};

  return await this.prisma.subvendor.update({
    where: { id: Number(id) },
    data: {
      name: data.name,
      phone: data.phone,
      official_name: data.official_name,
      vkn: data.vkn,
      city: data.city,
      district: data.district,
      address_detail: data.address_detail,
      employee_volume: data.employee_volume !== undefined ? Number(data.employee_volume) : undefined,
      is_active: data.is_active,
      is_franchise: data.is_franchise,
      latitude: (data.latitude !== null && data.latitude !== undefined) ? parseFloat(data.latitude) : undefined,
      longitude: (data.longitude !== null && data.longitude !== undefined) ? parseFloat(data.longitude) : undefined,
      ...brandConnect,
      ...langConnect
    },
  });
}
}