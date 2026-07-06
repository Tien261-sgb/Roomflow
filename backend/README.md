# RoomFlow Backend

Node.js + Express + PostgreSQL (Supabase). Xác thực bằng email/mật khẩu thật (bcrypt) + JWT.

## Cài đặt

```bash
cp .env.example .env
# Mở .env, điền DATABASE_URL lấy từ Supabase Dashboard -> Project Settings -> Database -> Connection string
npm install
npm start
```

Lần chạy đầu tiên sẽ tự tạo bảng (`employees`, `rooms`, `meetings`) và seed dữ liệu mẫu:
- 5 nhân viên, mật khẩu mặc định cho tất cả: `123456`
- 4 phòng họp

## API

| Method | Endpoint              | Auth | Mô tả                                  |
|--------|------------------------|------|------------------------------------------|
| POST   | /api/auth/login        | Không| Đăng nhập, trả về JWT                  |
| GET    | /api/rooms             | Có   | Danh sách phòng họp                    |
| GET    | /api/meetings?from&to  | Có   | Danh sách cuộc họp trong khoảng thời gian |
| POST   | /api/meetings          | Có   | Tạo lịch họp mới (tự kiểm tra trùng lịch) |
| PUT    | /api/meetings/:id      | Có   | Sửa cuộc họp (chỉ người tổ chức)       |
| DELETE | /api/meetings/:id      | Có   | Xóa cuộc họp (chỉ người tổ chức)       |

Test nhanh bằng curl:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"an.nguyen@roomflow.com","password":"123456"}'
```
