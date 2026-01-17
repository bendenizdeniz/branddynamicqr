# Brand-Driven Dynamic QR Menu System

A robust, multi-tenant backend built with **Node.js**, **TypeScript**, and **Prisma ORM**. This system is designed for high-scale restaurant/cafe management where branding is centralized, but operations are distributed across sub-vendors.

## 🏗 Architectural Overview

The project follows a modular and scalable architecture, leveraging modern software design patterns:

### 1. **Factory Pattern (PrismaFactory)**

To ensure data consistency and reduce boilerplate, a custom `PrismaFactory` handles complex entity creation (upserts). It centralizes the logic for:

* Linking Owners to Brands.
* Managing Brands and their Sub-vendors.
* Automating multi-language string values for products and categories.

### 2. **Multi-Language Support (Localization)**

Instead of static columns, the system uses a relational `StringValue` and `Language` table structure.

* **Dynamic Localization:** Products and Categories can have infinite translations.
* **Contextual Mapping:** The backend intelligently maps language codes (TR, EN, DE) to database entities during data retrieval and seeding.

### 3. **TypeScript Integration**

* **Type Safety:** Strict mode enabled for comprehensive compile-time checks.
* **Prisma Client:** Leveraging auto-generated types from the Prisma Schema to ensure 1:1 mapping with the database layer.

---

## 🛠 Tech Stack

* **Runtime:** Node.js (v18+)
* **Language:** TypeScript
* **ORM:** Prisma
* **Database:** PostgreSQL
* **Containerization:** Docker & Docker Compose
* **API Framework:** Express.js

---

## 📂 Project Structure

```text
backend/
├── src/
│   ├── controllers/   # Request handlers (ApiController)
│   ├── services/      # Business logic and external data mapping
│   ├── factories/     # Factory Pattern implementation (PrismaFactory)
│   ├── enums/         # Global constants and core enums
│   └── server.ts      # Application entry point
├── prisma/
│   └── schema.prisma  # Database models and relations
└── dist/              # Compiled JavaScript output

```

---

## 🚀 Getting Started

### Prerequisites

* Docker & Docker Compose
* Node.js & npm (for local development)

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/bendenizdeniz/branddynamicqr.git
cd branddynamicqr/backend

```


2. **Environment Variables:**
Create a `.env` file based on your database configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

```


3. **Run with Docker:**
```bash
docker-compose up -d --build

```


4. **Database Synchronization:**
```bash
npx prisma db push
npx prisma generate

```


5. **Seed Initial Data:**
Visit `http://localhost:3000/seed` to populate the database with default owners, brands, and localized products.

---

## 🗺 Roadmap

* [x] Initial TypeScript Migration
* [x] Factory Pattern Implementation
* [x] Multi-language Product & Category Management
* [ ] **Next:** Hierarchical Authentication (Admin -> Owner -> Brand -> Sub-vendor)
* [ ] **Next:** Sub-vendor Specific Configuration (Dynamic Language/Theme per Branch)
* [ ] **Next:** Frontend Dashboard Integration

---

## 📄 License

This project is licensed under the MIT License.

---
