import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, collection, query, where, getDocs } from '@react-native-firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

const {  } = Dimensions.get('window');

interface AppointmentStats {
    date: string;
    count: number;
    serviceName: string;
    price: number;
}

const HealthStatisticsScreen = ({ navigation }: { navigation: any }) => {
    const [loading, setLoading] = useState(true);
    const [completedAppointments, setCompletedAppointments] = useState<AppointmentStats[]>([]);
    const [totalAppointments, setTotalAppointments] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Thống kê sức khỏe',
            headerTitleAlign: 'center',
            headerStyle: {
                backgroundColor: '#6366F1',
            },
            headerTintColor: '#FFF',
            headerTitleStyle: {
                fontWeight: 'bold',
                color: '#FFF',
            },
        });
    }, [navigation]);

    const fetchHealthStatistics = useCallback(async () => {
        setLoading(true);
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            setLoading(false);
            return;
        }

        try {
            const db = getFirestore();
            const appointmentsRef = collection(db, 'appointments');

            // Calculate date range based on selected period
            const now = new Date();
            let startDate = new Date();

            if (selectedPeriod === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (selectedPeriod === 'month') {
                startDate.setMonth(now.getMonth() - 1);
            } else {
                startDate = new Date(0); // All time
            }

            // Simplified query without orderBy to avoid composite index requirement
            const appointmentsQuery = query(
                appointmentsRef,
                where('customerId', '==', currentUser.uid),
                where('status', '==', 'completed')
            );

            const snapshot = await getDocs(appointmentsQuery);
            const appointments: AppointmentStats[] = [];
            let total = 0;

            snapshot.forEach((doc: { data: () => any; }) => {
                const data = doc.data();
                const appointmentDate = data.appointmentDateTime.toDate();

                // Filter by selected period
                if (appointmentDate >= startDate) {
                    appointments.push({
                        date: appointmentDate.toLocaleDateString('vi-VN'),
                        count: 1,
                        serviceName: data.serviceName || 'Không rõ',
                        price: data.servicePrice || 0,
                    });
                    total += data.servicePrice || 0;
                }
            });

            // Sort appointments by date in descending order
            appointments.sort((a, b) => {
                const dateA = new Date(a.date.split('/').reverse().join('-'));
                const dateB = new Date(b.date.split('/').reverse().join('-'));
                return dateB.getTime() - dateA.getTime();
            });

            setCompletedAppointments(appointments);
            setTotalAppointments(appointments.length);
            setTotalSpent(total);
        } catch (error) {
            console.error('Error fetching health statistics:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod]);

    useFocusEffect(
        useCallback(() => {
            fetchHealthStatistics();
        }, [fetchHealthStatistics])
    );

    // Group appointments by date for chart
    const getChartData = () => {
        const dateGroups: { [key: string]: number } = {};

        completedAppointments.forEach((appointment) => {
            if (dateGroups[appointment.date]) {
                dateGroups[appointment.date]++;
            } else {
                dateGroups[appointment.date] = 1;
            }
        });

        return Object.entries(dateGroups).map(([date, count]) => ({ date, count }));
    };

    const chartData = getChartData();
    const maxCount = Math.max(...chartData.map(d => d.count), 1);

    const renderPeriodButton = (period: 'week' | 'month' | 'all', label: string) => {
        const isSelected = selectedPeriod === period;
        return (
            <TouchableOpacity
                style={[styles.periodButton, isSelected && styles.periodButtonActive]}
                onPress={() => setSelectedPeriod(period)}
            >
                <Text style={[styles.periodButtonText, isSelected && styles.periodButtonTextActive]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Period Filter */}
            <View style={styles.periodContainer}>
                {renderPeriodButton('week', '7 ngày')}
                {renderPeriodButton('month', '30 ngày')}
                {renderPeriodButton('all', 'Tất cả')}
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryCard}>
                    <Icon name="event-available" size={32} color={COLORS.primary} />
                    <Text style={styles.summaryValue}>{totalAppointments}</Text>
                    <Text style={styles.summaryLabel}>Lần khám</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Icon name="payments" size={32} color="#10B981" />
                    <Text style={styles.summaryValue}>{totalSpent.toLocaleString('vi-VN')}</Text>
                    <Text style={styles.summaryLabel}>VNĐ chi tiêu</Text>
                </View>
            </View>

            {/* Chart */}
            {chartData.length > 0 ? (
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Biểu đồ khám bệnh</Text>
                    <View style={styles.chart}>
                        {chartData.map((item, index) => {
                            const barHeight = (item.count / maxCount) * 150;
                            return (
                                <View key={index} style={styles.barContainer}>
                                    <View style={styles.barWrapper}>
                                        <Text style={styles.barLabel}>{item.count}</Text>
                                        <View
                                            style={[
                                                styles.bar,
                                                {
                                                    height: barHeight,
                                                    backgroundColor: COLORS.primary,
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.barDate}>{item.date.split('/')[0]}/{item.date.split('/')[1]}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            ) : (
                <View style={styles.emptyChart}>
                    <Icon name="bar-chart" size={64} color={COLORS.textLight} />
                    <Text style={styles.emptyText}>Chưa có dữ liệu thống kê</Text>
                </View>
            )}

            {/* Appointment List */}
            {completedAppointments.length > 0 && (
                <View style={styles.listContainer}>
                    <Text style={styles.listTitle}>Lịch sử khám bệnh</Text>
                    {completedAppointments.map((appointment, index) => (
                        <View key={index} style={styles.appointmentItem}>
                            <View style={styles.appointmentIcon}>
                                <Icon name="local-hospital" size={24} color={COLORS.primary} />
                            </View>
                            <View style={styles.appointmentInfo}>
                                <Text style={styles.appointmentService}>{appointment.serviceName}</Text>
                                <View style={styles.appointmentDetails}>
                                    <Icon name="calendar-today" size={14} color={COLORS.textMedium} />
                                    <Text style={styles.appointmentDate}>{appointment.date}</Text>
                                </View>
                            </View>
                            <Text style={styles.appointmentPrice}>
                                {appointment.price.toLocaleString('vi-VN')} đ
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    periodContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    periodButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: COLORS.primary,
    },
    periodButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    periodButtonTextActive: {
        color: '#FFF',
    },
    summaryContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textDark,
        marginTop: 8,
    },
    summaryLabel: {
        fontSize: 13,
        color: COLORS.textMedium,
        marginTop: 4,
    },
    chartContainer: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 20,
    },
    chart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: 200,
        paddingTop: 20,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    barWrapper: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 170,
    },
    bar: {
        width: 30,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        minHeight: 10,
    },
    barLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textDark,
        marginBottom: 4,
    },
    barDate: {
        fontSize: 10,
        color: COLORS.textMedium,
        marginTop: 8,
        textAlign: 'center',
    },
    emptyChart: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    emptyText: {
        fontSize: 15,
        color: COLORS.textMedium,
        marginTop: 12,
    },
    listContainer: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 16,
    },
    appointmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    appointmentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    appointmentInfo: {
        flex: 1,
    },
    appointmentService: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textDark,
        marginBottom: 4,
    },
    appointmentDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    appointmentDate: {
        fontSize: 12,
        color: COLORS.textMedium,
    },
    appointmentPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
    },
});

export default HealthStatisticsScreen;
