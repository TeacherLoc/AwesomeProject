import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { getAuth, updateProfile as updateUserProfileAuth, signOut as firebaseSignOut } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import { useAuth } from '../navigation/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AdminProfileScreen = ({ navigation }: { navigation: any }) => {
    const { signOut: contextSignOut } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Custom Modal States
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    
    // Custom Modal Functions
    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setSuccessModalVisible(true);
    };
    
    const showError = (message: string) => {
        setErrorMessage(message);
        setErrorModalVisible(true);
    };

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Hồ Sơ Admin',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20 },
        });
    }, [navigation]);

    const loadUserProfile = useCallback(async () => {
        setLoading(true);
        const authInstance = getAuth();
        const currentUser = authInstance.currentUser;

        if (currentUser) {
            try {
                const firestoreInstance = getFirestore();
                const userDocumentRef = doc(firestoreInstance, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocumentRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setProfile(userData);
                    setName(userData?.name || '');
                    setPhone(userData?.phone || '');
                } else {
                    showError('Profile không tồn tại.');
                    setTimeout(() => contextSignOut(), 2000);
                }
            } catch (error) {
                console.error('Error fetching admin profile: ', error);
                showError('Không thể tải thông tin profile. Vui lòng thử lại.');
                // Cân nhắc contextSignOut() ở đây nếu lỗi nghiêm trọng
            }
        } else {
            // currentUser is null. This can happen during logout or if the session is otherwise invalid.
            // We still call contextSignOut() to ensure the app state is consistent.
            // AppNavigator will handle redirecting to login.
            // The Alert.alert previously here caused the issue during logout.
            contextSignOut();
        }
        setLoading(false);
    }, [contextSignOut]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadUserProfile();
        });
        loadUserProfile(); // Load lần đầu
        return unsubscribe;
    }, [navigation, loadUserProfile]);

    const handleUpdateProfile = async () => {
        const authInstance = getAuth();
        const currentUser = authInstance.currentUser;

        if (!currentUser) {
            showError('Quyền truy cập bị giới hạn.');
            setTimeout(() => contextSignOut(), 2000);
            return;
        }
        if (!name.trim()) {
            showError('Tên không thể để trống.');
            return;
        }

        setIsSaving(true);
        try {
            const firestoreInstance = getFirestore();
            const userDocumentRef = doc(firestoreInstance, 'users', currentUser.uid);
            await updateDoc(userDocumentRef, {
                name: name.trim(),
                phone: phone.trim(),
            });

            if (currentUser.displayName !== name.trim()) {
                await updateUserProfileAuth(currentUser, { // Sử dụng hàm updateProfile từ Firebase Auth
                    displayName: name.trim(),
                });
            }

            showSuccess('Cập nhật profile thành công!');
            setProfile((prev: any) => ({ ...prev, name: name.trim(), phone: phone.trim() }));
            setEditing(false);
        } catch (error) {
            console.error('Lỗi profile: ', error);
            showError('Không thể cập nhật profile. Vui lòng thử lại.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            const authInstance = getAuth();
            await firebaseSignOut(authInstance); // Sử dụng hàm signOut từ Firebase Auth
            contextSignOut();
        } catch (error) {
            console.error('Error signing out: ', error);
            showError('Không thể đăng xuất. Vui lòng thử lại.');
        }
    };

    if (loading && !profile) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!profile) {
        return <View style={styles.centered}><Text>Lỗi không tìm thấy profile.</Text></View>;
    }

    return (
        <>
        <ScrollView style={styles.container}>
            <View style={styles.avatarSection}>
                <View style={styles.avatarCircle}>
                    <Icon name="admin-panel-settings" size={60} color={COLORS.primary} />
                </View>
                <Text style={styles.roleText}>Quản trị viên</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.infoRow}>
                    <Icon name="email" size={22} color="#666" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{profile.email}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Icon name="badge" size={22} color="#666" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Chức vụ</Text>
                        <Text style={styles.infoValue}>{profile.role}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Icon name="person" size={22} color="#666" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Tên</Text>
                        {editing ? (
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                editable={!isSaving}
                                placeholder="Nhập tên"
                            />
                        ) : (
                            <Text style={styles.infoValue}>{profile.name}</Text>
                        )}
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Icon name="phone" size={22} color="#666" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Số điện thoại</Text>
                        {editing ? (
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                placeholder="Nhập số điện thoại"
                                editable={!isSaving}
                            />
                        ) : (
                            <Text style={styles.infoValue}>{profile.phone || 'Chưa có số điện thoại'}</Text>
                        )}
                    </View>
                </View>
            </View>

            {editing ? (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.button, styles.saveButton]}
                        onPress={handleUpdateProfile}
                        disabled={isSaving}
                    >
                        <Icon name="check" size={20} color="#fff" />
                        <Text style={styles.buttonText}>
                            {isSaving ? 'Đang lưu...' : 'Lưu'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={() => {
                            setName(profile.name);
                            setPhone(profile.phone || '');
                            setEditing(false);
                        }}
                        disabled={isSaving}
                    >
                        <Icon name="close" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Hủy</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={[styles.button, styles.editButton]}
                    onPress={() => setEditing(true)}
                >
                    <Icon name="edit" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Chỉnh sửa Profile</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={[styles.button, styles.passwordButton]}
                onPress={() => navigation.navigate('AdminChangePassword')}
            >
                <Icon name="lock" size={20} color="#fff" />
                <Text style={styles.buttonText}>Đổi mật khẩu</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.requestButton]}
                onPress={() => navigation.navigate('AdminPasswordRequests')}
            >
                <Icon name="security" size={20} color="#fff" />
                <Text style={styles.buttonText}>Yêu cầu đặt lại mật khẩu</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={handleLogout}
            >
                <Icon name="logout" size={20} color="#fff" />
                <Text style={styles.buttonText}>Đăng xuất</Text>
            </TouchableOpacity>
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
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    avatarCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#ffe0ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    roleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
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
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoContent: {
        flex: 1,
        marginLeft: 12,
    },
    infoLabel: {
        fontSize: 13,
        color: '#999',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: '#fafafa',
        color: '#333',
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
        backgroundColor: '#6c5ce7',
    },
    passwordButton: {
        backgroundColor: '#3498db',
    },
    requestButton: {
        backgroundColor: '#f39c12',
    },
    logoutButton: {
        backgroundColor: COLORS.primary,
        marginTop: 8,
        marginBottom: 32,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successModal: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: '90%',
        maxWidth: 400,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    errorModal: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: '90%',
        maxWidth: 400,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    modalIcon: {
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
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

export default AdminProfileScreen;
