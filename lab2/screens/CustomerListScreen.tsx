// filepath: screens/Admin/CustomerListScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity, Modal } from 'react-native';
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
    
    // Modal states
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Quản Lý Khách Hàng',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20 },
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

    const handleDeleteCustomer = (customer: any) => {
        setSelectedCustomer(customer);
        setShowDeleteConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!selectedCustomer) {
            return;
        }
        
        setShowDeleteConfirmModal(false);
        
        try {
            const firestoreInstance = getFirestore();
            await deleteDoc(doc(firestoreInstance, 'users', selectedCustomer.id));
            
            // Refresh the list
            setCustomers(prevCustomers => prevCustomers.filter(cust => cust.id !== selectedCustomer.id));
            setFilteredCustomers(prevFiltered => prevFiltered.filter(cust => cust.id !== selectedCustomer.id));
            
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error deleting customer: ', error);
            setErrorMessage('Không thể xoá khách hàng. Vui lòng thử lại.');
            setShowErrorModal(true);
        }
    };

    const handleEditCustomer = (customer: any) => {
        setSelectedCustomer(customer);
        setShowWarningModal(true);
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
                    onPress={() => handleDeleteCustomer(item)}
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

            {/* Delete Confirmation Modal */}
            <Modal
                visible={showDeleteConfirmModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeleteConfirmModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconContainer}>
                            <Icon name="warning" size={80} color="#FF9800" />
                        </View>
                        <Text style={styles.modalTitle}>Xác nhận xoá</Text>
                        <Text style={styles.modalMessage}>
                            Bạn có chắc chắn muốn xoá khách hàng{' '}
                            <Text style={styles.boldText}>{selectedCustomer?.name}</Text> không?
                        </Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancelButton]}
                                onPress={() => setShowDeleteConfirmModal(false)}
                            >
                                <Text style={styles.modalCancelButtonText}>Huỷ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalDeleteButton]}
                                onPress={confirmDelete}
                            >
                                <Text style={styles.modalButtonText}>Xoá</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconContainer}>
                            <Icon name="check-circle" size={80} color="#4CAF50" />
                        </View>
                        <Text style={styles.modalTitle}>Thành công!</Text>
                        <Text style={styles.modalMessage}>Đã xoá khách hàng thành công.</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setShowSuccessModal(false)}
                        >
                            <Text style={styles.modalButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Error Modal */}
            <Modal
                visible={showErrorModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowErrorModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconContainer}>
                            <Icon name="error-outline" size={80} color="#EF4444" />
                        </View>
                        <Text style={styles.modalTitle}>Lỗi</Text>
                        <Text style={styles.modalMessage}>{errorMessage}</Text>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.errorButton]}
                            onPress={() => setShowErrorModal(false)}
                        >
                            <Text style={styles.modalButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Warning Modal for Edit */}
            <Modal
                visible={showWarningModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowWarningModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconContainer}>
                            <Icon name="info" size={80} color={COLORS.primary} />
                        </View>
                        <Text style={styles.modalTitle}>Chức năng sửa</Text>
                        <Text style={styles.modalMessage}>
                            Đây là thông tin bảo mật của:{' '}
                            <Text style={styles.boldText}>{selectedCustomer?.name}</Text>.{'\n'}
                            Hãy cẩn thận khi sửa đổi!
                        </Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                setShowWarningModal(false);
                                navigation.navigate('EditCustomerScreen', { customerData: selectedCustomer });
                            }}
                        >
                            <Text style={styles.modalButtonText}>Đồng ý</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        width: '85%',
        maxWidth: 400,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalIconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    boldText: {
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    modalButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 12,
        minWidth: 150,
        alignItems: 'center',
        elevation: 2,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalCancelButton: {
        backgroundColor: '#9E9E9E',
        flex: 1,
    },
    modalDeleteButton: {
        backgroundColor: '#EF4444',
        flex: 1,
    },
    modalCancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorButton: {
        backgroundColor: '#EF4444',
    },
});

export default CustomerListScreen;
