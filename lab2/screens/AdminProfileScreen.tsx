/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, ActivityIndicator, ScrollView } from 'react-native';
// Firebase v9 modular API imports
import { getAuth, updateProfile as updateUserProfileAuth, signOut as firebaseSignOut } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import { useAuth } from '../navigation/AuthContext';

const AdminProfileScreen = ({ navigation }: { navigation: any }) => {
    const { signOut: contextSignOut } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
                    Alert.alert('Error', 'Profile không tồn tại.');
                    contextSignOut();
                }
            } catch (error) {
                console.error('Error fetching admin profile: ', error);
                Alert.alert('Error', 'Không thể tải.');
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
            Alert.alert('Error', 'Quyền truy cập bị giới hạn.');
            contextSignOut();
            return;
        }
        if (!name.trim()) {
            Alert.alert('Error', 'Tên không thể để trống.');
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

            Alert.alert('Success', 'Cập nhật profile thành công!');
            setProfile((prev: any) => ({ ...prev, name: name.trim(), phone: phone.trim() }));
            setEditing(false);
        } catch (error) {
            console.error('Lỗi profile: ', error);
            Alert.alert('Error', 'Không thể cập nhật profile.');
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
            Alert.alert('Lỗi', 'Không thể đăng xuất.');
        }
    };

    if (loading && !profile) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!profile) {
        return <View style={styles.centered}><Text>Lỗi không tìm thấy profile.</Text></View>;
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.pageTitle}>Hồ sơ máy chủ</Text>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{profile.email}</Text>
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Chức vụ:</Text>
                <Text style={styles.value}>{profile.role}</Text>
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Tên:</Text>
                {editing ? (
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        editable={!isSaving}
                    />
                ) : (
                    <Text style={styles.value}>{profile.name}</Text>
                )}
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Phone:</Text>
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
                    <Text style={styles.value}>{profile.phone || 'Chưa có số điện thoại'}</Text>
                )}
            </View>

            {editing ? (
                <View style={styles.buttonGroup}>
                    <Button title={isSaving ? 'Đang cập nhật...' : 'Đồng ý'} onPress={handleUpdateProfile} disabled={isSaving} color={COLORS.primary}/>
                    <View style={{ height: 10 }} />
                    <Button title="Huỷ" color={COLORS.textLight} onPress={() => {
                        setName(profile.name);
                        setPhone(profile.phone || '');
                        setEditing(false);
                    }} disabled={isSaving} />
                </View>
            ) : (
                <View style={styles.buttonGroup}>
                    <Button title="Chỉnh sửa Profile" onPress={() => setEditing(true)} color={COLORS.primary} />
                </View>
            )}

            <View style={styles.buttonGroup}>
                <Button title="Đổi mật khẩu" onPress={() => navigation.navigate('AdminChangePassword')} color={COLORS.primary} />
            </View>

            {/* Thêm nút điều hướng đến Yêu cầu mật khẩu */}
            <View style={styles.buttonGroup}>
                <Button title="Yêu cầu đặt lại mật khẩu" onPress={() => navigation.navigate('AdminPasswordRequests')} color={COLORS.primary} />
            </View>

            <View style={[styles.buttonGroup, styles.logoutButtonContainer]}>
                 <Button title="Đăng xuất" color={COLORS.error} onPress={handleLogout} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: COLORS.backgroundMain,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundMain,
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 25,
        textAlign: 'center',
        color: COLORS.textDark,
    },
    fieldContainer: {
        marginBottom: 18,
    },
    label: {
        fontSize: 14,
        color: COLORS.textMedium,
        marginBottom: 6,
    },
    value: {
        fontSize: 17,
        color: COLORS.textDark,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: COLORS.white,
        color: COLORS.textDark,
    },
    buttonGroup: {
        marginTop: 20,
    },
    logoutButtonContainer: {
        marginTop: 30,
    },
});

export default AdminProfileScreen;
