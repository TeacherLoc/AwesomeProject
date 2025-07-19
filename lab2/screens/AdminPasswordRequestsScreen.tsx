import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/FontAwesome';

const AdminPasswordRequestsScreen = ({ navigation }: { navigation: any }) => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

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
        <View style={styles.requestItem}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.userName || 'Không có tên'}</Text>
                <Text style={styles.itemEmail}>{item.userEmail}</Text>
                <Text style={styles.itemDate}>
                    Yêu cầu lúc: {item.requestTimestamp?.toDate().toLocaleString() || 'N/A'}
                </Text>
            </View>
            {actionLoading === item.id ? (
                <ActivityIndicator color={COLORS.primary} style={styles.itemActions} />
            ) : (
                <View style={styles.itemActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApproveRequest(item)}
                    >
                        <Icon name="check" size={16} color={COLORS.white} />
                        <Text style={styles.actionButtonText}>Duyệt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectRequest(item.id)}
                    >
                         <Icon name="times" size={16} color={COLORS.white} />
                        <Text style={styles.actionButtonText}>Từ chối</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            {requests.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>Không có yêu cầu đặt lại mật khẩu nào đang chờ.</Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContentContainer}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    listContentContainer: {
        paddingVertical: 10,
    },
    requestItem: {
        backgroundColor: COLORS.white,
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    itemInfo: {
        flex: 1,
        marginRight: 10,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    itemEmail: {
        fontSize: 14,
        color: COLORS.textMedium,
        marginVertical: 2,
    },
    itemDate: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    itemActions: {
        flexDirection: 'column', // Stack buttons vertically
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginVertical: 4, // Spacing between vertical buttons
        minWidth: 90,
        justifyContent: 'center',
    },
    approveButton: {
        backgroundColor: COLORS.success, // Define COLORS.success
    },
    rejectButton: {
        backgroundColor: COLORS.primary,
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textMedium,
        textAlign: 'center',
    },
});

export default AdminPasswordRequestsScreen;
