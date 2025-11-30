import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Linking,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    StatusBar} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { parseString } from 'react-native-xml2js';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme/colors'; // Giả sử bạn có file này
import Icon from 'react-native-vector-icons/FontAwesome5'; // Hoặc icon set bạn dùng

// !!! THAY THẾ BẰNG RSS FEED SỨC KHỎE THỰC TẾ BẠN TÌM ĐƯỢC !!!
const HEALTH_RSS_URL = 'https://suckhoedoisong.vn/rss/dinh-duong.rss'; // Ví dụ: RSS của Sức Khỏe & Đời Sống - Dinh dưỡng
// Một số ví dụ khác bạn có thể tìm kiếm:
// - VnExpress Sức khỏe: https://vnexpress.net/rss/suc-khoe.rss
// - Tuổi Trẻ Sức khỏe: https://tuoitre.vn/rss/suc-khoe.rss

interface Article {
    title: string[];
    link: string[];
    description: string[];
    pubDate: string[];
    guid?: [{ _: string }];
    // Thêm các trường khác nếu RSS feed của bạn có, ví dụ ảnh:
    'media:content'?: [{ $: { url: string } }]; // Thường dùng cho ảnh trong RSS
    enclosure?: [{ $: { url: string, type?: string } }]; // Cũng có thể chứa ảnh
}

// Custom Header Component với logo và gradient
const CustomHeader = ({ title }: { title: string }) => {
    return (
        <LinearGradient
            colors={['rgba(120, 220, 215, 0.98)', 'rgba(254, 214, 227, 0.9)', 'rgba(255, 236, 210, 0.95)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.customHeader}
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <View style={styles.headerContent}>
                <View style={styles.headerCenter}>
                    <Image source={require('../assets/logo3.png')} style={styles.headerLogo} resizeMode="contain" />
                    <Text style={styles.headerTitle}>{title}</Text>
                </View>
            </View>
        </LinearGradient>
    );
};

const HealthNewsScreen = ({ navigation }: { navigation: any }) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        navigation.setOptions({
            headerShown: false, // Ẩn header cũ để dùng custom header
        });
    }, [navigation]);

    const fetchHealthNews = useCallback(async () => {
        if (!HEALTH_RSS_URL) {
            setError('Chưa cấu hình URL cho RSS feed sức khỏe.');
            setLoading(false);
            setRefreshing(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(HEALTH_RSS_URL);
            parseString(response.data, (err: any, result: { rss: { channel: { item: Article[]; }[]; }; }) => {
                if (err) {
                    console.error('Parse Error:', err);
                    setError('Không thể phân tích dữ liệu tin tức sức khỏe.');
                    setArticles([]);
                } else {
                    if (result?.rss?.channel?.[0]?.item) {
                        const items: Article[] = result.rss.channel[0].item;
                        setArticles(items);
                    } else {
                        setError('Không tìm thấy bài viết nào trong RSS feed sức khỏe.');
                        setArticles([]);
                    }
                }
                setLoading(false);
                setRefreshing(false);
            });
        } catch (fetchError) {
            console.error('Fetch Health News Error:', fetchError);
            setError('Không thể tải tin tức sức khỏe. Vui lòng kiểm tra kết nối mạng.');
            setArticles([]);
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchHealthNews();
        }, [fetchHealthNews])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchHealthNews();
    }, [fetchHealthNews]);

    const handleOpenLink = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Lỗi', `Không thể mở URL này: ${url}`);
            }
        } catch (linkError) {
            Alert.alert('Lỗi', 'Đã xảy ra sự cố khi mở liên kết.');
            console.error('Link error:', linkError);
        }
    };

    const getImageUrl = (item: Article): string | null => {
        if (item['media:content'] && item['media:content'][0] && item['media:content'][0].$.url) {
            return item['media:content'][0].$.url;
        }
        if (item.enclosure && item.enclosure[0] && item.enclosure[0].$.url && item.enclosure[0].$.type?.startsWith('image/')) {
            return item.enclosure[0].$.url;
        }
        // Bạn có thể thử trích xuất từ thẻ <img> trong description nếu cần, nhưng sẽ phức tạp hơn
        // const descriptionHtml = item.description?.[0];
        // if (descriptionHtml) {
        //     const match = descriptionHtml.match(/<img.*?src=["'](.*?)["']/);
        //     if (match && match[1]) return match[1];
        // }
        return null;
    };

    const renderItem = ({ item }: { item: Article }) => {
        const imageUrl = getImageUrl(item);
        const descriptionText = item.description?.[0]?.replace(/<[^>]+>/g, '').trim() || 'Không có mô tả.';

        return (
            <TouchableOpacity style={styles.itemContainer} onPress={() => handleOpenLink(item.link[0])}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.itemImage} resizeMode="cover" />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Icon name="notes-medical" size={40} color={COLORS.textLight || '#ccc'} />
                    </View>
                )}
                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.title[0]}</Text>
                    {item.pubDate && <Text style={styles.itemDate}>{new Date(item.pubDate[0]).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>}
                    <Text style={styles.itemDescription} numberOfLines={3}>
                        {descriptionText}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary || '#007bff'} />
                <Text style={styles.loadingText}>Đang tải tin tức sức khỏe...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Icon name="heartbeat" size={50} color={COLORS.error || 'red'} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchHealthNews} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (articles.length === 0 && !loading) {
        return (
            <View style={styles.centered}>
                <Icon name="file-medical-alt" size={50} color={COLORS.textMedium || '#888'} />
                <Text style={styles.emptyText}>Không có tin tức sức khỏe nào để hiển thị.</Text>
                <TouchableOpacity onPress={fetchHealthNews} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Tải lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <LinearGradient 
            colors={['#a8edea', '#fed6e3', '#ffecd2']} 
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 1}}
            style={styles.container}
        >
            <CustomHeader title="Tin tức" />
            <View style={styles.contentContainer}>
            <FlatList
                data={articles}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.guid?.[0]?._ || item.link[0] || index.toString()}
                contentContainerStyle={styles.listContentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary || '#007bff']} />
                }
            />
        </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    customHeader: {
        paddingTop: 35,
        paddingBottom: 12,
        paddingHorizontal: 16,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 5,
    },
    headerContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerLogo: {
        width: 28,
        height: 28,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        textShadowColor: 'rgba(255, 255, 255, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    listContentContainer: {
        paddingVertical: 8,
        paddingBottom: 75, // Để tránh bị che bởi tab bar
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.backgroundMain || '#f4f6f8',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: COLORS.textMedium || '#555',
    },
    errorText: {
        color: COLORS.error || 'red',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 15,
        marginTop:10,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: COLORS.textMedium || '#555',
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: COLORS.primary || '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 5,
        marginTop: 20,
    },
    retryButtonText: {
        color: COLORS.white || '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemContainer: {
        backgroundColor: COLORS.white || '#fff',
        marginVertical: 8,
        marginHorizontal: 12,
        borderRadius: 8,
        shadowColor: COLORS.black || '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        flexDirection: 'column', // Changed to column for better image layout
    },
    itemImage: {
        width: '100%',
        height: 180, // Adjust as needed
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    imagePlaceholder: {
        width: '100%',
        height: 150,
        backgroundColor: COLORS.primary || '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    itemContent: {
        padding: 12,
    },
    itemTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 6,
        color: COLORS.textDark || '#333',
    },
    itemDate: {
        fontSize: 12,
        color: COLORS.textLight || '#777',
        marginBottom: 8,
    },
    itemDescription: {
        fontSize: 14,
        color: COLORS.textMedium || '#555',
        lineHeight: 20,
    },
});

export default HealthNewsScreen;
