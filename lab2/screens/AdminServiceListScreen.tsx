/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
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
import Icon from 'react-native-vector-icons/FontAwesome';

// Function to get services from Firestore
const fetchAdminServices = async () => {
    const firestoreInstance = getFirestore();
    const servicesCollectionRef = collection(firestoreInstance, 'services');
    const q = query(servicesCollectionRef, orderBy('name'));
    try {
        const querySnapshot = await getDocs(q);
        const servicesList = querySnapshot.docs.map(documentSnapshot => ({
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
            title: 'Quản lý Dịch vụ',
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => navigation.navigate('AdminAddService')}
                    style={{ marginRight: 15 }}
                >
                    <Icon name="plus-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
            ),
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
        <TouchableOpacity onPress={() => handleSelectServiceForAdmin(item)} style={styles.itemContainer}>
            {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
            )}
            <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.price !== undefined && (
                    <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')}K</Text>
                )}
                {item.duration && (
                     <Text style={styles.itemDuration}>Thời gian: {item.duration}</Text>
                )}
                <Text style={styles.itemDescription} numberOfLines={2}>
                    {item.description || 'Chưa có mô tả.'}
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
                ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>Chưa có dịch vụ nào. Hãy thêm mới!</Text></View>}
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
        borderRadius: 25,
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
        alignItems: 'center',
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
        flex: 1,
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

export default AdminServiceListScreen;

