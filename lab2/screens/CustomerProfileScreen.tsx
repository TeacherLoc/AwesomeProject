/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { getAuth, updateProfile as updateUserProfileAuth, signOut as firebaseSignOut } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors'; // Giả sử bạn có file này
import { useAuth } from '../navigation/AuthContext'; // Giả sử bạn có AuthContext

const CustomerProfileScreen = ({ navigation }: { navigation: any }) => {
    const { signOut: contextSignOut } = useAuth(); // Sử dụng signOut từ context nếu có
    const [profile, setProfile] = useState<any>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState(''); // Email thường không đổi và lấy từ auth
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const loadUserProfile = useCallback(async () => {
        setLoading(true);
        const authInstance = getAuth();
        const currentUser = authInstance.currentUser;

        if (currentUser) {
            setEmail(currentUser.email || ''); // Lấy email từ Firebase Auth
            try {
                const firestoreInstance = getFirestore();
                // Khách hàng sẽ có document trong collection 'users' với UID của họ
                const userDocumentRef = doc(firestoreInstance, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocumentRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setProfile(userData);
                    setName(userData?.name || currentUser.displayName || ''); // Ưu tiên name từ Firestore, fallback về displayName từ Auth
                    setPhone(userData?.phone || '');
                } else {
                    // Trường hợp này ít xảy ra nếu user đã đăng ký và có record trong 'users'
                    // Nếu không có, có thể lấy displayName từ Auth làm tên mặc định
                    setName(currentUser.displayName || '');
                    setPhone('');
                    setProfile({ email: currentUser.email, name: currentUser.displayName }); // Tạo profile cơ bản
                    Alert.alert('Thông báo', 'Không tìm thấy thông tin chi tiết hồ sơ. Một số thông tin có thể chưa đầy đủ.');
                }
            } catch (error) {
                console.error('Error fetching customer profile: ', error);
                Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ.');
            }
        } else {
            // Không có người dùng hiện tại, có thể đã đăng xuất
            contextSignOut(); // Đảm bảo trạng thái context được cập nhật
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
            Alert.alert('Lỗi', 'Phiên đăng nhập không hợp lệ.');
            contextSignOut();
            return;
        }
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Tên không được để trống.');
            return;
        }

        setIsSaving(true);
        try {
            const firestoreInstance = getFirestore();
            const userDocumentRef = doc(firestoreInstance, 'users', currentUser.uid);

            // Dữ liệu cập nhật cho Firestore
            const updatedFirestoreData: { name: string; phone?: string } = {
                name: name.trim(),
            };
            if (phone.trim()) {
                updatedFirestoreData.phone = phone.trim();
            } else {
                updatedFirestoreData.phone = ''; // Hoặc xóa trường phone nếu muốn
            }

            await updateDoc(userDocumentRef, updatedFirestoreData);

            // Cập nhật displayName trong Firebase Auth nếu nó thay đổi
            if (currentUser.displayName !== name.trim()) {
                await updateUserProfileAuth(currentUser, {
                    displayName: name.trim(),
                });
            }

            Alert.alert('Thành công', 'Hồ sơ đã được cập nhật!');
            setProfile((prev: any) => ({ ...prev, ...updatedFirestoreData }));
            setName(updatedFirestoreData.name); // Cập nhật state name
            setPhone(updatedFirestoreData.phone || ''); // Cập nhật state phone
            setEditing(false);
        } catch (error) {
            console.error('Lỗi cập nhật hồ sơ: ', error);
            Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            const authInstance = getAuth();
            await firebaseSignOut(authInstance);
            contextSignOut(); // Gọi signOut từ context để cập nhật trạng thái toàn cục
            // AppNavigator sẽ tự động xử lý chuyển hướng
        } catch (error) {
            console.error('Error signing out: ', error);
            Alert.alert('Lỗi', 'Không thể đăng xuất.');
        }
    };

    if (loading && !profile) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary || '#007bff'} /></View>;
    }

    if (!profile) {
        // Có thể hiển thị thông báo lỗi hoặc nút thử lại
        return <View style={styles.centered}><Text>Không thể tải thông tin hồ sơ.</Text></View>;
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.pageTitle}>Hồ Sơ Của Tôi</Text>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{email}</Text>
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Tên:</Text>
                {editing ? (
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        editable={!isSaving}
                        placeholder="Nhập tên của bạn"
                    />
                ) : (
                    <Text style={styles.value}>{name || 'Chưa cập nhật'}</Text>
                )}
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Số điện thoại:</Text>
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
                    <Text style={styles.value}>{phone || 'Chưa cập nhật'}</Text>
                )}
            </View>

            {editing ? (
                <View style={styles.buttonGroup}>
                    <Button title={isSaving ? 'Đang lưu...' : 'Lưu thay đổi'} onPress={handleUpdateProfile} disabled={isSaving} color={COLORS.primary || '#007bff'}/>
                    <View style={{ height: 10 }} />
                    <Button title="Huỷ" color={COLORS.textLight || 'gray'} onPress={() => {
                        setName(profile.name || '');
                        setPhone(profile.phone || '');
                        setEditing(false);
                    }} disabled={isSaving} />
                </View>
            ) : (
                <View style={styles.buttonGroup}>
                    <Button title="Chỉnh sửa hồ sơ" onPress={() => setEditing(true)} color={COLORS.primary || '#007bff'} />
                </View>
            )}

            <View style={styles.buttonGroup}>
                <Button title="Đổi mật khẩu" onPress={() => navigation.navigate('CustomerChangePassword')} color={COLORS.primary || '#007bff'} />
            </View>

            <View style={[styles.buttonGroup, styles.logoutButtonContainer]}>
                 <Button title="Đăng xuất" color={COLORS.error || 'red'} onPress={handleLogout} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: COLORS.backgroundMain || '#f8f9fa', // Sử dụng màu từ theme nếu có
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundMain || '#f8f9fa',
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 25,
        textAlign: 'center',
        color: COLORS.textDark || '#333',
    },
    fieldContainer: {
        marginBottom: 18,
    },
    label: {
        fontSize: 14,
        color: COLORS.textMedium || '#555',
        marginBottom: 6,
    },
    value: { // Style cho Text hiển thị giá trị
        fontSize: 17,
        color: COLORS.textDark || '#333',
        paddingVertical: 10, // Tăng padding để dễ nhìn hơn
        paddingHorizontal: 5, // Thêm padding ngang
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border || '#eee',
    },
    input: { // Style cho TextInput khi chỉnh sửa
        borderWidth: 1,
        borderColor: COLORS.border || '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: COLORS.white || '#fff',
        color: COLORS.textDark || '#333',
    },
    buttonGroup: {
        marginTop: 20,
    },
    logoutButtonContainer: { // Đổi tên cho rõ ràng hơn
        marginTop: 30,
        marginBottom: 20, // Thêm margin dưới cho đẹp
    }});

export default CustomerProfileScreen;
