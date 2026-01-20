import { Request, Response } from 'express';
import { OwnerService } from '../services/OwnerService';

export class OwnerController {
  constructor(private ownerService: OwnerService) {}

  list = async (req: Request, res: Response) => {
    try {
      const { search } = req.body;
      const owners = await this.ownerService.getAllOwners(search);
      res.json(owners);
    } catch (error) {
      res.status(500).json({ error: "Şirketler listelenemedi" });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const owner = await this.ownerService.createOwner(req.body);
      res.status(201).json(owner);
    } catch (error) {
      res.status(400).json({ error: "Şirket oluşturulamadı" });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const owner = await this.ownerService.updateOwner(Number(id), req.body);
      res.json(owner);
    } catch (error) {
      res.status(400).json({ error: "Güncelleme hatası" });
    }
  };

  remove = async (req: Request, res: Response) => {
    try {
      await this.ownerService.softDelete(Number(req.params.id));
      res.json({ message: "Şirket silindi" });
    } catch (error) {
      res.status(400).json({ error: "Silme hatası" });
    }
  };
}