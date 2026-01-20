import { Request, Response } from "express";
import { SubvendorService } from "../services/SubvendorService";

export class SubvendorController {
  private service: SubvendorService;

  constructor(service: SubvendorService) {
    this.service = service;
  }

  list = async (req: Request, res: Response) => {
    try {
      const { search, brandId, status } = req.query;
      const data = await this.service.getAllSubvendors({
        searchKeyword: search as string,
        brandId: brandId ? Number(brandId) : undefined,
        status: status === "true" ? true : status === "false" ? false : undefined
      });
      res.json({ status: "success", data });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const result = await this.service.createSubvendor(req.body);
      res.status(201).json({ status: "success", data: result });
    } catch (error: any) {
      res.status(400).json({ status: "error", message: error.message });
    }
  };

update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Servise ID ve tüm body paketini gönderiyoruz
    const result = await this.service.update(Number(id), updateData);

    res.json({ 
      status: "success", 
      message: "Şube başarıyla güncellendi", 
      data: result 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Güncelleme sırasında hata oluştu";
    res.status(400).json({ status: "error", message });
  }
};

  remove = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.service.softDelete(Number(id));
      res.json({ status: "success", message: "Subvendor silindi" });
    } catch (error: any) {
      res.status(400).json({ status: "error", message: error.message });
    }
  };
}