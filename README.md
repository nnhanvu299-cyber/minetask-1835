# ⛏️ MINETASK: 8-Bit Voxel Gamified Workflow Management
> **Ứng dụng quản lý công việc nhóm nội bộ 4 người theo phong cách Minecraft Gamification**
> Hỗ trợ xuất file Android APK (Capacitor) và triển khai Progressive Web App (PWA) 100% offline.

---

## 🎮 1. Thiết Kế Giao Diện Minecraft Retro (UI/UX)

- **Voxel 100% Vuông Vức**: Toàn bộ thành phần (button, card, dialog, avatar, input) đều có `border-radius: 0 !important`. Không có bất kỳ góc bo tròn nào.
- **Hiệu ứng 3D Nổi Khối (Block Extrusion)**:
  - Trạng thái mặc định: CSS `border-outset` dày (4px) với viền sáng ở trên-trái và viền tối ở dưới-phải tạo hiệu ứng khối nổi như các block trong Minecraft.
  - Trạng thái Click/Active: Chuyển tức thì sang `border-inset`, lún xuống 4px (`translateY(4px)`), kèm phản hồi thị giác dứt khoát và âm thanh gõ gỗ/đá 8-bit.
- **Bảng Màu Chủ Đạo**:
  - **Diamond Blue** (`#4dedf4`, `#279ca3`, `#1a8794`): Nút hành động chính, viền phát sáng, danh hiệu cao cấp.
  - **Obsidian Dark** (`#191526`, `#100c1a`, `#08060d`): Nền ứng dụng, panel phụ, khung điều khiển.
  - **Snow White** (`#f4f9fd`, `#ffffff`): Highlight cạnh block, văn bản nổi bật.
  - **Iron Silver/Gray** (`#d8d8d8`, `#8f8f8f`): Thanh công cụ, vạch ngăn cách, khối tài nguyên tiêu chuẩn.
  - **Accents**: Emerald Green (`#17dd62`), Gold (`#fcdc3b`), Redstone Red (`#ff2200`), Netherite (`#493f44`).
- **Typography 8-Bit Chuẩn Retro**:
  - Font chuẩn: Google Font `'Press Start 2P'`, `'Silkscreen'`, và `'VT323'` với drop shadow đen chuẩn pixel art (`mc-text-shadow`).

---

## 👥 2. Hệ Thống 4 Hồ Sơ Thành Viên (Mock Auth)

Ứng dụng tích hợp sẵn màn hình đăng nhập nhanh với đúng 4 profile cố định:

| Miner | Avatar Pixel Art | Chức Danh & Vai Trò | Level & Vũ Khí | Biome Yêu Thích |
|---|---|---|---|---|
| **Steve** | 8x8 Steve Cyan Shirt | Lead Miner & Project Overseer | Lv. 34 • Netherite Pickaxe | Diamond Deepslate Cavern |
| **Alex** | 8x8 Alex Orange Hair | Frontend Alchemist & UI Crafter | Lv. 31 • Golden Apple | Lush Moss Caves |
| **Devon (Creeper Dev)** | 8x8 Creeper with Tech Visor | Backend Wizard & Redstone Sorcerer | Lv. 33 • Redstone Torch | The End Dimension |
| **Luna (Nether Knight)** | 8x8 Netherite Knight Glowing Eyes | QA Slayer & Release Master | Lv. 30 • Diamond Sword | Nether Fortress |

*Người dùng có thể bấm vào nút **"SWITCH"** hoặc thẻ Miner bất kỳ lúc nào để chuyển đổi danh tính mà không làm mất dữ liệu.*

---

## 🌍 3. Quản Lý Dự Án (Thế Giới - Worlds)

- **Màn hình Dashboard**: Hiển thị danh sách các Dự án dưới dạng **"Thế giới" (Worlds)**.
- **Nút "CREATE NEW WORLD"**: Mở hộp thoại tạo dự án mới:
  - Đặt tên thế giới (World Name).
  - Chọn Biome: *Overworld Grassland, Diamond Deepslate Cavern, Nether Fortress, The End Dimension, Lush Moss Caves*.
  - Độ khó (Difficulty): *Peaceful (Nhàn nhã), Normal (Tiêu chuẩn), Hardcore (Thời hạn ngặt nghèo)*.
  - Mục tiêu deadline và tùy chọn tự động sinh 3 khối nhiệm vụ khởi đầu (Starter Tasks).
- **Thẻ Thế giới (World Card)**: Minh họa banner Biome pixel, thống kê tỷ lệ khối đã đào (`Mined: X/Y`), thanh Team XP bar thu nhỏ, và danh sách avatar thành viên tham gia.

---

## ⛏️ 4. Quản Lý Nhiệm Vụ & Cơ Chế Khai Thác (Mining Blocks)

- **Khối Tài Nguyên (Resource Blocks)**: Mỗi công việc được hiển thị như một khối quặng Minecraft 3D:
  - 💎 **Diamond Ore**: Nhiệm vụ ưu tiên cao / Tính năng cốt lõi (`+220 XP`)
  - 🟢 **Emerald Ore**: Milestone kiến trúc đặc biệt quan trọng (`+260 XP`)
  - 🟡 **Gold Ore**: Tính năng sản phẩm giá trị (`+140 XP`)
  - 🔴 **Redstone Ore**: Logic backend / Tối ưu hiệu năng (`+160 XP`)
  - ⚪ **Iron Ore**: Công việc tiêu chuẩn / Giao diện (`+80 XP`)
  - ⚫ **Coal Ore**: Nhiệm vụ nhỏ / Quick bugfix (`+40 XP`)
  - 🟤 **Netherite Block**: Mục tiêu huyền thoại của toàn đội (`+320 XP`)
- **Hiệu Ứng Khai Thác (Mining & Cracking Animation)**:
  - Khi bấm **"MINE BLOCK"**, khối quặng bắt đầu rung lắc (`mc-mining-active`) và xuất hiện vết rạn nứt qua **5 giai đoạn rạn nứt** (Fissure Stages 1 -> 5).
  - Âm thanh cuốc gõ đá dồn dập được tổng hợp trực tiếp bằng Web Audio API.
  - Khi đạt giai đoạn 5, khối quặng nổ tung thành các mảnh vụn pixel (`mc-block-shattered`), phát âm thanh vỡ đá và tiếng chuông ngọc kinh nghiệm (**XP Orb Pickup Ding!**).
  - Khối chuyển sang trạng thái đã đào (Mined), hiển thị biểu tượng kho báu rơi ra (Drop Item), và thanh Team XP bar tự động tăng điểm.
  - Có nút **"RE-CRAFT"** để hoàn tác nếu cần tái khai thác.

---

## 📈 5. Thanh Kinh Nghiệm Đội Ngũ (Team XP Bar) & Hiệu Ứng Chiến Thắng (Win State)

- **Team XP Bar ở Đỉnh Thế Giới**:
  - Đặt nổi bật ở góc trên cùng của mỗi Thế giới.
  - Thiết kế chuẩn Minecraft: Thanh xanh lá chia vạch pixel, chính giữa có con số Level phát sáng (`Lv. X` hoặc tỷ lệ phần trăm).
  - Tự động đồng bộ và mượt mà theo từng khối được khai thác.
- **Hiệu Ứng Chiến Thắng (100% Win State)**:
  - Khi hoàn thành tất cả các Task trong Thế giới đó (Team XP đạt 100%):
  - Nền mờ dần và kích hoạt hiệu ứng **Pháo hoa / Confetti Pixel vuông** rơi rực rỡ khắp màn hình (màu Diamond Cyan, Emerald, Gold, Redstone, Amethyst).
  - Dòng chữ 8-bit nhấp nháy phát sáng: **"★ LEVEL UP! ★ WORLD CLEARED!"**.
  - Âm thanh khải hoàn khúc 8-bit (Victory Fanfare arpeggio) vang lên chúc mừng chiến thắng của cả 4 thành viên!

---

## 🔊 6. Bộ Tổng Hợp Âm Thanh 8-Bit (Pure Web Audio API)

Không cần tải bất kỳ file MP3 ngoài nào (tránh lỗi 404 hoặc mất mạng), toàn bộ âm thanh được tổng hợp bằng code Web Audio API:
- **Click Nút**: Sóng tam giác tần số 320Hz -> 140Hz tạo tiếng gõ nút gỗ/đá.
- **Cuốc Gõ Khối**: Tiếng ồn trắng lọc băng thông (Bandpass Noise) tần số 800Hz - 1100Hz.
- **Vỡ Khối**: Tiếng va đập tần số thấp kết hợp xung nhiễu sụp đổ 1400Hz -> 200Hz.
- **Ngọc XP**: Sóng tam giác lướt âm cao 880Hz -> 1320Hz đặc trưng của Minecraft.
- **Khải Hoàn Khúc**: Chuỗi hợp âm 8-bit C4 - E4 - G4 - C5 - E5 - G5 - C6.
- Có nút chuyển đổi **SFX ON / MUTED** để bật/tắt âm thanh bất cứ lúc nào.

---

## 🚀 7. Hướng Dẫn Deploy PWA & Xuất File Cài Đặt Android APK

### A. Chạy Ứng Dụng Dưới Dạng Progressive Web App (PWA)
1. Cài đặt và build dự án:
   ```bash
   npm install
   npm run build
   ```
2. Khởi chạy server:
   ```bash
   npm run preview
   # hoặc: npm run dev
   ```
3. Mở trên trình duyệt (Chrome, Edge, Brave, Safari iOS):
   - **Desktop**: Bấm biểu tượng "Install MineTask" trên thanh địa chỉ hoặc bấm **"APK & PWA" -> "INSTALL PWA TO DEVICE"**.
   - **Mobile (Android/iOS)**: Bấm Menu trình duyệt (dấu 3 chấm hoặc nút Share) -> Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
   - Ứng dụng chạy độc lập không có viền trình duyệt, có icon Minecraft 192x192 và 512x512, lưu trữ offline qua Service Worker (`sw.js`).

---

### B. Xuất File Cài Đặt Native Android APK (Capacitor)
Dự án đã được tích hợp sẵn `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` và cấu hình `capacitor.config.ts`.

Thư mục `android/` đã được khởi tạo hoàn chỉnh với đầy đủ Android Studio wrapper (`gradlew`, `build.gradle`, `AndroidManifest.xml`).

Các bước tạo file APK:
```bash
# 1. Build bundle web mới nhất và đồng bộ vào thư mục Android
npm run cap:build-apk

# 2. Mở trực tiếp dự án trong Android Studio
npx cap open android
```
Trong **Android Studio**:
- Chọn menu: **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
- Android Studio sẽ xuất file `app-debug.apk` tại:
  `android/app/build/outputs/apk/debug/app-debug.apk`.
- Copy file APK này cài đặt trực tiếp lên điện thoại của 4 thành viên!

*Ngoài ra, bạn cũng có thể deploy web lên Vercel/Netlify/GitHub Pages và dán link vào [PWABuilder.com](https://www.pwabuilder.com) để tải file APK đã ký số chỉ trong 1 phút.*

---

## 🗄️ 8. Cấu Trúc Mã Nguồn

```
d:\1835\
├── android/                   # Native Android Studio Project (Capacitor)
├── public/
│   ├── icon-192.png           # 192x192 Pixel Ore PWA Icon
│   ├── icon-512.png           # 512x512 High-Res Voxel Icon
│   ├── manifest.json          # PWA Web App Manifest
│   └── sw.js                  # Service Worker Caching Engine
├── src/
│   ├── components/
│   │   ├── ApkExportModal.tsx     # Trung tâm deploy PWA & xuất APK
│   │   ├── CreateTaskModal.tsx    # Hộp thoại chế tác khối nhiệm vụ
│   │   ├── CreateWorldModal.tsx   # Hộp thoại tạo thế giới mới
│   │   ├── Header.tsx             # Thanh điều hướng Minecraft Voxel
│   │   ├── LoginModal.tsx         # Chọn 4 profile cứng (Mock Auth)
│   │   ├── TaskBlock.tsx          # Khối quặng 3D & hiệu ứng rạn nứt khi đào
│   │   ├── UserProfileModal.tsx   # Thống kê miner, level, kho danh hiệu
│   │   ├── WinStateModal.tsx      # Pháo hoa pixel, banner WORLD CLEARED
│   │   └── XPBar.tsx              # Thanh Team XP bar xanh lá chuẩn game
│   ├── context/
│   │   └── AppContext.tsx         # Quản lý state tập trung & LocalStorage
│   ├── styles/
│   │   └── minecraft.css          # Hệ thống CSS Voxel 3D, border outset/inset
│   ├── types/
│   │   └── index.ts               # Định nghĩa Users, Worlds, Tasks, Biomes
│   ├── utils/
│   │   ├── audio.ts               # Web Audio API 8-bit sound effects
│   │   ├── pixelAvatars.tsx       # 4 Avatar pixel art Steve, Alex, Devon, Luna
│   │   └── pixelBlocks.tsx        # Kết cấu quặng đá, vết nứt, vật phẩm rơi
│   ├── views/
│   │   ├── WorldDetailView.tsx    # Chi tiết thế giới & bảng công việc
│   │   └── WorldsView.tsx         # Dashboard danh sách các thế giới
│   ├── App.tsx                    # Controller ứng dụng chính
│   └── main.tsx                   # Điểm khởi chạy React
├── capacitor.config.ts        # Cấu hình Capacitor Android
├── index.html                 # Template HTML tải Google Pixel Fonts
├── package.json               # Dependencies & build scripts
└── vite.config.ts             # Cấu hình Vite & Tailwind v4
```
