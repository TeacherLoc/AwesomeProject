import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import auth, { firebase } from '@react-native-firebase/auth';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ChangePasswordScreen = ({ navigation }: { navigation: any }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Thay đổi mật khẩu',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20, fontWeight: 'bold' },
        });
    }, [navigation]);

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
        <ScrollView style={styles.container}>
            <View style={styles.headerCard}>
                <View style={styles.iconContainer}>
                    <Icon name="lock-reset" size={48} color={COLORS.primary} />
                </View>
                <Text style={styles.subtitle}>Đổi mật khẩu</Text>
                <Text style={styles.description}>Vui lòng nhập mật khẩu hiện tại và mật khẩu mới</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                        <Icon name="lock-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.label}>Mật khẩu hiện tại</Text>
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập mật khẩu hiện tại"
                            placeholderTextColor="#999"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry={!showCurrentPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                            <Icon
                                name={showCurrentPassword ? 'visibility' : 'visibility-off'}
                                size={24}
                                color="#999"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                        <Icon name="lock" size={20} color={COLORS.primary} />
                        <Text style={styles.label}>Mật khẩu mới (ít nhất 6 ký tự)</Text>
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập mật khẩu mới"
                            placeholderTextColor="#999"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNewPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowNewPassword(!showNewPassword)}
                        >
                            <Icon
                                name={showNewPassword ? 'visibility' : 'visibility-off'}
                                size={24}
                                color="#999"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                        <Icon name="lock-clock" size={20} color={COLORS.primary} />
                        <Text style={styles.label}>Nhập lại mật khẩu mới</Text>
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Xác nhận mật khẩu mới"
                            placeholderTextColor="#999"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <Icon
                                name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                                size={24}
                                color="#999"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            ) : (
                <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
                    <Icon name="check-circle" size={22} color="#fff" />
                    <Text style={styles.buttonText}>Cập nhật mật khẩu</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
    subtitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 32,
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingRight: 50,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fafafa',
    },
    eyeIcon: {
        position: 'absolute',
        right: 12,
        padding: 8,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 32,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    loader: {
        marginTop: 20,
        marginBottom: 32,
    },
});

export default ChangePasswordScreen;
