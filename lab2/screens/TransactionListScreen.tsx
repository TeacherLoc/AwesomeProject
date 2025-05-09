// filepath: screens/Admin/TransactionListScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors'; // Import COLORS

// Mock function to get transactions (appointments)
const fetchAdminTransactions = async () => {
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate delay
    return [
        { id: 'apt1', customerName: 'John Doe', serviceName: 'Massage Therapy', dateTime: new Date(Date.now() + 86400000 * 2).toISOString(), status: 'Pending' },
        { id: 'apt2', customerName: 'Jane Smith', serviceName: 'Facial Treatment', dateTime: new Date(Date.now() + 86400000 * 5).toISOString(), status: 'Pending' },
        { id: 'apt4', customerName: 'Alice Brown', serviceName: 'Pedicure', dateTime: new Date(Date.now() + 86400000 * 1).toISOString(), status: 'Confirmed' },
        { id: 'apt3', customerName: 'Bob White', serviceName: 'Manicure', dateTime: new Date(Date.now() - 86400000 * 3).toISOString(), status: 'Completed' },
    ];
};

const TransactionListScreen = ({ navigation }: { navigation: any }) => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTransactions = async () => {
        setLoading(true);
        const data = await fetchAdminTransactions();
        // Sort by date, maybe newest first or by status
        data.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
        setTransactions(data);
        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', loadTransactions);
        loadTransactions();
        return unsubscribe;
    }, [navigation]);

    const handleAccept = (id: string) => {
         // --- Add API call to update status to 'Confirmed' ---
        console.log("Accepting transaction:", id);
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'Confirmed' } : t));
        Alert.alert("Success", "Appointment confirmed.");
         // --- End API call ---
    };

    const handleUpdate = (_item: any) => {
        // Navigate to a screen to update details (e.g., change time, assign staff)
        // navigation.navigate('AdminUpdateTransaction', { transactionData: item });
        Alert.alert("Info", "Update functionality not implemented yet.");
    };

     const handleCancel = (id: string) => {
        Alert.alert(
            "Cancel Appointment",
            "Are you sure you want to cancel this appointment?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes", onPress: () => {
                        // --- Add API call to update status to 'Cancelled' or delete ---
                        console.log("Cancelling appointment:", id);
                        setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'Cancelled' } : t));
                        // Or filter it out: setTransactions(prev => prev.filter(t => t.id !== id));
                        Alert.alert("Success", "Appointment cancelled.");
                        // --- End API call ---
                    }
                }
            ]
        );
    };


    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.item}>
            <View style={styles.itemDetails}>
                <Text style={styles.itemService}>{item.serviceName}</Text>
                <Text style={styles.itemCustomer}>Customer: {item.customerName}</Text>
                <Text style={styles.itemDate}>Date: {new Date(item.dateTime).toLocaleString()}</Text>
                <Text style={[styles.itemStatusBase, getStatusStyle(item.status)]}>Status: {item.status}</Text>
            </View>
            <View style={styles.itemActions}>
                {item.status === 'Pending' && (
                    <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={() => handleAccept(item.id)}>
                        <Text style={styles.actionButtonText}>Accept</Text>
                    </TouchableOpacity>
                )}
                 {item.status !== 'Completed' && item.status !== 'Cancelled' && (
                    <>
                        {item.status === 'Pending' && <View style={{ height: 8 }} /> }
                        <TouchableOpacity style={[styles.actionButton, styles.updateButton]} onPress={() => handleUpdate(item)}>
                            <Text style={styles.actionButtonText}>Update</Text>
                        </TouchableOpacity>
                        <View style={{ height: 8 }} />
                        <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => handleCancel(item.id)}>
                            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Confirmed': return styles.statusConfirmed;
            case 'Pending': return styles.statusPending;
            case 'Completed': return styles.statusCompleted;
            case 'Cancelled': return styles.statusCancelled;
            default: return {};
        }
    };


    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <View style={styles.container}>
             {/* Title is usually handled by Stack Navigator header, but keeping if it's a local title */}
             {/* <Text style={styles.title}>Manage Transactions</Text> */}
            <FlatList
                data={transactions}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>No transactions found.</Text>}
                contentContainerStyle={styles.listContentContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight, // Nền chung
    },
    listContentContainer: {
        paddingVertical: 5,
    },
    // title: { // If you need a local title (not from header)
    //     fontSize: 20,
    //     fontWeight: 'bold',
    //     padding: 15,
    //     backgroundColor: COLORS.white,
    //     textAlign: 'center',
    //     color: COLORS.textDark,
    //     borderBottomWidth: 1,
    //     borderBottomColor: COLORS.border,
    // },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundLight,
    },
    item: {
        backgroundColor: COLORS.white, // Nền item
        padding: 15,
        marginVertical: 6, // Khoảng cách giữa các item
        marginHorizontal: 10, // Khoảng cách ngang
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: COLORS.black, // Màu shadow
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2.5,
        elevation: 3,
    },
    itemDetails: {
        flex: 1,
        marginRight: 10,
    },
    itemService: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textDark, // Màu chữ dịch vụ
    },
    itemCustomer: {
        fontSize: 14,
        color: COLORS.textMedium, // Màu chữ khách hàng
        marginTop: 4,
    },
    itemDate: {
        fontSize: 14,
        color: COLORS.textMedium, // Màu chữ ngày
        marginTop: 4,
    },
    itemStatusBase: { // Base style for status text
        fontSize: 14,
        marginTop: 5,
        fontWeight: 'bold',
    },
    statusPending: { color: COLORS.warning }, // Màu trạng thái Pending
    statusConfirmed: { color: COLORS.success }, // Màu trạng thái Confirmed
    statusCompleted: { color: COLORS.textLight }, // Màu trạng thái Completed
    statusCancelled: { color: COLORS.error }, // Màu trạng thái Cancelled
    itemActions: {
        // width: 80, // Có thể set width cố định nếu cần
        alignItems: 'flex-end',
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        minWidth: 70,
        alignItems: 'center',
    },
    actionButtonText: {
        color: COLORS.white,
        fontWeight: '500',
        fontSize: 13,
    },
    acceptButton: {
        backgroundColor: COLORS.primary,
    },
    updateButton: {
        backgroundColor: COLORS.secondary,
    },
    cancelButton: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.error,
        borderWidth: 1,
    },
    cancelButtonText: {
        color: COLORS.error,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: COLORS.textMedium, // Màu chữ khi không có giao dịch
    }
});

export default TransactionListScreen;