import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../theme/colors';

const ClinicInfoScreen = ({ navigation }: { navigation: any }) => {
    const clinicInfo = {
        name: 'Phòng khám Chăm sóc Sức khỏe Thành Lộc',
        address: '123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM',
        phone: '0911550316',
        email: 'thanhloc@healthcare.vn',
        website: 'www.healthcare.vn',
        foundedYear: '2020',
        openTime: '05:00',
        closeTime: '17:00',
        workingDays: 'Thứ 2 - Chủ Nhật',
        description: 'Phòng khám chuyên nghiệp với đội ngũ bác sĩ giàu kinh nghiệm, trang thiết bị hiện đại, cam kết mang đến dịch vụ chăm sóc sức khỏe tốt nhất cho bạn và gia đình.',
    };

    const infoSections = [
        {
            title: 'Thông tin liên hệ',
            icon: 'contact-phone',
            items: [
                {
                    label: 'Địa chỉ',
                    value: clinicInfo.address,
                    icon: 'location-on',
                    action: () => {
                        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicInfo.address)}`;
                        Linking.openURL(url).catch(() => {
                            Alert.alert('Lỗi', 'Không thể mở bản đồ');
                        });
                    },
                },
                {
                    label: 'Hotline',
                    value: clinicInfo.phone,
                    icon: 'phone',
                    action: () => {
                        Alert.alert(
                            'Gọi điện',
                            `Bạn muốn gọi đến ${clinicInfo.phone}?`,
                            [
                                { text: 'Hủy', style: 'cancel' },
                                {
                                    text: 'Gọi',
                                    onPress: () => {
                                        Linking.openURL(`tel:${clinicInfo.phone}`).catch(() => {
                                            Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi');
                                        });
                                    },
                                },
                            ]
                        );
                    },
                },
                {
                    label: 'Email',
                    value: clinicInfo.email,
                    icon: 'email',
                    action: () => {
                        Linking.openURL(`mailto:${clinicInfo.email}`).catch(() => {
                            Alert.alert('Lỗi', 'Không thể mở ứng dụng email');
                        });
                    },
                },
                {
                    label: 'Website',
                    value: clinicInfo.website,
                    icon: 'language',
                    action: () => {
                        Linking.openURL(`https://${clinicInfo.website}`).catch(() => {
                            Alert.alert('Lỗi', 'Không thể mở website');
                        });
                    },
                },
            ],
        },
        {
            title: 'Giờ làm việc',
            icon: 'schedule',
            items: [
                {
                    label: 'Ngày làm việc',
                    value: clinicInfo.workingDays,
                    icon: 'calendar-today',
                },
                {
                    label: 'Giờ mở cửa',
                    value: clinicInfo.openTime,
                    icon: 'access-time',
                },
                {
                    label: 'Giờ đóng cửa',
                    value: clinicInfo.closeTime,
                    icon: 'access-time',
                },
            ],
        },
        {
            title: 'Giới thiệu',
            icon: 'info',
            items: [
                {
                    label: 'Năm thành lập',
                    value: clinicInfo.foundedYear,
                    icon: 'event',
                },
                {
                    label: 'Tên phòng khám',
                    value: clinicInfo.name,
                    icon: 'local-hospital',
                },
            ],
        },
    ];

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Card */}
                <View style={styles.headerCard}>
                    <View style={styles.headerIconContainer}>
                        <Icon name="local-hospital" size={48} color={COLORS.primary} />
                    </View>
                    <Text style={styles.headerTitle}>{clinicInfo.name}</Text>
                    <Text style={styles.headerSubtitle}>{clinicInfo.description}</Text>
                </View>

                {/* Info Sections */}
                {infoSections.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name={section.icon} size={24} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                        </View>
                        <View style={styles.sectionContent}>
                            {section.items.map((item, itemIndex) => (
                                <TouchableOpacity
                                    key={itemIndex}
                                    style={styles.infoItem}
                                    onPress={'action' in item ? item.action : undefined}
                                    disabled={!('action' in item)}
                                >
                                    <View style={styles.infoItemLeft}>
                                        <View style={styles.iconContainer}>
                                            <Icon name={item.icon} size={20} color={COLORS.primary} />
                                        </View>
                                        <View style={styles.infoTextContainer}>
                                            <Text style={styles.infoLabel}>{item.label}</Text>
                                            <Text style={styles.infoValue}>{item.value}</Text>
                                        </View>
                                    </View>
                                    {'action' in item && (
                                        <Icon name="chevron-right" size={24} color={COLORS.textLight} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hành động nhanh</Text>
                    <View style={styles.quickActionsContainer}>
                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => navigation.navigate('ServicesTab')}
                        >
                            <Icon name="medical-services" size={24} color={COLORS.white} />
                            <Text style={styles.quickActionText}>Xem dịch vụ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.quickActionButton, styles.quickActionButtonSecondary]}
                            onPress={() => navigation.navigate('ChatbotTab')}
                        >
                            <Icon name="chat" size={24} color={COLORS.primary} />
                            <Text style={[styles.quickActionText, styles.quickActionTextSecondary]}>
                                Hỗ trợ
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    headerCard: {
        backgroundColor: COLORS.white,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: 20,
    },
    section: {
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginLeft: 8,
    },
    sectionContent: {
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    infoItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: COLORS.textDark,
        fontWeight: '500',
    },
    quickActionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    quickActionButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    quickActionButtonSecondary: {
        backgroundColor: COLORS.primaryLight,
    },
    quickActionText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.white,
    },
    quickActionTextSecondary: {
        color: COLORS.primary,
    },
    bottomSpacing: {
        height: 24,
    },
});

export default ClinicInfoScreen;
