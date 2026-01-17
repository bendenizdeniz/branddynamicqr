// enums/CoreEnums.ts

export enum LanguageCodes {
  TR = "tr",
  EN = "en",
  DE = "de"
}

export enum LanguageValues {
  TR = "TÜRKÇE",
  EN = "ENGLISH",
  DE = "DEUTSCH"
}

export enum EntityTypes {
  CATEGORY = "category",
  PRODUCT = "product"
}

export enum AuthorizeTypes {
  ADMIN = "admin",       // Admin
  OWNER = "owner",       // Yıldız Holding 
  BRAND = "brand",       // EspressoLab 
  SUBVENDOR = "subvendor", // Bebek Şubesi 
}

// Geriye dönük uyumluluk için eski isimlerle export ediyoruz
export const LANG_TR = LanguageCodes.TR;
export const LANG_EN = LanguageCodes.EN;
export const LANG_DE = LanguageCodes.DE;

export const LANG_TR_VAL = LanguageValues.TR;
export const LANG_EN_VAL = LanguageValues.EN;
export const LANG_DE_VAL = LanguageValues.DE;

export const CATEGORY = EntityTypes.CATEGORY;
export const PRODUCT = EntityTypes.PRODUCT;