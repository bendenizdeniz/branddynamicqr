// server.ts
import express from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaFactory } from "./factories/PrismaFactory";
import { ApiService } from "./services/ApiService";
import { ApiController } from "./controllers/ApiController";

const app = express();
app.use(express.json());

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

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 TS Server running on http://localhost:${PORT}`));

// console.log("🔍 ŞU ANKİ DB ADRESİ:", process.env.DATABASE_URL);

// const express = require("express");
// const { PrismaClient } = require("@prisma/client");
// const PrismaFactory = require("./factories/PrismaFactory");
// const ApiService = require("./services/ApiService");
// const ApiController = require("./controllers/ApiController");

// const app = express();
// app.use(express.json());

// const prisma = new PrismaClient();
// const factory = new PrismaFactory(prisma);
// const apiService = new ApiService(prisma, factory);
// const controller = new ApiController(apiService, factory);

// // Routes
// app.get("/seed", controller.seed);
// app.get("/dashboard-data", controller.getDashboard);
// app.post("/owners", controller.postOwner);
// app.post("/categories", controller.postCategory);
// app.post("/products", controller.postProduct);

// app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));