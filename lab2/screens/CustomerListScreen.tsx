// filepath: screens/Admin/CustomerListScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../theme/colors'; // Import COLORS
import { getFirestore, collection, getDocs, query, where, doc, deleteDoc } from '@react-native-firebase/firestore'; // Added doc, deleteDoc, updateDoc

// Function to get customers from Firestore
const fetchAdminCustomers = async () => {
    const firestoreInstance = getFirestore();
    const usersCollectionRef = collection(firestoreInstance, 'users');
    const appointmentsCollectionRef = collection(firestoreInstance, 'appointments');

    try {
        // 1. Get all customers
        const usersQuery = query(usersCollectionRef, where('role', '==', 'customer'));
        const usersSnapshot = await getDocs(usersQuery);
        const customersList = usersSnapshot.docs.map((userDoc: { id: any; data: () => any; }) => ({
            id: userDoc.id,
            ...userDoc.data(),
        }));

        // 2. Get all approved/completed appointments
        const appointmentsQuery = query(appointmentsCollectionRef, where('status', '==', 'confirmed'));
        const appointmentsSnapshot = await getDocs(appointmentsQuery);

        // 3. Create a count map
        const appointmentCounts: { [key: string]: number } = {};
        appointmentsSnapshot.forEach((appointmentDoc: { data: () => { (): any; new(): any; customerId: any; }; }) => {
            const customerId = appointmentDoc.data().customerId;
            appointmentCounts[customerId] = (appointmentCounts[customerId] || 0) + 1;
        });

        // 4. Combine customer data with appointment counts
        const customersWithCounts = customersList.map((customer: { id: string | number; }) => ({
            ...customer,
            totalAppointments: appointmentCounts[customer.id] || 0,
        }));

        return customersWithCounts;
    } catch (error) {
        console.error('Error fetching customers and counts: ', error);
        return []; // Return empty array on error
    }
};

const CustomerListScreen = ({ navigation }: { navigation: any }) => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const loadCustomers = async () => {
        setLoading(true);
        const data = await fetchAdminCustomers();
        setCustomers(data);
        setFilteredCustomers(data);
        setLoading(false);
    };

    useEffect(() => {
        // Load customers when the screen mounts
        loadCustomers();

        // Optional: Reload customers when the screen comes into focus
        const unsubscribe = navigation.addListener('focus', () => {
            loadCustomers();
        });

        return unsubscribe; // Cleanup listener on unmount
    }, [navigation]);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (!text.trim()) {
            setFilteredCustomers(customers);
        } else {
            const lowerCaseQuery = text.toLowerCase();
            const filtered = customers.filter(cust =>
                cust.name.toLowerCase().includes(lowerCaseQuery) ||
                cust.email.toLowerCase().includes(lowerCaseQuery) ||
                (cust.phone && cust.phone.includes(text))
            );
            setFilteredCustomers(filtered);
        }
    };

    const handleDeleteCustomer = async (customerId: string) => {
        Alert.alert(
            'Xác nhận xoá',
            'Bạn có chắc chắn muốn xoá khách hàng này không?',
            [
                { text: 'Huỷ', style: 'cancel' },
                {
                    text: 'Xoá',
                    onPress: async () => {
                        try {
                            const firestoreInstance = getFirestore();
                            await deleteDoc(doc(firestoreInstance, 'users', customerId));
                            Alert.alert('Thành công', 'Đã xoá khách hàng.');
                            // Refresh the list
                            setCustomers(prevCustomers => prevCustomers.filter(cust => cust.id !== customerId));
                            setFilteredCustomers(prevFiltered => prevFiltered.filter(cust => cust.id !== customerId));
                        } catch (error) {
                            console.error('Error deleting customer: ', error);
                            Alert.alert('Lỗi', 'Không thể xoá khách hàng. Vui lòng thử lại.');
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const handleEditCustomer = (customer: any) => {
        navigation.navigate('EditCustomerScreen', { customerData: customer });
        console.log('Edit customer: ', customer);
        Alert.alert('Chức năng sửa', `Đây là thông tin bảo mật của: ${customer.name}. Hãy cẩn thận khi sửa đổi!`);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.item}>
            <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemEmail}>{item.email}</Text>
                <Text style={styles.itemPhone}>{item.phone || 'Chưa có SĐT'}</Text>
                <Text style={[styles.itemAppointments, item.totalAppointments > 0 ? styles.hasAppointments : {}]}>
                    Lịch hẹn đã có: {item.totalAppointments}
                </Text>
            </View>
            <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => handleEditCustomer(item)} style={[styles.actionButton, styles.editButton]}>
                    <Text style={styles.actionButtonText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteCustomer(item.id)} style={[styles.actionButton, styles.deleteButton]}>
                    <Text style={styles.actionButtonText}>Xoá</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchBar}
                placeholder="Tìm theo Tên, Email, hoặc SĐT..."
                placeholderTextColor={COLORS.textLight}
                value={searchQuery}
                onChangeText={handleSearch}
            />
            <FlatList
                data={filteredCustomers}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy khách hàng nào.</Text>}
                contentContainerStyle={styles.listContentContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    listContentContainer: {
        paddingBottom: 10,
    },
    searchBar: {
        height: 45,
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginHorizontal: 10,
        marginTop: 10,
        marginBottom: 5,
        backgroundColor: COLORS.white,
        fontSize: 15,
        color: COLORS.textDark,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundLight,
    },
    item: {
        backgroundColor: COLORS.white,
        padding: 15,
        marginVertical: 6,
        marginHorizontal: 10,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2.5,
        elevation: 3,
    },
    itemDetails: {
        flex: 1,
        marginRight: 10,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textDark,
    },
    itemEmail: {
        fontSize: 14,
        color: COLORS.textMedium,
        marginTop: 4,
    },
    itemPhone: {
        fontSize: 14,
        color: COLORS.textMedium,
        marginTop: 4,
    },
    itemAppointments: {
        fontSize: 13,
        color: COLORS.primary,
        marginTop: 6,
        fontWeight: 'bold',
    },
    hasAppointments: {
        color: 'green', // Or any other color to indicate presence of appointments
    },
    actionsContainer: {
        flexDirection: 'column',
    },
    actionButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginLeft: 5,
        marginVertical: 3,
        minWidth: 60,
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: COLORS.secondary,
    },
    deleteButton: {
        backgroundColor: COLORS.primary,
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: COLORS.textMedium,
    }});

export default CustomerListScreen;
