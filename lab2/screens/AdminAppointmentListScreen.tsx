/* eslint-disable react/no-unstable-nested-components */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Appointment {
    id: string;
    serviceName: string;
    appointmentDateTime: FirebaseFirestoreTypes.Timestamp;
    status: 'pending' | 'confirmed' | 'cancelled_by_customer' | 'cancelled_by_admin' | 'rejected' | 'completed';
    servicePrice?: number;
    customerId: string;
    customerName?: string;
    customerEmail?: string;
    requestTimestamp?: FirebaseFirestoreTypes.Timestamp;
}

type AdminAppointmentListScreenNavigationProp = StackNavigationProp<any>;

type Props = {
    navigation: AdminAppointmentListScreenNavigationProp;
};

const AdminAppointmentListScreen: React.FC<Props> = ({ navigation }) => {
    // Căn giữa tiêu đề ở header
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Quản lý lịch hẹn',
            headerTitleAlign: 'center',
            headerTitleStyle: {
                fontWeight: '600',
                fontSize: 18,
            },
        });
    }, [navigation]);

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAppointmentsForAdmin = useCallback(async () => {
        try {
            const app = getApp();
            const db = firestore(app);
            const querySnapshot = await db
                .collection('appointments')
                .orderBy('requestTimestamp', 'desc')
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
                            const app = getApp();
                            const db = firestore(app);
                            await db.collection('appointments').doc(appointmentId).update({
                                status: newStatus,
                                ...(newStatus === 'confirmed' && { confirmedAt: firestore.FieldValue.serverTimestamp() }),
                                ...(newStatus === 'rejected' && { rejectedAt: firestore.FieldValue.serverTimestamp() }),
                                ...(newStatus === 'cancelled_by_admin' && { cancelledAt: firestore.FieldValue.serverTimestamp() }),
                                ...(newStatus === 'completed' && { completedAt: firestore.FieldValue.serverTimestamp() }),
                            });
                            Alert.alert('Thành công', 'Trạng thái lịch hẹn đã được cập nhật.');
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
                    <View style={styles.serviceNameContainer}>
                        <Icon name="event-note" size={20} color={COLORS.primary} />
                        <Text style={styles.serviceName}>{item.serviceName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                    </View>
                </View>

                <View style={styles.infoContainer}>
                    <InfoRow icon="person" label="Khách hàng:" value={item.customerName} />
                    <InfoRow icon="calendar-today" label="Ngày hẹn:" value={appointmentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} />
                    <InfoRow icon="access-time" label="Giờ hẹn:" value={appointmentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} />
                    {requestDate && <InfoRow icon="date-range" label="Ngày đặt:" value={requestDate.toLocaleString('vi-VN')} />}
                    {item.servicePrice !== undefined && (
                        <InfoRow icon="payments" label="Giá:" value={`${item.servicePrice.toLocaleString('vi-VN')} VNĐ`} />
                    )}
                </View>

                <View style={styles.actionsContainer}>
                    {item.status === 'pending' && (
                        <>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.confirmButton]}
                                onPress={() => handleUpdateAppointmentStatus(item.id, 'confirmed')}
                            >
                                <Icon name="check-circle" size={18} color="#FFF" />
                                <Text style={styles.actionButtonText}>Xác nhận</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.rejectButton]}
                                onPress={() => handleUpdateAppointmentStatus(item.id, 'rejected')}
                            >
                                <Icon name="cancel" size={18} color="#FFF" />
                                <Text style={styles.actionButtonText}>Từ chối</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    {item.status === 'confirmed' && (
                         <TouchableOpacity
                            style={[styles.actionButton, styles.completeButton]}
                            onPress={() => handleUpdateAppointmentStatus(item.id, 'completed')}
                        >
                            <Icon name="task-alt" size={18} color="#FFF" />
                            <Text style={styles.actionButtonText}>Hoàn thành</Text>
                        </TouchableOpacity>
                    )}
                     {(item.status === 'confirmed' || item.status === 'pending') && (
                         <TouchableOpacity
                            style={[styles.actionButton, styles.cancelAdminButton]}
                            onPress={() => handleUpdateAppointmentStatus(item.id, 'cancelled_by_admin')}
                        >
                            <Icon name="block" size={18} color="#FFF" />
                            <Text style={styles.actionButtonText}>Hủy</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.detailTouch}
                    onPress={() => navigation.navigate('AdminAppointmentDetail', { appointmentId: item.id })}
                >
                    <Text style={styles.detailTouchText}>Xem chi tiết</Text>
                    <Icon name="chevron-right" size={18} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
        );
    };

    const InfoRow = ({ icon, label, value }: { icon: string, label: string, value?: string }) => (
        <View style={styles.itemRow}>
            <Icon name={icon} size={18} color={COLORS.primary} />
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
                <View style={styles.emptyIconContainer}>
                    <Icon name="event-available" size={64} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>Không có lịch hẹn</Text>
                <Text style={styles.emptyText}>Hiện tại không có lịch hẹn nào cần xử lý</Text>
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
        backgroundColor: '#F5F7FA',
    },
    listContentContainer: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#F5F7FA',
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    appointmentItem: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    serviceNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    serviceName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 8,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    infoContainer: {
        gap: 10,
        marginBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
        minWidth: 90,
    },
    infoValue: {
        fontSize: 14,
        color: '#1F2937',
        flex: 1,
        fontWeight: '400',
    },
    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        gap: 6,
        flex: 1,
        minWidth: 110,
        justifyContent: 'center',
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    confirmButton: {
        backgroundColor: '#10B981',
    },
    rejectButton: {
        backgroundColor: '#EF4444',
    },
    completeButton: {
        backgroundColor: '#3B82F6',
    },
    cancelAdminButton: {
        backgroundColor: '#F59E0B',
    },
    detailTouch: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingTop: 12,
        marginTop: 8,
    },
    detailTouchText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
});

export default AdminAppointmentListScreen;
