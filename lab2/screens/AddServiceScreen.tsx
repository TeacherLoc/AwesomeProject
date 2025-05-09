import React, { useState } from 'react';
import { Text, StyleSheet, TextInput, Alert, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors'; // Đường dẫn đúng

const AddServiceScreen = ({ navigation }: { navigation: any }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

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
            <Text style={styles.label}>Tên dịch vụ:</Text>
            <TextInput
                style={styles.input}
                placeholder="Các dịch vụ thư giãn"
                placeholderTextColor={COLORS.textLight}
                value={name}
                onChangeText={setName}
                editable={!loading}
            />

            <Text style={styles.label}>Giá (VNĐ):</Text>
            <TextInput
                style={styles.input}
                placeholder="50k, 100k, 200k..."
                placeholderTextColor={COLORS.textLight}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                editable={!loading}
            />

            <Text style={styles.label}>Thời gian:</Text>
            <TextInput
                style={styles.input}
                placeholder="60 phút, 1 tiếng"
                placeholderTextColor={COLORS.textLight}
                value={duration}
                onChangeText={setDuration}
                editable={!loading}
            />

            <Text style={styles.label}>Miêu tả:</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Thông tin chi tiết cho dịch vụ"
                placeholderTextColor={COLORS.textLight}
                value={description}
                onChangeText={setDescription}
                multiline
                editable={!loading}
            />

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            ) : (
                <TouchableOpacity style={styles.submitButton} onPress={handleAddService} disabled={loading}>
                    <Text style={styles.submitButtonText}>Thêm dịch vụ</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: COLORS.white,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: COLORS.textMedium,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 18,
        color: COLORS.textDark,
        backgroundColor: COLORS.white,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    loader: {
        marginTop: 20,
        alignSelf: 'center',
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: COLORS.textOnPrimary,
        fontSize: 16,
        fontWeight: 'bold',
    }});

export default AddServiceScreen;
