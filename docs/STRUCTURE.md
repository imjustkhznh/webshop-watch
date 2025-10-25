# Cấu Trúc Dự Án - TimeLuxe Watch Shop

## 📁 Tổng Quan Cấu Trúc

```
webshop-watch/
├── backend/                    # Backend API (Node.js + Express + MySQL)
│   ├── config/                # Configuration
│   │   ├── config.env        # Environment variables
│   │   └── database.js       # Database connection pool
│   │
│   ├── models/               # Models (Database layer)
│   │   ├── User.js          # User model
│   │   ├── Product.js       # Product model
│   │   └── Order.js         # Order model
│   │
│   ├── controllers/          # Controllers (Business logic)
│   │   ├── authController.js      # Authentication logic
│   │   ├── userController.js      # User management
│   │   ├── productController.js   # Product management
│   │   └── orderController.js     # Order management
│   │
│   ├── routes/               # Routes (API endpoints)
│   │   ├── authRoutes.js          # /api/auth/*
│   │   ├── userRoutes.js          # /api/users/*
│   │   ├── productRoutes.js       # /api/products/*
│   │   └── orderRoutes.js         # /api/orders/*
│   │
│   ├── middleware/           # Middleware functions
│   │   ├── auth.js                # JWT authentication
│   │   └── errorHandler.js        # Error handling
│   │
│   ├── scripts/              # Database management scripts
│   │   ├── seed-data.js           # Seed sample data
│   │   ├── sync-products.js       # Sync products
│   │   ├── create-user.js         # Create user
│   │   └── reset-passwords.js     # Reset passwords
│   │
│   ├── server.js             # Main server file
│   ├── package.json
│   └── package-lock.json
│
├── public/                    # Frontend (HTML + CSS + JS + Images)
│   ├── *.html                # All HTML pages
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── register.html
│   │   └── (other pages...)
│   │
│   ├── css/                  # All CSS files
│   │   ├── styles.css
│   │   ├── header.css
│   │   ├── login.css
│   │   └── (other CSS...)
│   │
│   ├── js/                   # All frontend JavaScript
│   │   ├── index.js
│   │   ├── admin.js
│   │   ├── login.js
│   │   └── (other JS...)
│   │
│   └── images/               # All images
│       ├── banners/          # Banner images
│       ├── products/         # Product images
│       ├── logos/            # Logo images
│       └── icons/            # Icon images
│
├── docs/                      # Documentation
│   ├── README.md
│   ├── HUONG-DAN-GITHUB.md
│   └── STRUCTURE.md (this file)
│
└── node_modules/             # Dependencies (auto-generated)
```

## 🚀 Cách Chạy Dự Án

### 1. Cài đặt dependencies
```bash
cd backend
npm install
```

### 2. Cấu hình database
Sửa file `backend/config/config.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=watchshop_db
JWT_SECRET=your_secret_key
PORT=3001
```

### 3. Chạy server
```bash
cd backend
npm start
```

Server sẽ chạy tại: `http://localhost:3001`

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/verify` - Xác thực token (cần JWT)

### Users (`/api/users`)
- `GET /api/users/profile` - Lấy thông tin user (cần JWT)
- `PUT /api/users/profile` - Cập nhật profile (cần JWT)
- `POST /api/users/change-password` - Đổi mật khẩu (cần JWT)
- `GET /api/users/customers` - Lấy danh sách customers (Admin only)
- `DELETE /api/users/customers/:id` - Xóa customer (Admin only)

### Products (`/api/products`)
- `GET /api/products` - Lấy tất cả sản phẩm (Public)
- `GET /api/products/:id` - Lấy sản phẩm theo ID (Public)
- `POST /api/products` - Tạo sản phẩm mới (Admin only)
- `PUT /api/products/:id` - Cập nhật sản phẩm (Admin only)
- `DELETE /api/products/:id` - Xóa sản phẩm (Admin only)

### Orders (`/api/orders`)
- `GET /api/orders` - Lấy danh sách đơn hàng (cần JWT)
- `GET /api/orders/:id` - Lấy đơn hàng theo ID (cần JWT)
- `POST /api/orders` - Tạo đơn hàng mới (cần JWT)
- `PUT /api/orders/:id/status` - Cập nhật trạng thái (Admin only)
- `DELETE /api/orders/:id` - Xóa đơn hàng (Admin only)
- `GET /api/orders/stats/revenue` - Thống kê doanh thu (Admin only)

## 🔐 Authentication

API sử dụng JWT (JSON Web Token) để xác thực.

### Cách sử dụng:
1. Đăng ký/Đăng nhập để nhận token
2. Thêm token vào header của request:
```
Authorization: Bearer <your_token_here>
```

## 🛠️ Scripts Hữu Ích

```bash
# Từ thư mục backend/

# Seed dữ liệu mẫu
npm run seed

# Tạo user mới
npm run create-user

# Hoặc chạy trực tiếp
node scripts/seed-data.js
node scripts/create-user.js
node scripts/sync-products.js
```

## 📦 MVC Pattern

Dự án sử dụng mô hình MVC (Model-View-Controller):

- **Models**: Xử lý logic database, truy vấn dữ liệu
- **Controllers**: Xử lý business logic, xử lý request/response
- **Routes**: Định nghĩa API endpoints và kết nối với controllers
- **Middleware**: Xử lý authentication, error handling
- **Views**: Frontend HTML/CSS/JS (trong thư mục public/)

## 🔄 So Sánh Với Cấu Trúc Cũ

### Cũ:
```
- Tất cả file HTML, CSS, JS, images ở root và static/
- server.js chứa tất cả logic (>1500 lines)
- Không có phân chia rõ ràng giữa frontend và backend
```

### Mới:
```
✅ Backend và Frontend tách biệt rõ ràng
✅ MVC pattern cho backend
✅ API endpoints có cấu trúc RESTful
✅ Middleware riêng cho authentication
✅ Models riêng cho database layer
✅ Dễ maintain và scale
```

## 📝 Notes

- Tất cả HTML files giờ nằm trong `public/`
- CSS files trong `public/css/`
- JS files trong `public/js/`
- Images được tổ chức theo thư mục: banners/, products/, logos/, icons/
- Server tự động serve static files từ `public/`

