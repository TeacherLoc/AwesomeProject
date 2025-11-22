/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable quotes */
import React, { useState, useEffect, useCallback, JSX } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image, TextInput, Modal } from 'react-native';
import { getFirestore, doc, getDoc, updateDoc, Timestamp, collection, addDoc, query, where, getDocs, serverTimestamp } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';

import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createAppointmentCancelledNotification } from '../utils/notificationHelper';

interface Review {
    id: string;
    appointmentId: string;
    userId: string;
    rating: number;
    comment: string;
    imageBase64?: string;
    createdAt: Date;
}

const CustomerAppointmentDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { appointmentId, appointmentData: initialAppointmentData } = route.params;

    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const [existingReview, setExistingReview] = useState<Review | null>(null);
    const [loadingReview, setLoadingReview] = useState(true);
    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const firestoreInstance = getFirestore();

    const fetchExistingReview = useCallback(async (currentApptId: string) => {
        if (!currentApptId) {
            console.log(`[Review] fetchExistingReview called with no currentApptId. Skipping.`);
            setLoadingReview(false);
            setExistingReview(null);
            return;
        }
        console.log(`[Review] Fetching review for appointmentId: ${currentApptId}. Current existingReview state before fetch:`, existingReview);
        setLoadingReview(true);
        try {
            const reviewsRef = collection(firestoreInstance, 'reviews');
            const q = query(reviewsRef, where('appointmentId', '==', currentApptId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const reviewDoc = querySnapshot.docs[0];
                const reviewData = reviewDoc.data();
                console.log(`[Review] Found review for ${currentApptId}:`, reviewDoc.id);
                const newReview = {
                    id: reviewDoc.id,
                    ...reviewData,
                    createdAt: reviewData.createdAt instanceof Timestamp ? reviewData.createdAt.toDate() : new Date(reviewData.createdAt)} as Review;
                setExistingReview(newReview);
            } else {
                console.log(`[Review] No review found for ${currentApptId}. Setting existingReview to null.`);
                setExistingReview(null);
            }
        } catch (error) {
            console.error("[Review] Error fetching existing review: ", error);
            setExistingReview(null);
        } finally {
            setLoadingReview(false);
        }
    }, [firestoreInstance]);

    const fetchAppointmentDetails = useCallback(async (currentApptId: string) => {
        if (!currentApptId) {
            Alert.alert('Lỗi', 'Không có ID lịch hẹn.');
            navigation.goBack();
            return;
        }
        console.log(`[Appointment] Fetching details for appointmentId: ${currentApptId}`);
        setLoading(true);

        const appointmentDocRef = doc(firestoreInstance, 'appointments', currentApptId);
        try {
            const docSnap = await getDoc(appointmentDocRef);
            if (docSnap.exists()) {
                const firestoreDocumentData = docSnap.data() as any;
                const data = { id: docSnap.id, ...firestoreDocumentData };

                if (data.appointmentDateTime && data.appointmentDateTime instanceof Timestamp) {
                    data.appointmentDateTime = data.appointmentDateTime.toDate();
                }
                if (data.requestTimestamp && data.requestTimestamp instanceof Timestamp) {
                    data.requestTimestamp = data.requestTimestamp.toDate();
                }
                setAppointment(data);

                if (data.status === 'completed') {
                    console.log(`[Appointment] Status is completed for ${data.id}. Fetching review.`);
                    fetchExistingReview(data.id);
                } else {
                    console.log(`[Appointment] Status is NOT completed for ${data.id} (${data.status}). Setting review states to null/false.`);
                    setLoadingReview(false);
                    setExistingReview(null);
                }
            } else {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin lịch hẹn.');
                navigation.goBack();
            }
        } catch (error) {
            console.error('[Appointment] Lỗi khi tải chi tiết lịch hẹn: ', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin chi tiết lịch hẹn.');
        } finally {
            setLoading(false);
        }
    }, [firestoreInstance, navigation, fetchExistingReview]);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Chi tiết Lịch Hẹn',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20, fontWeight: 'bold' },
        });
    }, [navigation]);

    useEffect(() => {
        console.log(`[Effect] Screen focus/param change. appointmentId from params: ${appointmentId}. Current appointment state:`, appointment?.id);

        setAppointment(null);
        setExistingReview(null);
        setLoading(true);
        setLoadingReview(true);
        setRating(0);
        setComment('');
        setSelectedImage(null);

        if (appointmentId) {
            if (initialAppointmentData && initialAppointmentData.id === appointmentId && appointment?.id !== appointmentId) {
                console.log(`[Effect] Using initialAppointmentData for: ${appointmentId}`);
                const data = { ...initialAppointmentData };
                if (data.appointmentDateTime && data.appointmentDateTime.seconds) {
                    data.appointmentDateTime = new Timestamp(data.appointmentDateTime.seconds, data.appointmentDateTime.nanoseconds).toDate();
                }
                if (data.requestTimestamp && data.requestTimestamp.seconds) {
                    data.requestTimestamp = new Timestamp(data.requestTimestamp.seconds, data.requestTimestamp.nanoseconds).toDate();
                }
                setAppointment(data);
                setLoading(false);

                if (data.status === 'completed') {
                    console.log(`[Effect-InitialData] Status is completed for ${data.id}. Fetching review.`);
                    fetchExistingReview(data.id);
                } else {
                    console.log(`[Effect-InitialData] Status is NOT completed for ${data.id} (${data.status}). Setting review states to null/false.`);
                    setLoadingReview(false);
                    setExistingReview(null);
                }
            } else {
                console.log(`[Effect] Fetching new details for appointmentId: ${appointmentId}`);
                fetchAppointmentDetails(appointmentId);
            }
        } else {
            console.log("[Effect] No appointmentId found.");
            Alert.alert("Lỗi", "Không có thông tin lịch hẹn.");
            navigation.goBack();
            setLoading(false);
            setLoadingReview(false);
        }
    }, [appointmentId, initialAppointmentData]);

    const handleImagePick = () => {
        launchImageLibrary(
            { mediaType: 'photo', includeBase64: true, quality: 0.5 },
            (response: ImagePickerResponse) => {
                if (response.didCancel) {
                    console.log('User cancelled image picker');
                } else if (response.errorCode) {
                    console.log('ImagePicker Error: ', response.errorMessage);
                    Alert.alert('Lỗi chọn ảnh', response.errorMessage || 'Không thể chọn ảnh.');
                } else if (response.assets && response.assets.length > 0) {
                    setSelectedImage(response.assets[0]);
                }
            }
        );
    };

    const handleSubmitReview = async () => {
        if (rating === 0) {
            Alert.alert('Thiếu thông tin', 'Vui lòng chọn số sao đánh giá.');
            return;
        }
        if (!comment.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng để lại bình luận của bạn.');
            return;
        }
        const currentUser = auth().currentUser;
        if (!currentUser || !appointment) {
            Alert.alert('Lỗi', 'Không thể xác định người dùng hoặc lịch hẹn.');
            return;
        }

        setIsSubmittingReview(true);
        try {
            const reviewData = {
                appointmentId: appointment.id,
                serviceId: appointment.serviceId || 'N/A',
                serviceName: appointment.serviceName || 'N/A',
                userId: currentUser.uid,
                rating,
                comment: comment.trim(),
                imageBase64: selectedImage?.base64 || null,
                createdAt: serverTimestamp(),
            };

            console.log('Submitting reviewData:', JSON.stringify(reviewData, null, 2));
            console.log('Current User UID for rule check:', currentUser.uid);
            console.log('Appointment ID for rule check:', appointment.id);

            const reviewCollectionRef = collection(firestoreInstance, 'reviews');
            const docRef = await addDoc(reviewCollectionRef, reviewData);

            const appointmentDocRef = doc(firestoreInstance, 'appointments', appointment.id);
            await updateDoc(appointmentDocRef, {
                reviewId: docRef.id,
                hasReview: true});
            setAppointment((prev: any) => ({ ...prev, reviewId: docRef.id, hasReview: true }));

            Alert.alert('Thành công', 'Cảm ơn bạn đã gửi đánh giá!');
            setExistingReview({
                id: docRef.id,
                ...reviewData,
                createdAt: new Date()} as Review);
            setRating(0);
            setComment('');
            setSelectedImage(null);

        } catch (error) {
            console.error('Lỗi khi gửi đánh giá: ', error);
            Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại.');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleCancelAppointment = async () => {
        if (!appointment || !appointment.id) { return; }
        setShowCancelModal(true);
    };

    const confirmCancelAppointment = async () => {
        if (!appointment || !appointment.id) { return; }

        setShowCancelModal(false);
        setIsCancelling(true);
        const appointmentDocRef = doc(firestoreInstance, 'appointments', appointment.id);
        try {
            await updateDoc(appointmentDocRef, {
                status: 'cancelled_by_customer',
                cancelledAt: Timestamp.now(),
            });
            
            // Tạo thông báo huỷ lịch hẹn
            const currentUser = auth().currentUser;
            if (currentUser) {
                await createAppointmentCancelledNotification(
                    currentUser.uid,
                    appointment.id,
                    appointment.serviceName,
                    'customer'
                );
            }
            
            Alert.alert('Thành công', 'Lịch hẹn của bạn đã được huỷ.');
            setAppointment((prev: any) => ({ ...prev, status: 'cancelled_by_customer' }));
        } catch (error) {
            console.error('Lỗi khi hủy lịch hẹn: ', error);
            Alert.alert('Lỗi', 'Không thể hủy lịch hẹn. Vui lòng thử lại.');
        } finally {
            setIsCancelling(false);
        }
    };

    const getStatusStyle = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return { backgroundColor: COLORS.warningLight, color: COLORS.warningDark, text: 'Chờ xác nhận' };
            case 'confirmed':
                return { backgroundColor: COLORS.successLight, color: COLORS.successDark, text: 'Đã xác nhận' };
            case 'cancelled_by_customer':
            case 'cancelled_by_admin':
            case 'rejected':
                return { backgroundColor: COLORS.errorLight, color: COLORS.errorDark, text: 'Đã hủy' };
            case 'completed':
                return { backgroundColor: COLORS.infoLight, color: COLORS.infoDark, text: 'Đã hoàn thành' };
            default:
                return { backgroundColor: COLORS.greyLight, color: COLORS.textMedium, text: status || 'Không rõ' };
        }
    };

    if (loading) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!appointment) {
        return <View style={styles.loadingContainer}><Text style={styles.errorText}>Không có dữ liệu lịch hẹn.</Text></View>;
    }

    const statusInfo = getStatusStyle(appointment?.status);
    const canCancel = appointment?.status === 'pending' || appointment?.status === 'confirmed';

    const renderStars = (currentRating: number, interactive: boolean = false) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity key={i} onPress={() => interactive && setRating(i)} disabled={!interactive}>
                    <Icon
                        name={i <= currentRating ? "star" : "star-o"}
                        size={interactive ? 30 : 20}
                        color={COLORS.warning}
                        style={styles.starIcon}
                    />
                </TouchableOpacity>
            );
        }
        return <View style={styles.starsContainer}>{stars}</View>;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Cancel Confirmation Modal */}
            <Modal
                visible={showCancelModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCancelModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalIconContainer}>
                            <Icon name="warning" size={80} color="#e74c3c" />
                        </View>
                        <Text style={styles.modalTitle}>Xác nhận hủy lịch</Text>
                        <Text style={styles.modalMessage}>
                            Bạn có chắc chắn muốn hủy lịch hẹn này không?
                        </Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSecondary]}
                                onPress={() => setShowCancelModal(false)}
                            >
                                <Icon name="close" size={18} color={COLORS.textDark} />
                                <Text style={styles.modalButtonTextSecondary}>Không</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonDanger]}
                                onPress={confirmCancelAppointment}
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <>
                                        <Icon name="event-busy" size={18} color={COLORS.white} />
                                        <Text style={styles.modalButtonTextPrimary}>Có, hủy lịch</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Header Card */}
            <View style={styles.headerCard}>
                <View style={styles.headerIconContainer}>
                    <Icon name="event-note" size={40} color={COLORS.white} />
                </View>
                <Text style={styles.serviceName}>{appointment.serviceName || 'Dịch vụ không xác định'}</Text>
                <View style={[styles.statusBadge, statusInfo.backgroundColor === '#f39c12' && styles.statusBadgePending,
                    statusInfo.backgroundColor === '#27ae60' && styles.statusBadgeConfirmed,
                    statusInfo.backgroundColor === '#3498db' && styles.statusBadgeCompleted,
                    statusInfo.backgroundColor === '#e74c3c' && styles.statusBadgeCancelled]}>
                    <Text style={[styles.statusText, statusInfo.color === '#fff' && styles.statusTextWhite]}>{statusInfo.text}</Text>
                </View>
            </View>

            {/* Appointment Details Card */}
            <View style={styles.detailCard}>
                <InfoRow icon="event" label="Ngày hẹn:" value={appointment.appointmentDateTime ? new Date(appointment.appointmentDateTime).toLocaleDateString('vi-VN') : 'N/A'} />
                <InfoRow icon="schedule" label="Giờ hẹn:" value={appointment.appointmentDateTime ? new Date(appointment.appointmentDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'} />
                {appointment.servicePrice !== undefined && (
                    <InfoRow icon="payments" label="Giá dịch vụ:" value={`${Number(appointment.servicePrice).toLocaleString('vi-VN')} VNĐ`} />
                )}
                <InfoRow icon="info" label="Trạng thái:" valueComponent={
                    <View style={[styles.statusBadgeInline, statusInfo.backgroundColor === '#f39c12' && styles.statusBadgePending,
                        statusInfo.backgroundColor === '#27ae60' && styles.statusBadgeConfirmed,
                        statusInfo.backgroundColor === '#3498db' && styles.statusBadgeCompleted,
                        statusInfo.backgroundColor === '#e74c3c' && styles.statusBadgeCancelled]}>
                        <Text style={[styles.statusTextInline, statusInfo.color === '#fff' && styles.statusTextWhite]}>{statusInfo.text}</Text>
                    </View>
                } />
                <InfoRow icon="bookmark-outline" label="Mã lịch hẹn:" value={appointment.id?.substring(0, 10) + "..."} />
                {appointment.requestTimestamp && (
                    <InfoRow icon="event-available" label="Ngày đặt:" value={new Date(appointment.requestTimestamp).toLocaleString('vi-VN')} />
                )}
            </View>

            {loadingReview && appointment?.status === 'completed' && (
                <View style={styles.loadingContainer}><ActivityIndicator color={COLORS.primary} size="large" /></View>
            )}

            {!loadingReview && appointment?.status === 'completed' && (
                <View style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                        <Icon name="rate-review" size={24} color={COLORS.primary} />
                        <Text style={styles.reviewTitle}>Đánh giá dịch vụ</Text>
                    </View>
                    {existingReview ? (
                        <View style={styles.existingReviewContainer}>
                            <Text style={styles.reviewLabel}>Đánh giá của bạn:</Text>
                            {renderStars(existingReview.rating)}
                            <Text style={styles.reviewLabel}>Bình luận:</Text>
                            <Text style={styles.reviewText}>{existingReview.comment}</Text>
                            {existingReview.imageBase64 && (
                                <>
                                    <Text style={styles.reviewLabel}>Hình ảnh:</Text>
                                    <Image source={{ uri: `data:image/jpeg;base64,${existingReview.imageBase64}` }} style={styles.reviewImage} />
                                </>
                            )}
                            <Text style={styles.reviewDate}>Đã đánh giá ngày: {new Date(existingReview.createdAt).toLocaleDateString('vi-VN')}</Text>
                        </View>
                    ) : (
                        <View style={styles.reviewForm}>
                            <Text style={styles.reviewLabel}>Chọn số sao:</Text>
                            {renderStars(rating, true)}

                            <Text style={styles.reviewLabel}>Ý kiến của bạn:</Text>
                            <TextInput
                                style={styles.commentInput}
                                multiline
                                numberOfLines={4}
                                placeholder="Chia sẻ cảm nhận của bạn..."
                                value={comment}
                                onChangeText={setComment}
                                placeholderTextColor={COLORS.textLight}
                            />

                            <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePick}>
                                <Icon name="camera-alt" size={20} color={COLORS.white} />
                                <Text style={styles.imagePickerButtonText}>{selectedImage ? "Thay đổi ảnh" : "Thêm hình ảnh"}</Text>
                            </TouchableOpacity>

                            {selectedImage?.uri && (
                                <Image source={{ uri: selectedImage.uri }} style={styles.selectedImagePreview} />
                            )}
                            <Text style={styles.base64Warning}>Lưu ý: Ảnh chất lượng cao có thể làm tăng kích thước lưu trữ.</Text>

                            <TouchableOpacity
                                style={[styles.submitReviewButton, isSubmittingReview && styles.disabledButton]}
                                onPress={handleSubmitReview}
                                disabled={isSubmittingReview}
                            >
                                {isSubmittingReview ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <>
                                        <Icon name="send" size={18} color={COLORS.white} />
                                        <Text style={styles.buttonText}>Gửi đánh giá</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {canCancel && (
                <TouchableOpacity
                    style={[styles.cancelButton, isCancelling && styles.disabledButton]}
                    onPress={handleCancelAppointment}
                    disabled={isCancelling}
                >
                    {isCancelling ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                        <>
                            <Icon name="cancel" size={20} color={COLORS.white} />
                            <Text style={styles.buttonText}>Hủy lịch hẹn</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};

const InfoRow = ({ icon, label, value, valueComponent }: { icon: string, label: string, value?: string, valueComponent?: JSX.Element }) => (
    <View style={styles.infoRow}>
        <View style={styles.iconWrapper}>
            <Icon name={icon} size={22} color={COLORS.primary} />
        </View>
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            {valueComponent ? valueComponent : <Text style={styles.infoValue}>{value}</Text>}
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.textMedium,
        textAlign: 'center',
    },
    headerCard: {
        backgroundColor: COLORS.primary,
        margin: 16,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    headerIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    serviceName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusBadgePending: {
        backgroundColor: '#f39c12',
    },
    statusBadgeConfirmed: {
        backgroundColor: '#27ae60',
    },
    statusBadgeCompleted: {
        backgroundColor: '#3498db',
    },
    statusBadgeCancelled: {
        backgroundColor: '#e74c3c',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusTextWhite: {
        color: COLORS.white,
    },
    statusBadgeInline: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusTextInline: {
        fontSize: 13,
        fontWeight: '600',
    },
    detailCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.textDark,
        fontWeight: '500',
    },
    reviewCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    reviewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginLeft: 12,
    },
    existingReviewContainer: {},
    reviewForm: {},
    reviewLabel: {
        fontSize: 15,
        color: COLORS.textDark,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 8,
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    starIcon: {
        marginHorizontal: 2,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 12,
        textAlignVertical: 'top',
        minHeight: 100,
        fontSize: 15,
        color: COLORS.textDark,
        backgroundColor: '#f9f9f9',
        marginBottom: 12,
    },
    imagePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    imagePickerButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
    selectedImagePreview: {
        width: 150,
        height: 150,
        borderRadius: 12,
        marginVertical: 12,
        alignSelf: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    base64Warning: {
        fontSize: 12,
        color: COLORS.textLight,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 12,
    },
    submitReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#27ae60',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e74c3c',
        marginHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    disabledButton: {
        opacity: 0.6,
    },
    reviewText: {
        fontSize: 15,
        color: COLORS.textMedium,
        lineHeight: 22,
        marginBottom: 8,
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
    },
    reviewImage: {
        width: '100%',
        height: 220,
        borderRadius: 12,
        marginVertical: 12,
        resizeMode: 'cover',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    reviewDate: {
        fontSize: 13,
        color: COLORS.textLight,
        textAlign: 'right',
        marginTop: 12,
        fontStyle: 'italic',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
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
    modalIconContainer: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 15,
        color: COLORS.textMedium,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 6,
    },
    modalButtonDanger: {
        backgroundColor: '#e74c3c',
        elevation: 2,
    },
    modalButtonSecondary: {
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: '#95a5a6',
    },
    modalButtonTextPrimary: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    modalButtonTextSecondary: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
});

export default CustomerAppointmentDetailScreen;
