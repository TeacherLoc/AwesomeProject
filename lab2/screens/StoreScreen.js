import React from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Dữ liệu mẫu
const storeData = [
    { id: '1', name: 'Sản phẩm 1', price: '100.000đ', image: require('../assets/khang.png') },
    { id: '2', name: 'Sản phẩm 2', price: '250.000đ', image: require('../assets/khang.png') },
    { id: '3', name: 'Sản phẩm 3', price: '50.000đ', image: require('../assets/khang.png') },
    { id: '4', name: 'Sản phẩm 4', price: '1.200.000đ', image: require('../assets/khang.png') },
    // Thêm sản phẩm khác
];

const numColumns = 2;
const screenWidth = Dimensions.get('window').width;
const itemWidth = (screenWidth - 30) / numColumns; // 10 padding left, 10 padding right, 10 space between

const StoreItem = ({ item }) => (
    <View style={styles.storeItemContainer}>
        {/* Sửa dòng này: bỏ {{ uri: ... }} */}
        <Image source={item.image} style={styles.itemImage} />
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price}</Text>
        <TouchableOpacity style={styles.buyButton} onPress={() => alert(`Mua ${item.name}`)}>
            <Text style={styles.buyButtonText}>Mua</Text>
        </TouchableOpacity>
    </View>
);

const StoreScreen = ({ navigation }) => {
     React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Store',
             headerRight: () => (
                <TouchableOpacity onPress={() => alert('Search pressed!')} style={{ marginRight: 15 }}>
                    <Icon name="search-outline" size={24} color="#000" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    return (
        <FlatList
            data={storeData}
            renderItem={({ item }) => <StoreItem item={item} />}
            keyExtractor={item => item.id}
            numColumns={numColumns}
            contentContainerStyle={styles.listContainer}
        />
    );
};

const styles = StyleSheet.create({
    listContainer: {
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    storeItemContainer: {
        width: itemWidth,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        marginHorizontal: 5, // Space between columns
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
    },
    itemImage: {
        width: itemWidth - 20, // width - padding*2
        height: 120,
        borderRadius: 4,
        marginBottom: 10,
    },
    itemName: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
    },
    itemPrice: {
        fontSize: 13,
        color: 'green',
        marginBottom: 10,
    },
    buyButton: {
        backgroundColor: '#007bff',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    buyButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});


export default StoreScreen;