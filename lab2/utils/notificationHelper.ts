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
    cancelledBy: 'customer' | 'admin'
) => {
    try {
        const db = getFirestore(getApp());
        const notificationsRef = collection(db, 'notifications');

        const message = cancelledBy === 'customer'
            ? `Lịch hẹn "${serviceName}" của bạn đã được hủy thành công`
            : `Lịch hẹn "${serviceName}" của bạn đã bị hủy bởi phòng khám. Vui lòng liên hệ để biết thêm chi tiết.`;

        await addDoc(notificationsRef, {
            userId: userId,
            type: 'status',
            title: 'Lịch hẹn đã hủy ✗',
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
    serviceName: string
) => {
    try {
        const db = getFirestore(getApp());
        const notificationsRef = collection(db, 'notifications');

        await addDoc(notificationsRef, {
            userId: userId,
            type: 'status',
            title: 'Lịch hẹn bị từ chối ✗',
            message: `Lịch hẹn "${serviceName}" của bạn đã bị từ chối. Vui lòng chọn thời gian khác hoặc liên hệ phòng khám.`,
            isRead: false,
            createdAt: Timestamp.now(),
            relatedId: appointmentId,
        });

        console.log('Created appointment rejected notification');
    } catch (error) {
        console.error('Error creating appointment rejected notification:', error);
    }
};
