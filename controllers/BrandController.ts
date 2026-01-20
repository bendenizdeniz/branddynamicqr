import { Request, Response } from "express";
import { BrandService } from "../services/BrandService";

export class BrandController {
  constructor(private service: BrandService) {}

  list = async (req: Request, res: Response) => {
    const data = await this.service.getAllBrands(req.query.search as string);
    res.json(data);
  };

  create = async (req: Request, res: Response) => {
    const result = await this.service.createBrand(req.body);
    res.status(201).json(result);
  };

  update = async (req: Request, res: Response) => {
    const result = await this.service.updateBrand(Number(req.params.id), req.body);
    res.json(result);
  };

  remove = async (req: Request, res: Response) => {
    await this.service.softDelete(Number(req.params.id));
    res.json({ message: "Marka silindi" });
  };
}