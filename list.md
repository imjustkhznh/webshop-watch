# 📋 DANH SÁCH TÀI KHOẢN - WEBSHOP WATCH

## 👑 ADMIN (Quản trị viên)

| Email | Username | Password | Họ tên |
|-------|----------|----------|--------|
| admin@shop.com | admin | admin123 | Quản Trị Viên |

---

## 👤 KHÁCH HÀNG (Customers)

| # | Email | Username | Password | Họ tên | SĐT |
|---|-------|----------|----------|--------|-----|
| 1 | test@example.com | testuser | 123456 | Test User | 012345678945 |
| 2 | khanhne123@gmail.com | khanhvippro | 123456 | Gia Khánh | - |
| 3 | nhavua@gmail.com | Vua | 123456 | King | - |
| 4 | sonkieuvan@gmail.com | sonsiuu | 123456 | Van Son | - |
| 5 | traidep@gmail.com | Khanh | 123456 | Trai Đẹp | - |
| 6 | khanh@gmail.com | khanh@gmail.com | 123456 | Phạm Gia Khánh | - |
| 7 | lina@gmail.com | Lina | 123456 | Linh Anh | - |
| 8 | duy@gmail.com | Gggf | 123456 | Bgcvv | - |
| 9 | 1@gmail.com | min | 123456 | minh | 0000000000 |
| 10 | staff@shop.com | staff01 | 123456 | Nguyễn Nhân Viên | - |

---

## 🔑 THÔNG TIN ĐĂNG NHẬP

### Cách đăng nhập:
- Có thể dùng **Email** hoặc **Username**
- Ví dụ: `admin@shop.com` hoặc `admin`

### Mật khẩu mặc định:
- **Admin**: `admin123`
- **Khách hàng**: `123456`

---

## 💡 GỢI Ý TÀI KHOẢN TEST

### Tài khoản Admin (Full quyền):
```
Email:    admin@shop.com
Password: admin123
```

### Tài khoản Khách hàng (Đầy đủ thông tin):
```
Email:    test@example.com
Password: 123456
Họ tên:   Test User
SĐT:      012345678945
```

### Tài khoản Khách hàng (Phổ biến):
```
Email:    khanh@gmail.com
Password: 123456
Họ tên:   Phạm Gia Khánh
```

---

## 📝 LƯU Ý

1. Tất cả mật khẩu khách hàng đều là: `123456`
2. Mật khẩu admin là: `admin123`
3. Có thể đăng nhập bằng Email hoặc Username
4. Để xem danh sách này trong terminal, chạy:
   ```bash
   node backend/scripts/list-users.js
   ```

---

## 🔧 SCRIPT HỮU ÍCH

### Xem danh sách users:
```bash
node backend/scripts/list-users.js
```

### Reset mật khẩu tất cả users về 123456:
```bash
node backend/scripts/reset-passwords.js
```

### Tạo user mới:
```bash
node backend/scripts/create-user.js
```

### Seed dữ liệu mẫu (products, brands, users):
```bash
npm run seed
# hoặc
cd backend && node scripts/seed-data.js
```

---

**Ngày cập nhật**: 27/10/2025
**Tổng số tài khoản**: 11 (1 admin + 10 khách hàng)

