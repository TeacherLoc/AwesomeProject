import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Linking, Image } from 'react-native';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Định nghĩa kiểu cho params của route
type AdminAppointmentDetailScreenRouteParams = {
    appointmentId: string;
};

// Interface cho Review
interface Review {
    id: string;
    appointmentId: string;
    userId: string;
    rating: number;
    comment: string;
    imageBase64?: string;
    createdAt: FirebaseFirestoreTypes.Timestamp | Date;
}

interface Appointment {
    id: string;
    serviceName: string;
    appointmentDateTime: FirebaseFirestoreTypes.Timestamp;
    status: 'pending' | 'confirmed' | 'cancelled_by_customer' | 'cancelled_by_admin' | 'rejected' | 'completed';
    servicePrice?: number;
    customerId: string;
    customerName?: string;
    customerEmail?: string;
    requestTimestamp?: FirebaseFirestoreTypes.Timestamp;
    confirmedAt?: FirebaseFirestoreTypes.Timestamp;
    rejectedAt?: FirebaseFirestoreTypes.Timestamp;
    cancelledAt?: FirebaseFirestoreTypes.Timestamp;
    completedAt?: FirebaseFirestoreTypes.Timestamp;
    notes?: string;
    reviewId?: string;
    hasReview?: boolean;
}

interface AppointmentDetail extends Appointment {
    serviceDetails?: { name: string; description?: string; duration?: string };
    customerDetails?: { name: string; email?: string; phone?: string };
}

const AdminAppointmentDetailScreen: React.FC = () => {
    const route = useRoute<RouteProp<{ params: AdminAppointmentDetailScreenRouteParams }, 'params'>>();
    const navigation = useNavigation<StackNavigationProp<any>>();
    const { appointmentId } = route.params;

    const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [existingReview, setExistingReview] = useState<Review | null>(null);
    const [loadingReview, setLoadingReview] = useState(false);

    const fetchExistingReview = useCallback(async (currentAppointmentId: string, reviewId?: string) => {
        if (!reviewId && !currentAppointmentId) {
            console.log('[AdminReview] No reviewId or appointmentId to fetch review.');
            setExistingReview(null);
            return;
        }
        setLoadingReview(true);
        setExistingReview(null);
        try {
            let reviewDocSnap;
            if (reviewId) {
                console.log(`[AdminReview] Fetching review by reviewId: ${reviewId}`);
                reviewDocSnap = await firestore().collection('reviews').doc(reviewId).get();
            } else {
                console.log(`[AdminReview] Fetching review by appointmentId: ${currentAppointmentId}`);
                const reviewsQuery = await firestore().collection('reviews')
                    .where('appointmentId', '==', currentAppointmentId)
                    .limit(1)
                    .get();
                if (!reviewsQuery.empty) {
                    reviewDocSnap = reviewsQuery.docs[0];
                }
            }

            if (reviewDocSnap && reviewDocSnap.exists()) {
                const reviewData = reviewDocSnap.data() as any; // Tạm thời dùng any để linh hoạt hơn với createdAt
                console.log(`[AdminReview] Found review: ${reviewDocSnap.id}`);
                console.log('[AdminReview] reviewData.createdAt type:', typeof reviewData.createdAt, reviewData.createdAt);
                setExistingReview({
                    ...reviewData,
                    id: reviewDocSnap.id,
                    createdAt: reviewData.createdAt && typeof reviewData.createdAt.toDate === 'function' ? reviewData.createdAt.toDate() : reviewData.createdAt,
                });
            } else {
                console.log(`[AdminReview] No review found for appointment ${currentAppointmentId} (reviewId: ${reviewId})`);
                setExistingReview(null);
            }
        } catch (error) {
            console.error('[AdminReview] Error fetching existing review: ', error);
            setExistingReview(null);
        } finally {
            setLoadingReview(false);
        }
    }, []);

    const fetchAppointmentDetails = useCallback(async () => {
        setLoading(true);
        setAppointment(null);
        setExistingReview(null);
        try {
            const docRef = firestore().collection('appointments').doc(appointmentId);
            const docSnap = await docRef.get();

            if (docSnap.exists()) {
                const data = docSnap.data() as Appointment;
                console.log('[AdminApptDetail] Fetched appointment data:', JSON.stringify(data, null, 2));
                setAppointment({
                    ...data,
                    id: docSnap.id,
                });

                if (data.status === 'completed' && (data.reviewId || data.hasReview)) {
                    console.log(`[AdminApptDetail] Appointment is completed and has review info. reviewId: ${data.reviewId}, hasReview: ${data.hasReview}. Fetching review.`);
                    fetchExistingReview(data.id, data.reviewId);
                } else {
                    console.log(`[AdminApptDetail] Appointment NOT completed or NO review info. Status: ${data.status}, reviewId: ${data.reviewId}, hasReview: ${data.hasReview}. Setting existingReview to null.`);
                    setExistingReview(null);
                }
            } else {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin lịch hẹn.');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error fetching appointment details: ', error);
            Alert.alert('Lỗi', 'Không thể tải chi tiết lịch hẹn.');
        } finally {
            setLoading(false);
        }
    }, [appointmentId, navigation, fetchExistingReview]);

    useEffect(() => {
        fetchAppointmentDetails();
    }, [fetchAppointmentDetails]);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Chi tiết Lịch Hẹn',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20, fontWeight: 'bold' },
        });
    }, [navigation]);

    const handleUpdateStatus = async (newStatus: Appointment['status']) => {
        if (!appointment) { return; }
        setUpdating(true);
        Alert.alert(
            'Xác nhận thay đổi',
            `Bạn có chắc muốn cập nhật trạng thái lịch hẹn thành "${newStatus.replace('_', ' ')}"?`,
            [
                { text: 'Hủy', style: 'cancel', onPress: () => setUpdating(false) },
                {
                    text: 'Đồng ý',
                    onPress: async () => {
                        try {
                            const updateData: any = {
                                status: newStatus,
                            };
                            if (newStatus === 'confirmed') {updateData.confirmedAt = firestore.FieldValue.serverTimestamp();}
                            else if (newStatus === 'rejected') {updateData.rejectedAt = firestore.FieldValue.serverTimestamp();}
                            else if (newStatus === 'cancelled_by_admin') {updateData.cancelledAt = firestore.FieldValue.serverTimestamp();}
                            else if (newStatus === 'completed') {updateData.completedAt = firestore.FieldValue.serverTimestamp();}

                            await firestore().collection('appointments').doc(appointment.id).update(updateData);
                            Alert.alert('Thành công', 'Trạng thái lịch hẹn đã được cập nhật.');
                            setAppointment(prev => {
                                if (!prev) {return null;}
                                const updatedAppointment = { ...prev, status: newStatus };
                                if (newStatus === 'completed' && !prev.reviewId && !prev.hasReview) {
                                    // fetchExistingReview(prev.id); // Cân nhắc nếu cần fetch review ngay
                                }
                                return updatedAppointment;
                            });
                        } catch (error) {
                            console.error('Error updating appointment status: ', error);
                            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái lịch hẹn.');
                        } finally {
                            setUpdating(false);
                        }
                    }}]
        );
    };

    const getStatusStyle = (status?: Appointment['status']) => {
        switch (status?.toLowerCase()) {
            case 'pending': return { backgroundColor: COLORS.warningLight, color: COLORS.warningDark, text: 'Chờ xác nhận' };
            case 'confirmed': return { backgroundColor: COLORS.successLight, color: COLORS.successDark, text: 'Đã xác nhận' };
            case 'cancelled_by_customer': return { backgroundColor: COLORS.errorLight, color: COLORS.errorDark, text: 'KH hủy' };
            case 'cancelled_by_admin': return { backgroundColor: COLORS.errorLight, color: COLORS.errorDark, text: 'Admin hủy' };
            case 'rejected': return { backgroundColor: COLORS.errorLight, color: COLORS.errorDark, text: 'Đã từ chối' };
            case 'completed': return { backgroundColor: COLORS.infoLight, color: COLORS.infoDark, text: 'Đã hoàn thành' };
            default: return { backgroundColor: COLORS.greyLight, color: COLORS.textMedium, text: status || 'Không rõ' };
        }
    };

    const renderStars = (currentRating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Icon
                    key={i}
                    name={i <= currentRating ? 'star' : 'star-border'}
                    size={22}
                    color="#FFC107"
                    style={styles.starIcon}
                />
            );
        }
        return <View style={styles.starsContainer}>{stars}</View>;
    };

    if (loading) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!appointment) {
        return <View style={styles.loadingContainer}><Text style={styles.errorText}>Không có dữ liệu lịch hẹn.</Text></View>;
    }

    const statusInfo = getStatusStyle(appointment.status);
    const appointmentDate = appointment.appointmentDateTime.toDate();
    const requestDate = appointment.requestTimestamp?.toDate();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Header Card */}
            <View style={styles.headerCard}>
                <View style={styles.headerIconContainer}>
                    <Icon name="event-note" size={40} color={COLORS.white} />
                </View>
                <Text style={styles.serviceName}>{appointment.serviceName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                </View>
            </View>

            {/* Appointment Details Card */}
            <View style={styles.detailCard}>
                <View style={styles.cardHeader}>
                    <Icon name="info" size={24} color={COLORS.primary} />
                    <Text style={styles.cardTitle}>Nội soi</Text>
                </View>

                <InfoRow icon="person" label="Khách hàng:" value={appointment.customerName} />
                {appointment.customerEmail && <InfoRow icon="email" label="Email KH:" value={appointment.customerEmail} onPress={() => Linking.openURL(`mailto:${appointment.customerEmail}`)} />}

                <InfoRow icon="event" label="Ngày hẹn:" value={appointmentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} />
                <InfoRow icon="schedule" label="Giờ hẹn:" value={appointmentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} />
                {requestDate && <InfoRow icon="event-available" label="Ngày đặt:" value={requestDate.toLocaleString('vi-VN')} />}
                {appointment.servicePrice !== undefined && (
                    <InfoRow icon="payments" label="Giá dịch vụ:" value={`${appointment.servicePrice.toLocaleString('vi-VN')} VNĐ`} />
                )}
                {appointment.notes && <InfoRow icon="note" label="Ghi chú KH:" value={appointment.notes} isLongText />}
            </View>

            {/* Review Card */}
            {appointment.status === 'completed' && (
                <View style={styles.reviewCard}>
                    <View style={styles.cardHeader}>
                        <Icon name="rate-review" size={24} color={COLORS.primary} />
                        <Text style={styles.cardTitle}>Đánh giá của khách hàng</Text>
                    </View>
                    {loadingReview ? (
                        <ActivityIndicator color={COLORS.primary} style={styles.reviewLoading} />
                    ) : existingReview ? (
                        <View>
                            <View style={styles.reviewItem}>
                                <Text style={styles.reviewLabel}>Đánh giá:</Text>
                                {renderStars(existingReview.rating)}
                            </View>
                            <View style={styles.reviewItem}>
                                <Text style={styles.reviewLabel}>Bình luận:</Text>
                                <Text style={styles.reviewTextValue}>{existingReview.comment}</Text>
                            </View>
                            {existingReview.imageBase64 && (
                                <View style={styles.reviewImageContainer}>
                                    <Text style={styles.reviewLabel}>Hình ảnh đính kèm:</Text>
                                    <Image
                                        source={{ uri: `data:image/jpeg;base64,${existingReview.imageBase64}` }}
                                        style={styles.reviewImage}
                                        resizeMode="cover"
                                    />
                                </View>
                            )}
                            <Text style={styles.reviewDate}>
                                Ngày đánh giá: {existingReview.createdAt instanceof Date ? existingReview.createdAt.toLocaleDateString('vi-VN') : new Date(existingReview.createdAt.seconds * 1000).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.noReviewText}>Chưa có đánh giá từ khách hàng cho lịch hẹn này.</Text>
                    )}
                </View>
            )}

            {/* Actions Card */}
            <View style={styles.actionsCard}>
                <View style={styles.cardHeader}>
                    <Icon name="settings" size={24} color={COLORS.primary} />
                    <Text style={styles.cardTitle}>Hành động</Text>
                </View>
                {updating && <ActivityIndicator style={styles.actionLoading} color={COLORS.primary} />}
                {!updating && (
                    <>
                        {appointment.status === 'pending' && (
                            <View style={styles.actionRow}>
                                <ActionButton title="Xác nhận" icon="check-circle" color="#27ae60" onPress={() => handleUpdateStatus('confirmed')} />
                                <ActionButton title="Từ chối" icon="cancel" color="#e74c3c" onPress={() => handleUpdateStatus('rejected')} />
                            </View>
                        )}
                        {appointment.status === 'confirmed' && (
                            <ActionButton title="Đánh dấu Hoàn thành" icon="check-box" color="#3498db" onPress={() => handleUpdateStatus('completed')} />
                        )}
                        {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                            <ActionButton title="Hủy (Admin)" icon="block" color="#f39c12" onPress={() => handleUpdateStatus('cancelled_by_admin')} />
                        )}
                    </>
                )}
            </View>
        </ScrollView>
    );
};

const InfoRow = ({ icon, label, value, onPress, isLongText }: { icon: string, label: string, value?: string, onPress?: () => void, isLongText?: boolean }) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.infoRow}>
        <View style={styles.iconWrapper}>
            <Icon name={icon} size={20} color={COLORS.primary} />
        </View>
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, onPress && styles.linkValue, isLongText && styles.longText]} selectable={true}>
                {value || 'N/A'}
            </Text>
        </View>
    </TouchableOpacity>
);

const ActionButton = ({ title, icon, color, onPress }: { title: string, icon: string, color: string, onPress: () => void }) => (
    <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
        <Icon name={icon} size={20} color={COLORS.white} />
        <Text style={styles.actionButtonText}>{title}</Text>
    </TouchableOpacity>
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
    statusText: {
        fontSize: 14,
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
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginLeft: 12,
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
    linkValue: {
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
    longText: {
        lineHeight: 22,
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
    reviewLoading: {
        marginVertical: 20,
    },
    reviewItem: {
        marginBottom: 16,
    },
    reviewLabel: {
        fontSize: 15,
        color: COLORS.textDark,
        fontWeight: '600',
        marginBottom: 8,
    },
    reviewTextValue: {
        fontSize: 15,
        color: COLORS.textMedium,
        lineHeight: 22,
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starIcon: {
        marginHorizontal: 2,
    },
    reviewImageContainer: {
        marginBottom: 16,
    },
    reviewImage: {
        width: '100%',
        height: 220,
        borderRadius: 12,
        marginTop: 8,
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
    noReviewText: {
        fontSize: 15,
        color: COLORS.textMedium,
        textAlign: 'center',
        paddingVertical: 20,
        fontStyle: 'italic',
    },
    actionsCard: {
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
    actionLoading: {
        marginVertical: 12,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginVertical: 6,
        flex: 1,
        marginHorizontal: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default AdminAppointmentDetailScreen;
