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
app.get("/seed", controller.seed);
app.get("/dashboard-data", controller.getDashboard);
app.post("/owners", controller.postOwner);
app.post("/categories", controller.postCategory);
app.post("/products", controller.postProduct);
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
