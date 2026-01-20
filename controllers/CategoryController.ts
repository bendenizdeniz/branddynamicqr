// controllers/CategoryController.ts
import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';
import * as CoreEnums from "../enums/CoreEnums";

export class CategoryController {
  private categoryService: CategoryService;

  constructor(categoryService: CategoryService) {
    this.categoryService = categoryService;
  }

  postCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      if ((user.role as string).toLocaleLowerCase() !== CoreEnums.AuthorizeTypes.ADMIN) {
        res.status(403).json({ message: "Bu işlem için Admin yetkisi gerekiyor." });
        return;
      }
      
      const { ext_id, names, type } = req.body;
      const result = await this.categoryService.createOrUpdateCategory(ext_id, names, type);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { languageId, searchKeyword } = req.body;

    if (!languageId) {
      res.status(400).json({ message: "languageId zorunludur." });
      return;
    }

    const categories = await this.categoryService.getAllCategories({
      languageId: Number(languageId),
      searchKeyword: searchKeyword,
      brandId: req.body.brandId ? Number(req.body.brandId) : null // Yeni parametre
    });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
}