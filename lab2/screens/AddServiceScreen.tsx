import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, TextInput, Alert, ScrollView, ActivityIndicator, TouchableOpacity, View, Modal } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AddServiceScreen = ({ navigation }: { navigation: any }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Thêm Dịch Vụ Mới',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20, fontWeight: 'bold' },
        });
    }, [navigation]);

    const showSuccess = () => {
        setSuccessModalVisible(true);
    };

    const showError = (message: string) => {
        setErrorMessage(message);
        setErrorModalVisible(true);
    };

    const handleAddService = async () => {
        if (!name.trim() || !price.trim() || !duration.trim()) {
            showError('Vui lòng điền đầy đủ tất cả các trường thông tin cần thiết.');
            return;
        }
        const priceValue = parseFloat(price);
        if (isNaN(priceValue) || priceValue <= 0) {
            showError('Vui lòng nhập giá dịch vụ lớn hơn 0.');
            return;
        }

        setLoading(true);
        try {
            const serviceData = {
                name: name.trim(),
                price: priceValue,
                duration: duration.trim(),
                description: description.trim(),
                createdAt: firestore.FieldValue.serverTimestamp(),
            };

            await firestore().collection('services').add(serviceData);

            showSuccess();
        } catch (error) {
            console.error('Lỗi thêm dịch vụ: ', error);
            showError('Không thể thêm dịch vụ. Vui lòng kiểm tra kết nối và thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                        <Icon name="medical-services" size={20} color={COLORS.primary} />
                        <Text style={styles.label}>Tên dịch vụ</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="VD: Khám nhi, Kiểm tra định kỳ..."
                        placeholderTextColor="#999"
                        value={name}
                        onChangeText={setName}
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                        <Icon name="payments" size={20} color={COLORS.primary} />
                        <Text style={styles.label}>Giá (VNĐ)</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="VD: 200000"
                        placeholderTextColor="#999"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                        <Icon name="schedule" size={20} color={COLORS.primary} />
                        <Text style={styles.label}>Thời gian</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="VD: 30 phút, 1 tiếng..."
                        placeholderTextColor="#999"
                        value={duration}
                        onChangeText={setDuration}
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                        <Icon name="description" size={20} color={COLORS.primary} />
                        <Text style={styles.label}>Mô tả</Text>
                    </View>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Thông tin chi tiết về dịch vụ..."
                        placeholderTextColor="#999"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        editable={!loading}
                        textAlignVertical="top"
                    />
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            ) : (
                <TouchableOpacity style={styles.submitButton} onPress={handleAddService}>
                    <Icon name="add-circle" size={22} color="#fff" />
                    <Text style={styles.submitButtonText}>Thêm dịch vụ</Text>
                </TouchableOpacity>
            )}

            {/* Success Modal */}
            <Modal
                visible={successModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setSuccessModalVisible(false);
                    navigation.goBack();
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.successModal}>
                        <View style={styles.modalIcon}>
                            <Icon name="check-circle-outline" size={64} color="#2ed573" />
                        </View>
                        <Text style={styles.modalTitle}>Thành công!</Text>
                        <Text style={styles.modalMessage}>
                            Dịch vụ đã được thêm thành công vào hệ thống.
                        </Text>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.successButton]}
                            onPress={() => {
                                setSuccessModalVisible(false);
                                navigation.goBack();
                            }}
                        >
                            <Text style={styles.successButtonText}>Hoàn thành</Text>
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
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
    loader: {
        marginTop: 20,
        alignSelf: 'center',
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        marginLeft: 8,
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
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    successButton: {
        backgroundColor: '#2ed573',
    },
    errorButton: {
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
});

export default AddServiceScreen;
