import { Request, Response } from 'express';
import { ProductService, ProductFilterRequest } from '../services/ProductService';
import * as CoreEnums from "../enums/CoreEnums";

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  // POST /products/filter
  getBrandBasedFilteredProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const filterData: ProductFilterRequest = req.body;

      // Basit validasyon: languageId her zaman gerekli
      if (!filterData.languageId) {
        res.status(400).json({ error: 'languageId parametresi zorunludur.' });
        return;
      }

      const products = await this.productService.getBrandBasedFilteredProducts(filterData);
      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error: any) {
      console.error('ProductController Error:', error);
      res.status(500).json({ 
        error: 'Ürünler listelenirken bir sunucu hatası oluştu.' 
      });
    }
  };

  postProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    // Admin kontrolü
    if (String(user.role).toLocaleLowerCase() !== CoreEnums.AuthorizeTypes.ADMIN) {
      res.status(403).json({ message: "Bu işlem için yetkiniz yok." });
      return;
    }

    const { 
      ext_id,     // Ürün için benzersiz kod (barkod vb.)
      names,      // Örn: { "tr": "Ürün Adı", "en": "Product Name" }
      brandId,    // Sayısal ID
      categoryId, // Sayısal ID
      price       // Float/Sayı
    } = req.body;

    // Temel validasyon
    if (!ext_id || !names || !brandId || !categoryId || price === undefined) {
      res.status(400).json({ message: "Eksik veri: ext_id, names, brandId, categoryId ve price zorunludur." });
      return;
    }

    // Servis katmanına tüm paketi gönderiyoruz
    const result = await this.productService.createFullProductFlow({
      ext_id,
      names,
      brandId: Number(brandId),
      categoryId: Number(categoryId),
      price: parseFloat(price),
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


  // 3. Marka Ürünlerini Listeleme (Localized)
  getMyProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!; 
      const lang = (req.query.lang as string) || 'tr';

      const result = await this.productService.getBrandProductsLocalized(user, lang);
      
      res.status(200).json({
        status: "success",
        data: result
      });
    } catch (error: any) {
      res.status(403).json({ status: "error", message: error.message });
    }
  };
}