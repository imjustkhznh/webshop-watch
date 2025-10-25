# 🚀 Quick Start Guide - TimeLuxe Watch Shop

## ⚡ Chạy Dự Án

### 1. Chạy Server Backend

```bash
# Vào thư mục backend
cd backend

# Chạy server (production mode)
npm start

# HOẶC chạy dev mode với nodemon (auto-restart)
npm run dev
```

Server sẽ chạy tại: **http://localhost:3001**

---

## 📦 Cài Đặt Lần Đầu

```bash
cd backend
npm install
```

---

## 🛠️ Các Lệnh Hữu Ích

```bash
# Từ thư mục backend/

npm run seed          # Seed dữ liệu mẫu vào database
npm run create-user   # Tạo user mới
```

---

## 🗂️ Cấu Trúc Dự Án Mới

```
webshop-watch/
├── backend/          ← Tất cả code backend (Node.js)
│   ├── server.js     ← Main server file
│   └── package.json  ← NPM dependencies
│
└── public/           ← Tất cả frontend (HTML/CSS/JS)
    ├── index.html
    ├── css/
    ├── js/
    └── images/
```

---

## ⚙️ Cấu Hình Database

Chỉnh sửa file: `backend/config/config.env`

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=watchshop_db
JWT_SECRET=your_secret_key
PORT=3001
```

---

## 🌐 Truy Cập Website

Sau khi server chạy:
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3001/api/

Ví dụ API endpoints:
- http://localhost:3001/api/products
- http://localhost:3001/api/auth/login
- http://localhost:3001/api/auth/register

---

## ❓ Lỗi Thường Gặp

### 1. `npm: command not found`
→ Cần cài đặt Node.js

### 2. `ENOENT: no such file or directory, open 'package.json'`
→ Đang chạy lệnh npm ở root directory
→ **Giải pháp**: `cd backend` trước khi chạy npm

### 3. Database connection error
→ Kiểm tra `backend/config/config.env`
→ Đảm bảo MySQL đang chạy
→ Đảm bảo database `watchshop_db` đã tồn tại

---

## 📚 Tài Liệu Chi Tiết

Xem thêm: `docs/STRUCTURE.md` để hiểu rõ cấu trúc MVC và API endpoints.

---

## 🎯 Workflow Phát Triển

1. **Start backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Mở browser**: http://localhost:3001

3. **Edit frontend files**: Trong thư mục `public/`
   - HTML files: `public/*.html`
   - CSS files: `public/css/*.css`
   - JS files: `public/js/*.js`

4. **Edit backend files**: Trong thư mục `backend/`
   - Models: `backend/models/`
   - Controllers: `backend/controllers/`
   - Routes: `backend/routes/`

5. **Refresh browser** để xem thay đổi frontend
   (nodemon sẽ tự động restart server khi có thay đổi backend)

---

**💡 Tip**: Luôn nhớ `cd backend` trước khi chạy các lệnh npm!

