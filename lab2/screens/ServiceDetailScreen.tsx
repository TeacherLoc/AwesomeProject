import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Modal } from 'react-native';
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
    
    // Modal states
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Chi tiết dịch vụ',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20, fontWeight: 'bold' },
        });
    }, [navigation]);

    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setSuccessModalVisible(true);
    };

    const showError = (message: string) => {
        setErrorMessage(message);
        setErrorModalVisible(true);
    };

    const showDeleteConfirm = () => {
        setDeleteModalVisible(true);
    };

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
                showError('Không tìm thấy dịch vụ này trong hệ thống.');
                setTimeout(() => navigation.goBack(), 2000);
            }
        } catch (error) {
            console.error('Lỗi chi tiết: ', error);
            showError('Không thể tải thông tin dịch vụ. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [serviceId, navigation]);

    useEffect(() => {
        fetchServiceDetails();
    }, [fetchServiceDetails]);

    const handleUpdate = async () => {
        if (!name.trim() || !price.trim() || !duration.trim()) {
            showError('Vui lòng điền đầy đủ tất cả các trường thông tin.');
            return;
        }
        const priceValue = parseFloat(price);
        if (isNaN(priceValue) || priceValue <= 0) {
            showError('Vui lòng nhập giá dịch vụ lớn hơn 0.');
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
            showSuccess('Dịch vụ đã được cập nhật thành công!');
            setService((prev: any) => ({ ...prev, ...updatedData }));
            setEditing(false);
        } catch (error) {
            console.error('Lỗi cập nhật: ', error);
            showError('Không thể cập nhật dịch vụ. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        showDeleteConfirm();
    };

    const confirmDelete = async () => {
        setDeleteModalVisible(false);
        setLoading(true);
        const firestoreInstance = getFirestore();
        const serviceDocRef = doc(firestoreInstance, 'services', serviceId);
        try {
            await deleteDoc(serviceDocRef);
            showSuccess('Dịch vụ đã được xóa thành công.');
            setTimeout(() => navigation.goBack(), 2000);
        } catch (error) {
            console.error('Lỗi xoá dịch vụ: ', error);
            showError('Không thể xóa dịch vụ. Vui lòng thử lại.');
            setLoading(false);
        }
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
        <>
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

        {/* Success Modal */}
        <Modal
            visible={successModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setSuccessModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.successModal}>
                    <View style={styles.modalIcon}>
                        <Icon name="check-circle-outline" size={64} color="#2ed573" />
                    </View>
                    <Text style={styles.modalTitle}>Thành công!</Text>
                    <Text style={styles.modalMessage}>{successMessage}</Text>
                    <TouchableOpacity
                        style={[styles.modalButton, styles.successButton]}
                        onPress={() => setSuccessModalVisible(false)}
                    >
                        <Text style={styles.successButtonText}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* Error Modal */}
        <Modal
            visible={errorModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setErrorModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.errorModal}>
                    <View style={styles.modalIcon}>
                        <Icon name="error-outline" size={64} color="#ff4757" />
                    </View>
                    <Text style={styles.modalTitle}>Có lỗi xảy ra</Text>
                    <Text style={styles.modalMessage}>{errorMessage}</Text>
                    <TouchableOpacity
                        style={[styles.modalButton, styles.errorButton]}
                        onPress={() => setErrorModalVisible(false)}
                    >
                        <Text style={styles.errorButtonText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
            visible={deleteModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setDeleteModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.deleteModal}>
                    <View style={styles.modalIcon}>
                        <Icon name="delete-outline" size={64} color="#ff4757" />
                    </View>
                    <Text style={styles.modalTitle}>Xóa dịch vụ</Text>
                    <Text style={styles.modalMessage}>
                        Bạn có chắc chắn muốn xóa "{service?.name}"?{'\n'}
                        Hành động này không thể hoàn tác.
                    </Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalCancelButton]}
                            onPress={() => setDeleteModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalDeleteButton]}
                            onPress={confirmDelete}
                        >
                            <Text style={styles.deleteButtonText}>Xóa</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
        </>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successModal: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 320,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    errorModal: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 320,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    deleteModal: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 320,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalIcon: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    successButton: {
        backgroundColor: '#2ed573',
    },
    errorButton: {
        backgroundColor: '#ff4757',
    },
    modalCancelButton: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    modalDeleteButton: {
        backgroundColor: '#ff4757',
    },
    successButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    errorButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ServiceDetailScreen;
