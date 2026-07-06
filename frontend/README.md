# RoomFlow Frontend

React + Vite + Tailwind CSS. Chỉ chứa 2 chức năng theo đề bài (Module nhân viên):
- **Tạo lịch họp mới**
- **Quản lý cuộc họp** (xem theo tuần, sửa, xóa — chỉ người tổ chức mới sửa/xóa được)

## Cài đặt

```bash
npm install
npm run dev
```

Mặc định chạy tại `http://localhost:5173`, gọi API tới backend ở `http://localhost:4000`
(cấu hình trong `src/api.js`, đổi `API_BASE` nếu backend chạy ở địa chỉ khác).

**Lưu ý:** phải chạy backend trước (xem thư mục `backend/`), nếu không đăng nhập sẽ báo lỗi kết nối.
