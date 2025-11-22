import firestore from '@react-native-firebase/firestore';

export interface AdminMessage {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userMessage: string;
  adminReply?: string;
  status: 'pending' | 'answered';
  createdAt: Date;
  answeredAt?: Date;
  answeredBy?: string; // Admin email
}

/**
 * Gửi câu hỏi cho Admin
 */
export const sendMessageToAdmin = async (
  userId: string,
  userName: string,
  userEmail: string,
  message: string,
): Promise<void> => {
  try {
    await firestore().collection('adminMessages').add({
      userId,
      userName,
      userEmail,
      userMessage: message,
      status: 'pending',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    console.log('Message sent to admin successfully');
  } catch (error) {
    console.error('Error sending message to admin:', error);
    throw error;
  }
};

/**
 * Lấy câu trả lời từ Admin cho user hiện tại
 */
export const getUserAdminMessages = async (userId: string): Promise<AdminMessage[]> => {
  try {
    const snapshot = await firestore()
      .collection('adminMessages')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const messages: AdminMessage[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        userMessage: data.userMessage,
        adminReply: data.adminReply,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        answeredAt: data.answeredAt?.toDate(),
        answeredBy: data.answeredBy,
      };
    });

    return messages;
  } catch (error) {
    console.error('Error getting admin messages:', error);
    return [];
  }
};

/**
 * Đánh dấu tin nhắn là đã đọc (cho user)
 */
export const markAdminMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    await firestore().collection('adminMessages').doc(messageId).update({
      readByUser: true,
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

/**
 * Lắng nghe câu trả lời mới từ Admin (đã được tối ưu)
 */
export const listenToAdminReplies = (
  userId: string,
  onNewReply: (message: AdminMessage) => void,
): (() => void) => {
  // Track các tin nhắn đã hiển thị để tránh duplicate
  const displayedMessages = new Set<string>();

  const unsubscribe = firestore()
    .collection('adminMessages')
    .where('userId', '==', userId)
    .where('status', '==', 'answered')
    // Không dùng orderBy để tránh composite index
    .onSnapshot(
      snapshot => {
        if (!snapshot || snapshot.empty) {
          return;
        }

        const changes = snapshot.docChanges();
        if (!changes || changes.length === 0) {
          return;
        }

        changes.forEach(change => {
          // Chỉ xử lý tin nhắn được thêm hoặc sửa đổi
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            // Kiểm tra có admin reply không
            if (!data.adminReply) {
              return;
            }

            const messageId = change.doc.id;
            // Kiểm tra đã hiển thị chưa
            if (displayedMessages.has(messageId)) {
              return;
            }

            // Đánh dấu đã hiển thị
            displayedMessages.add(messageId);

            const message: AdminMessage = {
              id: messageId,
              userId: data.userId,
              userName: data.userName,
              userEmail: data.userEmail,
              userMessage: data.userMessage,
              adminReply: data.adminReply,
              status: data.status,
              createdAt: data.createdAt?.toDate() || new Date(),
              answeredAt: data.answeredAt?.toDate(),
              answeredBy: data.answeredBy,
            };

            onNewReply(message);
          }
        });
      },
      error => {
        console.error('Error listening to admin replies:', error);
      },
    );

  return unsubscribe;
};
