// services/ApiService.ts
import { PrismaClient } from "@prisma/client";
import { PrismaFactory, LangIdMap } from "../factories/PrismaFactory";
import * as CoreEnums from "../enums/CoreEnums";
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { LocalizedProductResponse } from "../types/responses";
import { TokenPayload } from "../utils/JwtUtils";
import { AuthorizeTypes } from "../enums/CoreEnums";


export class ApiService {
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

async runSeed() {
  try {
    // 1. Dillerin Hazırlanması (Localization Foundation)
    const langConfigs = [
      { code: CoreEnums.LANG_TR, name: CoreEnums.LANG_TR_VAL },
      { code: CoreEnums.LANG_EN, name: CoreEnums.LANG_EN_VAL },
      { code: CoreEnums.LANG_DE, name: CoreEnums.LANG_DE_VAL }
    ];

    for (const l of langConfigs) {
      await this.prisma.language.upsert({ 
        where: { code: l.code }, 
        update: {}, 
        create: { code: l.code, name: l.name } 
      });
    }

    const langMap = await this.getLangMap();
    const trLangId = langMap[CoreEnums.LANG_TR];
    const enLangId = langMap[CoreEnums.LANG_EN];

    // 2. Hiyerarşi: Owner ve Markaların Oluşturulması
    const owner = await this.factory.upsertOwner("holding_star", "Yıldız Holding", "1234567890");
    const brandLab = await this.factory.upsertBrand("brand_espressolab", "EspressoLab", "VKN-0987654321", owner.id);
    const brandStar = await this.factory.upsertBrand("brand_starbucks", "Starbucks", "VKN-123654300", owner.id);

    // 3. Hiyerarşi: Subvendor (Şubeler) Oluşturulması
    // Factory içindeki güncellediğimiz upsertSubvendor metodunu kullanıyoruz
    const subIst = await this.factory.upsertSubvendor(
      "ist_bebek_001", 
      "EspressoLab Bebek", 
      brandLab.id, 
      trLangId
    );

    const subLon = await this.factory.upsertSubvendor(
      "lon_soho_001", 
      "EspressoLab Soho", 
      brandLab.id, 
      enLangId
    );

    // 4. Identity (Kimlik/Kullanıcı) Hesaplarının Oluşturulması
    const commonPassword = await bcrypt.hash("123456", 10);

    const identities = [
      { 
        email: "admin@sistem.com", 
        role: Role.ADMIN, 
        ownerId: null, brandId: null, subvendorId: null 
      },
      { 
        email: "owner@yildiz.com", 
        role: Role.OWNER, 
        ownerId: owner.id, brandId: null, subvendorId: null 
      },
      { 
        email: "manager@espressolab.com", 
        role: Role.BRAND, 
        ownerId: null, brandId: brandLab.id, subvendorId: null 
      },
      { 
        email: "bebek@espressolab.com", 
        role: Role.SUBVENDOR, 
        ownerId: null, brandId: null, subvendorId: subIst.id 
      }
    ];

    for (const iden of identities) {
      await this.prisma.identity.upsert({
        where: { email: iden.email },
        update: { 
          password: commonPassword,
          role: iden.role,
          ownerId: iden.ownerId,
          brandId: iden.brandId,
          subvendorId: iden.subvendorId
        },
        create: {
          email: iden.email,
          password: commonPassword,
          role: iden.role,
          ownerId: iden.ownerId,
          brandId: iden.brandId,
          subvendorId: iden.subvendorId
        }
      });
    }

    // 5. Ürün ve Kategori Yönetimi (Merkezi Veri)
    const catAtist = await this.factory.upsertCategory("atistirmalik", { tr: "Atıştırmalık", en: "Snacks", de: "Snacks" }, langMap, CoreEnums.CATEGORY);
    const catSicak = await this.factory.upsertCategory("sicak_icecek", { tr: "Sıcak İçecek", en: "Hot Drinks", de: "Heiße Getränke" }, langMap, CoreEnums.CATEGORY);

    const prodKahve = await this.factory.upsertProduct("filtre_kahve", { tr: "Filtre Kahve", en: "Filter Coffee", de: "Filterkaffee" }, langMap, CoreEnums.PRODUCT);
    const prodGofret = await this.factory.upsertProduct("gofret", { tr: "Gofret", en: "Wafer", de: "Waffel" }, langMap, CoreEnums.PRODUCT);
    const prodSalata = await this.factory.upsertProduct("salata", { tr: "Salata", en: "Salad", de: "Salat" }, langMap, CoreEnums.PRODUCT);

    // 6. Marka-Kategori-Ürün İlişkileri ve Fiyatlandırma
    const relations = [
      { brandId: brandLab.id, catId: catSicak.id, prodId: prodKahve.id, price: 45.50 },
      { brandId: brandStar.id, catId: catSicak.id, prodId: prodKahve.id, price: 55.00 },
      { brandId: brandStar.id, catId: catAtist.id, prodId: prodSalata.id, price: 85.00 },
      { brandId: brandLab.id, catId: catAtist.id, prodId: prodGofret.id, price: 15.00 }
    ];

    for (const rel of relations) {
      await this.prisma.categoryProduct.upsert({
        where: { brandId_categoryId_productId: { brandId: rel.brandId, categoryId: rel.catId, productId: rel.prodId } },
        update: { price: rel.price },
        create: { brandId: rel.brandId, categoryId: rel.catId, productId: rel.prodId, price: rel.price }
      });
    }

    return { 
      status: "success", 
      message: "Seed Successful: Languages, Hierarchy, Identities and Products created/updated." 
    };

  } catch (error: any) {
    console.error("Seed Error:", error);
    throw new Error("Seed failed: " + error.message);
  }
}

  async getDashboardData() {
    const owners = await this.prisma.owner.findMany({
      include: {
        brands: {
          include: {
            category_products: {
              include: { category: true, product: true }
            }
          }
        }
      }
    });

    const allTranslations = await this.prisma.stringValue.findMany({
      include: { language: true }
    });

    const getNames = (entityId: number, type: string) => {
      return allTranslations
        .filter(t => t.entity_id === entityId && t.type === type)
        .reduce((acc, t) => ({ ...acc, [t.language.code]: t.value }), {} as Record<string, string>);
    };

    return owners.map(owner => ({
      ...owner,
      brands: owner.brands.map(brand => ({
        ...brand,
        products: brand.category_products.map(cp => ({
          price: cp.price,
          ext_id: cp.ext_id,
          category: {
            ...cp.category,
            names: getNames(cp.category.id, 'category')
          },
          product: {
            ...cp.product,
            names: getNames(cp.product.id, 'product')
          }
        }))
      }))
    }));
  }

async getBrandProductsLocalized(user: TokenPayload, lang: string) {
    // 1. Yetki Kontrolü
    if (!user.brandId && user.role !== 'ADMIN') {
      throw new Error("Yetkisiz erişim: Marka bilgisi bulunamadı.");
    }

    // 2. Ana Veriyi Çek (CategoryProduct ve bağları)
    const categoryProducts = await this.prisma.categoryProduct.findMany({
      where: {
        brandId: user.role as string === AuthorizeTypes.ADMIN ? undefined : user.brandId!,
        is_deleted: false,
      },
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
}