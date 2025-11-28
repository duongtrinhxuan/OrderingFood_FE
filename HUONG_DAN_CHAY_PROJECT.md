# Hướng Dẫn Chạy Project Food Order App

## Yêu Cầu Hệ Thống

- **Node.js**: phiên bản 16 trở lên
- **npm** hoặc **yarn**: để quản lý packages
- **Database**: PostgreSQL hoặc MySQL (khuyến nghị PostgreSQL)
- **Expo CLI**: để chạy ứng dụng mobile (sẽ được cài đặt tự động)
- **Expo Go app**: trên điện thoại (iOS/Android) để test trên thiết bị thật

## Cấu Trúc Project

```
FoodOrderAppExpo/
├── src/
│   ├── OrderingFood_BE/     # Backend (NestJS)
│   ├── components/           # React Native components
│   ├── screens/              # React Native screens
│   ├── services/             # API services
│   └── ...
├── package.json              # Frontend dependencies
└── ...
```

## Bước 1: Cài Đặt Dependencies

### 1.1. Cài đặt dependencies cho Frontend (Expo)

Mở terminal ở thư mục gốc của project:

```bash
npm install
```

### 1.2. Cài đặt dependencies cho Backend

Di chuyển vào thư mục backend:

```bash
cd src/OrderingFood_BE
npm install
cd ../..
```

## Bước 2: Cấu Hình Database

### 2.1. Tạo Database

Tạo một database mới trong PostgreSQL hoặc MySQL với tên bạn muốn (ví dụ: `foodorder_db`).

### 2.2. Tạo File .env cho Backend

Tạo file `.env` trong thư mục `src/OrderingFood_BE/` với nội dung:

```env
# Database Configuration
DB_DIALECT=postgres          # hoặc 'mysql' nếu dùng MySQL
DB_HOST=localhost
DB_PORT=5432                 # 3306 nếu dùng MySQL
DB_NAME=foodorder_db         # Tên database bạn đã tạo
DB_USERNAME=postgres         # Username của database
DB_PASSWORD=your_password    # Password của database

# Database Sync (tùy chọn)
DB_SYNC_ALTER=false          # Set 'true' nếu muốn tự động alter schema

# Server Port
PORT=5000
```

**Lưu ý**: Thay đổi các giá trị phù hợp với cấu hình database của bạn.

## Bước 3: Chạy Backend Server

### 3.1. Di chuyển vào thư mục backend

```bash
cd src/OrderingFood_BE
```

### 3.2. Chạy backend ở chế độ development

```bash
npm run start:dev
```

Backend sẽ chạy tại: `http://localhost:5000`

**Kiểm tra**: Mở trình duyệt và truy cập:

- API Swagger: `http://localhost:5000/api`
- Health check: `http://localhost:5000`

## Bước 4: Chạy Frontend (Expo App)

### 4.1. Quay lại thư mục gốc

Mở terminal mới (giữ backend đang chạy) và di chuyển về thư mục gốc:

```bash
cd D:\Code\doan1\FoodOrderAppExpo
```

### 4.2. Chạy Expo

```bash
npm start
```

Hoặc chạy trực tiếp trên Android/iOS:

```bash
# Android
npm run android

# iOS (chỉ trên macOS)
npm run ios

# Web
npm run web
```

### 4.3. Kết nối với thiết bị

Sau khi chạy `npm start`, bạn sẽ thấy QR code:

- **Trên điện thoại**: Mở app **Expo Go**, quét QR code để kết nối
- **Trên emulator**: Nhấn `a` cho Android hoặc `i` cho iOS
- **Trên web**: Nhấn `w` để mở trên trình duyệt

## Lưu Ý Quan Trọng

### 1. Kết Nối API Tự Động

Project đã được cấu hình để **tự động phát hiện URL API** khi chạy với Expo Go:

- App sẽ tự động detect IP của máy tính và kết nối đến `http://<IP>:5000`
- **Không cần** tạo file `.env` cho frontend
- Nếu muốn override, có thể tạo file `.env` ở thư mục gốc với:
  ```env
  EXPO_PUBLIC_API_URL=http://your-api-url:5000
  ```

### 2. CORS và Network

- Backend đã được cấu hình CORS để cho phép requests từ Expo
- Đảm bảo máy tính và điện thoại cùng mạng WiFi (nếu test trên thiết bị thật)
- Nếu dùng emulator, có thể dùng `localhost` hoặc `10.0.2.2` (Android emulator)

### 3. Database Migrations

Nếu cần chạy migrations:

```bash
cd src/OrderingFood_BE
npm run migration:run
```

Hoặc undo migration:

```bash
npm run migration:undo
```

### 4. Troubleshooting

**Lỗi kết nối database:**

- Kiểm tra database đã được tạo chưa
- Kiểm tra username/password trong file `.env`
- Đảm bảo database service đang chạy

**Lỗi kết nối API từ app:**

- Kiểm tra backend đang chạy tại port 5000
- Kiểm tra firewall không chặn port 5000
- Đảm bảo máy tính và điện thoại cùng mạng WiFi
- Thử restart Expo: nhấn `r` trong terminal Expo

**Lỗi khi cài đặt packages:**

- Xóa `node_modules` và `package-lock.json`
- Chạy lại `npm install`
- Đảm bảo Node.js version >= 16

## Các Lệnh Hữu Ích

### Backend

```bash
cd src/OrderingFood_BE

# Development mode (auto-reload)
npm run start:dev

# Production mode
npm run start:prod

# Build
npm run build

# Lint
npm run lint
```

### Frontend

```bash
# Start Expo
npm start

# Clear cache và restart
npm start -- --clear

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## Tài Liệu API

Sau khi backend chạy, truy cập Swagger UI tại:
**http://localhost:5000/api**

Tại đây bạn có thể:

- Xem tất cả các API endpoints
- Test API trực tiếp
- Xem request/response schemas

## Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:

1. Logs trong terminal của backend
2. Logs trong terminal của Expo
3. Console trong Expo Go app (shake device để mở menu)
4. Network tab trong browser (nếu chạy trên web)
