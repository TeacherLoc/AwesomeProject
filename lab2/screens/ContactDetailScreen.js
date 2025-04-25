import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const ContactDetailScreen = ({ route, navigation }) => {
    // Nhận dữ liệu contact được truyền qua params
    const { contact } = route.params;

    // Đặt tiêu đề cho header là tên của contact
    React.useLayoutEffect(() => {
        navigation.setOptions({ title: contact.name });
    }, [navigation, contact]);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Image source={contact.avatar} style={styles.avatar} />
                <Text style={styles.name}>{contact.name}</Text>
            </View>
            <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                    <Icon name="call-outline" size={24} color="#007AFF" style={styles.icon} />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Điện thoại</Text>
                        <Text style={styles.infoValue}>{contact.phone || 'Chưa có'}</Text>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <Icon name="mail-outline" size={24} color="#007AFF" style={styles.icon} />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{contact.email || 'Chưa có'}</Text>
                    </View>
                </View>
                {/* Thêm các thông tin khác nếu cần */}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 10,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 15,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    infoSection: {
        backgroundColor: '#fff',
        marginHorizontal: 10,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    infoRowLast: { // Nếu là dòng cuối cùng thì bỏ borderBottom
        borderBottomWidth: 0,
    },
    icon: {
        marginRight: 15,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        color: '#888',
        marginBottom: 3,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
    },
});

export default ContactDetailScreen;