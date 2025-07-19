/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import { Image } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { View, Text, StyleSheet, TextInput, Button, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { getAuth, updateProfile as updateUserProfileAuth, signOut as firebaseSignOut } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import { useAuth } from '../navigation/AuthContext';
import { TouchableOpacity } from 'react-native';

const CustomerProfileScreen = ({ navigation }: { navigation: any }) => {
    const { signOut: contextSignOut } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState(''); // Email thường không đổi và lấy từ auth
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // State cho avatar
    const [avatar, setAvatar] = useState<string | null>(null);
    // State cho ảnh CCCD và kết quả OCR
    const [cccdImage, setCccdImage] = useState<string | null>(null);
    const [ocrResult, setOcrResult] = useState<string>('');
    // Hàm chọn ảnh CCCD và nhận diện văn bản
    const handlePickCccdImage = async () => {
        setOcrResult('');
        launchImageLibrary({ mediaType: 'photo', quality: 1 }, async (response) => {
            if (response.didCancel) {return;}
            if (response.errorCode) {
                Alert.alert('Lỗi', 'Không thể chọn ảnh: ' + response.errorMessage);
                return;
            }
            const asset = response.assets && response.assets[0];
            if (asset?.uri) {
                setCccdImage(asset.uri);
                try {
                    const result = await TextRecognition.recognize(asset.uri);
                    setOcrResult(result?.text || 'Không nhận diện được văn bản');
                } catch (err) {
                    setOcrResult('Lỗi nhận diện văn bản');
                }
            }
        });
    };

    const loadUserProfile = useCallback(async () => {
        setLoading(true);
        const authInstance = getAuth();
        const currentUser = authInstance.currentUser;

        if (currentUser) {
            setEmail(currentUser.email || '');
            // Nếu user đã có avatar (photoURL), dùng nó, nếu chưa thì dùng ảnh mặc định lo.png
            setAvatar(currentUser.photoURL || require('../assets/lo.png'));
            try {
                const firestoreInstance = getFirestore();
                const userDocumentRef = doc(firestoreInstance, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocumentRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setProfile(userData);
                    setName(userData?.name || currentUser.displayName || '');
                    setPhone(userData?.phone || '');
                } else {
                    setName(currentUser.displayName || '');
                    setPhone('');
                    setProfile({ email: currentUser.email, name: currentUser.displayName });
                    Alert.alert('Thông báo', 'Không tìm thấy thông tin chi tiết hồ sơ. Một số thông tin có thể chưa đầy đủ.');
                }
            } catch (error) {
                console.error('Error fetching customer profile: ', error);
                Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ.');
            }
        } else {
            contextSignOut();
        }
        setLoading(false);
    }, [contextSignOut]);
    // Hàm chọn avatar
    // Hàm xem ảnh đại diện
    const handleViewAvatar = () => {
        if (!avatar) {
            Alert.alert('Thông báo', 'Chưa có ảnh đại diện.');
            return;
        }
        Alert.alert('Ảnh đại diện', '', [
            {
                text: 'Đóng',
                style: 'cancel',
            },
        ], {
            cancelable: true,
        });
        // Nếu muốn hiển thị modal ảnh đẹp hơn, có thể dùng Modal hoặc thư viện như react-native-image-viewer
    };

    // Hàm chọn avatar từ thư viện
    const handleChangeAvatar = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 1 }, async (response) => {
            if (response.didCancel) { return; }
            if (response.errorCode) {
                Alert.alert('Lỗi', 'Không thể chọn ảnh: ' + response.errorMessage);
                return;
            }
            const asset = response.assets && response.assets[0];
            if (asset?.uri) {
                setAvatar(asset.uri);
                // TODO: Upload to Firebase Storage và cập nhật photoURL cho user
            }
        });
    };

    // State cho modal chọn chức năng avatar
    const [avatarModalVisible, setAvatarModalVisible] = useState(false);
    // Hàm xử lý khi nhấn vào avatar
    const handleAvatarPress = () => {
        setAvatarModalVisible(true);
    };

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
            {/* Modal chọn chức năng avatar */}
            <Modal
                visible={avatarModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setAvatarModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.modalButton} onPress={() => { setAvatarModalVisible(false); handleViewAvatar(); }}>
                            <Text style={styles.modalButtonText}>Xem ảnh đại diện</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButton} onPress={() => { setAvatarModalVisible(false); handleChangeAvatar(); }}>
                            <Text style={styles.modalButtonText}>Thay đổi ảnh đại diện</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, { borderBottomWidth: 0 }]} onPress={() => setAvatarModalVisible(false)}>
                            <Text style={[styles.modalButtonText, { color: COLORS.error || 'red' }]}>Huỷ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarPress}>
                {avatar ? (
                    typeof avatar === 'string' ? (
                        <Image source={{ uri: avatar }} style={styles.avatar} />
                    ) : (
                        <Image source={avatar} style={styles.avatar} />
                    )
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarPlaceholderText}>Chọn ảnh</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* ...existing code... */}
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

            {/* TÍNH NĂNG QUÉT CCCD */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Ảnh CCCD & Nhận diện thông tin:</Text>
                <Button title="Chọn ảnh CCCD" onPress={handlePickCccdImage} color={COLORS.primary || '#007bff'} />
                {cccdImage && (
                    <Image source={{ uri: cccdImage }} style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 8 }} resizeMode="contain" />
                )}
                {ocrResult ? (
                    <View style={{ marginTop: 10, backgroundColor: COLORS.white || '#fff', padding: 10, borderRadius: 8 }}>
                        <Text style={{ color: COLORS.textDark || '#333', fontWeight: 'bold' }}>Kết quả nhận diện:</Text>
                        <Text style={{ color: COLORS.textMedium || '#555', marginTop: 5 }}>{ocrResult}</Text>
                    </View>
                ) : null}
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

import { Modal } from 'react-native';
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
    avatarContainer: {
        alignSelf: 'center',
        marginBottom: 25,
        borderWidth: 3,
        borderColor: COLORS.primary || '#007bff',
        borderRadius: 75,
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        elevation: 5,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 75,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 75,
        backgroundColor: 'gold',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        color: '#333',
        fontWeight: 'bold',
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.white || '#fff',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 24,
        minWidth: 260,
        elevation: 8,
        alignItems: 'stretch',
    },
    modalButton: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border || '#eee',
    },
    modalButtonText: {
        fontSize: 16,
        color: COLORS.primary || '#007bff',
        textAlign: 'center',
    },
});

export default CustomerProfileScreen;
