import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
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
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorTitle, setErrorTitle] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Thay đổi mật khẩu',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20, fontWeight: 'bold' },
        });
    }, [navigation]);

    const showError = useCallback((title: string, message: string) => {
        setErrorTitle(title);
        setErrorMessage(message);
        setErrorModalVisible(true);
    }, []);

    const showSuccess = () => {
        setSuccessModalVisible(true);
    };

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
            showError('Thông tin chưa đầy đủ', 'Vui lòng điền đầy đủ các trường.');
            return;
        }
        if (newPassword !== confirmPassword) {
            showError('Mật khẩu không khớp', 'Mật khẩu mới và xác nhận mật khẩu không giống nhau.');
            return;
        }
        if (newPassword.length < 6) {
            showError('Mật khẩu quá ngắn', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        setLoading(true);
        try {
            await reauthenticate(currentPassword);
            const user = auth().currentUser;
            if (user) {
                await user.updatePassword(newPassword);
                showSuccess();
            } else {
                showError('Lỗi hệ thống', 'Không tìm thấy người dùng để cập nhật mật khẩu.');
            }
        } catch (error: any) {
            // Kiểm tra tất cả các error code có thể xảy ra với invalid credential
            if (error.code === 'auth/wrong-password' ||
                error.code === 'auth/invalid-credential' ||
                error.code === 'auth/user-mismatch' ||
                error.message?.includes('credential')) {
                // Sử dụng setTimeout để đảm bảo state đã được reset
                setTimeout(() => {
                    showError('Mật khẩu không đúng', 'Mật khẩu hiện tại bạn nhập không chính xác. Vui lòng kiểm tra lại.');
                }, 200);
            } else if (error.code === 'auth/too-many-requests') {
                setTimeout(() => {
                    showError('Đã vượt giới hạn', 'Bạn đã thử quá nhiều lần. Vui lòng chờ 15 phút rồi thử lại.');
                }, 200);
            } else if (error.code === 'auth/network-request-failed') {
                setTimeout(() => {
                    showError('Lỗi kết nối', 'Không thể kết nối mạng. Vui lòng kiểm tra Internet và thử lại.');
                }, 200);
            } else {
                // Hiển thị error code để debug
                setTimeout(() => {
                    showError('Lỗi không xác định', `Lỗi: ${error.code || 'unknown'}\n${error.message || 'Vui lòng thử lại sau.'}`);
                }, 200);
            }
        } finally {
            // Luôn tắt loading ở finally
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView>
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

        {/* Error Modal - Đưa ra ngoài ScrollView */}
        <Modal
            visible={errorModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setErrorModalVisible(false)}
        >
                <View style={styles.modalOverlay}>
                    <View style={styles.errorModal}>
                        <View style={styles.modalIcon}>
                            <Icon name="error-outline" size={48} color="#ff4757" />
                        </View>
                        <Text style={styles.modalTitle}>{errorTitle}</Text>
                        <Text style={styles.modalMessage}>{errorMessage}</Text>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.errorButton]}
                            onPress={() => setErrorModalVisible(false)}
                        >
                            <Text style={styles.errorButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
                            <Icon name="check-circle-outline" size={48} color="#2ed573" />
                        </View>
                        <Text style={styles.modalTitle}>Thành công!</Text>
                        <Text style={styles.modalMessage}>Mật khẩu đã được thay đổi thành công.</Text>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.successButton]}
                            onPress={() => {
                                setSuccessModalVisible(false);
                                navigation.goBack();
                            }}
                        >
                            <Text style={styles.successButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        zIndex: 9999,
        elevation: 9999,
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
        minWidth: 100,
    },
    errorButton: {
        backgroundColor: '#ff4757',
    },
    successButton: {
        backgroundColor: '#2ed573',
    },
    errorButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    successButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

});

export default ChangePasswordScreen;
