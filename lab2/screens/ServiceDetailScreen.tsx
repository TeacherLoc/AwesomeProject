import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ServiceDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { serviceId } = route.params;
    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Chi tiết dịch vụ',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20, fontWeight: 'bold' },
        });
    }, [navigation]);

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
            Alert.alert('Thành công', 'Cập nhật dịch vụ thành công!');
            setService((prev: any) => ({ ...prev, ...updatedData }));
            setEditing(false);
        } catch (error) {
            console.error('Lỗi cập nhật dịch vụ: ', error);
            Alert.alert('Lỗi', 'Cập nhật dịch vụ thất bại.');
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
        return (
            <View style={styles.centered}>
                <Icon name="error-outline" size={64} color="#ccc" />
                <Text style={styles.errorText}>Lỗi dữ liệu</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {editing ? (
                <>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Icon name="medical-services" size={20} color={COLORS.primary} />
                                <Text style={styles.label}>Tên dịch vụ</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                editable={!loading}
                                placeholder="Nhập tên dịch vụ"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Icon name="payments" size={20} color={COLORS.primary} />
                                <Text style={styles.label}>Giá (VNĐ)</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="numeric"
                                editable={!loading}
                                placeholder="Nhập giá"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Icon name="schedule" size={20} color={COLORS.primary} />
                                <Text style={styles.label}>Thời gian</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={duration}
                                onChangeText={setDuration}
                                editable={!loading}
                                placeholder="Nhập thời gian"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Icon name="description" size={20} color={COLORS.primary} />
                                <Text style={styles.label}>Mô tả</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                editable={!loading}
                                placeholder="Nhập mô tả"
                                placeholderTextColor="#999"
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={handleUpdate}
                            disabled={loading}
                        >
                            <Icon name="check" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Lưu</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={() => {
                                setName(service.name);
                                setPrice(service.price.toString());
                                setDuration(service.duration);
                                setDescription(service.description);
                                setEditing(false);
                            }}
                            disabled={loading}
                        >
                            <Icon name="close" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <>
                    <View style={styles.headerCard}>
                        <View style={styles.iconContainer}>
                            <Icon name="medical-services" size={48} color={COLORS.primary} />
                        </View>
                        <Text style={styles.title}>{service.name}</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Icon name="payments" size={22} color={COLORS.primary} />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Giá</Text>
                                <Text style={styles.detailValue}>{service.price?.toLocaleString('vi-VN')} VNĐ</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Icon name="schedule" size={22} color={COLORS.primary} />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Thời gian</Text>
                                <Text style={styles.detailValue}>{service.duration}</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Icon name="description" size={22} color={COLORS.primary} />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Miêu tả</Text>
                                <Text style={styles.detailValue}>{service.description || 'Không có mô tả.'}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, styles.editButton]}
                        onPress={() => setEditing(true)}
                    >
                        <Icon name="edit" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Chỉnh sửa dịch vụ</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.deleteButton]}
                        onPress={handleDelete}
                        disabled={loading}
                    >
                        <Icon name="delete" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Xóa dịch vụ</Text>
                    </TouchableOpacity>
                </>
            )}
            {loading && <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    errorText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
    },
    headerCard: {
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingVertical: 32,
        marginBottom: 16,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#ffe0ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    detailIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 13,
        color: '#999',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    inputGroup: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 16,
        marginLeft: 8,
        color: '#333',
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fafafa',
    },
    textArea: {
        height: 120,
        paddingTop: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#4CAF50',
        marginRight: 8,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#9e9e9e',
        marginLeft: 8,
    },
    editButton: {
        backgroundColor: COLORS.primary,
    },
    deleteButton: {
        backgroundColor: '#f44336',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    loader: {
        marginTop: 10,
    },
});

export default ServiceDetailScreen;
