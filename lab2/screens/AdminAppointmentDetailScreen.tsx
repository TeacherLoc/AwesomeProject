/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Linking } from 'react-native';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/FontAwesome'; // Hoặc icon set bạn dùng

// Định nghĩa kiểu cho params của route
type AdminAppointmentDetailScreenRouteParams = {
    appointmentId: string;
};

// Định nghĩa kiểu cho props của màn hình (nếu bạn không dùng useRoute/useNavigation)
// type AdminAppointmentDetailScreenProps = {
//     route: RouteProp<{ params: AdminAppointmentDetailScreenRouteParams }, 'params'>;
//     navigation: StackNavigationProp<any>; // Hoặc type cụ thể hơn cho Stack Navigator của bạn
// };

interface AppointmentDetail extends Appointment {
    // Thêm các trường chi tiết khác nếu cần, ví dụ thông tin dịch vụ, thông tin khách hàng đầy đủ
    serviceDetails?: { name: string; description?: string; duration?: string };
    customerDetails?: { name: string; email?: string; phone?: string };
}

interface Appointment { // Giữ lại interface Appointment cơ bản
    id: string;
    serviceName: string;
    appointmentDateTime: FirebaseFirestoreTypes.Timestamp;
    status: 'pending' | 'confirmed' | 'cancelled_by_customer' | 'cancelled_by_admin' | 'rejected' | 'completed';
    servicePrice?: number;
    customerId: string;
    customerName?: string;
    customerEmail?: string;
    requestTimestamp?: FirebaseFirestoreTypes.Timestamp;
    // Thêm các trường thời gian cập nhật trạng thái nếu có
    confirmedAt?: FirebaseFirestoreTypes.Timestamp;
    rejectedAt?: FirebaseFirestoreTypes.Timestamp;
    cancelledAt?: FirebaseFirestoreTypes.Timestamp;
    completedAt?: FirebaseFirestoreTypes.Timestamp;
    notes?: string; // Ghi chú của admin hoặc khách hàng
}


const AdminAppointmentDetailScreen: React.FC = () => {
    const route = useRoute<RouteProp<{ params: AdminAppointmentDetailScreenRouteParams }, 'params'>>();
    const navigation = useNavigation<StackNavigationProp<any>>();
    const { appointmentId } = route.params;

    const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const fetchAppointmentDetails = useCallback(async () => {
        setLoading(true);
        try {
            const docRef = firestore().collection('appointments').doc(appointmentId);
            const docSnap = await docRef.get();

            if (docSnap.exists()) {
                const data = docSnap.data() as Appointment;
                // Bạn có thể fetch thêm thông tin chi tiết về service hoặc customer nếu cần
                // Ví dụ:
                // const serviceSnap = await firestore().collection('services').doc(data.serviceId).get();
                // const customerSnap = await firestore().collection('users').doc(data.customerId).get();
                setAppointment({
                    ...data,
                    id: docSnap.id,
                    // serviceDetails: serviceSnap.exists() ? serviceSnap.data() : undefined,
                    // customerDetails: customerSnap.exists() ? customerSnap.data() : undefined,
                });
            } else {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin lịch hẹn.');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error fetching appointment details: ', error);
            Alert.alert('Lỗi', 'Không thể tải chi tiết lịch hẹn.');
        } finally {
            setLoading(false);
        }
    }, [appointmentId, navigation]);

    useEffect(() => {
        fetchAppointmentDetails();
    }, [fetchAppointmentDetails]);

    const handleUpdateStatus = async (newStatus: Appointment['status']) => {
        if (!appointment) {return;}
        setUpdating(true);
        Alert.alert(
            'Xác nhận thay đổi',
            `Bạn có chắc muốn cập nhật trạng thái lịch hẹn thành "${newStatus.replace('_', ' ')}"?`,
            [
                { text: 'Hủy', style: 'cancel', onPress: () => setUpdating(false) },
                {
                    text: 'Đồng ý',
                    onPress: async () => {
                        try {
                            await firestore().collection('appointments').doc(appointment.id).update({
                                status: newStatus,
                                ...(newStatus === 'confirmed' && { confirmedAt: firestore.FieldValue.serverTimestamp() }),
                                ...(newStatus === 'rejected' && { rejectedAt: firestore.FieldValue.serverTimestamp() }),
                                ...(newStatus === 'cancelled_by_admin' && { cancelledAt: firestore.FieldValue.serverTimestamp() }),
                                ...(newStatus === 'completed' && { completedAt: firestore.FieldValue.serverTimestamp() }),
                            });
                            Alert.alert('Thành công', 'Trạng thái lịch hẹn đã được cập nhật.');
                            setAppointment(prev => prev ? { ...prev, status: newStatus } : null);
                            // navigation.goBack(); // Hoặc cập nhật lại màn hình
                        } catch (error) {
                            console.error('Error updating appointment status: ', error);
                            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái lịch hẹn.');
                        } finally {
                            setUpdating(false);
                        }
                    } }]
        );
    };

    const getStatusStyle = (status?: Appointment['status']) => {
        // Copy hàm getStatusStyle từ AdminAppointmentListScreen hoặc định nghĩa lại
        switch (status?.toLowerCase()) {
            case 'pending': return { backgroundColor: COLORS.warningLight, color: COLORS.warningDark, text: 'Chờ xác nhận' };
            case 'confirmed': return { backgroundColor: COLORS.successLight, color: COLORS.successDark, text: 'Đã xác nhận' };
            case 'cancelled_by_customer': return { backgroundColor: COLORS.errorLight, color: COLORS.errorDark, text: 'KH hủy' };
            case 'cancelled_by_admin': return { backgroundColor: COLORS.errorLight, color: COLORS.errorDark, text: 'Admin hủy' };
            case 'rejected': return { backgroundColor: COLORS.errorLight, color: COLORS.errorDark, text: 'Đã từ chối' };
            case 'completed': return { backgroundColor: COLORS.infoLight, color: COLORS.infoDark, text: 'Đã hoàn thành' };
            default: return { backgroundColor: COLORS.greyLight, color: COLORS.textMedium, text: status || 'Không rõ' };
        }
    };


    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!appointment) {
        return <View style={styles.centered}><Text>Không có dữ liệu lịch hẹn.</Text></View>;
    }

    const statusInfo = getStatusStyle(appointment.status);
    const appointmentDate = appointment.appointmentDateTime.toDate();
    const requestDate = appointment.requestTimestamp?.toDate();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.card}>
                <View style={styles.headerSection}>
                    <Text style={styles.serviceName}>{appointment.serviceName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                    </View>
                </View>

                <InfoRow icon="user" label="Khách hàng:" value={appointment.customerName} />
                {appointment.customerEmail && <InfoRow icon="envelope" label="Email KH:" value={appointment.customerEmail} onPress={() => Linking.openURL(`mailto:${appointment.customerEmail}`)} />}
                {/* {appointment.customerDetails?.phone && <InfoRow icon="phone" label="SĐT KH:" value={appointment.customerDetails.phone} onPress={() => Linking.openURL(`tel:${appointment.customerDetails.phone}`)} />} */}

                <InfoRow icon="calendar" label="Ngày hẹn:" value={appointmentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} />
                <InfoRow icon="clock-o" label="Giờ hẹn:" value={appointmentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} />
                {requestDate && <InfoRow icon="calendar-plus-o" label="Ngày đặt:" value={requestDate.toLocaleString('vi-VN')} />}
                {appointment.servicePrice !== undefined && (
                    <InfoRow icon="money" label="Giá dịch vụ:" value={`${appointment.servicePrice.toLocaleString('vi-VN')}K`} />
                )}

                {/* Thêm thông tin chi tiết dịch vụ nếu có */}
                {/* {appointment.serviceDetails && (
                    <>
                        <Text style={styles.sectionTitle}>Chi tiết dịch vụ</Text>
                        <InfoRow icon="info-circle" label="Tên DV:" value={appointment.serviceDetails.name} />
                        <InfoRow icon="align-left" label="Mô tả:" value={appointment.serviceDetails.description} isLongText />
                        <InfoRow icon="hourglass-half" label="Thời gian:" value={appointment.serviceDetails.duration} />
                    </>
                )} */}

                {appointment.notes && <InfoRow icon="sticky-note" label="Ghi chú:" value={appointment.notes} isLongText />}

            </View>

            <View style={styles.actionsCard}>
                <Text style={styles.sectionTitle}>Hành động</Text>
                {updating && <ActivityIndicator style={{marginBottom: 10}} color={COLORS.primary} />}
                {!updating && (
                    <>
                        {appointment.status === 'pending' && (
                            <View style={styles.actionRow}>
                                <ActionButton title="Xác nhận" icon="check-circle" color={COLORS.success} onPress={() => handleUpdateStatus('confirmed')} />
                                <ActionButton title="Từ chối" icon="times-circle" color={COLORS.error} onPress={() => handleUpdateStatus('rejected')} />
                            </View>
                        )}
                        {appointment.status === 'confirmed' && (
                             <ActionButton title="Đánh dấu Hoàn thành" icon="check-square-o" color={COLORS.info} onPress={() => handleUpdateStatus('completed')} />
                        )}
                        {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                             <ActionButton title="Hủy (Admin)" icon="ban" color={COLORS.warningDark} onPress={() => handleUpdateStatus('cancelled_by_admin')} />
                        )}
                        {/* Nút gọi điện hoặc nhắn tin cho khách hàng */}
                    </>
                )}
            </View>
        </ScrollView>
    );
};

const InfoRow = ({ icon, label, value, onPress, isLongText }: { icon: string, label: string, value?: string, onPress?: () => void, isLongText?: boolean }) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.infoRowContainer}>
        <Icon name={icon} size={16} color={COLORS.textMedium} style={styles.infoIcon} />
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, onPress && styles.linkValue, isLongText && styles.longText]} selectable={true}>
            {value || 'N/A'}
        </Text>
    </TouchableOpacity>
);

const ActionButton = ({ title, icon, color, onPress }: { title: string, icon: string, color: string, onPress: () => void }) => (
    <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
        <Icon name={icon} size={18} color={COLORS.white} />
        <Text style={styles.actionButtonText}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundMain || '#f8f9fa',
    },
    contentContainer: {
        padding: 15,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: 20,
        marginBottom: 20,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: 20,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.primary,
    },
    serviceName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textDark,
        flex: 1, // Allow text to wrap
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    infoRowContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Align items to start for long text
        paddingVertical: 8,
    },
    infoIcon: {
        marginRight: 12,
        marginTop: 2, // Adjust icon position
    },
    infoLabel: {
        fontSize: 15,
        color: COLORS.textDark,
        fontWeight: '500',
        width: 120, // Fixed width for labels
    },
    infoValue: {
        fontSize: 15,
        color: COLORS.textMedium,
        flex: 1, // Allow value to take remaining space
    },
    linkValue: {
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
    longText: {
        lineHeight: 22, // Improve readability for long text
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textDark,
        marginBottom: 15,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.primary,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginVertical: 5, // Add vertical margin for single buttons
        flex: 1, // Make buttons in a row share space
        marginHorizontal: 5, // Add horizontal margin for buttons in a row
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default AdminAppointmentDetailScreen;
