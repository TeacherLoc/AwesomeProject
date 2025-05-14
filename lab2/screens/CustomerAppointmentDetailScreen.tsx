/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable quotes */
/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback, JSX } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image, TextInput } from 'react-native';
import { getFirestore, doc, getDoc, updateDoc, Timestamp, collection, addDoc, query, where, getDocs, serverTimestamp } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';

import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/FontAwesome';

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

        Alert.alert(
            'Xác nhận hủy lịch',
            'Bạn có chắc chắn muốn hủy lịch hẹn này không?',
            [
                { text: 'Không', style: 'cancel' },
                {
                    text: 'Có, hủy lịch',
                    style: 'destructive',
                    onPress: async () => {
                        setIsCancelling(true);
                        const appointmentDocRef = doc(firestoreInstance, 'appointments', appointment.id);
                        try {
                            await updateDoc(appointmentDocRef, {
                                status: 'cancelled_by_customer',
                                cancelledAt: Timestamp.now(),
                            });
                            Alert.alert('Thành công', 'Lịch hẹn của bạn đã được hủy.');
                            setAppointment((prev: any) => ({ ...prev, status: 'cancelled_by_customer' }));
                        } catch (error) {
                            console.error('Lỗi khi hủy lịch hẹn: ', error);
                            Alert.alert('Lỗi', 'Không thể hủy lịch hẹn. Vui lòng thử lại.');
                        } finally {
                            setIsCancelling(false);
                        }
                    }}]
        );
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
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!appointment) {
        return <View style={styles.centered}><Text style={{ color: COLORS.textMedium }}>Không có dữ liệu lịch hẹn.</Text></View>;
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
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.headerSection}>
                <Text style={styles.serviceName}>{appointment.serviceName || 'Dịch vụ không xác định'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                </View>
            </View>

            <View style={styles.detailCard}>
                <InfoRow icon="calendar" label="Ngày hẹn:" value={appointment.appointmentDateTime ? new Date(appointment.appointmentDateTime).toLocaleDateString('vi-VN') : 'N/A'} />
                <InfoRow icon="clock-o" label="Giờ hẹn:" value={appointment.appointmentDateTime ? new Date(appointment.appointmentDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'} />
                {appointment.servicePrice !== undefined && (
                    <InfoRow icon="money" label="Giá dịch vụ:" value={`${Number(appointment.servicePrice).toLocaleString('vi-VN')} VNĐ`} />
                )}
                <InfoRow icon="info-circle" label="Trạng thái:" valueComponent={
                    <View style={[styles.statusBadgeInline, { backgroundColor: statusInfo.backgroundColor, alignSelf: 'flex-start' }]}>
                        <Text style={[styles.statusTextInline, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                    </View>
                } />
                <InfoRow icon="bookmark-o" label="Mã lịch hẹn:" value={appointment.id?.substring(0, 10) + "..."} />
                {appointment.requestTimestamp && (
                    <InfoRow icon="calendar-plus-o" label="Ngày đặt:" value={new Date(appointment.requestTimestamp).toLocaleString('vi-VN')} />
                )}
            </View>

            {loadingReview && appointment?.status === 'completed' && (
                <View style={styles.centered}><ActivityIndicator color={COLORS.primary} /></View>
            )}

            {!loadingReview && appointment?.status === 'completed' && (
                <View style={styles.reviewSection}>
                    <Text style={styles.reviewTitle}>Đánh giá dịch vụ</Text>
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
                                <Icon name="camera" size={16} color={COLORS.primary} />
                                <Text style={styles.imagePickerButtonText}> {selectedImage ? "Thay đổi ảnh" : "Thêm hình ảnh (nếu có)"}</Text>
                            </TouchableOpacity>

                            {selectedImage?.uri && (
                                <Image source={{ uri: selectedImage.uri }} style={styles.selectedImagePreview} />
                            )}
                            <Text style={styles.base64Warning}>Lưu ý: Ảnh chất lượng cao có thể làm tăng kích thước lưu trữ.</Text>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.submitReviewButton, isSubmittingReview && styles.disabledButton]}
                                onPress={handleSubmitReview}
                                disabled={isSubmittingReview}
                            >
                                {isSubmittingReview ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <Text style={styles.actionButtonText}>Gửi đánh giá</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {canCancel && (
                <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton, isCancelling && styles.disabledButton]}
                    onPress={handleCancelAppointment}
                    disabled={isCancelling}
                >
                    {isCancelling ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                        <Text style={styles.actionButtonText}>Hủy lịch hẹn</Text>
                    )}
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};

const InfoRow = ({ icon, label, value, valueComponent }: { icon: string, label: string, value?: string, valueComponent?: JSX.Element }) => (
    <View style={styles.infoRow}>
        <Icon name={icon} size={18} color={COLORS.primary} style={styles.infoIcon} />
        <Text style={styles.infoLabel}>{label}</Text>
        {valueComponent ? valueComponent : <Text style={styles.infoValue}>{value}</Text>}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight || '#f4f6f8',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundLight || '#f4f6f8',
    },
    headerSection: {
        paddingHorizontal: 20,
        paddingVertical: 25,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        alignItems: 'center',
    },
    serviceName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textDark,
        textAlign: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusBadgeInline: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusTextInline: {
        fontSize: 14,
        fontWeight: '500',
    },
    detailCard: {
        margin: 15,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        padding: 20,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoIcon: {
        marginRight: 12,
        width: 20,
        textAlign: 'center',
    },
    infoLabel: {
        fontSize: 15,
        color: COLORS.textMedium,
        fontWeight: '600',
        marginRight: 8,
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.textDark,
        flexShrink: 1,
    },
    actionButton: {
        marginHorizontal: 20,
        marginTop: 10,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.error,
        marginBottom: 20,
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.7,
    },
    reviewSection: {
        marginTop: 20,
        marginHorizontal: 15,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        padding: 20,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        marginBottom: 20,
    },
    reviewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 15,
        textAlign: 'center',
    },
    existingReviewContainer: {},
    reviewForm: {},
    reviewLabel: {
        fontSize: 15,
        color: COLORS.textDark,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 5,
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    starIcon: {
        marginHorizontal: 3,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 5,
        padding: 10,
        textAlignVertical: 'top',
        minHeight: 80,
        fontSize: 15,
        color: COLORS.textDark,
        backgroundColor: COLORS.backgroundLight,
        marginBottom: 10,
    },
    imagePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.greyLight,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    imagePickerButtonText: {
        color: COLORS.primary,
        fontSize: 15,
        marginLeft: 5,
    },
    selectedImagePreview: {
        width: 100,
        height: 100,
        borderRadius: 5,
        marginBottom: 10,
        alignSelf: 'center',
    },
    base64Warning: {
        fontSize: 12,
        color: COLORS.textLight,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 15,
    },
    submitReviewButton: {
        backgroundColor: COLORS.success,
        marginTop: 10,
    },
    reviewText: {
        fontSize: 15,
        color: COLORS.textMedium,
        lineHeight: 22,
        marginBottom: 5,
    },
    reviewImage: {
        width: '100%',
        height: 200,
        borderRadius: 5,
        marginVertical: 10,
        resizeMode: 'contain',
    },
    reviewDate: {
        fontSize: 12,
        color: COLORS.textLight,
        textAlign: 'right',
        marginTop: 10,
    }});

export default CustomerAppointmentDetailScreen;
