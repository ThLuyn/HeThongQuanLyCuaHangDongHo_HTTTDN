# HeThongQuanLyCuaHangDongHo_HTTTDN

He thong quan ly cua hang dong ho (HTTTDN) gom:

- Backend: Node.js + Express + MySQL
- Frontend: React + Vite + TypeScript

## 1. Yeu cau moi truong

- Node.js 18+
- MySQL 8+
- npm

## 2. Clone va cai dat

### Buoc 1: Cai dat Backend

```bash
cd Src/Backend
npm install
```

### Buoc 2: Cai dat Frontend

```bash
cd Src/Frontend
npm install
```

## 3. Cai dat Database

### Buoc 1: Tao database

Tao database voi ten: QuanLyCuaHangDongHo

### Buoc 2: Import file SQL

Import file sau vao MySQL: Database/QuanLyCuaHangDongHo.sql

## 4. Cau hinh Backend

File cau hinh: Src/Backend/.env

Luu y:

- Hay doi JWT_SECRET thanh chuoi bi mat cua ban.
- Neu thong tin MySQL khac may ban, sua DB_USER/DB_PASSWORD cho dung.

## 5. Chay du an

Can mo 2 terminal rieng.

### Terminal 1: Chay Backend

```bash
cd Src/Backend
npm run dev
```

Backend chay mac dinh o: http://localhost:5000

### Terminal 2: Chay Frontend

```bash
cd Src/Frontend
npm run dev
```

Frontend chay mac dinh o: http://localhost:3000

Frontend da cau hinh proxy /api sang backend http://localhost:5000.

## 6. Build Frontend

```bash
cd Src/Frontend
npm run build
```