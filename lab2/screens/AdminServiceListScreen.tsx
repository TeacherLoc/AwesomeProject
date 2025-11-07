import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TextInput,
    TouchableOpacity,
    Alert,
    Image} from 'react-native';
import { COLORS } from '../theme/colors';
import { getFirestore, collection, getDocs, query, orderBy } from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Function to get services from Firestore
const fetchAdminServices = async () => {
    const firestoreInstance = getFirestore();
    const servicesCollectionRef = collection(firestoreInstance, 'services');
    const q = query(servicesCollectionRef, orderBy('name'));
    try {
        const querySnapshot = await getDocs(q);
        const servicesList = querySnapshot.docs.map((documentSnapshot: any) => ({
            id: documentSnapshot.id,
            ...(documentSnapshot.data() as { name?: string; price?: number; duration?: string; description?: string; imageUrl?: string }),
        }));
        return servicesList;
    } catch (error) {
        console.error('Error fetching admin services: ', error);
        Alert.alert('Lỗi', 'Không thể tải danh sách dịch vụ cho admin.');
        return [];
    }
};

const AdminServiceListScreen = ({ navigation }: { navigation: any }) => {
    const [services, setServices] = useState<any[]>([]);
    const [filteredServices, setFilteredServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Dịch vụ phòng khám',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20, fontWeight: 'bold' },
        });
    }, [navigation]);

    const loadAdminServices = useCallback(async () => {
        setLoading(true);
        const data = await fetchAdminServices();
        setServices(data);
        setFilteredServices(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadAdminServices();
        });
        loadAdminServices();
        return unsubscribe;
    }, [navigation, loadAdminServices]);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (!text.trim()) {
            setFilteredServices(services);
        } else {
            const lowerCaseQuery = text.toLowerCase();
            const filtered = services.filter(service =>
                service.name?.toLowerCase().includes(lowerCaseQuery) ||
                (service.description && service.description.toLowerCase().includes(lowerCaseQuery))
            );
            setFilteredServices(filtered);
        }
    };

    const handleSelectServiceForAdmin = (service: any) => {
        navigation.navigate('AdminServiceDetail', { serviceId: service.id, serviceData: service });
    };

    const renderServiceItem = ({ item }: { item: any }) => (
        <TouchableOpacity onPress={() => handleSelectServiceForAdmin(item)} style={styles.serviceCard}>
            <View style={styles.cardContent}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.serviceImage} resizeMode="cover" />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Icon name="medical-services" size={32} color={COLORS.primary} />
                    </View>
                )}

                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{item.name}</Text>

                    <View style={styles.priceRow}>
                        <Icon name="payments" size={16} color={COLORS.primary} />
                        <Text style={styles.servicePrice}>
                            {item.price !== undefined ? `${item.price.toLocaleString('vi-VN')} VNĐ` : 'Chưa có giá'}
                        </Text>
                    </View>

                    {item.duration && (
                        <View style={styles.durationRow}>
                            <Icon name="schedule" size={16} color="#666" />
                            <Text style={styles.serviceDuration}>{item.duration}</Text>
                        </View>
                    )}

                    <Text style={styles.serviceDescription} numberOfLines={2}>
                        {item.description || 'Chưa có mô tả dịch vụ phòng khám.'}
                    </Text>
                </View>
            </View>

            <Icon name="chevron-right" size={24} color="#ccc" style={styles.chevronIcon} />
        </TouchableOpacity>
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
                    placeholder="Tìm kiếm dịch vụ phòng khám..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>
            <FlatList
                data={filteredServices}
                renderItem={renderServiceItem}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="medical-services" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>Chưa có dịch vụ phòng khám nào</Text>
                        <Text style={styles.emptySubtext}>Nhấn nút + để thêm mới</Text>
                    </View>
                }
                contentContainerStyle={styles.listContentContainer}
            />
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AdminAddService')}
            >
                <Icon name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    addButton: {
        marginRight: 15,
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
        padding: 20,
    },
    serviceCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
    },
    serviceImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 12,
    },
    placeholderImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#ffe0ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    serviceInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    serviceName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    servicePrice: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
        marginLeft: 6,
    },
    durationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    serviceDuration: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
    },
    serviceDescription: {
        fontSize: 13,
        color: '#999',
        lineHeight: 18,
    },
    chevronIcon: {
        marginLeft: 8,
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
        fontWeight: '500',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#bbb',
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
});

export default AdminServiceListScreen;

