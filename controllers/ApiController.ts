import { Request, Response } from 'express';
import { ApiService } from '../services/ApiService';
import { PrismaFactory } from '../factories/PrismaFactory';
import * as CoreEnums from "../enums/CoreEnums";
export class ApiController {
  private apiService: ApiService;
  private factory: PrismaFactory;

  constructor(apiService: ApiService, factory: PrismaFactory) {
    this.apiService = apiService;
    this.factory = factory;
  }

  // 1. Seed İşlemi (Admin Only - Servis içinde kontrol ediliyor)
  seed = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const result = await this.apiService.runSeed(user);
      res.json(result);
    } catch (error: any) {
      res.status(403).json({ status: "error", message: error.message });
    }
  };

  // 2. Dashboard Verisi (Admin/Owner Only)
  getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const data = await this.apiService.getDashboardData(user);
      res.json({ status: "success", data });
    } catch (error: any) {
      res.status(403).json({ status: "error", message: error.message });
    }
  };

  // 4. Yönetimsel Kayıt Metotları (Admin/Owner Yetki Kontrolleri Eklenmeli)
  postOwner = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      if ((user.role as string) !== CoreEnums.AuthorizeTypes.ADMIN) {
        res.status(403).json({ message: "Sadece sistem yöneticileri Owner ekleyebilir." });
        return;
      }
      const { ext_id, name, vkn } = req.body;
      const data = await this.factory.upsertOwner(ext_id, name, vkn);
      res.status(201).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}