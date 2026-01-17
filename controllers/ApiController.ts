// controllers/ApiController.ts
import { Request, Response } from 'express';
import { ApiService } from '../services/ApiService';
import { PrismaFactory } from '../factories/PrismaFactory';
import { PrismaClient } from '@prisma/client';

export class ApiController {
  private apiService: ApiService;
  private factory: PrismaFactory;
  private static prisma=new  PrismaClient();

  constructor(apiService: ApiService, factory: PrismaFactory) {
    this.apiService = apiService;
    this.factory = factory;
  }

  // Ok fonksiyonu (Arrow function) kullanımı binding hatalarını önler
  seed = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.apiService.runSeed();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.apiService.getDashboardData();
      res.json({ status: "success", data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  postOwner = async (req: Request, res: Response): Promise<void> => {
    const { ext_id, name, vkn } = req.body;
    const data = await this.factory.upsertOwner(ext_id, name, vkn);
    res.status(201).json(data);
  };

  postCategory = async (req: Request, res: Response): Promise<void> => {
    const { ext_id, names, type } = req.body;
    const langMap = await this.apiService.getLangMap();
    const data = await this.factory.upsertCategory(ext_id, names, langMap, type);
    res.status(201).json(data);
  };

  postProduct = async (req: Request, res: Response): Promise<void> => {
    const { ext_id, names, type } = req.body;
    const langMap = await this.apiService.getLangMap();
    const data = await this.factory.upsertProduct(ext_id, names, langMap, type);
    res.status(201).json(data);
  };

  // Örnek bir Controller Metodu
getMyProducts = async (req: Request, res: Response) => {
    try {
      const user = req.user!; 
      const lang = (req.query.lang as string) || 'tr';

      // Business tamamen servise devredildi
      const result = await this.apiService.getBrandProductsLocalized(user, lang);
      
      return res.status(200).json({
        status: "success",
        data: result
      });
    } catch (error: any) {
      // Servis içinden fırlatılan Error'lar burada yakalanır
      return res.status(403).json({ 
        status: "error", 
        message: error.message 
      });
    }
  }
}