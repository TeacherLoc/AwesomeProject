/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import { Image, Modal } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { getAuth, updateProfile as updateUserProfileAuth, signOut as firebaseSignOut } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import { useAuth } from '../navigation/AuthContext';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
    // Căn giữa tiêu đề ở header
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Hồ sơ của tôi',
            headerTitleAlign: 'center',
            headerTitleStyle: {
                fontSize: 20,
            },
        });
    }, [navigation]);

    const { signOut: contextSignOut } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showAvatarSuccessModal, setShowAvatarSuccessModal] = useState(false);
    const [showAvatarErrorModal, setShowAvatarErrorModal] = useState(false);
    const [avatarErrorMessage, setAvatarErrorMessage] = useState('');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
                setAvatarErrorMessage('Không thể chọn ảnh: ' + (response.errorMessage || 'Lỗi không xác định'));
                setShowAvatarErrorModal(true);
                return;
            }
            const asset = response.assets && response.assets[0];
            if (asset?.base64) {
                setIsUploadingAvatar(true);
                try {
                    const authInstance = getAuth();
                    const currentUser = authInstance.currentUser;
                    if (!currentUser) {
                        setIsUploadingAvatar(false);
                        setAvatarErrorMessage('Không tìm thấy thông tin người dùng');
                        setShowAvatarErrorModal(true);
                        return;
                    }

                    // Update avatar preview immediately
                    setAvatar('data:image/jpeg;base64,' + asset.base64);

                    // Save to Firestore
                    const firestoreInstance = getFirestore();
                    const userDocumentRef = doc(firestoreInstance, 'users', currentUser.uid);
                    await updateDoc(userDocumentRef, { avatarBase64: asset.base64 });

                    setIsUploadingAvatar(false);
                    setShowAvatarSuccessModal(true);
                } catch (error) {
                    console.error('Lỗi lưu ảnh đại diện:', error);
                    setIsUploadingAvatar(false);
                    setAvatarErrorMessage('Không thể lưu ảnh đại diện. Vui lòng thử lại.');
                    setShowAvatarErrorModal(true);
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

            setProfile((prev: any) => ({ ...prev, ...updatedFirestoreData }));
            setEditing(false);
            setShowSuccessModal(true);
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

            {/* Success Modal - Profile Updated */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.successModalOverlay}>
                    <View style={styles.successModalContainer}>
                        <View style={styles.successIconContainer}>
                            <Icon name="check-circle" size={80} color="#27ae60" />
                        </View>
                        <Text style={styles.successModalTitle}>Thành công</Text>
                        <Text style={styles.successModalMessage}>
                            Hồ sơ đã được cập nhật!
                        </Text>
                        <TouchableOpacity
                            style={styles.successModalButton}
                            onPress={() => setShowSuccessModal(false)}
                        >
                            <Icon name="check" size={18} color={COLORS.white} />
                            <Text style={styles.successModalButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Avatar Success Modal */}
            <Modal
                visible={showAvatarSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAvatarSuccessModal(false)}
            >
                <View style={styles.successModalOverlay}>
                    <View style={styles.successModalContainer}>
                        <View style={styles.successIconContainer}>
                            <Icon name="check-circle" size={80} color="#27ae60" />
                        </View>
                        <Text style={styles.successModalTitle}>Cập nhật thành công!</Text>
                        <Text style={styles.successModalMessage}>
                            Ảnh đại diện của bạn đã được cập nhật.
                        </Text>
                        <TouchableOpacity
                            style={styles.successModalButton}
                            onPress={() => setShowAvatarSuccessModal(false)}
                        >
                            <Icon name="check" size={18} color={COLORS.white} />
                            <Text style={styles.successModalButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Avatar Error Modal */}
            <Modal
                visible={showAvatarErrorModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAvatarErrorModal(false)}
            >
                <View style={styles.successModalOverlay}>
                    <View style={styles.successModalContainer}>
                        <View style={[styles.successIconContainer, { backgroundColor: '#ffe6e6' }]}>
                            <Icon name="error-outline" size={80} color="#e74c3c" />
                        </View>
                        <Text style={[styles.successModalTitle, { color: '#e74c3c' }]}>Có lỗi xảy ra</Text>
                        <Text style={styles.successModalMessage}>
                            {avatarErrorMessage}
                        </Text>
                        <TouchableOpacity
                            style={[styles.successModalButton, { backgroundColor: '#e74c3c' }]}
                            onPress={() => setShowAvatarErrorModal(false)}
                        >
                            <Icon name="close" size={18} color={COLORS.white} />
                            <Text style={styles.successModalButtonText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Avatar Uploading Modal */}
            <Modal
                visible={isUploadingAvatar}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.successModalOverlay}>
                    <View style={styles.successModalContainer}>
                        <ActivityIndicator size={80} color={COLORS.primary} />
                        <Text style={[styles.successModalTitle, { marginTop: 20 }]}>Đang tải lên...</Text>
                        <Text style={styles.successModalMessage}>
                            Vui lòng đợi trong giây lát
                        </Text>
                    </View>
                </View>
            </Modal>

            <View style={styles.profileBox}>
                <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarPress}>
                    <Image source={avatar ? (typeof avatar === 'string' ? { uri: avatar } : avatar) : require('../assets/lo.png')} style={styles.avatar} />
                    <View style={styles.avatarEditBadge}>
                        <Icon name="camera-alt" size={18} color="#FFF" />
                    </View>
                </TouchableOpacity>

                {/* Email Field */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Icon name="email" size={20} color={COLORS.primary} style={styles.infoIcon} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{email}</Text>
                        </View>
                    </View>
                </View>

                {/* Name Field */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Icon name="person" size={20} color={COLORS.primary} style={styles.infoIcon} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Họ và Tên</Text>
                            {editing ? (
                                <TextInput
                                    style={styles.infoInput}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Nhập họ và tên"
                                    editable={!isSaving}
                                />
                            ) : (
                                <Text style={styles.infoValue}>{name || 'Chưa cập nhật'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Phone Field */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Icon name="phone" size={20} color={COLORS.primary} style={styles.infoIcon} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Số điện thoại</Text>
                            {editing ? (
                                <TextInput
                                    style={styles.infoInput}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Nhập số điện thoại"
                                    keyboardType="phone-pad"
                                    editable={!isSaving}
                                />
                            ) : (
                                <Text style={styles.infoValue}>{phone || 'Chưa cập nhật'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* CCCD Number Field */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Icon name="badge" size={20} color={COLORS.primary} style={styles.infoIcon} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Số CCCD</Text>
                            {editing ? (
                                <TextInput
                                    style={styles.infoInput}
                                    value={cccdNumber}
                                    onChangeText={setCccdNumber}
                                    placeholder="Nhập số CCCD"
                                    keyboardType="number-pad"
                                    editable={!isSaving}
                                />
                            ) : (
                                <Text style={styles.infoValue}>{cccdNumber || 'Chưa cập nhật'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Date of Birth Field */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Icon name="cake" size={20} color={COLORS.primary} style={styles.infoIcon} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Ngày sinh</Text>
                            {editing ? (
                                <TextInput
                                    style={styles.infoInput}
                                    value={dob}
                                    onChangeText={setDob}
                                    placeholder="DD/MM/YYYY"
                                    editable={!isSaving}
                                />
                            ) : (
                                <Text style={styles.infoValue}>{dob || 'Chưa cập nhật'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Gender Field */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Icon name="wc" size={20} color={COLORS.primary} style={styles.infoIcon} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Giới tính</Text>
                            {editing ? (
                                <TextInput
                                    style={styles.infoInput}
                                    value={gender}
                                    onChangeText={setGender}
                                    placeholder="Nam/Nữ"
                                    editable={!isSaving}
                                />
                            ) : (
                                <Text style={styles.infoValue}>{gender || 'Chưa cập nhật'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Place of Origin Field */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Icon name="home" size={20} color={COLORS.primary} style={styles.infoIcon} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Quê quán</Text>
                            {editing ? (
                                <TextInput
                                    style={[styles.infoInput, styles.multilineInput]}
                                    value={placeOfOrigin}
                                    onChangeText={setPlaceOfOrigin}
                                    placeholder="Nhập quê quán"
                                    multiline
                                    editable={!isSaving}
                                />
                            ) : (
                                <Text style={styles.infoValue}>{placeOfOrigin || 'Chưa cập nhật'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Address Field */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Icon name="location-on" size={20} color={COLORS.primary} style={styles.infoIcon} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Địa chỉ thường trú</Text>
                            {editing ? (
                                <TextInput
                                    style={[styles.infoInput, styles.multilineInput]}
                                    value={address}
                                    onChangeText={setAddress}
                                    placeholder="Nhập địa chỉ"
                                    multiline
                                    editable={!isSaving}
                                />
                            ) : (
                                <Text style={styles.infoValue}>{address || 'Chưa cập nhật'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Expiry Date Field */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Icon name="event" size={20} color={COLORS.primary} style={styles.infoIcon} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Ngày hết hạn CCCD</Text>
                            {editing ? (
                                <TextInput
                                    style={styles.infoInput}
                                    value={expiryDate}
                                    onChangeText={setExpiryDate}
                                    placeholder="DD/MM/YYYY"
                                    editable={!isSaving}
                                />
                            ) : (
                                <Text style={styles.infoValue}>{expiryDate || 'Chưa cập nhật'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* CCCD Scanner Section */}
                {editing && (
                    <View style={styles.scannerSection}>
                        <View style={styles.scannerHeader}>
                            <Icon name="document-scanner" size={24} color={COLORS.primary} />
                            <Text style={styles.scannerTitle}>Quét thông tin từ CCCD</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.scanButton}
                            onPress={handlePickCccdImage}
                            disabled={isSaving}
                        >
                            <Icon name="add-a-photo" size={20} color="#FFF" />
                            <Text style={styles.scanButtonText}>Chọn & Quét ảnh CCCD</Text>
                        </TouchableOpacity>
                        {cccdImage && (
                            <View style={styles.cccdImageContainer}>
                                <Image source={{ uri: cccdImage }} style={styles.cccdImage} resizeMode="contain" />
                                {ocrResult ? (
                                    <View style={styles.ocrResultContainer}>
                                        <Text style={styles.ocrResultTitle}>Văn bản nhận diện được:</Text>
                                        <Text style={styles.ocrResultText}>{ocrResult}</Text>
                                    </View>
                                ) : null}
                            </View>
                        )}
                    </View>
                )}

                {/* Action Buttons */}
                {editing ? (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.saveButton]}
                            onPress={handleUpdateProfile}
                            disabled={isSaving}
                        >
                            <Icon name={isSaving ? 'hourglass-empty' : 'save'} size={20} color="#FFF" />
                            <Text style={styles.actionButtonText}>
                                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => {
                                loadUserProfile();
                                setEditing(false);
                                setCccdImage(null);
                                setOcrResult('');
                            }}
                            disabled={isSaving}
                        >
                            <Icon name="close" size={20} color="#666" />
                            <Text style={[styles.actionButtonText, { color: '#666' }]}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => setEditing(true)}
                    >
                        <Icon name="edit" size={20} color="#FFF" />
                        <Text style={styles.actionButtonText}>Chỉnh sửa hồ sơ</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Change Password Button */}
            <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => navigation.navigate('CustomerChangePassword')}
            >
                <Icon name="lock" size={20} color={COLORS.primary} />
                <Text style={styles.secondaryActionButtonText}>Đổi mật khẩu</Text>
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Icon name="logout" size={20} color="#FFF" />
                <Text style={styles.logoutButtonText}>Đăng xuất</Text>
            </TouchableOpacity>
            <View style={{ height: 20 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    profileBox: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    avatarContainer: {
        alignSelf: 'center',
        marginBottom: 24,
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: COLORS.primary,
        position: 'relative',
        overflow: 'visible',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 56,
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    infoCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E8EAED',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoIcon: {
        marginTop: 2,
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '400',
    },
    infoInput: {
        fontSize: 16,
        color: '#1F2937',
        padding: 8,
        backgroundColor: '#FFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        marginTop: 4,
    },
    multilineInput: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
    scannerSection: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    scannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    scannerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginLeft: 8,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        gap: 8,
    },
    scanButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
    cccdImageContainer: {
        marginTop: 16,
    },
    cccdImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    ocrResultContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#FFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    ocrResultTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    ocrResultText: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 18,
        fontStyle: 'italic',
    },
    actionButtons: {
        marginTop: 24,
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    editButton: {
        backgroundColor: COLORS.primary,
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginLeft: 8,
    },
    secondaryActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    secondaryActionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
        marginLeft: 8,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 24,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        paddingVertical: 8,
        minWidth: 280,
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalButtonText: {
        fontSize: 16,
        color: COLORS.primary,
        textAlign: 'center',
        fontWeight: '500',
    },
    // Success Modal styles
    successModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successModalContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 24,
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    successIconContainer: {
        marginBottom: 16,
    },
    successModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 12,
        textAlign: 'center',
    },
    successModalMessage: {
        fontSize: 15,
        color: COLORS.textMedium,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    successModalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 12,
        gap: 6,
        elevation: 2,
    },
    successModalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});

export default CustomerProfileScreen;
