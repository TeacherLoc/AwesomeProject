import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import auth, { firebase } from '@react-native-firebase/auth';
import { COLORS } from '../theme/colors';

const ChangePasswordScreen = ({ navigation }: { navigation: any }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const reauthenticate = (currentPass: string) => {
        const user = auth().currentUser;
        if (user && user.email) {
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPass);
            return user.reauthenticateWithCredential(credential);
        }
        return Promise.reject(new Error('User not found or email is null.'));
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không khớp.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        setLoading(true);
        try {
            await reauthenticate(currentPassword);
            const user = auth().currentUser;
            if (user) {
                await user.updatePassword(newPassword);
                Alert.alert('Thành công', 'Mật khẩu đã được thay đổi thành công.');
                navigation.goBack();
            } else {
                Alert.alert('Lỗi', 'Không tìm thấy người dùng để cập nhật mật khẩu.');
            }
        } catch (error: any) {
            console.error('Password change error: ', error);
            if (error.code === 'auth/wrong-password') {
                Alert.alert('Lỗi', 'Mật khẩu hiện tại không đúng.');
            } else if (error.code === 'auth/too-many-requests') {
                Alert.alert('Lỗi', 'Quá nhiều yêu cầu. Vui lòng thử lại sau.');
            } else if (error.code === 'auth/network-request-failed') {
                Alert.alert('Lỗi', 'Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
            } else {
                Alert.alert('Lỗi', `Không thể thay đổi mật khẩu: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Đổi mật khẩu</Text>
            <TextInput
                style={styles.input}
                placeholder="Mật khẩu hiện tại"
                placeholderTextColor={COLORS.textLight}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
            />
            <TextInput
                style={styles.input}
                placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                placeholderTextColor={COLORS.textLight}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
            />
            <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={COLORS.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            ) : (
                <View style={styles.buttonContainer}>
                    <Button title="Cập nhật mật khẩu" onPress={handleChangePassword} color={COLORS.primary} />
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: COLORS.backgroundLight,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: COLORS.textDark,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 15,
        paddingVertical: 12,
        width: '100%',
        height: 50,
        fontSize: 16,
        backgroundColor: COLORS.white,
        color: COLORS.textDark,
    },
    buttonContainer: {
        marginTop: 20,
        borderRadius: 8,
        overflow: 'hidden',
    },
    loader: {
        marginTop: 20,
    }});

export default ChangePasswordScreen;
