# 🚀 HƯỚNG DẪN TRIỂN KHAI ỨNG DỤNG LÊN INTERNET (HOẠT ĐỘNG 24/7)

> **Mục đích:** Giúp bạn tắt máy tính hoàn toàn mà điện thoại và các thiết bị khác vẫn truy cập ứng dụng được 24/7 qua 4G/5G hoặc Wi-Fi từ bất kỳ đâu.

---

## 📌 QUY TRÌNH CHUẨN KHI BẠN SỬA XONG PHẦN MỀM

Mỗi khi bạn sửa xong tính năng mới, chỉnh giao diện hoặc hoàn thiện phần mềm, bạn chỉ cần thực hiện 2 bước đơn giản:

### Bước 1: Đóng gói bản mới nhất (Build)
Mở Terminal tại thư mục `D:\1835` và chạy lệnh:
```bash
npm run build
```
*(Lệnh này sẽ tự động biên dịch toàn bộ code mới nhất vào thư mục `dist/`)*

---

### Bước 2: Đẩy lên Internet (Chọn 1 trong 2 cách bên dưới)

---

### CÁCH 1: KÉO & THẢ LÊN NETLIFY DROP (Nhanh nhất - 1 Phút) 🌟

1. Mở trình duyệt web và truy cập: **[https://app.netlify.com/drop](https://app.netlify.com/drop)**
   *(Đăng nhập nhanh bằng tài khoản Google hoặc GitHub nếu được yêu cầu)*
2. Mở File Explorer trên máy tính, vào thư mục: `D:\1835\`
3. **Kéo thả nguyên thư mục `dist`** thả vào khung nét đứt trên trang web Netlify Drop.
4. Đợi khoảng 10 giây tải lên là xong! Netlify sẽ tạo cho bạn một đường link Internet vĩnh viễn (ví dụ: `https://ten-ngau-nhien.netlify.app`).

#### 💡 Cách đổi tên link cho đẹp:
- Sau khi tải lên thành công, vào mục **Site configuration** -> **Change site name**.
- Nhập tên mong muốn, ví dụ: `minetask-1835` -> link sẽ thành: `https://minetask-1835.netlify.app`.

---

### CÁCH 2: DÙNG VERCEL CLI (Dành cho lập trình viên) ⚡

Dự án đã có sẵn file cấu hình `vercel.json`. Bạn chỉ cần:

1. Mở Terminal tại `D:\1835`.
2. Gõ lệnh:
   ```bash
   npx vercel
   ```
3. Lần đầu chạy, trình duyệt sẽ mở để bạn đăng nhập tài khoản Vercel (bằng GitHub hoặc Google).
4. Quay lại Terminal, nhấn **Enter** xác nhận các câu hỏi mặc định:
   - `Set up and deploy?` -> gõ **Y** rồi **Enter**
   - Các câu hỏi tiếp theo -> nhấn **Enter** để nhận mặc định.
5. Khi hoàn tất, Vercel sẽ cung cấp đường link dạng `https://1835-app.vercel.app`.

*(Khi bạn sửa xong code sau này, chỉ cần chạy `npx vercel --prod` là web tự động cập nhật ngay lập tức).*

---

## 📱 CÁCH CÀI ĐẶT APP LÊN MÀN HÌNH CHÍNH ĐIỆN THOẠI (PWA)

Sau khi có link web trên mạng, bạn và các thành viên trong đội có thể cài app lên điện thoại mà không cần file APK:

1. Dùng điện thoại mở đường link web (trên Safari cho iPhone, hoặc Chrome cho Android).
2. Nhấn vào nút **Menu 3 chấm** (hoặc nút **Chia sẻ** trên Safari).
3. Chọn **"Thêm vào Màn hình chính" (Add to Home screen)**.
4. Ứng dụng sẽ xuất hiện trên màn hình điện thoại với biểu tượng Minecraft 1835s, mở lên toàn màn hình như một ứng dụng thật!

---

*Tài liệu này được lưu vĩnh viễn tại `D:\1835\HUONG_DAN_TRIEN_KHAI_24_7.md`.*
