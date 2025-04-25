import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Button, ScrollView, Alert } from 'react-native';
// Import uuid để tạo ID duy nhất (cần cài đặt: npm install react-native-uuid)
import 'react-native-get-random-values'; // Cần thiết cho react-native-uuid
import { v4 as uuidv4 } from 'uuid';

const AddContactScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const handleSaveContact = () => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên liên hệ.');
            return;
        }

        const newContact = {
            id: uuidv4(), // Tạo ID duy nhất
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            // Mặc định avatar hoặc để trống, hoặc thêm logic chọn ảnh
            avatar: require('../assets/khang.png'), // Avatar mặc định
            isFavorite: false, // Mặc định không phải yêu thích
        };
        navigation.navigate('ContactsList', { newContact: newContact });
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Tên</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nhập tên liên hệ"
            />

            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Nhập địa chỉ email"
                keyboardType="email-address"
                autoCapitalize="none"
            />

            {/* Thêm input/chọn ảnh cho avatar nếu muốn */}

            <View style={styles.buttonContainer}>
                <Button title="Lưu liên hệ" onPress={handleSaveContact} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: '#333',
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 15,
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 20,
    },
});

export default AddContactScreen;
