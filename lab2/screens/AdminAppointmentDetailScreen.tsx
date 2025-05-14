/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Linking, Image } from 'react-native';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/FontAwesome';

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
                    name={i <= currentRating ? 'star' : 'star-o'}
                    size={20}
                    color={COLORS.warning}
                    style={styles.starIcon}
                />
            );
        }
        return <View style={styles.starsContainer}>{stars}</View>;
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!appointment) {
        return <View style={styles.centered}><Text>Không có dữ liệu lịch hẹn.</Text></View>;
    }

    const statusInfo = getStatusStyle(appointment.status);
    const appointmentDate = appointment.appointmentDateTime.toDate();
    const requestDate = appointment.requestTimestamp?.toDate();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.card}>
                <View style={styles.headerSection}>
                    <Text style={styles.serviceName}>{appointment.serviceName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                    </View>
                </View>

                <InfoRow icon="user" label="Khách hàng:" value={appointment.customerName} />
                {appointment.customerEmail && <InfoRow icon="envelope" label="Email KH:" value={appointment.customerEmail} onPress={() => Linking.openURL(`mailto:${appointment.customerEmail}`)} />}

                <InfoRow icon="calendar" label="Ngày hẹn:" value={appointmentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} />
                <InfoRow icon="clock-o" label="Giờ hẹn:" value={appointmentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} />
                {requestDate && <InfoRow icon="calendar-plus-o" label="Ngày đặt:" value={requestDate.toLocaleString('vi-VN')} />}
                {appointment.servicePrice !== undefined && (
                    <InfoRow icon="money" label="Giá dịch vụ:" value={`${appointment.servicePrice.toLocaleString('vi-VN')} VNĐ`} />
                )}
                {appointment.notes && <InfoRow icon="sticky-note" label="Ghi chú KH:" value={appointment.notes} isLongText />}
            </View>

            {appointment.status === 'completed' && (
                <View style={[styles.card, styles.reviewCard]}>
                    <Text style={styles.sectionTitle}>Đánh giá của khách hàng</Text>
                    {loadingReview ? (
                        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
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
                                <View style={styles.reviewItem}>
                                    <Text style={styles.reviewLabel}>Hình ảnh đính kèm:</Text>
                                    <Image
                                        source={{ uri: `data:image/jpeg;base64,${existingReview.imageBase64}` }}
                                        style={styles.reviewImage}
                                        resizeMode="contain"
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

            <View style={styles.actionsCard}>
                <Text style={styles.sectionTitle}>Hành động</Text>
                {updating && <ActivityIndicator style={{ marginBottom: 10 }} color={COLORS.primary} />}
                {!updating && (
                    <>
                        {appointment.status === 'pending' && (
                            <View style={styles.actionRow}>
                                <ActionButton title="Xác nhận" icon="check-circle" color={COLORS.success} onPress={() => handleUpdateStatus('confirmed')} />
                                <ActionButton title="Từ chối" icon="times-circle" color={COLORS.error} onPress={() => handleUpdateStatus('rejected')} />
                            </View>
                        )}
                        {appointment.status === 'confirmed' && (
                            <ActionButton title="Đánh dấu Hoàn thành" icon="check-square-o" color={COLORS.info} onPress={() => handleUpdateStatus('completed')} />
                        )}
                        {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                            <ActionButton title="Hủy (Admin)" icon="ban" color={COLORS.warningDark} onPress={() => handleUpdateStatus('cancelled_by_admin')} />
                        )}
                    </>
                )}
            </View>
        </ScrollView>
    );
};

const InfoRow = ({ icon, label, value, onPress, isLongText }: { icon: string, label: string, value?: string, onPress?: () => void, isLongText?: boolean }) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.infoRowContainer}>
        <Icon name={icon} size={16} color={COLORS.textMedium} style={styles.infoIcon} />
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, onPress && styles.linkValue, isLongText && styles.longText]} selectable={true}>
            {value || 'N/A'}
        </Text>
    </TouchableOpacity>
);

const ActionButton = ({ title, icon, color, onPress }: { title: string, icon: string, color: string, onPress: () => void }) => (
    <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
        <Icon name={icon} size={18} color={COLORS.white} />
        <Text style={styles.actionButtonText}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundMain || '#f8f9fa',
    },
    contentContainer: {
        padding: 15,
        paddingBottom: 30,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: 20,
        marginBottom: 20,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: 20,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.primary,
    },
    serviceName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textDark,
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    infoRowContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 8,
    },
    infoIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    infoLabel: {
        fontSize: 15,
        color: COLORS.textDark,
        fontWeight: '500',
        width: 120,
    },
    infoValue: {
        fontSize: 15,
        color: COLORS.textMedium,
        flex: 1,
    },
    linkValue: {
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
    longText: {
        lineHeight: 22,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textDark,
        marginBottom: 15,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.primary,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginVertical: 5,
        flex: 1,
        marginHorizontal: 5,
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    reviewCard: {},
    reviewItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    reviewLabel: {
        fontSize: 15,
        color: COLORS.textDark,
        fontWeight: '500',
        width: 100,
        marginRight: 10,
    },
    reviewTextValue: {
        fontSize: 15,
        color: COLORS.textMedium,
        flex: 1,
        lineHeight: 22,
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starIcon: {
        marginHorizontal: 1,
    },
    reviewImage: {
        width: '80%',
        height: 200,
        borderRadius: 5,
        marginTop: 5,
        alignSelf: 'center',
    },
    reviewDate: {
        fontSize: 12,
        color: COLORS.textLight,
        textAlign: 'right',
        marginTop: 10,
    },
    noReviewText: {
        fontSize: 15,
        color: COLORS.textMedium,
        textAlign: 'center',
        paddingVertical: 20,
        fontStyle: 'italic',
    }});

export default AdminAppointmentDetailScreen;
