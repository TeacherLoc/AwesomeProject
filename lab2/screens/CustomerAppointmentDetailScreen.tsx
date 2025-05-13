/* eslint-disable quotes */
/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback, JSX } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { getFirestore, doc, getDoc, updateDoc, Timestamp } from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors'; // Import COLORS
import Icon from 'react-native-vector-icons/FontAwesome'; // For icons

const CustomerAppointmentDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { appointmentId, appointmentData: initialAppointmentData } = route.params; // Nhận appointmentId hoặc appointmentData
    const [appointment, setAppointment] = useState<any>(initialAppointmentData || null);
    const [loading, setLoading] = useState(!initialAppointmentData); // Chỉ loading nếu không có initialData
    const [isCancelling, setIsCancelling] = useState(false);

    const fetchAppointmentDetails = useCallback(async () => {
        if (!appointmentId) {
            Alert.alert('Lỗi', 'Không có ID lịch hẹn.');
            navigation.goBack();
            return;
        }
        setLoading(true);
        const firestoreInstance = getFirestore();
        const appointmentDocRef = doc(firestoreInstance, 'appointments', appointmentId);
        try {
            const docSnap = await getDoc(appointmentDocRef);
            if (docSnap.exists()) {
                // Cast docSnap.data() to a type that acknowledges the possible existence of timestamp fields
                const firestoreDocumentData = docSnap.data() as {
                    appointmentDateTime?: any; // Or firebase.firestore.Timestamp if you have that type
                    requestTimestamp?: any;  // Or firebase.firestore.Timestamp
                    [key: string]: any;      // To allow other properties
                };

                const data = {
                    id: docSnap.id,
                    ...firestoreDocumentData};
                // Chuyển đổi Timestamp nếu có
                // Now, TypeScript should allow accessing data.appointmentDateTime
                if (data.appointmentDateTime && data.appointmentDateTime instanceof Timestamp) {
                    data.appointmentDateTime = data.appointmentDateTime.toDate();
                }
                if (data.requestTimestamp && data.requestTimestamp instanceof Timestamp) {
                    data.requestTimestamp = data.requestTimestamp.toDate();
                }
                setAppointment(data); // The `appointment` state is currently `any`, so this is fine.
                                      // For better type safety, consider defining an Appointment interface for the state.
            } else {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin lịch hẹn.');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Lỗi khi tải chi tiết lịch hẹn: ', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin chi tiết lịch hẹn.');
        } finally {
            setLoading(false);
        }
    }, [appointmentId, navigation]);

    useEffect(() => {
        // Nếu không có initialAppointmentData hoặc chỉ có appointmentId, thì fetch từ Firestore
        if (!initialAppointmentData && appointmentId) {
            fetchAppointmentDetails();
        } else if (initialAppointmentData) {
            // Xử lý Timestamp nếu initialAppointmentData được truyền vào
            const data = { ...initialAppointmentData };
            if (data.appointmentDateTime && data.appointmentDateTime.seconds) { // Kiểm tra nếu là object Timestamp từ Firestore
                 data.appointmentDateTime = new Timestamp(data.appointmentDateTime.seconds, data.appointmentDateTime.nanoseconds).toDate();
            }
            if (data.requestTimestamp && data.requestTimestamp.seconds) {
                 data.requestTimestamp = new Timestamp(data.requestTimestamp.seconds, data.requestTimestamp.nanoseconds).toDate();
            }
            setAppointment(data);
        }
    }, [initialAppointmentData, appointmentId, fetchAppointmentDetails]);

    const handleCancelAppointment = async () => {
        if (!appointment || !appointment.id) {return;}

        Alert.alert(
            'Xác nhận hủy lịch',
            'Bạn có chắc chắn muốn hủy lịch hẹn này không?',
            [
                { text: 'Không', style: 'cancel' },
                {
                    text: 'Có, hủy lịch',
                    style: 'destructive',
                    onPress: async () => {
                        setIsCancelling(true);
                        const firestoreInstance = getFirestore();
                        const appointmentDocRef = doc(firestoreInstance, 'appointments', appointment.id);
                        try {
                            await updateDoc(appointmentDocRef, {
                                status: 'cancelled_by_customer', // Trạng thái mới
                                cancelledAt: Timestamp.now(), // Thời điểm hủy
                            });
                            Alert.alert('Thành công', 'Lịch hẹn của bạn đã được hủy.');
                            // Cập nhật lại state hoặc điều hướng/refresh
                            setAppointment((prev: any) => ({ ...prev, status: 'cancelled_by_customer' }));
                            // navigation.goBack(); // Hoặc refresh list
                        } catch (error) {
                            console.error('Lỗi khi hủy lịch hẹn: ', error);
                            Alert.alert('Lỗi', 'Không thể hủy lịch hẹn. Vui lòng thử lại.');
                        } finally {
                            setIsCancelling(false);
                        }
                    }}]
        );
    };

    const getStatusStyle = (status?: string) => { // Thêm optional chaining cho status
        switch (status?.toLowerCase()) {
            case 'pending':
                return { backgroundColor: COLORS.warningLight, color: COLORS.warningDark, text: 'Chờ xác nhận' };
            case 'confirmed':
                return { backgroundColor: COLORS.successLight, color: COLORS.successDark, text: 'Đã xác nhận' };
            case 'cancelled_by_customer':
            case 'cancelled_by_admin':
            case 'rejected':
                return { backgroundColor: COLORS.errorLight, color: COLORS.errorDark, text: 'Đã hủy' }; // Hoặc 'Đã hủy/Từ chối'
            case 'completed':
                return { backgroundColor: COLORS.infoLight, color: COLORS.infoDark, text: 'Đã hoàn thành' };
            default:
                return { backgroundColor: COLORS.greyLight, color: COLORS.textMedium, text: status || 'Không rõ' };
        }
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!appointment) {
        return <View style={styles.centered}><Text style={{color: COLORS.textMedium}}>Không có dữ liệu lịch hẹn.</Text></View>;
    }

    const statusInfo = getStatusStyle(appointment?.status);
    const canCancel = appointment?.status === 'pending' || appointment?.status === 'confirmed'; // Điều kiện cho phép hủy

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerSection}>
                <Text style={styles.serviceName}>{appointment.serviceName || 'Dịch vụ không xác định'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                </View>
            </View>

            <View style={styles.detailCard}>
                <InfoRow icon="calendar" label="Ngày hẹn:" value={appointment.appointmentDateTime ? new Date(appointment.appointmentDateTime).toLocaleDateString('vi-VN') : 'N/A'} />
                <InfoRow icon="clock-o" label="Giờ hẹn:" value={appointment.appointmentDateTime ? new Date(appointment.appointmentDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit'}) : 'N/A'} />
                {appointment.servicePrice && (
                    <InfoRow icon="money" label="Giá dịch vụ:" value={`${appointment.servicePrice.toLocaleString('vi-VN')}K`} />
                )}
                <InfoRow icon="info-circle" label="Trạng thái:" valueComponent={
                    <View style={[styles.statusBadgeInline, { backgroundColor: statusInfo.backgroundColor, alignSelf: 'flex-start'}]}>
                        <Text style={[styles.statusTextInline, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                    </View>
                } />
                <InfoRow icon="bookmark-o" label="Mã lịch hẹn:" value={appointment.id.substring(0,10) + "..."} />
                 {appointment.requestTimestamp && (
                    <InfoRow icon="calendar-plus-o" label="Ngày đặt:" value={new Date(appointment.requestTimestamp).toLocaleString('vi-VN')} />
                )}
                {/* Thêm các thông tin khác nếu cần */}
            </View>

            {canCancel && (
                <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton, isCancelling && styles.disabledButton]}
                    onPress={handleCancelAppointment}
                    disabled={isCancelling}
                >
                    {isCancelling ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                        <Text style={styles.actionButtonText}>Hủy lịch hẹn</Text>
                    )}
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};

const InfoRow = ({ icon, label, value, valueComponent }: { icon: string, label: string, value?: string, valueComponent?: JSX.Element }) => (
    <View style={styles.infoRow}>
        <Icon name={icon} size={18} color={COLORS.primary} style={styles.infoIcon} />
        <Text style={styles.infoLabel}>{label}</Text>
        {valueComponent ? valueComponent : <Text style={styles.infoValue}>{value}</Text>}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight || '#f4f6f8',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundLight || '#f4f6f8',
    },
    headerSection: {
        paddingHorizontal: 20,
        paddingVertical: 25,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        alignItems: 'center',
    },
    serviceName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textDark,
        textAlign: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusBadgeInline: { // For status inside InfoRow
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusTextInline: {
        fontSize: 14,
        fontWeight: '500',
    },
    detailCard: {
        margin: 15,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        padding: 20,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoIcon: {
        marginRight: 12,
        width: 20, // Ensure consistent icon spacing
        textAlign: 'center',
    },
    infoLabel: {
        fontSize: 15,
        color: COLORS.textMedium,
        fontWeight: '600',
        marginRight: 8,
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.textDark,
        flexShrink: 1, // Allow text to wrap
    },
    actionButton: {
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 20,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.error,
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.7,
    }});

export default CustomerAppointmentDetailScreen;
