import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Thêm useMemo
import { View, Text, SectionList, Image, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'; // Thêm ActivityIndicator
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTACTS_STORAGE_KEY = '@contacts_data';

// ... ContactItem component không đổi ...
const ContactItem = ({ item, onPress, onToggleFavorite }) => (
    <TouchableOpacity style={styles.contactItemContainer} onPress={() => onPress(item)}>
        <Image source={item.avatar} style={styles.avatar} />
        <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{item.name}</Text>
        </View>
        <TouchableOpacity onPress={() => onToggleFavorite(item.id)} style={styles.favoriteButton}>
            <Icon
                name={item.isFavorite ? "star" : "star-outline"}
                size={24}
                color={item.isFavorite ? "#FFBF00" : "#ccc"}
            />
        </TouchableOpacity>
    </TouchableOpacity>
);


const ContactsScreen = ({ navigation, route }) => {
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // State mới để theo dõi loading

    // --- Hàm xử lý dữ liệu ---

    // Load dữ liệu từ AsyncStorage khi component mount
    useEffect(() => {
        const loadContacts = async () => {
            setIsLoading(true); // Bắt đầu loading
            try {
                const storedContacts = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
                if (storedContacts !== null) {
                    setContacts(JSON.parse(storedContacts));
                } else {
                    setContacts([]);
                }
            } catch (e) {
                console.error("Failed to load contacts.", e);
                Alert.alert('Lỗi', 'Không thể tải danh bạ.');
                setContacts([]); // Đảm bảo contacts là mảng nếu lỗi
            } finally {
                setIsLoading(false); // Kết thúc loading (dù thành công hay lỗi)
            }
        };
        loadContacts();
    }, []); // Chỉ chạy 1 lần khi mount

    // Lưu dữ liệu vào AsyncStorage mỗi khi state contacts thay đổi (và không còn loading)
    useEffect(() => {
        const saveContacts = async () => {
            // Chỉ lưu khi đã load xong và contacts đã được khởi tạo
            if (!isLoading && contacts) {
                try {
                    console.log("Attempting to save contacts:", contacts);
                    await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
                    console.log("Contacts saved successfully.");
                } catch (e) {
                    console.error("Failed to save contacts.", e);
                }
            }
        };
        saveContacts();
    }, [contacts, isLoading]); // Phụ thuộc vào contacts và isLoading

    // Xử lý khi có contact mới (CHỈ KHI ĐÃ LOAD XONG)
    useEffect(() => {
        // Chỉ xử lý newContact nếu không còn loading và có param newContact
        if (!isLoading && route.params?.newContact) {
            const newContact = route.params.newContact;
            console.log("Received new contact (after loading):", newContact);
            setContacts(prevContacts => {
                const currentContacts = Array.isArray(prevContacts) ? prevContacts : [];
                // Kiểm tra trùng lặp nếu cần trước khi thêm
                const exists = currentContacts.some(c => c.id === newContact.id);
                if (!exists) {
                    const updatedContacts = [newContact, ...currentContacts];
                    console.log("Updating contacts state with new:", updatedContacts);
                    return updatedContacts;
                }
                return currentContacts; // Trả về state cũ nếu đã tồn tại
            });
            // Xóa param
            navigation.setParams({ newContact: undefined });
        }
    }, [route.params?.newContact, navigation, isLoading]); // Thêm isLoading vào dependencies


    // Hàm toggle trạng thái yêu thích
    const toggleFavorite = useCallback((id) => {
        setContacts(prevContacts =>
            prevContacts.map(contact =>
                contact.id === id ? { ...contact, isFavorite: !contact.isFavorite } : contact
            )
        );
    }, []);

    // Hàm xử lý khi nhấn vào một contact (đi đến chi tiết)
    const handlePressContact = (contact) => {
        navigation.navigate('ContactDetail', { contact: contact });
    };

    // --- Chuẩn bị dữ liệu cho SectionList (dùng state contacts) ---
    const sections = useMemo(() => { // Đổi React.useMemo thành useMemo
        if (isLoading) return []; // Trả về mảng rỗng nếu đang loading

        const favoriteContacts = contacts.filter(contact => contact.isFavorite).sort((a, b) => a.name.localeCompare(b.name));
        const otherContacts = contacts.filter(contact => !contact.isFavorite).sort((a, b) => a.name.localeCompare(b.name));

        const result = [];
        if (favoriteContacts.length > 0) {
            result.push({ title: 'Yêu thích', data: favoriteContacts });
        }
        if (otherContacts.length > 0) {
            result.push({ title: 'Danh bạ', data: otherContacts });
        }
        return result;
    }, [contacts, isLoading]); // Phụ thuộc contacts và isLoading


    // --- Cấu hình Header ---
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Danh bạ',
            headerRight: () => (
                <TouchableOpacity onPress={() => navigation.navigate('AddContact')} style={{ marginRight: 15 }}>
                    <Icon name="add-outline" size={28} color="#007AFF" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);


    // --- Render ---
    // Hiển thị loading indicator nếu đang load
    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    // Hiển thị danh sách hoặc thông báo trống sau khi load xong
    return (
        <View style={styles.container}>
            {contacts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Danh bạ trống.</Text>
                    <Text style={styles.emptyText}>Nhấn dấu (+) để thêm liên hệ mới.</Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ContactItem
                            item={item}
                            onPress={handlePressContact}
                            onToggleFavorite={toggleFavorite}
                        />
                    )}
                    renderSectionHeader={({ section: { title } }) => (
                        <Text style={styles.sectionHeader}>{title}</Text>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
                    stickySectionHeadersEnabled={false}
                />
            )}
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    centerContent: { // Style mới để căn giữa ActivityIndicator
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#f2f2f7',
    },
    contactItemContainer: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        marginRight: 15,
    },
    contactInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    contactName: {
        fontSize: 17,
        color: '#000',
    },
    favoriteButton: {
        padding: 5,
        marginLeft: 10,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#c8c7cc',
        marginLeft: 75,
    },
    sectionHeader: {
        paddingTop: 15,
        paddingBottom: 8,
        paddingHorizontal: 15,
        fontSize: 14,
        fontWeight: '600',
        backgroundColor: '#f2f2f7',
        color: '#6d6d72',
        textTransform: 'uppercase',
    },
    sectionSeparator: {
        height: 10,
        backgroundColor: '#f2f2f7',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#8e8e93',
        textAlign: 'center',
        marginBottom: 5,
    }
});

export default ContactsScreen;
