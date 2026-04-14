# Copilot Workspace Instructions

## Overview

This workspace is a full-stack project for managing a watch store (HeThongQuanLyCuaHangDongHo_HTTTDN) with:

- **Backend:** Node.js + Express + MySQL
- **Frontend:** React + Vite + TypeScript

## Build & Run Commands

- **Backend:**
  - Install: `cd Src/Backend && npm install`
  - Start (dev): `npm run dev` (default: http://localhost:5000)
- **Frontend:**
  - Install: `cd Src/Frontend && npm install`
  - Start (dev): `npm run dev` (default: http://localhost:3000, proxies /api to backend)
  - Build: `npm run build`
- **Database:**
  - Create database: `QuanLyCuaHangDongHo`
  - Import schema: `Database/QuanLyCuaHangDongHo.sql`

## Key Conventions

- **Backend config:** `Src/Backend/.env` (set `JWT_SECRET`, DB credentials)
- **Frontend config:** Proxy is set up for API calls to backend.
- **Two terminals required** for local dev (one for backend, one for frontend).

## Documentation

- See [README.md](README.md) for full setup and environment requirements.
- Database schema: `Database/QuanLyCuaHangDongHo.sql`
- Project documentation: `Docs/`

## Agent Guidance

- **Link, don’t embed:** Reference docs/files above instead of duplicating content.
- **ApplyTo:**
  - For backend-specific instructions, target `Src/Backend/**`
  - For frontend-specific instructions, target `Src/Frontend/**`
- **Common pitfalls:**
  - Ensure `.env` is configured before running backend.
  - MySQL must be running and accessible.
  - Use correct Node.js version (18+).

## Example Prompts

- “How do I run the backend locally?”
- “Where is the database schema?”
- “How do I build the frontend for production?”

---

For advanced agent customization, consider creating `/create-instruction`, `/create-skill`, or `/create-agent` for:

- Automated database migration
- Custom test runners
- Environment validation
