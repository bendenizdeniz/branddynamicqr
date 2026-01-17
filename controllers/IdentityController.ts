import { Request, Response } from 'express';
import { IdentityService } from '../services/IdentityService';

const identityService = new IdentityService();

export class IdentityController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await identityService.login(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }
}