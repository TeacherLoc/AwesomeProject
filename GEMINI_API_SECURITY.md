# 🔐 Bảo Mật API Key - Google Gemini

## ✅ Đã hoàn thành:

### 1. **Di chuyển API key vào file `.env`**
   - API key giờ được lưu trong file `.env` (KHÔNG push lên GitHub)
   - File `.env` đã có trong `.gitignore` nên sẽ không bị commit

### 2. **Cài đặt `react-native-dotenv`**
   ```bash
   npm install react-native-dotenv
   ```

### 3. **Cấu hình Babel**
   - Thêm plugin `react-native-dotenv` vào `babel.config.js`
   - Cho phép import biến môi trường từ `.env`

### 4. **TypeScript types**
   - Cập nhật `env.d.ts` để TypeScript nhận diện `GOOGLE_GEMINI_API_KEY`

### 5. **Cập nhật `geminiService.ts`**
   - Import API key từ `@env` thay vì hardcode
   - Code giờ an toàn hơn, không lộ API key

### 6. **Tạo `.env.example`**
   - File template để developer khác biết cách cấu hình
   - PUSH lên GitHub để hướng dẫn

---

## 📝 Cách sử dụng cho developer khác:

1. **Copy file template:**
   ```bash
   cp .env.example .env
   ```

2. **Lấy Gemini API key:**
   - Truy cập: https://aistudio.google.com/app/apikey
   - Đăng nhập Google
   - Click "Create API key"
   - Copy key

3. **Paste vào `.env`:**
   ```
   GOOGLE_GEMINI_API_KEY=your_actual_key_here
   ```

4. **Restart Metro bundler:**
   ```bash
   npx react-native start --reset-cache
   ```

---

## 🔒 Bảo mật:

✅ File `.env` đã có trong `.gitignore` → KHÔNG bị push lên GitHub  
✅ File `.env.example` không chứa key thật → An toàn khi push  
✅ API key chỉ tồn tại local trên máy developer  
✅ Mỗi developer dùng API key riêng của mình  

---

## ⚠️ LƯU Ý:

- **KHÔNG BAO GIỜ** commit file `.env` lên GitHub
- **KHÔNG BAO GIỜ** hardcode API key vào source code
- Nếu vô tình push API key lên GitHub:
  1. Xóa key ngay tại: https://aistudio.google.com/app/apikey
  2. Tạo key mới
  3. Cập nhật file `.env`
  4. Xóa key cũ khỏi Git history (nếu cần)

---

## 🚀 Build & Run:

Sau khi cấu hình xong, restart Metro:

```bash
# Xóa cache
npx react-native start --reset-cache

# Hoặc chạy lại app
npm run android
# hoặc
npm run ios
```

---

## 🔍 Kiểm tra:

- Mở `geminiService.ts` → Không còn thấy API key hardcode
- Mở `.env` → Có `GOOGLE_GEMINI_API_KEY=...`
- Mở `.gitignore` → Có `.env` trong danh sách
- Test chatbot → Vẫn hoạt động bình thường với Gemini AI
