import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { COLORS } from '../theme/colors';
import { getFirestore, doc, updateDoc } from '@react-native-firebase/firestore';

const EditCustomerScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { customerData } = route.params;

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState(''); // Email thường không cho sửa trực tiếp qua profile này
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customerData) {
            setName(customerData.name || '');
            setPhone(customerData.phone || '');
            setEmail(customerData.email || ''); // Hiển thị email
        }
    }, [customerData]);

    const handleSaveChanges = async () => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Tên khách hàng không được để trống.');
            return;
        }
        // Thêm các validation khác nếu cần (ví dụ: định dạng SĐT)

        setLoading(true);
        try {
            const firestoreInstance = getFirestore();
            const customerDocRef = doc(firestoreInstance, 'users', customerData.id);

            await updateDoc(customerDocRef, {
                name: name.trim(),
                phone: phone.trim(),
                // Không cập nhật email ở đây trừ khi có yêu cầu cụ thể
                // và xử lý cẩn thận vì email liên quan đến authentication
            });

            Alert.alert('Thành công', 'Thông tin khách hàng đã được cập nhật.');
            navigation.goBack(); // Quay lại màn hình danh sách

        } catch (error) {
            console.error('Error updating customer: ', error);
            Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    if (!customerData) {
        return (
            <View style={styles.centered}>
                <Text>Không tìm thấy dữ liệu khách hàng.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.title}>Chỉnh sửa thông tin khách hàng</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email (Không thể sửa)</Text>
                <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={email}
                    editable={false} // Email không cho sửa
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Họ và Tên</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Nhập họ và tên"
                    placeholderTextColor={COLORS.textLight}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Số điện thoại</Text>
                <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="phone-pad"
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            ) : (
                <TouchableOpacity style={styles.button} onPress={handleSaveChanges}>
                    <Text style={styles.buttonText}>Lưu thay đổi</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => navigation.goBack()}
                disabled={loading}
            >
                <Text style={styles.buttonText}>Huỷ</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    contentContainer: {
        padding: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundLight,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 25,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: COLORS.textMedium,
        marginBottom: 6,
    },
    input: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.textDark,
        height: 50,
    },
    disabledInput: {
        backgroundColor: COLORS.backgroundLight,
        color: COLORS.textMedium,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        height: 50,
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.primary, // Hoặc một màu khác cho nút huỷ
        marginTop: 10,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    loader: {
        marginTop: 20,
    }});

export default EditCustomerScreen;
