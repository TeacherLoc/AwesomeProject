import { getFirestore, collection, addDoc, Timestamp } from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';

// Tạo thông báo khi lịch hẹn được xác nhận
export const createAppointmentConfirmedNotification = async (
    userId: string,
    appointmentId: string,
    serviceName: string,
    appointmentDateTime: Date
) => {
    try {
        const db = getFirestore(getApp());
        const notificationsRef = collection(db, 'notifications');

        const dateStr = appointmentDateTime.toLocaleDateString('vi-VN');
        const timeStr = appointmentDateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        await addDoc(notificationsRef, {
            userId: userId,
            type: 'status',
            title: 'Lịch hẹn đã xác nhận ✅',
            message: `Lịch hẹn "${serviceName}" của bạn đã được xác nhận vào ${timeStr} ngày ${dateStr}`,
            isRead: false,
            createdAt: Timestamp.now(),
            relatedId: appointmentId,
        });

        console.log('Created appointment confirmed notification');
    } catch (error) {
        console.error('Error creating appointment confirmed notification:', error);
    }
};

// Tạo thông báo khi lịch hẹn hoàn thành
export const createAppointmentCompletedNotification = async (
    userId: string,
    appointmentId: string,
    serviceName: string
) => {
    try {
        const db = getFirestore(getApp());
        const notificationsRef = collection(db, 'notifications');

        await addDoc(notificationsRef, {
            userId: userId,
            type: 'status',
            title: 'Lịch hẹn hoàn thành ✓',
            message: `Lịch hẹn "${serviceName}" của bạn đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ!`,
            isRead: false,
            createdAt: Timestamp.now(),
            relatedId: appointmentId,
        });

        console.log('Created appointment completed notification');
    } catch (error) {
        console.error('Error creating appointment completed notification:', error);
    }
};

// Tạo thông báo khi lịch hẹn bị hủy
export const createAppointmentCancelledNotification = async (
    userId: string,
    appointmentId: string,
    serviceName: string,
    cancelledBy: 'customer' | 'admin',
    reason?: string
) => {
    try {
        const db = getFirestore(getApp());
        const notificationsRef = collection(db, 'notifications');

        let message: string;
        let title: string;

        if (cancelledBy === 'customer') {
            title = 'Lịch hẹn đã hủy ✓';
            message = `Lịch hẹn "${serviceName}" của bạn đã được hủy thành công.`;
        } else {
            title = 'Lịch hẹn bị hủy bởi Admin ❌';
            const defaultReason = 'Phòng khám có vấn đề về lịch trình không thể thực hiện được.';
            message = `Rất tiếc! Lịch hẹn "${serviceName}" của bạn đã bị hủy bởi admin.\n\n📝 Lý do: ${reason || defaultReason}\n\n🙏 Chúng tôi rất xin lỗi vì sự bất tiện này. Quý khách có thể đặt lại lịch hẹn khác.`;
        }

        await addDoc(notificationsRef, {
            userId: userId,
            type: 'status',
            title: title,
            message: message,
            isRead: false,
            createdAt: Timestamp.now(),
            relatedId: appointmentId,
        });

        console.log('Created appointment cancelled notification');
    } catch (error) {
        console.error('Error creating appointment cancelled notification:', error);
    }
};

// Tạo thông báo khi lịch hẹn bị từ chối
export const createAppointmentRejectedNotification = async (
    userId: string,
    appointmentId: string,
    serviceName: string,
    reason?: string
) => {
    try {
        const db = getFirestore(getApp());
        const notificationsRef = collection(db, 'notifications');

        const defaultReason = 'Lịch khám trong thời gian này đã đầy hoặc không phù hợp.';
        const message = `Rất tiếc! Lịch hẹn "${serviceName}" của bạn đã bị từ chối.\n\n📝 Lý do: ${reason || defaultReason}\n\n🙏 Quý khách vui lòng chọn thời gian khác hoặc liên hệ để được hỗ trợ.`;

        await addDoc(notificationsRef, {
            userId: userId,
            type: 'status',
            title: 'Lịch hẹn bị từ chối ❌',
            message: message,
            isRead: false,
            createdAt: Timestamp.now(),
            relatedId: appointmentId,
        });

        console.log('Created appointment rejected notification');
    } catch (error) {
        console.error('Error creating appointment rejected notification:', error);
    }
};

// Tạo thông báo khi admin trả lời tin nhắn
export const createAdminReplyNotification = async (
    userId: string,
    messageId: string,
    userQuestion: string,
    adminReply: string
) => {
    try {
        const db = getFirestore(getApp());
        const notificationsRef = collection(db, 'notifications');

        const shortQuestion = userQuestion.length > 50
            ? userQuestion.substring(0, 50) + '...'
            : userQuestion;

        await addDoc(notificationsRef, {
            userId: userId,
            type: 'admin_reply',
            title: '💬 Admin đã trả lời',
            message: `Câu hỏi: "${shortQuestion}"\n\nTrả lời: ${adminReply}`,
            isRead: false,
            createdAt: Timestamp.now(),
            relatedId: messageId,
        });

        console.log('Created admin reply notification');
    } catch (error) {
        console.error('Error creating admin reply notification:', error);
    }
};
