# 🔥 Cấu hình Firebase Rules cho Admin Messages

## ⚠️ Lỗi hiện tại:
```
Error: [firestore/permission-denied] The caller does not have permission to execute the specified operation.
```

## ✅ Giải pháp: Cập nhật Firebase Security Rules

### Bước 1: Truy cập Firebase Console

1. Vào: https://console.firebase.google.com/
2. Chọn project của bạn
3. Vào **Firestore Database** (menu bên trái)
4. Click tab **Rules** (ở trên cùng)

### Bước 2: Thêm Rules cho collection `adminMessages`

Thêm đoạn code này vào Firebase Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... các rules khác của bạn ...
    
    // Rules cho collection adminMessages
    match /adminMessages/{messageId} {
      // User đã đăng nhập có thể tạo tin nhắn mới (gửi cho admin)
      allow create: if request.auth != null 
                    && request.resource.data.userId == request.auth.uid;
      
      // User chỉ có thể đọc tin nhắn của chính mình
      allow read: if request.auth != null 
                  && (resource.data.userId == request.auth.uid 
                      || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      
      // Chỉ admin mới có thể update (trả lời)
      allow update: if request.auth != null 
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      // Chỉ admin mới có thể xóa
      allow delete: if request.auth != null 
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
  }
}
```

### Bước 3: Publish Rules

1. Click nút **Publish** (màu xanh, góc trên bên phải)
2. Đợi vài giây để rules được cập nhật

---

## 🔐 Giải thích Rules:

### 1. **CREATE (Gửi tin nhắn cho Admin)**
```javascript
allow create: if request.auth != null 
              && request.resource.data.userId == request.auth.uid;
```
- User phải đăng nhập
- userId trong tin nhắn phải khớp với user đang đăng nhập
- ✅ User có thể gửi tin nhắn cho admin

### 2. **READ (Đọc tin nhắn)**
```javascript
allow read: if request.auth != null 
            && (resource.data.userId == request.auth.uid 
                || get(...).data.role == 'admin');
```
- User chỉ đọc được tin nhắn của chính mình
- Admin đọc được tất cả tin nhắn
- ✅ Bảo mật thông tin cá nhân

### 3. **UPDATE (Admin trả lời)**
```javascript
allow update: if request.auth != null 
              && get(...).data.role == 'admin';
```
- Chỉ admin mới được trả lời tin nhắn
- ✅ User không thể tự sửa tin nhắn

### 4. **DELETE (Xóa tin nhắn)**
```javascript
allow delete: if request.auth != null 
              && get(...).data.role == 'admin';
```
- Chỉ admin mới được xóa
- ✅ User không thể xóa tin nhắn đã gửi

---

## 🚀 Rules đơn giản hơn (cho testing):

Nếu bạn chỉ muốn test nhanh, dùng rules đơn giản này:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Rules đơn giản cho adminMessages (chỉ dùng cho testing)
    match /adminMessages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
  }
}
```

⚠️ **LƯU Ý**: Rules đơn giản này cho phép mọi user đã đăng nhập read/write tất cả. Chỉ dùng cho testing, production nên dùng rules chi tiết ở trên.

---

## ✅ Sau khi cập nhật Rules:

1. **Reload app** (nếu cần)
2. **Test lại**: Nhắn cho admin từ chatbot
3. **Kiểm tra**: Vào Firebase Console → Firestore → Collection `adminMessages` → Xem có tin nhắn mới không

---

## 🔍 Debug nếu vẫn lỗi:

### Kiểm tra user đã đăng nhập:
```typescript
console.log('Current user:', auth().currentUser?.uid);
```

### Kiểm tra data gửi đi:
```typescript
console.log('Sending message:', {
  userId,
  userName,
  userEmail,
  userMessage: message,
});
```

### Xem log chi tiết trong Firebase Console:
1. Firebase Console → Firestore → Tab **Usage**
2. Xem các request bị rejected

---

## 📝 Rules đầy đủ cho toàn bộ app:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Services collection
    match /services/{serviceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Appointments collection
    match /appointments/{appointmentId} {
      allow read: if request.auth != null 
                  && (resource.data.userId == request.auth.uid 
                      || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null 
                    && (resource.data.userId == request.auth.uid 
                        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow delete: if request.auth != null 
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Admin Messages collection (TIN NHẮN CHO ADMIN)
    match /adminMessages/{messageId} {
      allow create: if request.auth != null 
                    && request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null 
                  && (resource.data.userId == request.auth.uid 
                      || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow update: if request.auth != null 
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow delete: if request.auth != null 
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // News/Health articles
    match /healthNews/{newsId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
  }
}
```

Copy toàn bộ rules này vào Firebase Console → Firestore → Rules → Publish

---

## 🎉 Hoàn tất!

Sau khi cập nhật rules, tính năng "Nhắn cho Admin" sẽ hoạt động hoàn hảo!

Bất kỳ vấn đề gì, hãy kiểm tra Firebase Console logs để debug.
