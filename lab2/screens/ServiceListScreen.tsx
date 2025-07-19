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
import { COLORS } from '../theme/colors';
import { getFirestore, collection, getDocs, query, orderBy } from '@react-native-firebase/firestore'; // Import Firestore functions

// Function to get services from Firestore
const fetchServicesForCustomer = async () => {
    const firestoreInstance = getFirestore();
    const servicesCollectionRef = collection(firestoreInstance, 'services');
    // Bạn có thể thêm orderBy nếu muốn sắp xếp, ví dụ theo tên hoặc giá
    const q = query(servicesCollectionRef, orderBy('name')); // Sắp xếp theo tên dịch vụ
    try {
        const querySnapshot = await getDocs(q);
        const servicesList = querySnapshot.docs.map(documentSnapshot => ({
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
            {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
            )}
            <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.price && (
                    <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')}K</Text>
                )}
                {item.duration && (
                     <Text style={styles.itemDuration}>Thời gian: {item.duration}</Text>
                )}
                <Text style={styles.itemDescription} numberOfLines={2}>
                    {item.description || 'Xem chi tiết để biết thêm...'}
                </Text>
            </View>
            <View style={styles.chevronContainer}>
                 <Text style={styles.chevron}>›</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchBar}
                placeholder="Tìm kiếm dịch vụ..."
                placeholderTextColor={COLORS.textLight}
                value={searchQuery}
                onChangeText={handleSearch}
            />
            <FlatList
                data={filteredServices}
                renderItem={renderServiceItem}
                keyExtractor={item => item.id}
                ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>Không có dịch vụ nào.</Text></View>}
                contentContainerStyle={styles.listContentContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight || '#f4f6f8',
    },
    listContentContainer: {
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    searchBar: {
        height: 45,
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: 25, // Bo tròn hơn
        paddingHorizontal: 20,
        margin: 10,
        backgroundColor: COLORS.white,
        fontSize: 15,
        color: COLORS.textDark,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    itemContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 15,
        marginVertical: 8,
        flexDirection: 'row',
        alignItems: 'center', // Căn giữa các item theo chiều dọc
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 3,
    },
    itemImage: {
        width: 70,
        height: 70,
        borderRadius: 10,
        marginRight: 15,
    },
    itemContent: {
        flex: 1, // Cho phép nội dung text co giãn
    },
    itemName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 15,
        color: COLORS.primary,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemDuration: {
        fontSize: 13,
        color: COLORS.textMedium,
        marginBottom: 4,
    },
    itemDescription: {
        fontSize: 13,
        color: COLORS.textLight,
        lineHeight: 18,
    },
    chevronContainer: {
        paddingLeft: 10,
        justifyContent: 'center',
    },
    chevron: {
        fontSize: 24,
        color: COLORS.textLight,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: COLORS.textMedium,
    }});

export default CustomerServiceListScreen;

