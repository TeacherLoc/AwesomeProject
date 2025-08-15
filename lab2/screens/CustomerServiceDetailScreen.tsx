
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors'; // Import COLORS

const CustomerServiceDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { serviceId } = route.params; // Nhận serviceId từ navigation
    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchServiceDetails = useCallback(async () => {
        setLoading(true);
        const firestoreInstance = getFirestore();
        const serviceDocRef = doc(firestoreInstance, 'services', serviceId);
        try {
            const docSnap = await getDoc(serviceDocRef);
            if (docSnap.exists()) {
                const serviceData = { id: docSnap.id, ...(docSnap.data() as { name?: string; price?: number; duration?: string; description?: string }) };
                setService(serviceData);
            } else {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin dịch vụ.');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Lỗi khi tải chi tiết dịch vụ: ', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin chi tiết dịch vụ.');
        } finally {
            setLoading(false);
        }
    }, [serviceId, navigation]);

    useEffect(() => {
        fetchServiceDetails();
    }, [fetchServiceDetails]);

    const handleBookAppointment = () => {
        if (!service) {return;}
        navigation.navigate('CustomerBookAppointment', {
            serviceId: service.id,
            serviceName: service.name,
            servicePrice: service.price,
        });
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!service) {
        return <View style={styles.centered}><Text style={{color: COLORS.textMedium}}>Không có dữ liệu dịch vụ.</Text></View>;
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{service.name}</Text>
            <View style={styles.detailCard}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Giá dịch vụ:</Text>
                    <Text style={styles.detailValue}>{service.price ? `${service.price.toLocaleString('vi-VN')} VNĐ` : 'Liên hệ'}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Thời gian thực hiện:</Text>
                    <Text style={styles.detailValue}>{service.duration || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Mô tả chi tiết:</Text>
                    <Text style={styles.detailValueFull}>{service.description || 'Hiện chưa có mô tả cho dịch vụ này.'}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
                <Text style={styles.bookButtonText}>Đặt lịch hẹn ngay</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 20,
        paddingHorizontal: 15,
        backgroundColor: COLORS.backgroundLight || '#f4f6f8',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundLight || '#f4f6f8',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: COLORS.primary,
        textAlign: 'center',
    },
    detailCard: {
        backgroundColor: COLORS.white,
        borderRadius: 10,
        padding: 20,
        marginBottom: 25,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    detailItem: {
        marginBottom: 15,
    },
    detailLabel: {
        fontSize: 15,
        color: COLORS.textMedium,
        fontWeight: '600',
        marginBottom: 5,
    },
    detailValue: {
        fontSize: 17,
        color: COLORS.textDark,
    },
    detailValueFull: { // For description or longer text
        fontSize: 16,
        color: COLORS.textDark,
        lineHeight: 24,
    },
    bookButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primaryDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
        marginTop: 10,
    },
    bookButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
export default CustomerServiceDetailScreen;
