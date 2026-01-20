import { PrismaClient } from '@prisma/client';

import express from "express";
import cors from 'cors';

import { PrismaFactory } from "./factories/PrismaFactory";

// Services
import { ApiService } from "./services/ApiService";
import { CategoryService } from "./services/CategoryService";

// Controllers
import { ApiController } from "./controllers/ApiController";
import { BrandController } from "./controllers/BrandController";
import { IdentityController } from './controllers/IdentityController';
import { ProductController } from "./controllers/ProductController";
import { CategoryController } from "./controllers/CategoryController";
import {SubvendorController } from "./controllers/SubvendorController";
import {OwnerController } from "./controllers/OwnerController";

// Middlewares
import { AuthMiddleware } from './middlewares/AuthMiddleware';
import { SubvendorService } from "./services/SubvendorService";
import { BrandService } from './services/BrandService'; 
import { OwnerService } from './services/OwnerService'; 

const app = express();

// --- MIDDLEWARES ---
app.use(express.json()); 

app.use(cors({
  origin: 'http://localhost:5173', // Frontend'in adresi
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
}));

// --- DATABASE & FACTORY INITIALIZATION ---
const prisma = new PrismaClient();
const factory = new PrismaFactory(prisma);

// --- SERVICE INITIALIZATION (Dependency Injection) ---
const apiService = new ApiService(prisma, factory);
const categoryService = new CategoryService(prisma, factory);
const subvendorService = new SubvendorService(prisma);
const brandService = new BrandService(prisma);
const ownerService = new OwnerService(prisma);

// --- CONTROLLER INITIALIZATION ---
const apiController = new ApiController(apiService, factory);
const categoryController = new CategoryController(categoryService);
const brandController = new BrandController(brandService);
const productController = new ProductController();
const subvendorController = new SubvendorController(subvendorService);
const ownerController = new OwnerController(ownerService);

// --- ROUTES ---

// 1. Kimlik ve Yetkilendirme (Auth)
app.post('/auth/login', IdentityController.login);

// 2. Sistem ve Seed İşlemleri
app.get("/seed", apiController.seed);
app.get("/dashboard-data", AuthMiddleware.verify, apiController.getDashboard);

// 3. Kategori Yönetimi
// Admin yetkisi gerektiren kayıt işlemi
app.post("/post-category", AuthMiddleware.verify, categoryController.postCategory);
// Genel kullanıma açık kategori listesi
app.post('/categories', AuthMiddleware.verify, categoryController.getCategories);

// 4. Ürün Yönetimi
app.post("/post-product", AuthMiddleware.verify, productController.postProduct);
app.get('/my-brand-data', AuthMiddleware.verify, productController.getMyProducts);
// Frontend'den gelen filtreleme isteği (Body ile veri aldığı için POST yapıldı)
app.post('/brand-based-products', productController.getBrandBasedFilteredProducts);


// Route tanımlamaları (Daha önce apiController.postOwner vardı, onu buraya taşıyoruz)
app.post('/owners', AuthMiddleware.verify, ownerController.list);
app.post('/owners/create', AuthMiddleware.verify, ownerController.create);
app.patch('/owners/:id', AuthMiddleware.verify, ownerController.update);
app.delete('/owners/:id', AuthMiddleware.verify, ownerController.remove);


// --- 5. Marka İşlemleri ---

// Liste ve Arama (Frontend 'search' parametresini body ile gönderdiği için POST kullanılıyor)
app.post('/brands', AuthMiddleware.verify, brandController.list);

// Yeni Marka Kaydı
app.post('/brands/create', AuthMiddleware.verify, brandController.create);

// Marka Güncelleme (Patch - Kısmi Güncelleme)
app.patch('/brands/:id', AuthMiddleware.verify, brandController.update);

// Marka Silme (Soft Delete)
app.delete('/brands/:id', AuthMiddleware.verify, brandController.remove);


// --- 7. Alt Yüklenici (Subvendor) İşlemleri ---

app.get('/subvendors', AuthMiddleware.verify, subvendorController.list);

// Yeni Kayıt
app.post('/subvendors', AuthMiddleware.verify, subvendorController.create);

// Güncelleme 
app.patch('/subvendors/:id', AuthMiddleware.verify, subvendorController.update);

// Silme (Soft Delete)
app.delete('/subvendors/:id', AuthMiddleware.verify, subvendorController.remove);

// 6. Özel Yetkili Rotalar (Örnek)
app.get('/admin/stats', 
  AuthMiddleware.verify, 
  AuthMiddleware.checkRole(['ADMIN', 'OWNER']), 
  (req, res) => {
    res.json({ message: "Welcome to Secure Admin Panel", currentUser: req.user });
});

// --- SERVER START ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`
  🚀 TS Server is running!
  📡 URL: http://localhost:${PORT}
  🛠️ CORS: Enabled for http://localhost:5173
  `);
});