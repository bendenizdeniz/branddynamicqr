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

// factories/PrismaFactory.ts

async upsertCategory(ext_id: string, names: TranslationMap, langMap: LangIdMap, businessType: string): Promise<Category> {
  const category = await this.prisma.category.upsert({
    where: { ext_id },
    update: { type: businessType }, // Örn: "sıcak_icecek"
    create: { ext_id, type: businessType }
  });
  
  // Burada type parametresini "category_name" olarak sabit gönderiyoruz
  await this.createTranslation(category.id, names, langMap, "category"); 
  return category;
}

async createTranslation(
  entityId: number, 
  translations: TranslationMap, 
  langMap: LangIdMap, 
  translationType: string // "category", "product", "description"
): Promise<StringValue[]> {
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
          type: translationType // "category", "product", "description"
        } 
      },
      update: { value },
      create: { 
        entity_id: entityId, 
        languageId: languageId, 
        value: value, 
        type: translationType 
      }
    });
  });

  return Promise.all(upserts);
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

// languageId parametresini ekledik
async upsertSubvendor(
  ext_id: string, 
  name: string, 
  brandId: number, 
  languageId: number // Yeni zorunlu parametre
): Promise<Subvendor> {
  return await this.prisma.subvendor.upsert({
    where: { ext_id },
    update: { 
      name, 
      brandId, 
      languageId // Update kısmına da ekledik
    },
    create: { 
      ext_id, 
      name, 
      brandId, 
      languageId // Create kısmına da ekledik
    }
  });
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
}