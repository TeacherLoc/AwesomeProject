/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/FontAwesome';

interface Appointment {
    id: string;
    serviceName: string;
    appointmentDateTime: FirebaseFirestoreTypes.Timestamp;
    status: 'pending' | 'confirmed' | 'cancelled_by_customer' | 'cancelled_by_admin' | 'rejected' | 'completed';
    servicePrice?: number;
    customerId: string;
    customerName?: string; // Thêm tên khách hàng
    customerEmail?: string;
    requestTimestamp?: FirebaseFirestoreTypes.Timestamp;
}

type AdminAppointmentListScreenNavigationProp = StackNavigationProp<any>;

type Props = {
    navigation: AdminAppointmentListScreenNavigationProp;
};

const AdminAppointmentListScreen: React.FC<Props> = ({ navigation }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // const currentUser = auth().currentUser; // Admin user

    const fetchAppointmentsForAdmin = useCallback(async () => {
        // Admin có thể cần kiểm tra vai trò trước khi fetch, nhưng hiện tại giả sử admin đã đăng nhập
        // và có quyền đọc collection 'appointments' (đã cấu hình trong security rules)
        try {
            const querySnapshot = await firestore()
                .collection('appointments')
                // Sắp xếp theo thời gian yêu cầu, hoặc thời gian hẹn, hoặc trạng thái
                .orderBy('requestTimestamp', 'desc') // Hiển thị yêu cầu mới nhất trước
                // .where('status', 'in', ['pending', 'confirmed']) // Chỉ lấy các lịch hẹn cần xử lý
                .get();

            const fetchedAppointments: Appointment[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    serviceName: data.serviceName,
                    appointmentDateTime: data.appointmentDateTime,
                    status: data.status,
                    servicePrice: data.servicePrice,
                    customerId: data.customerId,
                    customerName: data.customerName || 'N/A',
                    customerEmail: data.customerEmail,
                    requestTimestamp: data.requestTimestamp,
                } as Appointment;
            });
            setAppointments(fetchedAppointments);
        } catch (error) {
            console.error('Error fetching appointments for admin: ', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách lịch hẹn.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchAppointmentsForAdmin();
        }, [fetchAppointmentsForAdmin])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAppointmentsForAdmin();
    }, [fetchAppointmentsForAdmin]);

    const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
        Alert.alert(
            'Xác nhận thay đổi',
            `Bạn có chắc muốn cập nhật trạng thái lịch hẹn thành "${newStatus.replace('_', ' ')}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đồng ý',
                    onPress: async () => {
                        try {
                            await firestore().collection('appointments').doc(appointmentId).update({
                                status: newStatus,
                                ...(newStatus === 'confirmed' && { confirmedAt: firestore.FieldValue.serverTimestamp() }),
                                ...(newStatus === 'rejected' && { rejectedAt: firestore.FieldValue.serverTimestamp() }),
                                ...(newStatus === 'cancelled_by_admin' && { cancelledAt: firestore.FieldValue.serverTimestamp() }),
                                ...(newStatus === 'completed' && { completedAt: firestore.FieldValue.serverTimestamp() }),
                            });
                            Alert.alert('Thành công', 'Trạng thái lịch hẹn đã được cập nhật.');
                            // Cập nhật lại danh sách local
                            setAppointments(prevAppointments =>
                                prevAppointments.map(apt =>
                                    apt.id === appointmentId ? { ...apt, status: newStatus } : apt
                                )
                            );
                        } catch (error) {
                            console.error('Error updating appointment status: ', error);
                            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái lịch hẹn.');
                        }
                    }}]
        );
    };

    const getStatusStyle = (status: Appointment['status']) => {
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

    const renderAppointmentItem = ({ item }: { item: Appointment }) => {
        const statusInfo = getStatusStyle(item.status);
        const appointmentDate = item.appointmentDateTime.toDate();
        const requestDate = item.requestTimestamp?.toDate();

        return (
            <View style={styles.appointmentItem}>
                <View style={styles.itemHeader}>
                    <Text style={styles.serviceName}>{item.serviceName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                    </View>
                </View>

                <InfoRow icon="user" label="Khách hàng:" value={item.customerName} />
                <InfoRow icon="calendar" label="Ngày hẹn:" value={appointmentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} />
                <InfoRow icon="clock-o" label="Giờ hẹn:" value={appointmentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} />
                {requestDate && <InfoRow icon="calendar-plus-o" label="Ngày đặt:" value={requestDate.toLocaleString('vi-VN')} />}
                {item.servicePrice !== undefined && (
                    <InfoRow icon="money" label="Giá:" value={`${item.servicePrice.toLocaleString('vi-VN')}K`} />
                )}

                <View style={styles.actionsContainer}>
                    {item.status === 'pending' && (
                        <>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.confirmButton]}
                                onPress={() => handleUpdateAppointmentStatus(item.id, 'confirmed')}
                            >
                                <Icon name="check-circle" size={16} color={COLORS.white} />
                                <Text style={styles.actionButtonText}> Xác nhận</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.rejectButton]}
                                onPress={() => handleUpdateAppointmentStatus(item.id, 'rejected')}
                            >
                                <Icon name="times-circle" size={16} color={COLORS.white} />
                                <Text style={styles.actionButtonText}> Từ chối</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    {item.status === 'confirmed' && (
                         <TouchableOpacity
                            style={[styles.actionButton, styles.completeButton]}
                            onPress={() => handleUpdateAppointmentStatus(item.id, 'completed')}
                        >
                            <Icon name="check-square-o" size={16} color={COLORS.white} />
                            <Text style={styles.actionButtonText}> Hoàn thành</Text>
                        </TouchableOpacity>
                    )}
                     {(item.status === 'confirmed' || item.status === 'pending') && (
                         <TouchableOpacity
                            style={[styles.actionButton, styles.cancelAdminButton]}
                            onPress={() => handleUpdateAppointmentStatus(item.id, 'cancelled_by_admin')}
                        >
                            <Icon name="ban" size={16} color={COLORS.white} />
                            <Text style={styles.actionButtonText}> Hủy (Admin)</Text>
                        </TouchableOpacity>
                    )}
                </View>
                 {/* Admin có thể nhấn vào để xem chi tiết hơn nếu cần */}
                <TouchableOpacity style={styles.detailTouch} onPress={() => navigation.navigate('AdminAppointmentDetail', { appointmentId: item.id })}>
                    <Text style={styles.detailTouchText}>Xem chi tiết</Text>
                    <Icon name="chevron-right" size={14} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
        );
    };

    const InfoRow = ({ icon, label, value }: { icon: string, label: string, value?: string }) => (
        <View style={styles.itemRow}>
            <Icon name={icon} size={15} color={COLORS.textMedium} style={{marginRight: 7}} />
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || 'N/A'}</Text>
        </View>
    );


    if (loading && !refreshing) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (appointments.length === 0 && !loading) {
        return (
            <View style={styles.centered}>
                <Icon name="calendar-check-o" size={50} color={COLORS.textLight} />
                <Text style={styles.emptyText}>Không có lịch hẹn nào cần xử lý.</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={appointments}
            renderItem={renderAppointmentItem}
            keyExtractor={item => item.id}
            style={styles.container}
            contentContainerStyle={styles.listContentContainer}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundMain || '#f8f9fa',
    },
    listContentContainer: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: COLORS.textMedium,
        textAlign: 'center',
    },
    appointmentItem: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    serviceName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: COLORS.textDark,
        flexShrink: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 7,
    },
    infoLabel: {
        fontSize: 14,
        color: COLORS.textDark,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: COLORS.textMedium,
        marginLeft: 5,
        flexShrink: 1,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around', // Hoặc 'flex-start' nếu muốn các nút gần nhau hơn
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.primary,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        minWidth: 100, // Đảm bảo nút có độ rộng tối thiểu
        justifyContent: 'center',
        marginHorizontal: 5, // Khoảng cách giữa các nút
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    confirmButton: {
        backgroundColor: COLORS.success,
    },
    rejectButton: {
        backgroundColor: COLORS.error,
    },
    completeButton: {
        backgroundColor: COLORS.info,
    },
    cancelAdminButton: {
        backgroundColor: COLORS.warningDark,
    },
    detailTouch: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingTop: 10,
        marginTop: 5,
    },
    detailTouchText: {
        color: COLORS.primary,
        fontSize: 13,
        marginRight: 5,
    }});

export default AdminAppointmentListScreen;
