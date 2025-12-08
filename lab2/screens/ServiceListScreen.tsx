import React, { useState, useEffect, useCallback } from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../theme/colors';
import { getFirestore, collection, getDocs, query, orderBy } from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Function to get services from Firestore
const fetchServicesForCustomer = async () => {
    const firestoreInstance = getFirestore();
    const servicesCollectionRef = collection(firestoreInstance, 'services');
    // Bạn có thể thêm orderBy nếu muốn sắp xếp, ví dụ theo tên hoặc giá
    const q = query(servicesCollectionRef, orderBy('name')); // Sắp xếp theo tên dịch vụ
    try {
        const querySnapshot = await getDocs(q);
        const servicesList = querySnapshot.docs.map((documentSnapshot: { id: any; data: () => { name?: string; price?: number; duration?: string; description?: string; imageUrl?: string; }; }) => ({
            id: documentSnapshot.id,
            ...(documentSnapshot.data() as { name?: string; price?: number; duration?: string; description?: string; imageUrl?: string }),
        }));
        return servicesList;
    } catch (error) {
        console.error('Error fetching services: ', error);
        Alert.alert('Lỗi', 'Không thể tải danh sách dịch vụ.');
        return []; // Return empty array on error
    }
};

const CustomerServiceListScreen = ({ navigation }: { navigation: any }) => {
    // Căn giữa tiêu đề ở header
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Dịch vụ',
            headerTitleAlign: 'center',
            headerTitleStyle: {
                fontWeight: '600',
                fontSize: 18,
            },
        });
    }, [navigation]);
    const [services, setServices] = useState<any[]>([]);
    const [filteredServices, setFilteredServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const loadServices = useCallback(async () => {
        setLoading(true);
        const data = await fetchServicesForCustomer();
        setServices(data);
        setFilteredServices(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadServices();
        });
        loadServices(); // Load initial data
        return unsubscribe;
    }, [navigation, loadServices]);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (!text.trim()) {
            setFilteredServices(services);
        } else {
            const lowerCaseQuery = text.toLowerCase();
            const filtered = services.filter(service =>
                service.name.toLowerCase().includes(lowerCaseQuery) ||
                (service.description && service.description.toLowerCase().includes(lowerCaseQuery))
            );
            setFilteredServices(filtered);
        }
    };

    const handleSelectService = (service: any) => {
        // Navigate to CustomerServiceDetailScreen, passing serviceId
        navigation.navigate('CustomerServiceDetail', { serviceId: service.id });
    };

    const renderServiceItem = ({ item }: { item: any }) => (
        <TouchableOpacity onPress={() => handleSelectService(item)} style={styles.itemContainer}>
            {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
            ) : (
                <View style={[styles.itemImage, styles.placeholderImage]}>
                    <Icon name="medical-services" size={32} color={COLORS.primary} />
                </View>
            )}
            <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.price && (
                    <View style={styles.priceRow}>
                        <Icon name="payments" size={16} color={COLORS.primary} />
                        <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')} VNĐ</Text>
                    </View>
                )}
                {item.duration && (
                    <View style={styles.durationRow}>
                        <Icon name="schedule" size={16} color={COLORS.textMedium} />
                        <Text style={styles.itemDuration}>{item.duration}</Text>
                    </View>
                )}
                <Text style={styles.itemDescription} numberOfLines={2}>
                    {item.description || 'Xem chi tiết để biết thêm...'}
                </Text>
            </View>
            <Icon name="chevron-right" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <LinearGradient
                colors={['#a8edea', '#fed6e3', '#ffecd2']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.centered}
            >
                <ActivityIndicator size="large" color={COLORS.primary} />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#a8edea', '#fed6e3', '#ffecd2']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.container}
        >
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color={COLORS.textMedium} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchBar}
                    placeholder="Tìm kiếm dịch vụ..."
                    placeholderTextColor={COLORS.textLight}
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>
            <FlatList
                data={filteredServices}
                renderItem={renderServiceItem}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Icon name="search-off" size={60} color={COLORS.textLight} />
                        <Text style={styles.emptyText}>Không tìm thấy dịch vụ nào</Text>
                    </View>
                }
                contentContainerStyle={styles.listContentContainer}
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchBar: {
        flex: 1,
        height: 48,
        fontSize: 15,
        color: COLORS.textDark,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        marginTop: 60,
    },
    itemContainer: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 16,
        backgroundColor: '#F8F9FA',
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F4F8',
    },
    itemContent: {
        flex: 1,
    },
    itemName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        lineHeight: 22,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    itemPrice: {
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
    itemDuration: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 6,
    },
    itemDescription: {
        fontSize: 14,
        color: '#9CA3AF',
        lineHeight: 20,
        marginTop: 4,
    },
    emptyText: {
        marginTop: 16,
        textAlign: 'center',
        fontSize: 16,
        color: COLORS.textMedium,
    },
});

export default CustomerServiceListScreen;

