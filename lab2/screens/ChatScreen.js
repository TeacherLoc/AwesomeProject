import React from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Hoặc bộ icon khác

// Dữ liệu mẫu với ảnh avatar cục bộ
const chatData = [
    {
        id: '1',
        name: 'Trần Từ Biệt',
        message: 'Bạn khỏe không?',
        time: '10:30 AM',
        // Sử dụng require() với đường dẫn tương đối từ file ChatScreen.js
        avatar: require('../assets/khang.png') // Thay 'avatar_a.png' bằng tên file ảnh của bạn
    },
    {
        id: '2',
        name: 'Trần Thị B',
        message: 'Đang làm gì đó?',
        time: '10:25 AM',
        avatar: require('../assets/lo.png') // Thay 'avatar_b.jpg' bằng tên file ảnh của bạn
    },
    {
        id: '3',
        name: 'Trần Từ Biệt',
        message: 'Bạn khỏe không?',
        time: '10:30 AM',
        // Sử dụng require() với đường dẫn tương đối từ file ChatScreen.js
        avatar: require('../assets/khang.png') // Thay 'avatar_a.png' bằng tên file ảnh của bạn
    },
    {
        id: '4',
        name: 'Trần Từ Biệt',
        message: 'Bạn khỏe không?',
        time: '10:30 AM',
        // Sử dụng require() với đường dẫn tương đối từ file ChatScreen.js
        avatar: require('../assets/khang.png') // Thay 'avatar_a.png' bằng tên file ảnh của bạn
    },
    {
        id: '5',
        name: 'Trần Từ Biệt',
        message: 'Bạn khỏe không?',
        time: '10:30 AM',
        // Sử dụng require() với đường dẫn tương đối từ file ChatScreen.js
        avatar: require('../assets/khang.png') // Thay 'avatar_a.png' bằng tên file ảnh của bạn
    },
    {
        id: '6',
        name: 'Trần Từ Biệt',
        message: 'Bạn khỏe không?',
        time: '10:30 AM',
        // Sử dụng require() với đường dẫn tương đối từ file ChatScreen.js
        avatar: require('../assets/khang.png') // Thay 'avatar_a.png' bằng tên file ảnh của bạn
    },
    {
        id: '7',
        name: 'Trần Từ Biệt',
        message: 'Bạn khỏe không?',
        time: '10:30 AM',
        // Sử dụng require() với đường dẫn tương đối từ file ChatScreen.js
        avatar: require('../assets/khang.png') // Thay 'avatar_a.png' bằng tên file ảnh của bạn
    },
    {
        id: '8',
        name: 'Trần Từ Biệt',
        message: 'Bạn khỏe không?',
        time: '10:30 AM',
        // Sử dụng require() với đường dẫn tương đối từ file ChatScreen.js
        avatar: require('../assets/khang.png') // Thay 'avatar_a.png' bằng tên file ảnh của bạn
    },
    {
        id: '9',
        name: 'Trần Từ Biệt',
        message: 'Bạn khỏe không?',
        time: '10:30 AM',
        // Sử dụng require() với đường dẫn tương đối từ file ChatScreen.js
        avatar: require('../assets/khang.png') // Thay 'avatar_a.png' bằng tên file ảnh của bạn
    },
    {
        id: '10',
        name: 'Trần Từ Biệt',
        message: 'Bạn khỏe không?',
        time: '10:30 AM',
        // Sử dụng require() với đường dẫn tương đối từ file ChatScreen.js
        avatar: require('../assets/khang.png') // Thay 'avatar_a.png' bằng tên file ảnh của bạn
    },
    // Thêm các cuộc trò chuyện khác với require() tương ứng
];

const ChatItem = ({ item }) => (
    <TouchableOpacity style={styles.chatItemContainer}>
        {/* Component Image sẽ tự động xử lý source từ require() */}
        <Image source={item.avatar} style={styles.avatar} />
        <View style={styles.chatContent}>
            <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={styles.chatTime}>{item.time}</Text>
            </View>
            <Text style={styles.chatMessage} numberOfLines={1}>{item.message}</Text>
        </View>
    </TouchableOpacity>
);

const ChatScreen = ({ navigation }) => {
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Chat',
            headerRight: () => (
                <TouchableOpacity onPress={() => alert('Search pressed!')} style={{ marginRight: 15 }}>
                    <Icon name="search-outline" size={24} color="#000" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    return (
        <View style={styles.container}>
            <FlatList
                data={chatData}
                renderItem={({ item }) => <ChatItem item={item} />}
                keyExtractor={item => item.id}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    chatItemContainer: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    chatContent: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    chatName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    chatTime: {
        fontSize: 12,
        color: '#888',
    },
    chatMessage: {
        fontSize: 14,
        color: '#555',
    },
});

export default ChatScreen;