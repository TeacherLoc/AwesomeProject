import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AdminPasswordRequestsScreen = ({ navigation }: { navigation: any }) => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Yêu cầu mật khẩu',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontSize: 20, fontWeight: 'bold' },
        });
    }, [navigation]);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const querySnapshot = await firestore()
                .collection('passwordResetRequests')
                .where('status', '==', 'pending')
                .orderBy('requestTimestamp', 'desc')
                .get();

            const fetchedRequests = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setRequests(fetchedRequests);
        } catch (error) {
            console.error('Error fetching password reset requests: ', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách yêu cầu.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchRequests();
        });
        return unsubscribe;
    }, [navigation, fetchRequests]);

    const handleApproveRequest = async (request: any) => {
        setActionLoading(request.id);
        try {
            await auth().sendPasswordResetEmail(request.userEmail);

            await firestore().collection('passwordResetRequests').doc(request.id).update({
                status: 'approved',
                approvedTimestamp: firestore.FieldValue.serverTimestamp(),
            });

            Alert.alert('Thành công', `Email đặt lại mật khẩu đã được gửi đến ${request.userEmail}.`);
            // Refresh list
            setRequests(prevRequests => prevRequests.filter(r => r.id !== request.id));
        } catch (error: any) {
            console.error('Error approving request: ', error);
            if (error.code === 'auth/user-not-found') {
                 Alert.alert('Lỗi Firebase Auth', `Không tìm thấy người dùng Firebase Auth với email ${request.userEmail}. Điều này không nên xảy ra nếu email đã được xác thực trước đó.`);
            } else {
                Alert.alert('Lỗi', `Không thể phê duyệt yêu cầu: ${error.message}`);
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        Alert.alert(
            'Xác nhận từ chối',
            'Bạn có chắc chắn muốn từ chối yêu cầu này không?',
            [
                { text: 'Huỷ', style: 'cancel' },
                {
                    text: 'Từ chối',
                    onPress: async () => {
                        setActionLoading(requestId);
                        try {
                            await firestore().collection('passwordResetRequests').doc(requestId).update({
                                status: 'rejected',
                                rejectedTimestamp: firestore.FieldValue.serverTimestamp(),
                            });
                            Alert.alert('Thành công', 'Yêu cầu đã được từ chối.');
                            setRequests(prevRequests => prevRequests.filter(r => r.id !== requestId));
                        } catch (error) {
                            console.error('Error rejecting request: ', error);
                            Alert.alert('Lỗi', 'Không thể từ chối yêu cầu.');
                        } finally {
                            setActionLoading(null);
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.requestCard}>
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    <Icon name="person" size={32} color={COLORS.white} />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.userName}>{item.userName || 'Không có tên'}</Text>
                    <View style={styles.emailRow}>
                        <Icon name="email" size={14} color={COLORS.textMedium} />
                        <Text style={styles.userEmail}>{item.userEmail}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Icon name="access-time" size={18} color={COLORS.primary} />
                    <Text style={styles.infoLabel}>Yêu cầu lúc:</Text>
                    <Text style={styles.infoValue}>
                        {item.requestTimestamp?.toDate().toLocaleString('vi-VN') || 'N/A'}
                    </Text>
                </View>
            </View>

            {actionLoading === item.id ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={COLORS.primary} size="small" />
                    <Text style={styles.loadingText}>Đang xử lý...</Text>
                </View>
            ) : (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApproveRequest(item)}
                    >
                        <Icon name="check-circle" size={20} color={COLORS.white} />
                        <Text style={styles.actionButtonText}>Phê duyệt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectRequest(item.id)}
                    >
                        <Icon name="cancel" size={20} color={COLORS.white} />
                        <Text style={styles.actionButtonText}>Từ chối</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    if (loading) {
        return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            {requests.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Icon name="inbox" size={80} color="#e0e0e0" />
                    </View>
                    <Text style={styles.emptyTitle}>Không có yêu cầu</Text>
                    <Text style={styles.emptyText}>Không có yêu cầu đặt lại mật khẩu nào đang chờ.</Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    listContent: {
        padding: 16,
        paddingBottom: 24,
    },
    requestCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 4,
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userEmail: {
        fontSize: 14,
        color: COLORS.textMedium,
        marginLeft: 6,
    },
    cardBody: {
        padding: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
        marginLeft: 8,
        marginRight: 6,
    },
    infoValue: {
        fontSize: 14,
        color: COLORS.textDark,
        fontWeight: '500',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.textMedium,
        marginLeft: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 12,
        paddingTop: 0,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    approveButton: {
        backgroundColor: '#27ae60',
    },
    rejectButton: {
        backgroundColor: '#e74c3c',
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: COLORS.textMedium,
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default AdminPasswordRequestsScreen;
