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

// Define navigation props
type CustomerAppointmentListScreenNavigationProp = StackNavigationProp<any>; // Replace 'any' with your RootStackParamList if available

type Props = {
    navigation: CustomerAppointmentListScreenNavigationProp;
};

const CustomerAppointmentListScreen: React.FC<Props> = ({ navigation }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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
            const fetchedAppointments: Appointment[] = querySnapshot.docs.map(doc => {
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

    const renderAppointmentItem = ({ item }: { item: Appointment }) => {
        const statusInfo = getStatusStyle(item.status);
        const appointmentDate = item.appointmentDateTime.toDate();

        return (
            <TouchableOpacity
                style={styles.appointmentItem}
                onPress={() => navigation.navigate('CustomerAppointmentDetail', {
                    appointmentId: item.id,
                    // Pass the full appointment data if you want to avoid re-fetching in detail screen for initial load
                    // appointmentData: { ...item, appointmentDateTime: item.appointmentDateTime.toDate().toISOString() } // Convert Timestamp to serializable format
                })}
            >
                <View style={styles.itemHeader}>
                    <Text style={styles.serviceName}>{item.serviceName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                    </View>
                </View>
                <View style={styles.itemRow}>
                    <Icon name="calendar" size={16} color={COLORS.textMedium} />
                    <Text style={styles.appointmentDate}>
                        {appointmentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                </View>
                <View style={styles.itemRow}>
                    <Icon name="clock-o" size={16} color={COLORS.textMedium} />
                    <Text style={styles.appointmentTime}>
                        {appointmentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                {item.servicePrice !== undefined && (
                    <View style={styles.itemRow}>
                        <Icon name="money" size={16} color={COLORS.textMedium} />
                        <Text style={styles.servicePrice}>Giá: {item.servicePrice.toLocaleString('vi-VN')}K</Text>
                    </View>
                )}
                <Icon name="chevron-right" size={16} color={COLORS.textLight} style={styles.chevronIcon} />
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
                <Icon name="calendar-times-o" size={50} color={COLORS.textLight} />
                <Text style={styles.emptyText}>Bạn chưa có lịch hẹn nào.</Text>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => navigation.navigate('ServicesTab', { screen: 'CustomerServiceList' })}
                >
                    <Text style={styles.bookButtonText}>Đặt dịch vụ ngay</Text>
                </TouchableOpacity>
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
        backgroundColor: COLORS.backgroundMain || '#f8f9fa',
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: COLORS.textMedium,
        textAlign: 'center',
    },
    bookButton: {
        marginTop: 20,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
    },
    bookButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
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
        marginLeft: 'auto', // Push to the right
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    appointmentDate: {
        fontSize: 14,
        color: COLORS.textMedium,
        marginLeft: 8,
    },
    appointmentTime: {
        fontSize: 14,
        color: COLORS.textMedium,
        marginLeft: 8,
    },
    servicePrice: {
        fontSize: 14,
        color: COLORS.textMedium,
        marginLeft: 8,
    },
    chevronIcon: {
        position: 'absolute',
        right: 15,
        top: '50%', // Center vertically
        transform: [{ translateY: -8 }], // Adjust based on icon size
    },
});

export default CustomerAppointmentListScreen;
