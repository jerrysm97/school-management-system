# 🏫 School Management System (ERP)

**Full-Stack Institutional Management Platform**

A comprehensive school ERP handling student enrollment, fee management, payment reconciliation, and dunning workflows. Built with a decoupled TypeScript architecture and deployed on Vercel.

[![Live Demo](https://img.shields.io/badge/Live-build--system--tau.vercel.app-000?logo=vercel&logoColor=white)](https://build-system-tau.vercel.app)
![TypeScript](https://img.shields.io/badge/TypeScript-Full_Stack-3178C6?logo=typescript&logoColor=white)
![Drizzle](https://img.shields.io/badge/ORM-Drizzle-C5F74F)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

---

## 🚀 Features

- **Student Management** — enrollment, profiles, class assignments
- **Fee & Payment Engine** — installment plans, payment tracking, receipt generation
- **Dunning & AR Workflows** — automated overdue notifications and accounts receivable
- **Payment Reconciliation** — match payments against outstanding invoices
- **Docker Support** — containerized deployment with `docker-compose`
- **Vercel-Optimized** — production-ready with `vercel.json` configuration

## 📁 Architecture

```
school-management-system/
├── client/              # React + Vite frontend (Tailwind + shadcn/ui)
├── server/              # Express API server
├── shared/              # Shared TypeScript types & schemas
├── api/                 # Vercel serverless API routes
├── script/              # Database migration scripts
├── drizzle.config.ts    # Drizzle ORM configuration
├── Dockerfile           # Container build
├── docker-compose.yml   # Multi-service orchestration
└── vercel.json          # Vercel deployment config
```

## ⚡ Quick Start

```bash
git clone https://github.com/jerrysm97/school-management-system.git
cd school-management-system
npm install

# Development
npm run dev

# Docker
docker-compose up --build
```

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, Express, TypeScript |
| **ORM** | Drizzle ORM |
| **Database** | SQLite (dev) / PostgreSQL (production) |
| **Deployment** | Vercel, Docker |

## 📊 Key Technical Decisions

- **Drizzle ORM** over Prisma for type-safe queries without code generation overhead
- **SQLite in development** for zero-config local setup, PostgreSQL in production
- **Decoupled client/server** architecture enabling independent scaling
- **Dunning automation** using cron-based job scheduling for overdue fee detection

## 📜 License

MIT License
