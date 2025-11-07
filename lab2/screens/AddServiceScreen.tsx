import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, TextInput, Alert, ScrollView, ActivityIndicator, TouchableOpacity, View } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AddServiceScreen = ({ navigation }: { navigation: any }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Thêm Dịch Vụ Mới',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20, fontWeight: 'bold' },
        });
    }, [navigation]);

    const handleAddService = async () => {
        if (!name.trim() || !price.trim() || !duration.trim()) {
            Alert.alert('Error', 'Điền đầy đủ thông tin.');
            return;
        }
        const priceValue = parseFloat(price);
        if (isNaN(priceValue) || priceValue <= 0) {
            Alert.alert('Error', 'Điền đầy đủ thông tin.');
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

            Alert.alert('Success', 'Thêm dịch vụ thành công!');
            navigation.goBack();
        } catch (error) {
            console.error('Lỗi thêm dịch vụ: ', error);
            Alert.alert('Error', 'Không thể thêm dịch vụ. Hãy thử lại.');
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
});

export default AddServiceScreen;
