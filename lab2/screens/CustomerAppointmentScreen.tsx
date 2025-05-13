/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'; // Import Timestamp type
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'; // Import User type
import DatePicker from 'react-native-date-picker';
import { COLORS } from '../theme/colors';
import { RouteProp } from '@react-navigation/native'; // For route prop type
import { StackNavigationProp } from '@react-navigation/stack'; // For navigation prop type


// Định nghĩa kiểu cho params của route
type CustomerAppointmentScreenRouteParams = {
    serviceId: string;
    serviceName: string;
    servicePrice?: number; // servicePrice có thể không tồn tại
};

// Định nghĩa kiểu cho props của màn hình
type CustomerAppointmentScreenProps = {
    route: RouteProp<{ params: CustomerAppointmentScreenRouteParams }, 'params'>; // Sử dụng key 'params' cho route.params
    navigation: StackNavigationProp<any>; // any có thể được thay thế bằng RootStackParamList nếu bạn có
};

// Định nghĩa interface cho currentUser
interface CurrentUser {
    uid: string;
    displayName: string | null;
    email: string | null;
}

const CustomerAppointmentScreen: React.FC<CustomerAppointmentScreenProps> = ({ route, navigation }) => {
    const { serviceId, serviceName, servicePrice } = route.params;
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [appointmentDate, setAppointmentDate] = useState(new Date());
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null); // Kiểu string hoặc null

    const availableTimeSlots: string[] = [ // Thêm kiểu cho mảng
        '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

    useEffect(() => {
        const firebaseUser: FirebaseAuthTypes.User | null = auth().currentUser;
        if (firebaseUser) {
            setCurrentUser({
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName,
                email: firebaseUser.email,
            });
        }
        setAuthChecked(true);
    }, []);

    useEffect(() => {
        if (authChecked && !currentUser) {
            Alert.alert('Lỗi', 'Bạn cần đăng nhập để đặt lịch.');
            navigation.goBack();
        }
    }, [authChecked, currentUser, navigation]);

    const handleConfirmBooking = async () => {
        if (!currentUser) { // Kiểm tra currentUser trước khi truy cập thuộc tính
            Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
            return;
        }
        if (!selectedTimeSlot) { // selectedTimeSlot có thể là null
            Alert.alert('Lỗi', 'Vui lòng chọn một khung giờ.');
            return;
        }

        setLoading(true);
        try {
            const appointmentDateTime = new Date(appointmentDate);
            // Đảm bảo selectedTimeSlot là string trước khi split
            const [hours, minutes] = (selectedTimeSlot as string).split(':');
            appointmentDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

            if (appointmentDateTime < new Date()) {
                Alert.alert('Lỗi', 'Không thể đặt lịch cho thời gian trong quá khứ.');
                setLoading(false);
                return;
            }

            const newAppointmentRef = await firestore().collection('appointments').add({
                serviceId: serviceId,
                serviceName: serviceName,
                servicePrice: servicePrice || null,
                customerId: currentUser.uid, // An toàn để truy cập uid
                customerName: currentUser.displayName || 'N/A',
                customerEmail: currentUser.email,
                appointmentDateTime: firestore.Timestamp.fromDate(appointmentDateTime),
                status: 'pending',
                requestTimestamp: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.FieldValue, // Cast cho rõ ràng
            });

            Alert.alert(
                'Đặt lịch thành công!',
                `Yêu cầu đặt lịch cho dịch vụ "${serviceName}" vào ${selectedTimeSlot} ngày ${appointmentDate.toLocaleDateString('vi-VN')} đã được gửi. Vui lòng chờ xác nhận từ quản trị viên.`,
                [
                    {
                        text: 'Xem chi tiết',
                        onPress: () => navigation.navigate('AppointmentsTab', {
                            screen: 'CustomerAppointmentDetail', // Tên màn hình đúng trong AppointmentStackNavigator
                            params: { appointmentId: newAppointmentRef.id }})},
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('AppointmentsTab', { screen: 'CustomerAppointmentList' })}                ],
                { cancelable: false }
            );
        } catch (error) {
            console.error('Error booking appointment: ', error);
            Alert.alert('Lỗi', 'Không thể đặt lịch. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    if (!authChecked) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!currentUser) {
        return (
            <View style={styles.centered}>
                <Text style={{color: COLORS.textDark}}>Bạn cần đăng nhập để thực hiện chức năng này.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Đặt lịch cho dịch vụ</Text>
            <View style={styles.serviceInfoContainer}>
                <Text style={styles.serviceName}>{serviceName}</Text>
                {servicePrice !== undefined && <Text style={styles.servicePrice}>Giá: {servicePrice.toLocaleString('vi-VN')}K</Text>}
            </View>

            <Text style={styles.label}>Chọn ngày:</Text>
            <TouchableOpacity onPress={() => setDatePickerVisibility(true)} style={styles.dateInput}>
                <Text style={styles.dateText}>{appointmentDate.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            </TouchableOpacity>

            <DatePicker
                modal
                open={isDatePickerVisible}
                date={appointmentDate}
                mode="date"
                minimumDate={new Date()}
                onConfirm={(date) => {
                    setDatePickerVisibility(false);
                    setAppointmentDate(date);
                    setSelectedTimeSlot(null); // Gán null là hợp lệ vì kiểu là string | null
                }}
                onCancel={() => {
                    setDatePickerVisibility(false);
                }}
                title="Chọn ngày đặt lịch"
                confirmText="Xác nhận"
                cancelText="Huỷ"
                locale="vi_VN"
            />

            <Text style={styles.label}>Chọn giờ:</Text>
            <View style={styles.timeSlotsContainer}>
                {availableTimeSlots.map(slot => (
                    <TouchableOpacity
                        key={slot}
                        style={[
                            styles.timeSlotButton,
                            selectedTimeSlot === slot && styles.selectedTimeSlotButton]}
                        onPress={() => setSelectedTimeSlot(slot)}
                    >
                        <Text
                            style={[
                                styles.timeSlotText,
                                selectedTimeSlot === slot && styles.selectedTimeSlotText]}
                        >
                            {slot}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmBooking} disabled={!selectedTimeSlot}>
                    <Text style={styles.confirmButtonText}>Xác nhận đặt lịch</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};

// ... (styles giữ nguyên)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: COLORS.backgroundMain || '#f8f9fa',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 10,
        textAlign: 'center',
    },
    serviceInfoContainer: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 5,
    },
    servicePrice: {
        fontSize: 16,
        color: COLORS.textMedium,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textDark,
        marginTop: 15,
        marginBottom: 8,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 15,
        backgroundColor: COLORS.white,
        marginBottom: 10,
    },
    dateText: {
        fontSize: 16,
        color: COLORS.textDark,
    },
    timeSlotsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    timeSlotButton: {
        backgroundColor: COLORS.white,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        minWidth: '30%',
        marginBottom: 10,
        marginRight: '3%',
    },
    selectedTimeSlotButton: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primaryDark,
    },
    timeSlotText: {
        fontSize: 15,
        color: COLORS.primary,
        fontWeight: '500',
    },
    selectedTimeSlotText: {
        color: COLORS.white,
    },
    confirmButton: {
        backgroundColor: COLORS.success,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    confirmButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
export default CustomerAppointmentScreen;
