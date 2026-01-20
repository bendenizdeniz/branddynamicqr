import { PrismaClient, Prisma } from "@prisma/client";

export class SubvendorService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getAllSubvendors(filter: { 
    searchKeyword?: string; 
    brandId?: number; 
    status?: boolean 
  }) {
    const where: Prisma.SubvendorWhereInput = {
      is_deleted: false,
      ...(filter.brandId && { brandId: filter.brandId }),
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
        brand: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async createSubvendor(data: any) {
    const createData: Prisma.SubvendorCreateInput = {
      ext_id: data.ext_id,
      name: data.name,
      phone: data.phone,
      is_franchise: data.is_franchise || false,
      country: data.country || "Türkiye",
      city: data.city,
      district: data.district,
      address_detail: data.address_detail,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      payment_methods: data.payment_methods || [],
      is_active: data.is_active ?? true,
      official_name: data.official_name,
      vkn: data.vkn,
      employee_volume: data.employee_volume ? Number(data.employee_volume) : 0,
      brand: { connect: { id: Number(data.brandId) } },
      defaultLanguage: { connect: { id: Number(data.languageId || 1) } }
    };

    return await this.prisma.subvendor.create({ data: createData });
  }

  // ⚠️ Bu metod eksikti - Controller'da çağrılıyor!
  async updateSubvendor(id: number, data: any) {
    const updateData: Prisma.SubvendorUpdateInput = {
      ...(data.name && { name: data.name }),
      ...(data.phone && { phone: data.phone }),
      ...(data.is_franchise !== undefined && { is_franchise: data.is_franchise }),
      ...(data.country && { country: data.country }),
      ...(data.city && { city: data.city }),
      ...(data.district && { district: data.district }),
      ...(data.address_detail && { address_detail: data.address_detail }),
      ...(data.latitude && { latitude: parseFloat(data.latitude) }),
      ...(data.longitude && { longitude: parseFloat(data.longitude) }),
      ...(data.payment_methods && { payment_methods: data.payment_methods }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
      ...(data.official_name && { official_name: data.official_name }),
      ...(data.vkn && { vkn: data.vkn }),
      ...(data.employee_volume && { employee_volume: Number(data.employee_volume) }),
      ...(data.brandId && { brand: { connect: { id: Number(data.brandId) } } }),
      ...(data.languageId && { defaultLanguage: { connect: { id: Number(data.languageId) } } })
    };

    return await this.prisma.subvendor.update({
      where: { id: Number(id) },
      data: updateData
    });
  }

  async toggleSubvendorStatus(id: number, status: boolean) {
    return await this.prisma.subvendor.update({
      where: { id: Number(id) },
      data: { is_active: status }
    });
  }

  async deleteSubvendor(id: number) {
    return await this.prisma.subvendor.update({
      where: { id: Number(id) },
      data: { is_deleted: true }
    });
  }
}