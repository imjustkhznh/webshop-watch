# ⌚ TimeLuxe Watch Shop

Website bán đồng hồ cao cấp với backend Node.js + Express + MySQL và frontend HTML/CSS/JavaScript.

## 🚀 Quick Start

```bash
# 1. Cài đặt dependencies
cd backend
npm install

# 2. Cấu hình database
# Chỉnh sửa backend/config/config.env

# 3. Chạy server
npm run dev
```

Mở browser: **http://localhost:3001**

## 📁 Cấu Trúc Dự Án (MVC Pattern)

```
webshop-watch/
├── backend/              # Backend API (Node.js + Express)
│   ├── models/          # Database models
│   ├── controllers/     # Business logic
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth & error handling
│   └── server.js        # Main server
│
├── public/              # Frontend (HTML + CSS + JS)
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── images/         # Images (banners, products, logos, icons)
│
└── docs/               # Documentation
```

## 🔌 API Endpoints

- **Auth**: `/api/auth/login`, `/api/auth/register`
- **Users**: `/api/users/profile`, `/api/users/customers`
- **Products**: `/api/products`
- **Orders**: `/api/orders`

Chi tiết: Xem `docs/STRUCTURE.md`

## 📚 Tài Liệu

- **Quick Start**: `QUICKSTART.md` - Hướng dẫn chạy nhanh
- **Cấu trúc**: `docs/STRUCTURE.md` - Chi tiết cấu trúc MVC và API
- **GitHub**: `docs/HUONG-DAN-GITHUB.md` - Hướng dẫn Git

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, MySQL, JWT
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Token)

## ⚙️ Yêu Cầu Hệ Thống

- Node.js (v14+)
- MySQL (v5.7+)
- npm hoặc yarn

## 🌐 Deployment (Render)

### Tự động deploy với `render.yaml`

Project đã được config sẵn với `render.yaml`. Khi push lên GitHub, Render sẽ tự động:
- Nhận diện root directory là `backend/`
- Chạy `npm install` và `npm start`

### Hoặc config thủ công trên Render Dashboard:

1. **Root Directory**: `backend`
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. **Environment Variables** (thêm trong Settings):
   - `DB_HOST` - MySQL host
   - `DB_PORT` - 3306
   - `DB_USER` - Database username
   - `DB_PASSWORD` - Database password
   - `DB_NAME` - Database name
   - `JWT_SECRET` - Secret key cho JWT
   - `CORS_ORIGIN` - Frontend URL
   - `PORT` - (Render tự động set)

### Database Setup trên Render:
1. Tạo MySQL database trên Render hoặc sử dụng external MySQL
2. Copy connection string vào Environment Variables
3. Server sẽ tự động tạo tables khi khởi động

## 📝 License

ISC

---

**⚠️ LƯU Ý**: Tất cả lệnh npm phải chạy từ thư mục `backend/`

```bash
# ✅ ĐÚNG (Local Development)
cd backend
npm run dev

# ❌ SAI
npm run dev  # (ở root directory)

# ✅ ĐÚNG (Production/Render)
npm start  # (ở root, tự động chạy backend)
```

