# 🎬 StreamCue Studio Pro (Prompter & OBS Director)

> **Trợ lý Kịch Bản Thông Minh & Điều Phối Ghi Hình / Livestream Chuẩn Studio**  
> Xây dựng trên nền tảng **Electron + Vite + React 19 + TypeScript + OBS WebSocket v5 + iPhone Remote Hub**.

---

## 🌟 Tính Năng Nổi Bật

### 1. ⏱️ Nhắc Kịch Bản Theo Mốc Giây Thực Tế (Timeline Cue Prompter)
- Hiển thị câu cần nói tương ứng với số giây máy quay / OBS đang quay tới.
- Vạch tiến độ và đồng hồ đếm lùi trực quan cho từng câu (cảnh báo đổi màu cam khi còn 4s, đỏ khi còn 2s).
- Khung **Xem trước câu kế tiếp (Next Cue Preview)** giúp người nói chuẩn bị khẩu hình và nhịp thở tự nhiên.
- Hỗ trợ đếm ngược chuẩn bị **3... 2... 1... RECORD** trước khi quay.

### 2. 📜 Teleprompter Cuộn Chữ Mượt Mà (Smooth Teleprompter)
- Cuộn chữ 60fps mượt mà, điều chỉnh tốc độ đọc theo chuẩn WPM (Words Per Minute).
- Vạch canh mắt **Eye-level Guide** đặt sát mép webcam/camera giúp mắt luôn nhìn thẳng vào khán giả.
- Hỗ trợ **Mirror Mode (Lật gương 180°)** tương thích hoàn toàn với kính Teleprompter quang học chuyên dụng.

### 3. 🎥 Tích Hợp OBS Studio 2 Chiều (OBS WebSocket v5)
- Kết nối tự động thời gian thực với OBS Studio qua WebSocket (`ws://127.0.0.1:4455`).
- **Đồng bộ 2 chiều:** Bấm quay trên máy tính hoặc trên iPhone thì OBS tự động quay; ngược lại khi bấm Record trên OBS thì ứng dụng tự động chạy chữ và đếm giây kịch bản.
- Tự động lưu video thẳng vào thư mục ổ **`E:\OBSVID`**.

### 4. 📱 Điều Khiển Từ Xa Bằng iPhone (iPhone Remote Hub)
- Tự động phát sinh mã **QR Code** trên màn hình Desktop: Chỉ cần cầm iPhone quét camera là kết nối ngay mà **không cần cài app từ App Store**.
- **Tab 1 - Remote Controller:** Nút bấm xúc giác lớn, rung phản hồi haptic khi chạm: Bấm quay OBS, Tạm dừng, Nhảy câu, Đếm lùi 3-2-1, Tăng/giảm tốc độ.
- **Tab 2 - Pocket Prompter:** Màn hình nhắc chữ bỏ túi chạy song song với máy tính để kẹp lên tripod cạnh máy ảnh rời.

### 5. 🎬 Trình Phát Xem Lại Video Tức Thì (Instant Take Review Player)
- Xem lại video vừa quay ngay trong app mà không cần mở phần mềm ngoài.
- Nút **[Quay Lại Take Mới (Xóa File Này)]** giúp tự động xóa file lỗi, đưa kịch bản về `00:00` và đếm lùi `3..2..1` để quay lại ngay lập tức.
- Nút **[Đạt Chuẩn - Giữ Lại Video]** và **[Mở Thư Mục Ổ E]**.

### 6. ⚡ AI Smart Pacing Calculator
- Tự động đếm số từ và ước tính thời lượng theo nhịp nói tiếng Việt.
- Nút bấm 1-Click AI: `⚡ TikTok 30s`, `⚡ Shorts 60s`, `⚡ Video 3 Phút` để tự động chia kịch bản chuẩn giữ chân người xem.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS / Vanilla Design System, Lucide Icons.
- **Desktop Runtime:** Electron (v44+).
- **OBS Integration:** `obs-websocket-js` (OBS WebSocket Protocol v5).
- **Mobile Remote:** Embedded Node.js HTTP & WebSocket Server (`ws`, `qrcode`).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Khởi động ứng dụng Desktop (Electron)
```bash
npm run electron:dev
# Hoặc nhấp đúp vào file StreamCue-Studio.bat / Shortcut ngoài Desktop
```

### 3. Chạy giao diện Web Dev Server + Remote Hub
```bash
npm run studio
```

---

## 📂 Cấu Trúc Dự Án

```
├── electron/
│   ├── main.cjs            # Tiến trình chính Electron, quản lý cửa sổ & IPC
│   └── preload.cjs         # Context bridge an toàn
├── server/
│   └── remote-hub.cjs      # Trạm phát QR Code & WebSocket điều khiển từ iPhone
├── src/
│   ├── components/
│   │   ├── Header.tsx                 # Thanh công cụ, trạng thái OBS & iPhone
│   │   ├── ScriptEditor.tsx           # Soạn kịch bản, AI Auto-Slice
│   │   ├── TimelineCuePrompter.tsx    # Nhắc kịch bản theo giây
│   │   ├── SmoothTeleprompter.tsx     # Teleprompter cuộn chữ mượt
│   │   ├── VideoReviewModal.tsx       # Trình phát xem lại video
│   │   ├── ObsModal.tsx               # Cấu hình OBS WebSocket
│   │   ├── MobileQrModal.tsx          # Mã QR kết nối iPhone
│   │   └── FloatingHud.tsx            # Cửa sổ nổi trong suốt sát webcam
│   ├── services/
│   │   ├── obsService.ts              # Dịch vụ OBS WebSocket v5
│   │   └── remoteClient.ts            # Client giao tiếp với iPhone Remote Hub
│   ├── utils/
│   │   └── scriptPacing.ts            # Thuật toán phân chia thời lượng & WPM
│   ├── App.tsx                        # Ứng dụng chính
│   └── main.tsx
├── StreamCue-Studio.bat               # File khởi động nhanh Desktop
└── app-icon.ico                       # Icon ứng dụng chuẩn Studio
```

---

## 📜 Bản Quyền
Dự án phát triển bởi **Hoàng Kỳ Anh** & Ban Cố Vấn Công Nghệ StreamCue.
