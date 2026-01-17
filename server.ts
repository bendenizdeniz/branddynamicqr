// server.ts
import express from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaFactory } from "./factories/PrismaFactory";
import { ApiService } from "./services/ApiService";
import { ApiController } from "./controllers/ApiController";
import { IdentityController } from './controllers/IdentityController';
import { AuthMiddleware } from './middlewares/AuthMiddleware';


const app = express();
app.use(express.json()); // MUTLAKA rotalardan yukarıda olmal

const prisma = new PrismaClient();
const factory = new PrismaFactory(prisma);
const apiService = new ApiService(prisma, factory);
const controller = new ApiController(apiService, factory);

// Routes
// Sadece en üst seviye admin yapabilmeli
app.get("/seed", AuthMiddleware.verify, controller.seed);

// Dashboard verisi genelde Admin veya Owner (Holding) içindir
app.get("/dashboard-data", AuthMiddleware.verify, controller.getDashboard);

// Yönetimsel kayıt işlemleri (Sadece Admin yetkisinde olmalı)
app.post("/owners", AuthMiddleware.verify, controller.postOwner);
app.post("/categories", AuthMiddleware.verify, controller.postCategory);
app.post("/products", AuthMiddleware.verify, controller.postProduct);

// Login her zaman herkese açık kalmalı
app.post('/auth/login', IdentityController.login);

// Bu rotaya sadece geçerli bir token'ı olan ve rolü ADMIN veya OWNER olanlar girebilir
app.get('/admin/stats', 
  AuthMiddleware.verify, 
  AuthMiddleware.checkRole(['ADMIN', 'OWNER']), 
  (req, res) => {
    res.json({ message: "Welcome to Secure Admin Panel", currentUser: req.user });
});

// server.ts
app.get('/my-brand-data', AuthMiddleware.verify, controller.getMyProducts);

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 TS Server running on http://localhost:${PORT}`));
