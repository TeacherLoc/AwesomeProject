# Hướng dẫn cấu hình Firebase cho hệ thống thông báo

## 1. Firebase Security Rules

Thêm các rules sau vào Firestore Security Rules trong Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Notifications collection - Người dùng chỉ được đọc/ghi thông báo của chính họ
    match /notifications/{notificationId} {
      // Cho phép user đọc thông báo của chính họ
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Cho phép user cập nhật (đánh dấu đã đọc) thông báo của chính họ
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Cho phép user xóa thông báo của chính họ
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Cho phép hệ thống tạo thông báo (được gọi từ authenticated context)
      allow create: if request.auth != null;
    }
    
    // Appointments collection - Cập nhật nếu cần
    match /appointments/{appointmentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        resource.data.customerId == request.auth.uid || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 2. Cấu trúc Collection "notifications"

Mỗi document trong collection `notifications` có cấu trúc:

```typescript
{
  userId: string;           // UID của user nhận thông báo
  type: string;            // Loại: 'appointment', 'status', 'reminder', 'news', 'promotion'
  title: string;           // Tiêu đề thông báo
  message: string;         // Nội dung chi tiết
  isRead: boolean;         // Đã đọc hay chưa
  createdAt: Timestamp;    // Thời gian tạo
  relatedId?: string;      // ID của lịch hẹn liên quan (nếu có)
}
```

## 3. Tính năng thông báo

### 3.1. Thông báo tự động khi thay đổi trạng thái lịch hẹn

Hệ thống tự động tạo thông báo khi:

- **Admin xác nhận lịch hẹn** (status: pending → confirmed)
  - Tạo thông báo type: 'status'
  - Title: "Lịch hẹn đã xác nhận ✅"
  - Message: Chi tiết lịch hẹn với thời gian

- **Admin hoàn thành lịch hẹn** (status: confirmed → completed)
  - Tạo thông báo type: 'status'
  - Title: "Lịch hẹn hoàn thành ✓"
  - Message: Cảm ơn đã sử dụng dịch vụ

- **Admin hủy lịch hẹn** (status: any → cancelled_by_admin)
  - Tạo thông báo type: 'status'
  - Title: "Lịch hẹn đã hủy ✗"
  - Message: Thông báo lịch hẹn bị hủy bởi phòng khám

- **Admin từ chối lịch hẹn** (status: pending → rejected)
  - Tạo thông báo type: 'status'
  - Title: "Lịch hẹn bị từ chối ✗"
  - Message: Yêu cầu chọn thời gian khác

- **Khách hàng hủy lịch hẹn** (status: any → cancelled_by_customer)
  - Tạo thông báo type: 'status'
  - Title: "Lịch hẹn đã hủy ✗"
  - Message: Xác nhận hủy thành công

### 3.2. Thông báo lịch hẹn sắp tới

- Tự động tạo thông báo cho các lịch hẹn **đã xác nhận** sẽ diễn ra trong vòng **24 giờ**
- Chỉ tạo 1 lần (kiểm tra trùng lặp qua relatedId)
- Type: 'appointment'
- Title: "Lịch hẹn sắp tới 📅"
- Message: Nhắc nhở thời gian và dịch vụ

### 3.3. Nhắc nhở uống nước hàng ngày

- Tự động tạo **mỗi ngày 1 lần** khi user mở app
- Kiểm tra đã có thông báo trong ngày chưa để tránh trùng lặp
- Type: 'reminder'
- Title: "Nhắc nhở sức khỏe 💧"
- Message: "Đã đến lúc uống nước! Hãy uống ít nhất 2 lít nước mỗi ngày"

## 4. Các chức năng trong NotificationScreen

- ✅ **Hiển thị danh sách thông báo** - Sắp xếp theo thời gian giảm dần
- ✅ **Lọc thông báo** - Tab "Tất cả" và "Chưa đọc"
- ✅ **Đánh dấu đã đọc** - Khi click vào thông báo
- ✅ **Đánh dấu tất cả đã đọc** - Button trên header
- ✅ **Xóa thông báo** - Long press hoặc button xóa
- ✅ **Điều hướng** - Click thông báo để đến màn hình liên quan
- ✅ **Pull to refresh** - Làm mới danh sách
- ✅ **Hiển thị thời gian** - "vừa xong", "5 phút trước", etc.

## 5. Icon và màu sắc theo loại thông báo

| Type | Icon | Màu icon | Màu nền |
|------|------|----------|---------|
| appointment | event | #EF4444 (Đỏ) | #FEE2E2 |
| status | check-circle | #10B981 (Xanh lá) | #D1FAE5 |
| news | article | #3B82F6 (Xanh dương) | #DBEAFE |
| reminder | notifications | #F59E0B (Cam) | #FEF3C7 |
| promotion | local-offer | #EC4899 (Hồng) | #FCE7F3 |

## 6. Testing

### Kiểm tra thông báo nhắc uống nước:
1. Mở app lần đầu trong ngày
2. Vào màn hình Thông báo
3. Kiểm tra có thông báo "Nhắc nhở sức khỏe 💧"

### Kiểm tra thông báo lịch hẹn sắp tới:
1. Tạo lịch hẹn với thời gian trong vòng 24h
2. Admin xác nhận lịch hẹn
3. Customer vào màn hình Thông báo
4. Kiểm tra có thông báo "Lịch hẹn sắp tới 📅"

### Kiểm tra thông báo thay đổi trạng thái:
1. Admin cập nhật trạng thái lịch hẹn (Xác nhận/Hoàn thành/Hủy/Từ chối)
2. Customer vào màn hình Thông báo
3. Kiểm tra có thông báo tương ứng với trạng thái mới

## 7. Lưu ý quan trọng

⚠️ **Cần cấu hình Firebase Security Rules trước khi sử dụng** để tránh lỗi permission-denied

📌 Thông báo nhắc uống nước chỉ tạo 1 lần mỗi ngày (kiểm tra bằng ngày tạo)

📌 Thông báo lịch hẹn sắp tới chỉ tạo cho lịch đã xác nhận và chỉ tạo 1 lần (kiểm tra relatedId)

📌 Mỗi thay đổi trạng thái lịch hẹn đều tạo thông báo tương ứng
