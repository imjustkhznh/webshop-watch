# WebShop Watch - Backend Setup

## Cài đặt và Cấu hình

### 1. Cài đặt Node.js
Đảm bảo bạn đã cài đặt Node.js (phiên bản 14 trở lên) từ [nodejs.org](https://nodejs.org/)

### 2. Cài đặt Dependencies
```bash
npm install
```

### 3. Cấu hình Cơ sở dữ liệu

#### MySQL Setup:
1. Cài đặt MySQL Server
2. Chạy script SQL để tạo database và bảng (đã cung cấp ở trên)
3. Hoặc tạo database mới:
```sql
CREATE DATABASE watchshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Cập nhật thông tin kết nối:
Chỉnh sửa file `config.env` với thông tin cơ sở dữ liệu của bạn:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=watchshop

# Server Configuration
PORT=3000
JWT_SECRET=your_jwt_secret_key_here

# CORS Configuration
CORS_ORIGIN=http://localhost:5500
```

### 4. Thêm dữ liệu mẫu (tùy chọn)
```bash
npm run seed
```

### 5. Chạy Server
```bash
# Chế độ development (với nodemon)
npm run dev

# Chế độ production
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/register` - Đăng ký tài khoản mới
- `POST /api/login` - Đăng nhập
- `GET /api/profile` - Lấy thông tin profile (cần token)

### Products
- `GET /api/products` - Lấy danh sách sản phẩm

### Brands
- `GET /api/brands` - Lấy danh sách thương hiệu

### Categories
- `GET /api/categories` - Lấy danh sách danh mục

## Cấu trúc Database

### Bảng Users
- `id` - ID người dùng
- `username` - Tên đăng nhập
- `password` - Mật khẩu (đã mã hóa)
- `email` - Email
- `full_name` - Họ tên đầy đủ
- `role` - Vai trò (admin, customer)
- `created_at` - Thời gian tạo

### Bảng Brands
- `id` - ID thương hiệu
- `name` - Tên thương hiệu

### Bảng Categories
- `id` - ID danh mục
- `name` - Tên danh mục

### Bảng Products
- `id` - ID sản phẩm
- `name` - Tên sản phẩm
- `brand_id` - ID thương hiệu
- `category_id` - ID danh mục
- `price` - Giá bán
- `description` - Mô tả
- `image` - URL hình ảnh
- `stock` - Số lượng tồn kho
- `created_at` - Thời gian tạo

### Bảng Carts
- `id` - ID giỏ hàng
- `user_id` - ID người dùng
- `created_at` - Thời gian tạo

### Bảng Cart_Items
- `id` - ID chi tiết giỏ hàng
- `cart_id` - ID giỏ hàng
- `product_id` - ID sản phẩm
- `quantity` - Số lượng

### Bảng Orders
- `id` - ID đơn hàng
- `user_id` - ID người dùng
- `order_date` - Ngày đặt hàng
- `total_amount` - Tổng tiền
- `status` - Trạng thái đơn hàng

### Bảng Order_Details
- `id` - ID chi tiết đơn hàng
- `order_id` - ID đơn hàng
- `product_id` - ID sản phẩm
- `quantity` - Số lượng
- `price` - Giá tại thời điểm mua

### Bảng Payments
- `id` - ID thanh toán
- `order_id` - ID đơn hàng
- `payment_method` - Phương thức thanh toán
- `payment_status` - Trạng thái thanh toán
- `payment_date` - Ngày thanh toán

### Bảng Reviews
- `id` - ID đánh giá
- `product_id` - ID sản phẩm
- `user_id` - ID người dùng
- `rating` - Điểm đánh giá (1-5)
- `comment` - Bình luận
- `review_date` - Ngày đánh giá

## Frontend Integration

Frontend đã được cập nhật để kết nối với backend API. Các tính năng chính:

1. **Đăng nhập**: Kết nối với `/api/login`
2. **Lưu trữ token**: Sử dụng localStorage/sessionStorage
3. **Xác thực**: Tự động thêm token vào headers

## Troubleshooting

### Lỗi kết nối database:
1. Kiểm tra MySQL service đang chạy
2. Kiểm tra thông tin kết nối trong `config.env`
3. Đảm bảo database `webshop_watch` đã được tạo

### Lỗi CORS:
1. Kiểm tra `CORS_ORIGIN` trong `config.env`
2. Đảm bảo frontend đang chạy đúng port

### Lỗi JWT:
1. Kiểm tra `JWT_SECRET` trong `config.env`
2. Đảm bảo secret key đủ mạnh và bảo mật

## Development

### Thêm API mới:
1. Tạo route trong `server.js`
2. Thêm middleware xác thực nếu cần
3. Cập nhật frontend để sử dụng API mới

### Thêm bảng mới:
1. Thêm SQL CREATE TABLE trong hàm `initDatabase`
2. Tạo API endpoints tương ứng
3. Cập nhật frontend nếu cần 