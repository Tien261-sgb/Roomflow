# HDSD — RoomFlow (Module Nhân viên: Tạo lịch họp mới & Quản lý cuộc họp)

## 1. Kiến trúc

```
roomflow/
├── backend/     Node.js + Express + PostgreSQL (Supabase) — API + lưu trữ dữ liệu thật
├── frontend/    React + Vite + Tailwind CSS — giao diện người dùng
└── HDSD.md      Tài liệu này
```

- Ngôn ngữ: JavaScript (Node.js cho backend, React cho frontend)
- CSDL: PostgreSQL (qua Supabase — miễn phí, không cần cài đặt server riêng)
- Xác thực: Email + mật khẩu thật, mã hóa bằng bcrypt, phiên đăng nhập dùng JWT

## 2. Cài đặt & chạy (theo đúng thứ tự)

### Bước 1 — Tạo project Supabase (nếu chưa có)
1. Vào https://supabase.com → tạo project mới (miễn phí)
2. Vào **Project Settings → Database → Connection string → URI**, copy chuỗi kết nối

### Bước 2 — Chạy Backend
```bash
cd backend
cp .env.example .env
# Mở file .env, dán DATABASE_URL vừa copy ở Bước 1 vào
npm install
npm start
```
Thấy dòng `🚀 RoomFlow backend (Postgres/Supabase) đang chạy tại http://localhost:4000` là thành công.
Lần chạy đầu tự tạo bảng + seed dữ liệu mẫu (5 nhân viên, 4 phòng).

Mở trình duyệt kiểm tra: `http://localhost:4000/api/health` → thấy `{"ok":true}`

### Bước 3 — Chạy Frontend (mở terminal mới, giữ terminal backend đang chạy)
```bash
cd frontend
npm install
npm run dev
```
Mở trình duyệt: `http://localhost:5173`

### Bước 4 — Đăng nhập thử
- Email: `an.nguyen@roomflow.com`
- Mật khẩu: `123456`

(5 tài khoản mẫu khác: binh.tran / cuong.le / dung.pham / duc.hoang @roomflow.com, cùng mật khẩu `123456`)

## 3. Hướng dẫn sử dụng 2 chức năng

### a) Tạo lịch họp mới
1. Sau khi đăng nhập, chọn tab **"Tạo lịch họp mới"**
2. Điền: tên cuộc họp, chọn phòng, giờ bắt đầu/kết thúc
3. Thêm người tham dự: gõ tên rồi nhấn Enter hoặc dấu phẩy
4. Chọn thiết bị cần dùng, nhập mô tả (tùy chọn)
5. Nhấn **"Tạo lịch họp"**
   - Hệ thống tự kiểm tra trùng lịch (cùng phòng, thời gian giao nhau) — nếu trùng sẽ báo lỗi rõ tên cuộc họp bị trùng, không cho tạo

### b) Quản lý cuộc họp
1. Chọn tab **"Quản lý cuộc họp"** → xem lịch theo tuần dạng lưới 7 ngày
2. Dùng nút **"← Tuần trước" / "Tuần sau →" / "Hôm nay"** để điều hướng
3. Click vào 1 cuộc họp để xem chi tiết
4. Nếu bạn là **người tổ chức** cuộc họp đó:
   - Nút **"Chỉnh sửa"** → mở lại form, sửa xong nhấn "Lưu thay đổi" (tự kiểm tra trùng lịch lại, và không cho sửa cuộc họp đã diễn ra)
   - Nút **"Xóa lịch họp"** → xóa vĩnh viễn (có xác nhận trước khi xóa)
5. Nếu bạn **không phải** người tổ chức: chỉ xem được chi tiết, không có nút sửa/xóa

## 4. Dữ liệu lưu ở đâu?

Toàn bộ dữ liệu (nhân viên, phòng, cuộc họp) lưu thật trong PostgreSQL trên Supabase — không mất khi tải lại trang (F5), không nằm trong bộ nhớ tạm của trình duyệt. Có thể xem trực tiếp trong **Supabase Dashboard → Table Editor**.

## 5. Link GitHub

*(Điền link repository GitHub của nhóm vào đây trước khi nộp bài, theo yêu cầu đề bài.)*
