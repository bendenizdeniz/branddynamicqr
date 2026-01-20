import { PrismaClient } from '@prisma/client';
import { TokenPayload } from '../utils/JwtUtils';
import * as CoreEnums from "../enums/CoreEnums";

export interface ProductFilterRequest {
  brandId?: number | null;
  categoryId?: number | null;
  searchKeyword?: string;
  languageId: number;
}

export class ProductService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      // Hata ayıklama için sorguları konsolda görmek istersen burayı açabilirsin
      // log: ['query', 'info', 'warn', 'error'],
    });
  }

  async getBrandBasedFilteredProducts(filter: ProductFilterRequest) {
    const { brandId, categoryId, searchKeyword, languageId } = filter;

    // Arama kelimesi varsa, ilgili dile ait ürün ID'lerini önceden toplayalım
    let searchProductIds: number[] = [];
    if (searchKeyword && searchKeyword.trim() !== "") {
      searchProductIds = await this.getProductIdsBySearch(searchKeyword, languageId);
    }

    // Sorgu Nesnesini Dinamik Oluşturma
    const whereCondition: any = {
      is_deleted: false,
      // Eğer brandId veya categoryId varsa filtre ekle, yoksa bu kriteri pas geç
      ...(brandId && { brandId: Number(brandId) }),
      ...(categoryId && { categoryId: Number(categoryId) }),
      product: {
        is_deleted: false,
        // searchKeyword varsa filtre uygula
        ...(searchKeyword && searchKeyword.trim() !== "" && {
          OR: [
            { ext_id: { contains: searchKeyword, mode: 'insensitive' } },
            { id: { in: searchProductIds } }
          ]
        })
      }
    };

    const data = await this.prisma.categoryProduct.findMany({
      where: whereCondition,
      include: {
        brand: { select: { name: true } },
        category: true,
        product: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Verileri eşzamanlı olarak dile göre mapleyelim
    return await Promise.all(data.map(async (item) => {
      const productName = await this.getTranslation(item.productId, languageId, 'product_name');
      const categoryName = await this.getTranslation(item.categoryId, languageId, 'category_name');

      return {
        categoryProductId: item.id,
        // Çeviri yoksa fallback olarak ext_id veya sabit bir metin döndür
        productName: productName || `Ürün (${item.product.ext_id})`,
        categoryName: categoryName || item.category.ext_id,
        brandName: item.brand.name,
        price: item.price,
        ext_id: item.product.ext_id,
      };
    }));
  }

  // StringValue tablosundan ilgili dildeki değeri getirir
  private async getTranslation(entityId: number, langId: number, type: string) {
    try {
      const translation = await this.prisma.stringValue.findUnique({
        where: {
          entity_id_languageId_type: {
            entity_id: entityId,
            languageId: Number(langId),
            type: type
          }
        }
      });
      return translation?.value;
    } catch (error) {
      return null;
    }
  }

  // İsimle arama yapıldığında eşleşen ürün ID'lerini döner
  private async getProductIdsBySearch(keyword: string, langId: number) {
    const translations = await this.prisma.stringValue.findMany({
      where: {
        languageId: Number(langId),
        type: 'product_name',
        value: { contains: keyword, mode: 'insensitive' }
      },
      select: { entity_id: true }
    });
    return translations.map(t => t.entity_id);
  }

async getBrandProductsLocalized(user: TokenPayload, lang: string) {
    // 1. Yetki Kontrolü - Daha güvenli hale getirdik
    const userRole = String(user.role).toUpperCase(); 
    const adminRole = String(CoreEnums.AuthorizeTypes.ADMIN).toUpperCase();
    
    const isAdmin = userRole === adminRole;

    // Eğer ADMIN değilse ve brandId yoksa o zaman hata fırlat
    if (!isAdmin && !user.brandId) {
      throw new Error("Yetkisiz erişim: Marka bilgisi bulunamadı.");
    }

    // 2. Dinamik Where Objesi
    const whereCondition: any = {
      is_deleted: false,
    };

    // Admin değilse markasına göre filtrele, Admin ise her şeyi getir
    if (!isAdmin) {
      whereCondition.brandId = user.brandId;
    }

    // 3. Ana Veriyi Çek
    const categoryProducts = await this.prisma.categoryProduct.findMany({
      where: whereCondition,
      include: {
        product: true,
        category: true
      }
    });

    // 3. StringValue tablosundan isimleri çek (Manuel Join Mantığı)
    // Veritabanına tek tek gitmemek için toplu çekiyoruz
    const productIds = categoryProducts.map(cp => cp.productId);
    const categoryIds = categoryProducts.map(cp => cp.categoryId);

    const stringValues = await this.prisma.stringValue.findMany({
      where: {
        languageId: 1, // 'tr' karşılığı olan ID'yi dinamik de alabilirsin
        OR: [
          { type: CoreEnums.PRODUCT, entity_id: { in: productIds } },
          { type: CoreEnums.CATEGORY, entity_id: { in: categoryIds } }
        ]
      }
    });

    // 4. Data Transformation (Eşleştirme)
    return categoryProducts.map(cp => {
      const pName = stringValues.find(v => v.type === CoreEnums.PRODUCT && v.entity_id === cp.productId)?.value;
      const cName = stringValues.find(v => v.type === CoreEnums.CATEGORY && v.entity_id === cp.categoryId)?.value;

      return {
        categoryProductId: cp.id,
        price: cp.price,
        productName: pName || "İsim bulunamadı",
        categoryName: cName || "Kategori bulunamadı",
        ext_id: cp.ext_id
      };
    });
  }

   async createFullProductFlow(data: {
  ext_id: string;
  names: Record<string, string>; // { "tr": "Çikolata", "en": "Chocolate" }
  brandId: number;
  categoryId: number;
  price: number;
}) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. Kategori ve Marka Var mı? (Ön Kontrol)
    const [category, brand] = await Promise.all([
      tx.category.findUnique({ where: { id: data.categoryId } }),
      tx.brand.findUnique({ where: { id: data.brandId } })
    ]);

    if (!category) throw new Error(`ID: ${data.categoryId} olan kategori bulunamadı!`);
    if (!brand) throw new Error(`ID: ${data.brandId} olan marka bulunamadı!`);

    // 2. Ürünü Oluştur veya Güncelle
    const product = await tx.product.upsert({
      where: { ext_id: data.ext_id },
      update: { is_deleted: false },
      create: { ext_id: data.ext_id }
    });

    // 3. İsimleri StringValue Tablosuna İşle
    const languages = await tx.language.findMany();
    for (const [langCode, nameValue] of Object.entries(data.names)) {
      const lang = languages.find(l => l.code === langCode.toLowerCase());
      if (lang) {
        await tx.stringValue.upsert({
          where: {
            entity_id_languageId_type: {
              entity_id: product.id,
              languageId: lang.id,
              type: "product_name"
            }
          },
          update: { value: nameValue, is_deleted: false },
          create: {
            entity_id: product.id,
            languageId: lang.id,
            value: nameValue,
            type: "product_name"
          }
        });
      }
    }

    // 4. CategoryProduct (İlişki ve Fiyat) Kaydı
    const rel = await tx.categoryProduct.upsert({
      where: {
        brandId_categoryId_productId: {
          brandId: data.brandId,
          categoryId: data.categoryId,
          productId: product.id
        }
      },
      update: { price: data.price, is_deleted: false },
      create: {
        brandId: data.brandId,
        categoryId: data.categoryId,
        productId: product.id,
        price: data.price
      }
    });

    return { success: true, productId: product.id, relationId: rel.id };
  });
}

}