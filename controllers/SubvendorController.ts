// controllers/SubvendorController.ts
import { Request, Response } from 'express';
import { SubvendorService } from '../services/SubvendorService';
import * as CoreEnums from "../enums/CoreEnums";

export class SubvendorController {
  private subvendorService: SubvendorService;

  constructor(subvendorService: SubvendorService) {
    this.subvendorService = subvendorService;
  }

getSubvendors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchKeyword, brandId, status } = req.body;
    
    const subvendors = await this.subvendorService.getAllSubvendors({
      searchKeyword: searchKeyword || undefined,
      // brandId null gelirse undefined yapıyoruz ki TS hata vermesin
      brandId: brandId ? Number(brandId) : undefined, 
      status: status === 'active' ? true : status === 'passive' ? false : undefined
    });

    res.status(200).json({ success: true, data: subvendors });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
  postSubvendor = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      
      // Sadece ADMIN şube ekleyebilir kontrolü
      if ((user.role as string).toUpperCase() !== CoreEnums.AuthorizeTypes.ADMIN) {
        res.status(403).json({ message: "Bu işlem için Admin yetkisi gerekiyor." });
        return;
      }

      const subvendorData = req.body;
      const result = await this.subvendorService.createSubvendor(subvendorData);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  };

putSubvendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await this.subvendorService.updateSubvendor(Number(id), req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

patchSubvendorStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // true veya false
    const result = await this.subvendorService.toggleSubvendorStatus(Number(id), status);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

deleteSubvendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await this.subvendorService.deleteSubvendor(Number(id));
    res.status(200).json({ success: true, message: "Şube başarıyla silindi." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
}