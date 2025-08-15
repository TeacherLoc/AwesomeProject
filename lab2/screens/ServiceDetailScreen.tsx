/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, ScrollView, ActivityIndicator } from 'react-native';
// Import Firestore modular API
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors'; // Import COLORS

const ServiceDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { serviceId } = route.params;
    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');

    const fetchServiceDetails = useCallback(async () => {
        setLoading(true);
        const firestoreInstance = getFirestore();
        const serviceDocRef = doc(firestoreInstance, 'services', serviceId);
        try {
            const docSnap = await getDoc(serviceDocRef);
            if (docSnap.exists()) {
                const serviceData = { id: docSnap.id, ...(docSnap.data() as { name?: string; price?: number; duration?: string; description?: string }) };
                setService(serviceData);
                setName(serviceData.name || '');
                setPrice(serviceData.price?.toString() || '');
                setDuration(serviceData.duration || '');
                setDescription(serviceData.description || '');
            } else {
                Alert.alert('Error', 'Không tìm thấy.');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Lỗi chi tiết: ', error);
            Alert.alert('Error', 'Không thể tải dịch vụ.');
        } finally {
            setLoading(false);
        }
    }, [serviceId, navigation]);

    useEffect(() => {
        fetchServiceDetails();
    }, [fetchServiceDetails]);

    const handleUpdate = async () => {
        if (!name.trim() || !price.trim() || !duration.trim()) {
            Alert.alert('Error', 'Hãy điền đủ thông tin.');
            return;
        }
        const priceValue = parseFloat(price);
        if (isNaN(priceValue) || priceValue <= 0) {
            Alert.alert('Error', 'Hãy điền đầy đủ các trường.');
            return;
        }

        setLoading(true);
        const firestoreInstance = getFirestore();
        const serviceDocRef = doc(firestoreInstance, 'services', serviceId);
        try {
            const updatedData = {
                name: name.trim(),
                price: priceValue,
                duration: duration.trim(),
                description: description.trim(),
            };
            await updateDoc(serviceDocRef, updatedData);
            Alert.alert('Success', 'Cập nhật dịch vụ thành công!');
            setService((prev: any) => ({ ...prev, ...updatedData }));
            setEditing(false);
        } catch (error) {
            console.error('Lỗi cập nhật dịch vụ: ', error);
            Alert.alert('Error', 'Cập nhật dịch vụ thất bại.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Xoá dịch vụ',
            `Bạn có chắc chắn muốn xoá "${service?.name}" không? Hành động này không thể hoàn tác.`,
            [
                { text: 'Huỷ', style: 'cancel' },
                {
                    text: 'Xoá',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        const firestoreInstance = getFirestore();
                        const serviceDocRef = doc(firestoreInstance, 'services', serviceId);
                        try {
                            await deleteDoc(serviceDocRef);
                            Alert.alert('Success', 'Dịch vụ đã được xoá thành công.');
                            navigation.goBack();
                        } catch (error) {
                            console.error('Lỗi xoá dịch vụ: ', error);
                            Alert.alert('Error', 'Xoá dịch vụ thất bại.');
                            setLoading(false); // Ensure loading is set to false in case of error
                        }
                        // setLoading(false) should be outside try/catch if navigation.goBack() always occurs
                   },
                }            ]
        );
    };

    if (loading && !service) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!service) {
        return <View style={styles.centered}><Text style={{color: COLORS.textMedium}}>Service data is unavailable.</Text></View>;
    }

    return (
        <ScrollView style={styles.container}>
            {editing ? (
                <>
                    <Text style={styles.label}>Tên dịch vụ:</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        editable={!loading}
                        placeholderTextColor={COLORS.textLight}
                    />

                    <Text style={styles.label}>Giá (VNĐ):</Text>
                    <TextInput
                        style={styles.input}
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                        editable={!loading}
                        placeholderTextColor={COLORS.textLight}
                    />

                    <Text style={styles.label}>Thời gian:</Text>
                    <TextInput
                        style={styles.input}
                        value={duration}
                        onChangeText={setDuration}
                        editable={!loading}
                        placeholderTextColor={COLORS.textLight}
                    />

                    <Text style={styles.label}>Miêu tả:</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        editable={!loading}
                        placeholderTextColor={COLORS.textLight}
                    />

                    <View style={styles.buttonGroup}>
                        <Button title="Đồng ý" onPress={handleUpdate} disabled={loading} color={COLORS.primary} />
                        <View style={{height: 10}} />
                        <Button title="Huỷ" color={COLORS.textLight} onPress={() => {
                            setName(service.name);
                            setPrice(service.price.toString());
                            setDuration(service.duration);
                            setDescription(service.description);
                            setEditing(false);
                        }} disabled={loading} />
                    </View>
                </>
            ) : (
                <>
                    <Text style={styles.title}>{service.name}</Text>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Giá:</Text>
                        <Text style={styles.detailValue}>{service.price?.toLocaleString('vi-VN')} VNĐ</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Thời gian:</Text>
                        <Text style={styles.detailValue}>{service.duration}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Miêu tả:</Text>
                        <Text style={styles.detailValue}>{service.description || 'Không có mô tả.'}</Text>
                    </View>

                    <View style={styles.buttonGroup}>
                        <Button title="Chỉnh sửa dịch vụ" onPress={() => setEditing(true)} color={COLORS.primary} />
                        <View style={{height: 10}} />
                        <Button title="Xoá dịch vụ" color={COLORS.error} onPress={handleDelete} disabled={loading} />
                    </View>
                </>
            )}
            {loading && <ActivityIndicator size="small" color={COLORS.primary} style={{marginTop: 10}} />}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: COLORS.white, // Nền trắng
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white, // Nền trắng
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: COLORS.textDark, // Màu chữ tiêu đề
        textAlign: 'center',
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10, // Tăng padding
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border, // Màu viền
        marginBottom: 10, // Tăng margin
    },
    detailLabel: {
        fontSize: 16,
        color: COLORS.textMedium, // Màu label
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 16,
        color: COLORS.textDark, // Màu giá trị
        flexShrink: 1,
        textAlign: 'right',
    },
    label: { // Dùng cho form chỉnh sửa
        fontSize: 16,
        marginBottom: 8, // Tăng margin
        color: COLORS.textMedium, // Màu label
        fontWeight: '500',
    },
    input: { // Dùng cho form chỉnh sửa
        borderWidth: 1,
        borderColor: COLORS.border, // Màu viền input
        borderRadius: 8, // Bo góc input
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 18, // Tăng margin
        backgroundColor: COLORS.white, // Nền input
        color: COLORS.textDark, // Màu chữ khi nhập
    },
    textArea: { // Dùng cho form chỉnh sửa
        height: 100,
        textAlignVertical: 'top',
    },
    buttonGroup: {
        marginTop: 30,
        marginBottom: 20,
    },
});

export default ServiceDetailScreen;
