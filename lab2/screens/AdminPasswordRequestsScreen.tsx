import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AdminPasswordRequestsScreen = ({ navigation }: { navigation: any }) => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    
    // Custom Modal States
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
    
    // Custom Modal Functions
    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setSuccessModalVisible(true);
    };
    
    const showError = (message: string) => {
        setErrorMessage(message);
        setErrorModalVisible(true);
    };
    
    const showConfirm = (requestId: string) => {
        setPendingRequestId(requestId);
        setConfirmModalVisible(true);
    };

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
            showError('Không thể tải danh sách yêu cầu. Vui lòng thử lại.');
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

            showSuccess(`Email đặt lại mật khẩu đã được gửi đến ${request.userEmail}.`);
            // Refresh list
            setRequests(prevRequests => prevRequests.filter(r => r.id !== request.id));
        } catch (error: any) {
            console.error('Error approving request: ', error);
            if (error.code === 'auth/user-not-found') {
                 showError(`Không tìm thấy người dùng Firebase Auth với email ${request.userEmail}. Điều này không nên xảy ra nếu email đã được xác thực trước đó.`);
            } else {
                showError(`Không thể phê duyệt yêu cầu: ${error.message}`);
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectRequest = (requestId: string) => {
        showConfirm(requestId);
    };
    
    const confirmRejectRequest = async () => {
        if (!pendingRequestId) return;
        
        setConfirmModalVisible(false);
        setActionLoading(pendingRequestId);
        try {
            await firestore().collection('passwordResetRequests').doc(pendingRequestId).update({
                status: 'rejected',
                rejectedTimestamp: firestore.FieldValue.serverTimestamp(),
            });
            showSuccess('Yêu cầu đã được từ chối.');
            setRequests(prevRequests => prevRequests.filter(r => r.id !== pendingRequestId));
        } catch (error) {
            console.error('Error rejecting request: ', error);
            showError('Không thể từ chối yêu cầu. Vui lòng thử lại.');
        } finally {
            setActionLoading(null);
            setPendingRequestId(null);
        }
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

            {/* Success Modal */}
            <Modal
                visible={successModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSuccessModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.successModal}>
                        <View style={styles.modalIcon}>
                            <Icon name="check-circle-outline" size={64} color="#27ae60" />
                        </View>
                        <Text style={styles.modalTitle}>Thành công!</Text>
                        <Text style={styles.modalMessage}>{successMessage}</Text>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.successButton]}
                            onPress={() => setSuccessModalVisible(false)}
                        >
                            <Text style={styles.successButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Error Modal */}
            <Modal
                visible={errorModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setErrorModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.errorModal}>
                        <View style={styles.modalIcon}>
                            <Icon name="error-outline" size={64} color="#e74c3c" />
                        </View>
                        <Text style={styles.modalTitle}>Có lỗi xảy ra</Text>
                        <Text style={styles.modalMessage}>{errorMessage}</Text>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.errorButton]}
                            onPress={() => setErrorModalVisible(false)}
                        >
                            <Text style={styles.errorButtonText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Confirm Reject Modal */}
            <Modal
                visible={confirmModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setConfirmModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmModal}>
                        <View style={styles.modalIcon}>
                            <Icon name="help-outline" size={64} color="#f39c12" />
                        </View>
                        <Text style={styles.modalTitle}>Xác nhận từ chối</Text>
                        <Text style={styles.modalMessage}>
                            Bạn có chắc chắn muốn từ chối yêu cầu này không?{'\n'}
                            Hành động này không thể hoàn tác.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setConfirmModalVisible(false);
                                    setPendingRequestId(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.rejectButton]}
                                onPress={confirmRejectRequest}
                            >
                                <Text style={styles.rejectButtonText}>Từ chối</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successModal: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: '90%',
        maxWidth: 400,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    errorModal: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: '90%',
        maxWidth: 400,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    confirmModal: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: '90%',
        maxWidth: 400,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    modalIcon: {
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    successButton: {
        backgroundColor: '#27ae60',
        minWidth: 120,
    },
    errorButton: {
        backgroundColor: '#e74c3c',
        minWidth: 120,
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    rejectButton: {
        backgroundColor: '#e74c3c',
    },
    successButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    errorButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    rejectButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AdminPasswordRequestsScreen;
