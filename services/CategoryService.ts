// services/CategoryService.ts
import { PrismaClient } from "@prisma/client";
import { PrismaFactory, LangIdMap, TranslationMap } from "../factories/PrismaFactory";

export class CategoryService {
  private prisma: PrismaClient;
  private factory: PrismaFactory;

  constructor(prisma: PrismaClient, factory: PrismaFactory) {
    this.prisma = prisma;
    this.factory = factory;
  }

  async getLangMap(): Promise<LangIdMap> {
    const langs = await this.prisma.language.findMany();
    return langs.reduce((acc, lang) => ({ ...acc, [lang.code]: lang.id }), {} as LangIdMap);
  }

async getAllCategories(filter: { 
  languageId: number; 
  searchKeyword?: string | null;
  brandId?: number | null; 
}) {
  const { languageId, searchKeyword, brandId } = filter;

  let categoryIdsFromBrand: number[] | undefined = undefined;

  if (brandId) {
    const categoryProducts = await this.prisma.categoryProduct.findMany({
      where: { brandId, is_deleted: false },
      select: { categoryId: true }
    });
    categoryIdsFromBrand = [...new Set(categoryProducts.map(cp => cp.categoryId))];
    if (categoryIdsFromBrand.length === 0) return [];
  }

  // StringValue'da sadece kategori isimlerini ("category") ara
  const translations = await this.prisma.stringValue.findMany({
    where: {
      languageId: languageId,
      is_deleted: false,
      type: "category", //sadece kategori isimlerini getir
      ...(searchKeyword && {
        value: { contains: searchKeyword, mode: 'insensitive' }
      }),
      ...(categoryIdsFromBrand && {
        entity_id: { in: categoryIdsFromBrand }
      })
    }
  });

  if (translations.length === 0) return [];

  const categories = await this.prisma.category.findMany({
    where: {
      id: { in: translations.map(t => t.entity_id) },
      is_deleted: false
    },
    select: { id: true, ext_id: true, type: true }
  });

 // services/CategoryService.ts - getAllCategories metodunun sonu

return categories.map(cat => {
  const translation = translations.find(t => t.entity_id === cat.id);
  return {
    id: cat.id,
    ext_id: cat.ext_id,
    type: cat.type, // Category tablosundaki "food", "drink" vb.
    categoryName: translation ? translation.value : "İsimsiz Kategori"
  };
});
}

  async createOrUpdateCategory(ext_id: string, names: TranslationMap, type: string) {
    const langMap = await this.getLangMap();
    return await this.factory.upsertCategory(ext_id, names, langMap, type);
  }
}