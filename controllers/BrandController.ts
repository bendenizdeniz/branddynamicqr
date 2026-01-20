import { Request, Response } from 'express';
import { BrandService } from '../services/BrandService';

export class BrandController {
  private brandService: BrandService;

  constructor() {
    this.brandService = new BrandService();
  }

  // GET /brands
  getBrands = async (_req: Request, res: Response): Promise<void> => {
    try {
      const brands = await this.brandService.getAllBrands();
      res.status(200).json(brands);
    } catch (error: any) {
      console.error('BrandController Error:', error);
      res.status(500).json({ 
        error: 'Markalar getirilirken bir sunucu hatası oluştu.' 
      });
    }
  };
}