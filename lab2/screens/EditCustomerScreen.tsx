import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { COLORS } from '../theme/colors';
import { getFirestore, doc, updateDoc } from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';

const EditCustomerScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { customerData } = route.params;

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Sửa thông tin KH',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20, fontWeight: 'bold' },
        });
    }, [navigation]);

    useEffect(() => {
        if (customerData) {
            setName(customerData.name || '');
            setPhone(customerData.phone || '');
            setEmail(customerData.email || '');
        }
    }, [customerData]);

    const handleSaveChanges = async () => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Tên khách hàng không được để trống.');
            return;
        }

        setLoading(true);
        try {
            const firestoreInstance = getFirestore();
            const customerDocRef = doc(firestoreInstance, 'users', customerData.id);

            await updateDoc(customerDocRef, {
                name: name.trim(),
                phone: phone.trim(),
            });

            Alert.alert('Thành công', 'Thông tin khách hàng đã được cập nhật.');
            navigation.goBack();

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
                <Icon name="error-outline" size={64} color="#ccc" />
                <Text style={styles.errorText}>Không tìm thấy dữ liệu khách hàng.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerCard}>
                <View style={styles.avatarCircle}>
                    <Icon name="person" size={48} color={COLORS.primary} />
                </View>
                <Text style={styles.subtitle}>Chỉnh sửa thông tin khách hàng</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                        <Icon name="email" size={20} color="#999" />
                        <Text style={styles.label}>Email (Không thể sửa)</Text>
                    </View>
                    <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={email}
                        editable={false}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                        <Icon name="person" size={20} color={COLORS.primary} />
                        <Text style={styles.label}>Họ và Tên</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Nhập họ và tên"
                        placeholderTextColor="#999"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                        <Icon name="phone" size={20} color={COLORS.primary} />
                        <Text style={styles.label}>Số điện thoại</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Nhập số điện thoại"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                    />
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            ) : (
                <>
                    <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveChanges}>
                        <Icon name="check-circle" size={22} color="#fff" />
                        <Text style={styles.buttonText}>Lưu thay đổi</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="cancel" size={22} color="#fff" />
                        <Text style={styles.buttonText}>Hủy</Text>
                    </TouchableOpacity>
                </>
            )}
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
    avatarCircle: {
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
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 20,
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
    disabledInput: {
        backgroundColor: '#f0f0f0',
        color: '#999',
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
        backgroundColor: COLORS.primary,
        marginTop: 8,
    },
    cancelButton: {
        backgroundColor: '#9e9e9e',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    loader: {
        marginTop: 20,
    },
});

export default EditCustomerScreen;
