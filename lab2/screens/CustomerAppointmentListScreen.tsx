import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { getFirestore, collection, query, where, orderBy, getDocs, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/FontAwesome';

// Define the structure of an appointment object
interface Appointment {
    id: string;
    serviceName: string;
    appointmentDateTime: FirebaseFirestoreTypes.Timestamp;
    status: 'pending' | 'confirmed' | 'cancelled_by_customer' | 'cancelled_by_admin' | 'rejected' | 'completed';
    servicePrice?: number;
    // Add other relevant fields if necessary
}

// Define filter types
type FilterType = 'all' | 'pending' | 'completed' | 'cancelled';

// Define navigation props
type CustomerAppointmentListScreenNavigationProp = StackNavigationProp<any>; // Replace 'any' with your RootStackParamList if available

type Props = {
    navigation: CustomerAppointmentListScreenNavigationProp;
};

const CustomerAppointmentListScreen: React.FC<Props> = ({ navigation }) => {
    // Căn giữa tiêu đề ở header
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Lịch hẹn của tôi',
            headerTitleAlign: 'center',
            headerTitleStyle: {
                fontSize: 20,
            },
        });
    }, [navigation]);

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
    const currentUser = getAuth(getApp()).currentUser;

    const fetchAppointments = useCallback(async () => {
        if (!currentUser) {
            setLoading(false);
            setRefreshing(false);
            // Optionally, prompt user to log in or handle appropriately
            return;
        }

        try {
            const db = getFirestore(getApp());
            const appointmentsRef = collection(db, 'appointments');
            const appointmentsQuery = query(
                appointmentsRef,
                where('customerId', '==', currentUser.uid),
                orderBy('appointmentDateTime', 'desc')
            );
            const querySnapshot = await getDocs(appointmentsQuery);
            const fetchedAppointments: Appointment[] = querySnapshot.docs.map((doc: { data: () => any; id: any; }) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    serviceName: data.serviceName,
                    appointmentDateTime: data.appointmentDateTime,
                    status: data.status,
                    servicePrice: data.servicePrice,
                } as Appointment;
            });
            setAppointments(fetchedAppointments);
        } catch (error) {
            console.error('Error fetching appointments: ', error);
            // Handle error (e.g., show a message to the user)
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchAppointments();
        }, [fetchAppointments])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAppointments();
    }, [fetchAppointments]);

    const getStatusStyle = (status: Appointment['status']) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return { backgroundColor: COLORS.warningLight, color: COLORS.warningDark, text: 'Chờ xác nhận' };
            case 'confirmed':
                return { backgroundColor: COLORS.successLight, color: COLORS.successDark, text: 'Đã xác nhận' };
            case 'cancelled_by_customer':
            case 'cancelled_by_admin':
            case 'rejected':
                return { backgroundColor: COLORS.errorLight, color: COLORS.errorDark, text: 'Đã hủy' };
            case 'completed':
                return { backgroundColor: COLORS.infoLight, color: COLORS.infoDark, text: 'Đã hoàn thành' };
            default:
                return { backgroundColor: COLORS.greyLight, color: COLORS.textMedium, text: status || 'Không rõ' };
        }
    };

    // Filter appointments based on selected filter
    const filteredAppointments = appointments.filter(appointment => {
        if (selectedFilter === 'all') {
            return true;
        }
        if (selectedFilter === 'pending') {
            return appointment.status === 'pending';
        }
        if (selectedFilter === 'completed') {
            return appointment.status === 'completed';
        }
        if (selectedFilter === 'cancelled') {
            return ['cancelled_by_customer', 'cancelled_by_admin', 'rejected'].includes(appointment.status);
        }
        return true;
    });

    const renderFilterButton = (filter: FilterType, label: string, icon: string) => {
        const isSelected = selectedFilter === filter;
        return (
            <TouchableOpacity
                style={[styles.filterButton, isSelected && styles.filterButtonActive]}
                onPress={() => setSelectedFilter(filter)}
            >
                <Icon
                    name={icon}
                    size={16}
                    color={isSelected ? COLORS.white : COLORS.primary}
                />
                <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderAppointmentItem = ({ item }: { item: Appointment }) => {
        const statusInfo = getStatusStyle(item.status);
        const appointmentDate = item.appointmentDateTime.toDate();

        return (
            <TouchableOpacity
                style={styles.appointmentItem}
                onPress={() => navigation.navigate('CustomerAppointmentDetail', {
                    appointmentId: item.id,
                })}
            >
                <View style={styles.itemHeader}>
                    <View style={styles.serviceNameContainer}>
                        <Icon name="event-note" size={20} color={COLORS.primary} />
                        <Text style={styles.serviceName}>{item.serviceName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                    </View>
                </View>

                <View style={styles.detailsContainer}>
                    <View style={styles.itemRow}>
                        <Icon name="calendar" size={18} color={COLORS.textMedium} />
                        <Text style={styles.appointmentDate}>
                            {appointmentDate.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                    </View>
                    <View style={styles.itemRow}>
                        <Icon name="clock-o" size={18} color={COLORS.textMedium} />
                        <Text style={styles.appointmentTime}>
                            {appointmentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    {item.servicePrice !== undefined && (
                        <View style={styles.itemRow}>
                            <Icon name="money" size={18} color={COLORS.primary} />
                            <Text style={styles.servicePrice}>{item.servicePrice.toLocaleString('vi-VN')} VNĐ</Text>
                        </View>
                    )}
                </View>

                <View style={styles.chevronContainer}>
                    <Icon name="chevron-right" size={20} color={COLORS.textLight} />
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!currentUser) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>Vui lòng đăng nhập để xem lịch hẹn.</Text>
            </View>
        );
    }

    if (appointments.length === 0) {
        return (
            <View style={styles.centered}>
                <View style={styles.emptyIconContainer}>
                    <Icon name="calendar-times-o" size={64} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>Chưa có lịch hẹn</Text>
                <Text style={styles.emptyText}>Bạn chưa đặt lịch khám nào. Hãy chọn dịch vụ và đặt lịch ngay!</Text>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => navigation.navigate('ServicesTab', { screen: 'CustomerServiceList' })}
                >
                    <Icon name="add-circle-outline" size={20} color="#FFF" />
                    <Text style={styles.bookButtonText}>Đặt dịch vụ ngay</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.filterContainer}>
                {renderFilterButton('all', 'Tất cả', 'list')}
                {renderFilterButton('pending', 'Chờ xác nhận', 'clock-o')}
                {renderFilterButton('completed', 'Đã hoàn thành', 'check-circle')}
                {renderFilterButton('cancelled', 'Đã hủy', 'times-circle')}
            </View>
            <FlatList
                data={filteredAppointments}
                renderItem={renderAppointmentItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="inbox" size={48} color={COLORS.textLight} />
                        <Text style={styles.emptyFilterText}>Không có lịch hẹn nào</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    filterButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        gap: 6,
    },
    filterButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    filterButtonTextActive: {
        color: COLORS.white,
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
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyFilterText: {
        fontSize: 15,
        color: COLORS.textMedium,
        marginTop: 12,
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    bookButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    appointmentItem: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        position: 'relative',
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
    detailsContainer: {
        gap: 10,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appointmentDate: {
        fontSize: 15,
        color: '#4B5563',
        marginLeft: 10,
        flex: 1,
    },
    appointmentTime: {
        fontSize: 15,
        color: '#4B5563',
        marginLeft: 10,
        fontWeight: '600',
    },
    servicePrice: {
        fontSize: 16,
        color: COLORS.primary,
        marginLeft: 10,
        fontWeight: '700',
    },
    chevronContainer: {
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -10,
    },
});

export default CustomerAppointmentListScreen;
