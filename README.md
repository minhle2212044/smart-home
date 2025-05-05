
# 🏠 Smart Home System API

Hệ thống quản lý nhà thông minh với các chức năng như cảm biến, điều khiển thiết bị, ghi nhận hoạt động, gửi thông báo, và lập lịch chế độ. Dự án xây dựng trên nền tảng **Node.js + Express** và kết nối đến cơ sở dữ liệu **MySQL**.

---

## 🚀 Công nghệ sử dụng

- **Node.js**
- **Express.js**
- **MySQL (with `mysql2` library)**
- **MQTT (giao tiếp IoT với thiết bị)**
- **exceljs** (xuất báo cáo Excel)
- **dotenv** (quản lý biến môi trường)
- **nodemon** (tự động reload khi dev)

---

## 📁 Cấu trúc thư mục

```
project-root/
├── config
├── database
├── src/
│   └── controller
│   └── routes
│   └── service
│   └── middleware
├── env_example
├── index.js
├── package.json
├── package-lock.json
└── README.md
```

---

## ⚙️ Cài đặt và chạy dự án

```bash
# 1. Clone repo
git clone https://github.com/minhle2212044/smart-home.git
cd smart-home

# 2. Cài đặt các package
npm install

# 3. Tạo file .env
cp .env.example .env
# => cấu hình các biến như DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, v.v.

# 4. Khởi động server (dev)
npm run dev

# Hoặc chạy thường:
node app.js
```

---

## 📊 Tính năng hỗ trợ thêm

- Ghi nhận trạng thái thiết bị (Bật/Tắt).
- Lưu dữ liệu cảm biến và thông báo nếu vượt ngưỡng.
- Đọc thông báo theo trạng thái (chưa đọc, đã đọc).
- Kết nối MQTT để nhận/gửi dữ liệu từ/to thiết bị IoT.
- Xuất báo cáo hoạt động/thông báo dưới dạng **Excel**.

---

## 📦 Một số thư viện chính

```bash
npm install express mysql2 mqtt exceljs dotenv
npm install --save-dev nodemon
```

---

## 🧪 Kiểm thử API

Có thể dùng các công cụ như:
- [Postman](https://www.postman.com/)

---

## 📜 License

MIT License
