# HeThongQuanLyCuaHangDongHo_HTTTDN

He thong quan ly cua hang dong ho (HTTTDN) gom:

- Backend: Node.js + Express + MySQL
- Frontend: React + Vite + TypeScript

## 1. Yeu cau moi truong

- Node.js 18+ (khuyen nghi 20+)
- MySQL 8+ (hoac MySQL 5.7 co ho tro schema tuong thich)
- npm

## 2. Clone va cai dat

### Buoc 1: Cai dat Backend

```bash
cd Src/Backend
npm install
```

### Buoc 2: Cai dat Frontend

```bash
cd ../Frontend
npm install
```

## 3. Cai dat Database

### Buoc 1: Tao database

Tao database voi ten:

QuanLyCuaHangDongHo

### Buoc 2: Import file SQL

Import file sau vao MySQL:

Database/QuanLyCuaHangDongHo.sql

Vi du command:

```bash
mysql -u <user> -p QuanLyCuaHangDongHo < Database/QuanLyCuaHangDongHo.sql
```

## 4. Cau hinh Backend

File cau hinh:

Src/Backend/.env

Mau cau hinh dang dung:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=projects
DB_PASSWORD=12345678
DB_NAME=QuanLyCuaHangDongHo
DB_CONNECTION_LIMIT=10

JWT_SECRET=replace_this_with_strong_secret
JWT_EXPIRES_IN=1d

NODE_ENV=development
```

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

Backend chay mac dinh o:

http://localhost:5000

### Terminal 2: Chay Frontend

```bash
cd Src/Frontend
npm run dev
```

Frontend chay mac dinh o:

http://localhost:3000

Frontend da cau hinh proxy /api sang backend http://localhost:5000.

## 6. Tai khoan dang nhap mac dinh

- Username: admin
- Password: 123456

## 7. Build Frontend

```bash
cd Src/Frontend
npm run build
```

## 8. Loi thuong gap

### 8.1 Loi EADDRINUSE: address already in use :::5000

Nguyen nhan: da co mot backend khac dang chay o cong 5000.

Xu ly:

```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

Sau do chay lai:

```bash
cd Src/Backend
npm run dev
```

### 8.2 Loi Invalid credentials

- Kiem tra lai username/password.
- Kiem tra tai khoan co trong bang TAIKHOAN va TRANGTHAI = 1.
- Dang nhap mac dinh: admin / 123456.

### 8.3 Loi Route not found

- Dam bao backend dang chay dung thu muc Src/Backend.
- Restart backend sau khi sua code route:

```bash
cd Src/Backend
npm run dev
```
