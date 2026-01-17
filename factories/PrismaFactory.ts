// factories/PrismaFactory.ts
import { 
  PrismaClient, 
  Owner, 
  Brand, 
  Subvendor, 
  Product, 
  Category, 
  StringValue 
} from '@prisma/client';

/**
 * Yardımcı tip: JSON formatındaki çeviri haritası için
 */
export interface TranslationMap {
  [key: string]: string;
}

/**
 * Yardımcı tip: Dil ID haritası için
 */
export interface LangIdMap {
  [code: string]: number;
}

export class PrismaFactory {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async upsertOwner(ext_id: string, name: string, vkn: string): Promise<Owner> {
    return await this.prisma.owner.upsert({
      where: { vkn },
      update: { name, ext_id },
      create: { ext_id, name, vkn }
    });
  }

  async upsertBrand(ext_id: string, name: string, vkn: string, ownerId: number): Promise<Brand> {
    return await this.prisma.brand.upsert({
      where: { ext_id },
      update: { name, vkn, ownerId },
      create: { ext_id, name, vkn, ownerId }
    });
  }

  async upsertSubvendor(ext_id: string, name: string, brandId: number): Promise<Subvendor> {
    return await this.prisma.subvendor.upsert({
      where: { ext_id },
      update: { name, brandId },
      create: { ext_id, name, brandId }
    });
  }

  async createTranslation(
    entityId: number, 
    translations: TranslationMap, 
    langMap: LangIdMap, 
    type: string
  ): Promise<StringValue[]> {
    // Object.entries ve Promise hatalarını gidermek için tsconfig/lib ES2020 olmalı
    const entries = Object.entries(translations);
    
    const upserts = entries.map(([code, value]) => {
      const languageId = langMap[code];
      if (!languageId) {
        throw new Error(`Dil ID bulunamadı: ${code}`);
      }

      return this.prisma.stringValue.upsert({
        where: { 
          entity_id_languageId_type: { 
            entity_id: entityId, 
            languageId: languageId, 
            type: type 
          } 
        },
        update: { value },
        create: { 
          entity_id: entityId, 
          languageId: languageId, 
          value: value, 
          type: type 
        }
      });
    });

    return Promise.all(upserts);
  }

  async upsertProduct(ext_id: string, names: TranslationMap, langMap: LangIdMap, type: string): Promise<Product> {
    const product = await this.prisma.product.upsert({
      where: { ext_id },
      update: {},
      create: { ext_id }
    });
    
    await this.createTranslation(product.id, names, langMap, type);
    return product;
  }

  async upsertCategory(ext_id: string, names: TranslationMap, langMap: LangIdMap, type: string): Promise<Category> {
    const category = await this.prisma.category.upsert({
      where: { ext_id },
      update: { type },
      create: { ext_id, type }
    });
    
    await this.createTranslation(category.id, names, langMap, type);
    return category;
  }
}