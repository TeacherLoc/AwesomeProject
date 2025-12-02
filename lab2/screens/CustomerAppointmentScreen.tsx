import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity, Modal } from 'react-native';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import DatePicker from 'react-native-date-picker';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../theme/colors';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';


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
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [newAppointmentId, setNewAppointmentId] = useState<string>('');

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
        navigation.setOptions({
            headerTitle: 'Đặt lịch hẹn',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20, fontWeight: 'bold' },
        });
    }, [navigation]);

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

            // Hiển thị modal thành công
            setNewAppointmentId(newAppointmentRef.id);
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error booking appointment: ', error);
            Alert.alert('Lỗi', 'Không thể đặt lịch. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    if (!authChecked) {
        return (
            <LinearGradient 
                colors={['#a8edea', '#fed6e3', '#ffecd2']} 
                start={{x: 0, y: 0}} 
                end={{x: 1, y: 1}}
                style={styles.loadingContainer}
            >
                <ActivityIndicator size="large" color={COLORS.primary} />
            </LinearGradient>
        );
    }

    if (!currentUser) {
        return (
            <LinearGradient 
                colors={['#a8edea', '#fed6e3', '#ffecd2']} 
                start={{x: 0, y: 0}} 
                end={{x: 1, y: 1}}
                style={styles.loadingContainer}
            >
                <Text style={styles.errorText}>Bạn cần đăng nhập để thực hiện chức năng này.</Text>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient 
            colors={['#a8edea', '#fed6e3', '#ffecd2']} 
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 1}}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalIconContainer}>
                            <Icon name="check-circle" size={80} color="#27ae60" />
                        </View>
                        <Text style={styles.modalTitle}>Đặt lịch thành công!</Text>
                        <Text style={styles.modalMessage}>
                            Yêu cầu đặt lịch cho dịch vụ "{serviceName}" vào {selectedTimeSlot} ngày {appointmentDate.toLocaleDateString('vi-VN')} đã được gửi. Vui lòng chờ xác nhận từ quản trị viên.
                        </Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSecondary]}
                                onPress={() => {
                                    setShowSuccessModal(false);
                                    // Navigate về HomeTab, user có thể tự vào ProfileTab để xem lịch hẹn
                                    navigation.navigate('HomeTab');
                                }}
                            >
                                <Icon name="visibility" size={18} color={COLORS.primary} />
                                <Text style={styles.modalButtonTextSecondary}>Xem lịch hẹn</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonPrimary]}
                                onPress={() => {
                                    setShowSuccessModal(false);
                                    // Navigate về HomeTab thay vì ProfileTab để user có thể điều hướng bình thường
                                    navigation.navigate('HomeTab');
                                }}
                            >
                                <Icon name="check" size={18} color={COLORS.white} />
                                <Text style={styles.modalButtonTextPrimary}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Service Info Card */}
            <View style={styles.headerCard}>
                <Text style={styles.headerTitle}>Đặt lịch cho dịch vụ</Text>
                <View style={styles.serviceCard}>
                    <Icon name="medical-services" size={24} color={COLORS.primary} />
                    <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{serviceName}</Text>
                        {servicePrice !== undefined && (
                            <Text style={styles.servicePrice}>Giá: {servicePrice.toLocaleString('vi-VN')} VNĐ</Text>
                        )}
                    </View>
                </View>
            </View>

            {/* Date Selection Card */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>Chọn ngày:</Text>
                <TouchableOpacity onPress={() => setDatePickerVisibility(true)} style={styles.dateButton}>
                    <Icon name="event" size={20} color={COLORS.primary} />
                    <Text style={styles.dateText}>
                        {appointmentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                    <Icon name="arrow-drop-down" size={24} color={COLORS.textMedium} />
                </TouchableOpacity>
            </View>

            <DatePicker
                modal
                open={isDatePickerVisible}
                date={appointmentDate}
                mode="date"
                minimumDate={new Date()}
                onConfirm={(date) => {
                    setDatePickerVisibility(false);
                    setAppointmentDate(date);
                    setSelectedTimeSlot(null);
                }}
                onCancel={() => {
                    setDatePickerVisibility(false);
                }}
                title="Chọn ngày đặt lịch"
                confirmText="Xác nhận"
                cancelText="Huỷ"
                locale="vi_VN"
            />

            {/* Time Slots Card */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>Chọn giờ:</Text>
                <View style={styles.timeSlotGrid}>
                    {availableTimeSlots.map(slot => (
                        <TouchableOpacity
                            key={slot}
                            style={[
                                styles.timeSlotButton,
                                selectedTimeSlot === slot && styles.timeSlotButtonSelected]}
                            onPress={() => setSelectedTimeSlot(slot)}
                        >
                            <Text
                                style={[
                                    styles.timeSlotText,
                                    selectedTimeSlot === slot && styles.timeSlotTextSelected]}
                            >
                                {slot}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Confirm Button */}
            {loading ? (
                <View style={styles.loadingButtonContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <TouchableOpacity
                    style={[styles.confirmButton, !selectedTimeSlot && styles.confirmButtonDisabled]}
                    onPress={handleConfirmBooking}
                    disabled={!selectedTimeSlot}
                >
                    <Icon name="check-circle" size={20} color={COLORS.white} />
                    <Text style={styles.confirmButtonText}>Xác nhận đặt lịch</Text>
                </TouchableOpacity>
            )}
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: COLORS.textMedium,
        textAlign: 'center',
    },
    headerCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textDark,
        textAlign: 'center',
        marginBottom: 16,
    },
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    serviceInfo: {
        marginLeft: 12,
        flex: 1,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    servicePrice: {
        fontSize: 14,
        color: COLORS.textMedium,
        fontWeight: '500',
    },
    sectionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textDark,
        marginBottom: 12,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    dateText: {
        flex: 1,
        fontSize: 15,
        color: COLORS.textDark,
        fontWeight: '500',
        marginLeft: 12,
    },
    timeSlotGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    timeSlotButton: {
        width: '30%',
        paddingVertical: 14,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeSlotButtonSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    timeSlotText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    timeSlotTextSelected: {
        color: COLORS.white,
    },
    loadingButtonContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#27ae60',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    confirmButtonDisabled: {
        opacity: 0.5,
        backgroundColor: '#95a5a6',
    },
    confirmButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
        marginLeft: 8,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 24,
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalIconContainer: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 15,
        color: COLORS.textMedium,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 6,
    },
    modalButtonPrimary: {
        backgroundColor: COLORS.primary,
        elevation: 2,
    },
    modalButtonSecondary: {
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    modalButtonTextPrimary: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    modalButtonTextSecondary: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
});
export default CustomerAppointmentScreen;
