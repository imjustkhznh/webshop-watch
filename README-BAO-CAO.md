# BÁO CÁO WEBSHOP ĐỒNG HỒ TIMELUXE

## 📋 Mô tả
Báo cáo LaTeX về dự án website bán đồng hồ TimeLuxe cho môn Trí tuệ nhân tạo và Các vấn đề hiện đại của công nghệ phần mềm.

## 📁 Cấu trúc file

### File chính:
- `baocao-webshop.tex` - File chính chứa trang bìa, lời nói đầu và Chương 1
- `baocao-chuong2-3.tex` - Chương 2, 3, kết luận và tài liệu tham khảo
- `hinh-anh-bao-cao.tex` - Phần hình ảnh minh họa và sơ đồ

### Hình ảnh:
- Sử dụng hình ảnh từ thư mục `static/` của dự án
- Logo TimeLuxe, banner, sản phẩm đồng hồ
- Icons dịch vụ (giao hàng, bảo hành)

## 🛠️ Cách biên dịch

### Yêu cầu:
- LaTeX distribution (TeX Live, MiKTeX)
- Compiler: XeLaTeX hoặc pdfLaTeX
- Packages cần thiết: babel, tikz, listings, mdframed

### Cách biên dịch:

#### Phương pháp 1: Biên dịch từng file riêng lẻ
```bash
# Biên dịch file chính
xelatex baocao-webshop.tex

# Biên dịch phần chương 2-3
xelatex baocao-chuong2-3.tex

# Biên dịch phần hình ảnh
xelatex hinh-anh-bao-cao.tex
```

#### Phương pháp 2: Tạo file tổng hợp (Khuyến nghị)
1. Tạo file `baocao-hoan-chinh.tex`:
```latex
\input{baocao-webshop}
\input{baocao-chuong2-3}
\input{hinh-anh-bao-cao}
```

2. Biên dịch:
```bash
xelatex baocao-hoan-chinh.tex
```

## 📊 Nội dung báo cáo

### Chương 1: Tổng quan về thương mại điện tử và công nghệ web
- Thương mại điện tử là gì?
- Lịch sử phát triển
- Vai trò của công nghệ web
- Các công nghệ web hiện đại
- Ứng dụng trong các lĩnh vực

### Chương 2: Phân tích và thiết kế hệ thống
- Phân tích yêu cầu hệ thống
- Kiến trúc hệ thống
- Thiết kế cơ sở dữ liệu
- API Design

### Chương 3: Triển khai và kiểm thử hệ thống
- Cài đặt môi trường phát triển
- Triển khai các chức năng chính
- Giao diện người dùng
- Testing và Deployment
- Kết quả triển khai

## 🎨 Đặc điểm thiết kế

### Trang bìa:
- Sử dụng logo TimeLuxe thực tế
- Khung viền đen 4pt
- Thông tin sinh viên và giảng viên đầy đủ

### Nội dung:
- Font tiếng Việt với babel
- Khoảng cách dòng 1.5
- Code listings với syntax highlighting
- Hình ảnh chất lượng cao

### Sơ đồ:
- Sử dụng TikZ cho sơ đồ kiến trúc
- ERD (Entity Relationship Diagram)
- Flowchart quy trình đơn hàng

## 🔧 Tùy chỉnh

### Thay đổi thông tin cá nhân:
```latex
\textbf{Sinh viên thực hiện:} [Tên của bạn]
\textbf{Lớp:} [Lớp của bạn]
\textbf{Giảng viên hướng dẫn:} [Tên giảng viên]
```

### Thay đổi hình ảnh:
- Thay thế đường dẫn hình ảnh trong `\includegraphics`
- Đảm bảo hình ảnh có trong thư mục `static/`

### Thay đổi nội dung:
- Chỉnh sửa nội dung trong các section
- Cập nhật code examples nếu cần

## 📝 Lưu ý quan trọng

1. **Hình ảnh**: Đảm bảo tất cả hình ảnh có trong thư mục `static/`
2. **Font**: Sử dụng font hỗ trợ tiếng Việt
3. **Compilation**: Chạy 2-3 lần để tạo mục lục và danh mục hình ảnh
4. **Backup**: Luôn backup file gốc trước khi chỉnh sửa

## 🚀 Triển khai

### Tạo PDF cuối cùng:
```bash
# Biên dịch lần 1
xelatex baocao-hoan-chinh.tex

# Biên dịch lần 2 (tạo mục lục)
xelatex baocao-hoan-chinh.tex

# Biên dịch lần 3 (tạo danh mục hình ảnh)
xelatex baocao-hoan-chinh.tex
```

### Kết quả:
- File PDF: `baocao-hoan-chinh.pdf`
- Chất lượng in: 300 DPI
- Kích thước: A4

## 📞 Hỗ trợ

Nếu gặp vấn đề khi biên dịch:
1. Kiểm tra cài đặt LaTeX
2. Cài đặt các package cần thiết
3. Kiểm tra đường dẫn hình ảnh
4. Đảm bảo encoding UTF-8

## 📄 License

Báo cáo này được tạo cho mục đích học tập tại Học viện Phụ nữ Việt Nam. 