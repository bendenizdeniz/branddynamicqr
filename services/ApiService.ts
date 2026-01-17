// services/ApiService.ts
import { PrismaClient } from "@prisma/client";
import { PrismaFactory, LangIdMap } from "../factories/PrismaFactory";
import * as CoreEnums from "../enums/CoreEnums";

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

      const owner = await this.factory.upsertOwner("holding_star", "Yıldız Holding", "1234567890");
      const brandLab = await this.factory.upsertBrand("brand_espressolab", "EspressoLab", "VKN-0987654321", owner.id);
      const brandStar = await this.factory.upsertBrand("brand_starbucks", "Starbucks", "VKN-123654300", owner.id);

      const catAtist = await this.factory.upsertCategory("atistirmalik", { tr: "Atıştırmalık", en: "Snacks", de: "Snacks" }, langMap, CoreEnums.CATEGORY);
      const catSicak = await this.factory.upsertCategory("sicak_icecek", { tr: "Sıcak İçecek", en: "Hot Drinks", de: "Heiße Getränke" }, langMap, CoreEnums.CATEGORY);

      const prodKahve = await this.factory.upsertProduct("filtre_kahve", { tr: "Filtre Kahve", en: "Filter Coffee", de: "Filterkaffee" }, langMap, CoreEnums.PRODUCT);
      const prodGofret = await this.factory.upsertProduct("gofret", { tr: "Gofret", en: "Wafer", de: "Waffel" }, langMap, CoreEnums.PRODUCT);
      const prodSalata = await this.factory.upsertProduct("salata", { tr: "Salata", en: "Salad", de: "Salat" }, langMap, CoreEnums.PRODUCT);

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
      return { status: "success", message: "Seed Successful" };
    } catch (error: any) {
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
}

// const CoreEnums = require("../enums/CoreEnums");

// class ApiService {
//   constructor(prisma, factory) {
//     this.prisma = prisma;
//     this.factory = factory;
//   }

//   async getLangMap() {
//     const langs = await this.prisma.language.findMany();
//     return langs.reduce((acc, lang) => ({ ...acc, [lang.code]: lang.id }), {});
//   }

//   async runSeed() {
//     try {
//       const langConfigs = [
//         { code: CoreEnums.LANG_TR, name: CoreEnums.LANG_TR_VAL },
//         { code: CoreEnums.LANG_EN, name: CoreEnums.LANG_EN_VAL },
//         { code: CoreEnums.LANG_DE, name: CoreEnums.LANG_DE_VAL }
//       ];
//       for (const l of langConfigs) {
//         await this.prisma.language.upsert({ where: { code: l.code }, update: {}, create: l });
//       }
//       const langMap = await this.getLangMap();

//       const owner = await this.factory.upsertOwner("holding_star", "Yıldız Holding", "1234567890");
//       const brandLab = await this.factory.upsertBrand("brand_espressolab", "EspressoLab", "VKN-0987654321", owner.id);
//       const brandStar = await this.factory.upsertBrand("brand_starbucks", "Starbucks", "VKN-123654300", owner.id);

//       const catAtist = await this.factory.upsertCategory("atistirmalik", { tr: "Atıştırmalık", en: "Snacks", de: "Snacks" }, langMap, "category");
//       const catSicak = await this.factory.upsertCategory("sicak_icecek", { tr: "Sıcak İçecek", en: "Hot Drinks", de: "Heiße Getränke" }, langMap, "category");

//       const prodKahve = await this.factory.upsertProduct("filtre_kahve", { tr: "Filtre Kahve", en: "Filter Coffee", de: "Filterkaffee" }, langMap, "product");
//       const prodGofret = await this.factory.upsertProduct("gofret", { tr: "Gofret", en: "Wafer", de: "Waffel" }, langMap, "product");
//       const prodSalata = await this.factory.upsertProduct("salata", { tr: "Salata", en: "Salad", de: "Salat" }, langMap, "product");

//       const relations = [
//         { brandId: brandLab.id, catId: catSicak.id, prodId: prodKahve.id, price: 45.50 },
//         { brandId: brandStar.id, catId: catSicak.id, prodId: prodKahve.id, price: 55.00 },
//         { brandId: brandStar.id, catId: catAtist.id, prodId: prodSalata.id, price: 85.00 },
//         { brandId: brandLab.id, catId: catAtist.id, prodId: prodGofret.id, price: 15.00 }
//       ];

//       for (const rel of relations) {
//         await this.prisma.categoryProduct.upsert({
//           where: { brandId_categoryId_productId: { brandId: rel.brandId, categoryId: rel.catId, productId: rel.prodId } },
//           update: { price: rel.price },
//           create: { brandId: rel.brandId, categoryId: rel.catId, productId: rel.prodId, price: rel.price }
//         });
//       }
//       return { status: "success", message: "Seed Successful" };
//     } catch (error) {
//       throw new Error("Seed failed: " + error.message);
//     }
//   }

//   async getDashboardData() {
//     const owners = await this.prisma.owner.findMany({
//       include: {
//         brands: {
//           include: {
//             category_products: {
//               include: { category: true, product: true }
//             }
//           }
//         }
//       }
//     });

//     const allTranslations = await this.prisma.stringValue.findMany({
//       include: { language: true }
//     });

//     const getNames = (entityId, type) => {
//       return allTranslations
//         .filter(t => t.entity_id === entityId && t.type === type)
//         .reduce((acc, t) => ({ ...acc, [t.language.code]: t.value }), {});
//     };

//     return owners.map(owner => ({
//       ...owner,
//       brands: owner.brands.map(brand => ({
//         ...brand,
//         products: brand.category_products.map(cp => ({
//           price: cp.price,
//           ext_id: cp.ext_id,
//           category: {
//             ...cp.category,
//             names: getNames(cp.category.id, 'category')
//           },
//           product: {
//             ...cp.product,
//             names: getNames(cp.product.id, 'product')
//           }
//         }))
//       }))
//     }));
//   }
// }

// module.exports = ApiService;