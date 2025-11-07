// filepath: screens/Admin/CustomerListScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../theme/colors';
import { getFirestore, collection, getDocs, query, where, doc, deleteDoc } from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';

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

const CustomerListScreen = ({ navigation }: any) => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Quản Lý Khách Hàng',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20, fontWeight: 'bold' },
        });
    }, [navigation]);

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
        <View style={styles.customerCard}>
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    <Icon name="person" size={32} color={COLORS.primary} />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.customerName}>{item.name}</Text>
                    <View style={styles.appointmentBadge}>
                        <Icon name="event" size={14} color={COLORS.primary} />
                        <Text style={styles.appointmentCount}>
                            {item.totalAppointments} lịch hẹn
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Icon name="email" size={18} color="#666" />
                    <Text style={styles.infoText}>{item.email}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Icon name="phone" size={18} color="#666" />
                    <Text style={styles.infoText}>{item.phone || 'Chưa có SĐT'}</Text>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    onPress={() => handleEditCustomer(item)}
                    style={[styles.actionBtn, styles.editBtn]}
                >
                    <Icon name="edit" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDeleteCustomer(item.id)}
                    style={[styles.actionBtn, styles.deleteBtn]}
                >
                    <Icon name="delete" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Xóa</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo Tên, Email, hoặc SĐT..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>
            <FlatList
                data={filteredCustomers}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="people-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>Không tìm thấy khách hàng nào</Text>
                    </View>
                }
                contentContainerStyle={styles.listContentContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 48,
        fontSize: 15,
        color: '#333',
    },
    listContentContainer: {
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    customerCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#ffe0ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    customerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    appointmentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffe0ed',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    appointmentCount: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
        marginLeft: 4,
    },
    cardBody: {
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 10,
        flex: 1,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        marginHorizontal: 4,
    },
    editBtn: {
        backgroundColor: '#6c5ce7',
    },
    deleteBtn: {
        backgroundColor: COLORS.primary,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
    },
});

export default CustomerListScreen;
