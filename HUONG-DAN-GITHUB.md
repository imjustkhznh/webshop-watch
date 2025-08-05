# HƯỚNG DẪN UPLOAD DỰ ÁN LÊN GITHUB

## Bước 1: Cài đặt Git
1. Truy cập: https://git-scm.com/download/win
2. Tải file .exe cho Windows
3. Chạy file và làm theo hướng dẫn cài đặt
4. Khởi động lại PowerShell sau khi cài đặt

## Bước 2: Tạo Repository trên GitHub
1. Đăng nhập GitHub: https://github.com
2. Click nút "New" hoặc "+" 
3. Đặt tên repository: `webshop-watch`
4. Chọn "Public" hoặc "Private"
5. **KHÔNG** check "Add a README file"
6. Click "Create repository"

## Bước 3: Khởi tạo Git và Upload Code

Sau khi cài Git, mở PowerShell trong thư mục dự án và chạy các lệnh sau:

```bash
# Khởi tạo Git repository
git init

# Thêm tất cả file vào staging
git add .

# Commit đầu tiên
git commit -m "Initial commit: Webshop Watch project"

# Thêm remote repository (thay YOUR_USERNAME bằng username GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/webshop-watch.git

# Push code lên GitHub
git branch -M main
git push -u origin main
```

## Bước 4: Cấu hình Git (chỉ làm 1 lần)
```bash
# Cấu hình tên và email
git config --global user.name "Tên của bạn"
git config --global user.email "email@example.com"
```

## Lưu ý quan trọng:
- Thay `YOUR_USERNAME` bằng username GitHub thực của bạn
- Nếu repository là Private, bạn cần đăng nhập GitHub khi push
- File `.gitignore` sẽ tự động loại trừ các file không cần thiết

## Các lệnh Git cơ bản:
```bash
git status          # Xem trạng thái file
git add .           # Thêm tất cả file thay đổi
git commit -m "message"  # Commit với message
git push            # Push lên GitHub
git pull            # Kéo code mới về
```

## Nếu gặp lỗi:
- Kiểm tra kết nối internet
- Đảm bảo đã đăng nhập GitHub
- Kiểm tra URL repository có đúng không 