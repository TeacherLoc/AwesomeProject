// filepath: screens/Admin/CustomerListScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { COLORS } from '../theme/colors'; // Import COLORS

// Mock function to get customers
const fetchAdminCustomers = async () => {
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate delay
    return [
        { id: 'cust123', name: 'John Doe', email: 'john.doe@email.com', phone: '123-456-7890', totalAppointments: 5 },
        { id: 'cust456', name: 'Jane Smith', email: 'jane.s@email.com', phone: '987-654-3210', totalAppointments: 2 },
        { id: 'cust789', name: 'Alice Brown', email: 'alice.b@email.com', phone: '555-123-4567', totalAppointments: 8 },
        { id: 'cust101', name: 'Bob White', email: 'bob.w@email.com', phone: '111-222-3333', totalAppointments: 1 },
    ];
};

const CustomerListScreen = ({ _navigation }: { _navigation: any }) => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadCustomers = async () => {
            setLoading(true);
            const data = await fetchAdminCustomers();
            setCustomers(data);
            setFilteredCustomers(data); // Initialize filtered list
            setLoading(false);
        };
        loadCustomers();
        // Could add focus listener if needed
    }, []);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query) {
            setFilteredCustomers(customers);
        } else {
            const lowerCaseQuery = query.toLowerCase();
            const filtered = customers.filter(cust =>
                cust.name.toLowerCase().includes(lowerCaseQuery) ||
                cust.email.toLowerCase().includes(lowerCaseQuery) ||
                (cust.phone && cust.phone.includes(query)) // Direct match for phone
            );
            setFilteredCustomers(filtered);
        }
    };


    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.item}>
            <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemEmail}>{item.email}</Text>
                <Text style={styles.itemPhone}>{item.phone || 'No phone'}</Text>
                <Text style={styles.itemAppointments}>Appointments: {item.totalAppointments}</Text>
            </View>
            {/* <Button title="Details" onPress={() => handleViewDetails(item.id)} color={COLORS.primary} /> */}
        </View>
    );

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <View style={styles.container}>
             {/* Title is usually handled by Stack Navigator header, but keeping if it's a local title */}
             {/* <Text style={styles.title}>Manage Customers</Text> */}
             <TextInput
                style={styles.searchBar}
                placeholder="Search by Name, Email, or Phone..."
                placeholderTextColor={COLORS.textLight} // Màu cho placeholder
                value={searchQuery}
                onChangeText={handleSearch}
            />
            <FlatList
                data={filteredCustomers}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>No customers found.</Text>}
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
        paddingBottom: 10, // Để item cuối không bị che khuất nếu có tab bar
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
    searchBar: {
        height: 45, // Tăng chiều cao một chút
        borderColor: COLORS.border, // Viền search bar
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginHorizontal: 10,
        marginTop: 10, // Thêm margin top
        marginBottom: 5, // Giảm margin bottom
        backgroundColor: COLORS.white, // Nền search bar
        fontSize: 15,
        color: COLORS.textDark, // Màu chữ khi nhập
    },
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
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textDark, // Màu tên khách hàng
    },
    itemEmail: {
        fontSize: 14,
        color: COLORS.textMedium, // Màu email
        marginTop: 4,
    },
    itemPhone: {
        fontSize: 14,
        color: COLORS.textMedium, // Màu số điện thoại
        marginTop: 4,
    },
     itemAppointments: {
        fontSize: 13,
        color: COLORS.primary, // Màu số lượng cuộc hẹn (màu chủ đạo)
        marginTop: 6,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: COLORS.textMedium, // Màu chữ khi không có khách hàng
    }
});

export default CustomerListScreen;