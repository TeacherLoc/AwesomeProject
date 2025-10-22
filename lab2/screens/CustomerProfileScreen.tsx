/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import { Image, Modal } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { View, Text, StyleSheet, TextInput, Button, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { getAuth, updateProfile as updateUserProfileAuth, signOut as firebaseSignOut } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import { useAuth } from '../navigation/AuthContext';
import { TouchableOpacity } from 'react-native';

// --- IMPROVED: CCCD Data Parsing Function ---
const parseCccdOcrResult = (text: string) => {
    const lines = text.split('\n').map(line => line.trim());
    const data = {
        cccdNumber: '',
        fullName: '',
        dob: '',
        gender: '',
        placeOfOrigin: '',
        address: '',
        expiryDate: '',
    };

    // More robust regex patterns
    const cccdRegex = /(?:\bNo\.\s*|I\s*No\.\s*)?(\d{12})\b/;
    const dobRegex = /(\d{2}\/\d{2}\/\d{4})/;
    const expiryRegex = /(\d{2}\/\d{2}\/\d{4})/;

    let nameNextLine = false;
    let addressNextLine = false;
    let originNextLine = false;

    lines.forEach(line => {
        // --- CCCD Number ---
        let match = line.match(cccdRegex);
        if (match && !data.cccdNumber) {
            data.cccdNumber = match[1];
        }

        // --- Full Name ---
        if (nameNextLine && line.length > 5) {
            data.fullName = line;
            nameNextLine = false;
        }
        if (line.includes('Họ và tên') || line.includes('Full name')) {
            let nameOnSameLine = line.split(':').pop()?.trim() || '';
            if (nameOnSameLine) {
                data.fullName = nameOnSameLine;
            } else {
                // Name is likely on the next line
                nameNextLine = true;
            }
        }

        // --- Date of Birth ---
        match = line.match(dobRegex);
        if ((line.includes('Ngày sinh') || line.includes('Date of birth')) && match) {
            data.dob = match[0];
        }

        // --- Gender ---
        if (line.includes('Giới tính') || line.includes('Sex')) {
            if (line.toLowerCase().includes('nam')) {
                data.gender = 'Nam';
            } else if (line.toLowerCase().includes('nữ') || line.toLowerCase().includes('nu')) {
                data.gender = 'Nữ';
            }
        }

        // --- Place of Origin (Quê quán) ---
        if (line.includes('Quê quán') || line.includes('Place of origin')) {
            const parts = line.split(':');
            if (parts.length > 1) {
                data.placeOfOrigin = parts[1].trim();
                originNextLine = data.placeOfOrigin.length < 5; // Likely continues on next line
            } else {
                originNextLine = true;
            }
        } else if (originNextLine) {
            data.placeOfOrigin += (data.placeOfOrigin ? ' ' : '') + line;
            if (line.length > 5) { // Assume it's the end of the origin
                originNextLine = false;
            }
        }

        // --- Address (Nơi thường trú) ---
        if (line.includes('Nơi thường trú') || line.includes('Place of residence')) {
            const parts = line.split(':');
            if (parts.length > 1) {
                data.address = parts[1].trim();
                addressNextLine = data.address.length < 10; // Likely continues on next line
            } else {
                addressNextLine = true;
            }
        } else if (addressNextLine) {
            data.address += (data.address ? ' ' : '') + line;
            // Heuristic to stop: if the line contains another keyword or is very short
            if (line.includes(':') || line.length < 5) {
                addressNextLine = false;
            }
        }

        // --- Expiry Date ---
        match = line.match(expiryRegex);
        if ((line.includes('giá trị đến') || line.includes('Date of expiry')) && match) {
            data.expiryDate = match[0];
        }
    });

    // Fallback for name if it wasn't found with the keyword
    if (!data.fullName) {
        const nameLine = lines.find(l => l.toUpperCase() === l && l.split(' ').length >= 2 && l.length > 5 && !l.includes(':') && !l.match(/\d/));
        if (nameLine) {
            data.fullName = nameLine;
        }
    }

    // Clean up potential artifacts
    data.address = data.address.replace(/Binh Nhâm/g, 'Bình Nhâm').replace(/Thuân/g, 'Thuận An');

    return data;
};


const CustomerProfileScreen = ({ navigation }: { navigation: any }) => {
    const { signOut: contextSignOut } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- UPDATED: Add state for all profile fields ---
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [cccdNumber, setCccdNumber] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');
    const [placeOfOrigin, setPlaceOfOrigin] = useState('');
    const [expiryDate, setExpiryDate] = useState('');

    // State for avatar
    const [avatar, setAvatar] = useState<string | null>(null);
    // State for CCCD image and OCR result
    const [cccdImage, setCccdImage] = useState<string | null>(null);
    const [ocrResult, setOcrResult] = useState<string>('');

    // --- UPDATED: Smart image picker and parser ---
    const handlePickCccdImage = async () => {
        if (isSaving) {return;}
        setOcrResult('');
        launchImageLibrary({ mediaType: 'photo', quality: 1 }, async (response) => {
            if (response.didCancel) { return; }
            if (response.errorCode) {
                Alert.alert('Lỗi', 'Không thể chọn ảnh: ' + response.errorMessage);
                return;
            }
            const asset = response.assets && response.assets[0];
            if (asset?.uri) {
                setCccdImage(asset.uri);
                try {
                    const result = await TextRecognition.recognize(asset.uri);
                    const rawText = result?.text || '';
                    setOcrResult(rawText); // Show raw text for debugging

                    if (rawText) {
                        const parsedData = parseCccdOcrResult(rawText);

                        // --- Auto-fill the form ---
                        if (parsedData.fullName) {setName(parsedData.fullName);}
                        if (parsedData.cccdNumber) {setCccdNumber(parsedData.cccdNumber);}
                        if (parsedData.dob) {setDob(parsedData.dob);}
                        if (parsedData.gender) {setGender(parsedData.gender);}
                        if (parsedData.address) {setAddress(parsedData.address);}
                        if (parsedData.placeOfOrigin) {setPlaceOfOrigin(parsedData.placeOfOrigin);}
                        if (parsedData.expiryDate) {setExpiryDate(parsedData.expiryDate);}


                        Alert.alert('Hoàn tất', 'Đã phân tích và điền thông tin từ ảnh CCCD. Vui lòng kiểm tra lại.');
                        setEditing(true); // Automatically enable editing mode
                    } else {
                        Alert.alert('Thông báo', 'Không nhận diện được văn bản từ ảnh.');
                    }
                } catch (err) {
                    setOcrResult('Lỗi nhận diện văn bản');
                    Alert.alert('Lỗi', 'Quá trình nhận diện văn bản thất bại.');
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
            try {
                const firestoreInstance = getFirestore();
                const userDocumentRef = doc(firestoreInstance, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocumentRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setProfile(userData);
                    // --- UPDATED: Load all fields from Firestore ---
                    setName(userData?.name || currentUser.displayName || '');
                    setPhone(userData?.phone || '');
                    setCccdNumber(userData?.cccdNumber || '');
                    setDob(userData?.dob || '');
                    setGender(userData?.gender || '');
                    setAddress(userData?.address || '');
                    setPlaceOfOrigin(userData?.placeOfOrigin || '');
                    setExpiryDate(userData?.expiryDate || '');

                    if (userData?.avatarBase64) {
                        setAvatar('data:image/jpeg;base64,' + userData.avatarBase64);
                    } else if (currentUser.photoURL) {
                        setAvatar(currentUser.photoURL);
                    } else {
                        setAvatar(require('../assets/lo.png'));
                    }
                } else {
                    // Fallback for users without a Firestore document
                    setName(currentUser.displayName || '');
                    setProfile({ email: currentUser.email, name: currentUser.displayName });
                    setAvatar(require('../assets/lo.png'));
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

    const [viewAvatarModalVisible, setViewAvatarModalVisible] = useState(false);
    const handleViewAvatar = () => {
        if (!avatar) {
            Alert.alert('Thông báo', 'Chưa có ảnh đại diện.');
            return;
        }
        setViewAvatarModalVisible(true);
    };

    const handleChangeAvatar = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 1, includeBase64: true }, async (response) => {
            if (response.didCancel) { return; }
            if (response.errorCode) {
                Alert.alert('Lỗi', 'Không thể chọn ảnh: ' + response.errorMessage);
                return;
            }
            const asset = response.assets && response.assets[0];
            if (asset?.base64) {
                setAvatar('data:image/jpeg;base64,' + asset.base64);
                try {
                    const authInstance = getAuth();
                    const currentUser = authInstance.currentUser;
                    if (!currentUser) { return; }
                    const firestoreInstance = getFirestore();
                    const userDocumentRef = doc(firestoreInstance, 'users', currentUser.uid);
                    await updateDoc(userDocumentRef, { avatarBase64: asset.base64 });
                    Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật!');
                } catch (error) {
                    console.error('Lỗi lưu ảnh đại diện:', error);
                    Alert.alert('Lỗi', 'Không thể lưu ảnh đại diện.');
                }
            }
        });
    };

    const [avatarModalVisible, setAvatarModalVisible] = useState(false);
    const handleAvatarPress = () => {
        setAvatarModalVisible(true);
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadUserProfile();
        });
        loadUserProfile();
        return unsubscribe;
    }, [navigation, loadUserProfile]);

    // --- UPDATED: Save all fields and clear image ---
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

            const updatedFirestoreData = {
                name: name.trim(),
                phone: phone.trim(),
                cccdNumber: cccdNumber.trim(),
                dob: dob.trim(),
                gender: gender.trim(),
                address: address.trim(),
                placeOfOrigin: placeOfOrigin.trim(),
                expiryDate: expiryDate.trim(),
            };

            await updateDoc(userDocumentRef, updatedFirestoreData);

            if (currentUser.displayName !== name.trim()) {
                await updateUserProfileAuth(currentUser, {
                    displayName: name.trim(),
                });
            }

            Alert.alert('Thành công', 'Hồ sơ đã được cập nhật!');
            setProfile((prev: any) => ({ ...prev, ...updatedFirestoreData }));
            setEditing(false);
            // --- NEW: Clear image and OCR result after successful save ---
            setCccdImage(null);
            setOcrResult('');
        } catch (error) {
            console.error('Lỗi cập nhật hồ sơ: ', error);
            Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await firebaseSignOut(getAuth());
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
        return <View style={styles.centered}><Text>Không thể tải thông tin hồ sơ.</Text></View>;
    }

    return (
        <ScrollView style={styles.container}>
            {/* Modal for avatar options */}
            <Modal visible={avatarModalVisible} transparent animationType="fade" onRequestClose={() => setAvatarModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.modalButton} onPress={() => { setAvatarModalVisible(false); handleViewAvatar(); }}>
                            <Text style={styles.modalButtonText}>Xem ảnh đại diện</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButton} onPress={() => { setAvatarModalVisible(false); handleChangeAvatar(); }}>
                            <Text style={styles.modalButtonText}>Thay đổi ảnh đại diện</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, { borderBottomWidth: 0 }]} onPress={() => setAvatarModalVisible(false)}>
                            <Text style={[styles.modalButtonText, { color: 'red' }]}>Huỷ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal for viewing avatar */}
            <Modal visible={viewAvatarModalVisible} transparent animationType="fade" onRequestClose={() => setViewAvatarModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { alignItems: 'center', padding: 0 }]}>
                        <Image source={avatar ? (typeof avatar === 'string' ? { uri: avatar } : avatar) : require('../assets/lo.png')} style={{ width: 250, height: 250, borderRadius: 16, marginBottom: 18 }} resizeMode="contain" />
                        <TouchableOpacity style={[styles.modalButton, { borderBottomWidth: 0, width: '100%' }]} onPress={() => setViewAvatarModalVisible(false)}>
                            <Text style={[styles.modalButtonText, { color: 'red' }]}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.profileBox}>
                <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarPress}>
                    <Image source={avatar ? (typeof avatar === 'string' ? { uri: avatar } : avatar) : require('../assets/lo.png')} style={styles.avatar} />
                </TouchableOpacity>

                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{email}</Text>
                </View>

                {/* --- UPDATED: All fields are now editable --- */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Họ và Tên:</Text>
                    {editing ? <TextInput style={styles.input} value={name} onChangeText={setName} editable={!isSaving} /> : <Text style={styles.value}>{name || 'Chưa cập nhật'}</Text>}
                </View>

                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Số điện thoại:</Text>
                    {editing ? <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!isSaving} /> : <Text style={styles.value}>{phone || 'Chưa cập nhật'}</Text>}
                </View>

                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Số CCCD:</Text>
                    {editing ? <TextInput style={styles.input} value={cccdNumber} onChangeText={setCccdNumber} keyboardType="number-pad" editable={!isSaving} /> : <Text style={styles.value}>{cccdNumber || 'Chưa cập nhật'}</Text>}
                </View>

                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Ngày sinh (DD/MM/YYYY):</Text>
                    {editing ? <TextInput style={styles.input} value={dob} onChangeText={setDob} editable={!isSaving} /> : <Text style={styles.value}>{dob || 'Chưa cập nhật'}</Text>}
                </View>

                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Giới tính:</Text>
                    {editing ? <TextInput style={styles.input} value={gender} onChangeText={setGender} editable={!isSaving} /> : <Text style={styles.value}>{gender || 'Chưa cập nhật'}</Text>}
                </View>

                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Quê quán:</Text>
                    {editing ? <TextInput style={styles.input} value={placeOfOrigin} onChangeText={setPlaceOfOrigin} multiline editable={!isSaving} /> : <Text style={styles.value}>{placeOfOrigin || 'Chưa cập nhật'}</Text>}
                </View>

                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Địa chỉ thường trú:</Text>
                    {editing ? <TextInput style={styles.input} value={address} onChangeText={setAddress} multiline editable={!isSaving} /> : <Text style={styles.value}>{address || 'Chưa cập nhật'}</Text>}
                </View>

                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Ngày hết hạn (DD/MM/YYYY):</Text>
                    {editing ? <TextInput style={styles.input} value={expiryDate} onChangeText={setExpiryDate} editable={!isSaving} /> : <Text style={styles.value}>{expiryDate || 'Chưa cập nhật'}</Text>}
                </View>

                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Quét thông tin từ ảnh CCCD:</Text>
                    <Button title="Chọn & Quét ảnh CCCD" onPress={handlePickCccdImage} color={COLORS.primary} disabled={isSaving} />
                    {cccdImage && (
                        <View>
                            <Image source={{ uri: cccdImage }} style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 8 }} resizeMode="contain" />
                            {ocrResult ? (
                                <View style={{ marginTop: 10, backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8 }}>
                                    <Text style={{ fontWeight: 'bold' }}>Văn bản gốc từ ảnh:</Text>
                                    <Text style={{ color: '#555', marginTop: 5, fontStyle: 'italic' }}>{ocrResult}</Text>
                                </View>
                            ) : null}
                        </View>
                    )}
                </View>

                {editing ? (
                    <View style={styles.buttonGroup}>
                        <Button title={isSaving ? 'Đang lưu...' : 'Lưu thay đổi'} onPress={handleUpdateProfile} disabled={isSaving} color={COLORS.primary} />
                        <View style={{ height: 10 }} />
                        <Button title="Huỷ" color={'gray'} onPress={() => {
                            loadUserProfile(); // Reload original data
                            setEditing(false);
                            setCccdImage(null); // Also clear image on cancel
                            setOcrResult('');
                        }} disabled={isSaving} />
                    </View>
                ) : (
                    <View style={styles.buttonGroup}>
                        <Button title="Chỉnh sửa hồ sơ" onPress={() => setEditing(true)} color={COLORS.primary} />
                    </View>
                )}
            </View>

            <View style={styles.buttonGroup}>
                <Button title="Đổi mật khẩu" onPress={() => navigation.navigate('CustomerChangePassword')} color={COLORS.primary} />
            </View>

            <View style={[styles.buttonGroup, styles.logoutButtonContainer]}>
                <Button title="Đăng xuất" color={'red'} onPress={handleLogout} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    profileBox: {
        backgroundColor: COLORS.white,
        borderRadius: 18,
        padding: 20,
        marginVertical: 18,
        marginHorizontal: 2,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
    },
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
    avatarContainer: {
        alignSelf: 'center',
        marginBottom: 25,
        borderWidth: 3,
        borderColor: COLORS.primary,
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
        paddingVertical: 10,
        paddingHorizontal: 5,
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
        marginBottom: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.white,
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
        borderBottomColor: COLORS.border,
    },
    modalButtonText: {
        fontSize: 16,
        color: COLORS.primary,
        textAlign: 'center',
    },
});

export default CustomerProfileScreen;
