import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Button, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
// Import Firestore modular API
import { getFirestore, collection, getDocs, query, orderBy } from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import { COLORS } from '../theme/colors'; // Import COLORS

const ServiceListScreen = ({ navigation }: { navigation: any }) => {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadServices = useCallback(async () => {
        setLoading(true);
        try {
            const firestoreInstance = getFirestore(); // Get Firestore instance
            const servicesCollectionRef = collection(firestoreInstance, 'services'); // Reference to the collection
            const q = query(servicesCollectionRef, orderBy('createdAt', 'desc')); // Create a query
            const servicesSnapshot = await getDocs(q); // Execute the query
            const servicesData = servicesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setServices(servicesData);
        } catch (error) {
            console.error('Lỗi dịch vụ: ', error);
            Alert.alert('Error', 'Dịch vụ không tồn tại.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadServices();
        });
        return unsubscribe;
    }, [navigation, loadServices]);

    const navigateToDetails = (serviceId: string) => {
        navigation.navigate('AdminServiceDetail', { serviceId });
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.itemContainer} onPress={() => navigateToDetails(item.id)}>
            <View style={styles.itemColorAccent} />
            <View style={styles.itemDetails}>
                <Text style={styles.itemText}>{item.name}</Text>
                <Text style={styles.itemSubText}>${item.price} - {item.duration}</Text>
            </View>
            <Icon name="chevron-right" size={16} color={COLORS.textLight} style={styles.itemChevron} />
        </TouchableOpacity>
    );

    if (loading && services.length === 0) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={services}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No services found. Add one!</Text></View>}
                refreshing={loading}
                onRefresh={loadServices}
                contentContainerStyle={styles.listContentContainer}
            />
            <View style={styles.addButtonContainer}>
                <Button
                    title="Thêm dịch vụ mới"
                    onPress={() => navigation.navigate('AdminAddService')}
                    color={COLORS.primary}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    listContentContainer: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexGrow: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.backgroundLight,
    },
    itemContainer: {
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingRight: 15,
        marginVertical: 7,
        borderRadius: 8,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 2.5,
        elevation: 3,
        overflow: 'hidden',
    },
    itemColorAccent: {
        width: 5,
        height: '100%',
        backgroundColor: COLORS.primary,
    },
    itemDetails: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    itemText: {
        fontSize: 17,
        fontWeight: '500',
        color: COLORS.textDark,
    },
    itemSubText: {
        fontSize: 14,
        color: COLORS.textMedium,
        marginTop: 4,
    },
    itemChevron: {
        marginLeft: 10,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: COLORS.textMedium,
    },
    addButtonContainer: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    }});

export default ServiceListScreen;
