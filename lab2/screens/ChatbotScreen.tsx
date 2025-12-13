
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GiftedChat, IMessage, Reply, Bubble, Send, InputToolbar } from 'react-native-gifted-chat';
import { View, StyleSheet, Image, StatusBar, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import uuid from 'react-native-uuid';
import { COLORS } from '../theme/colors';

import {
  detectIntent,
  mapStatusToLabel,
  QUICK_REPLY_TEMPLATES,
  type QuickReplyKey,
  type ChatbotIntent,
} from '../utils/chatbot';

import { askGemini } from '../services/geminiService';
import { sendMessageToAdmin, listenToAdminReplies } from '../services/adminMessageService';

type AppointmentDocument = {
  id: string;
  serviceName?: string;
  appointmentDateTime?: FirebaseFirestoreTypes.Timestamp | Date;
  status?: string;
};

type CachedValue<T> = {
  value: T;
  fetchedAt: number;
};

type BotReply = {
  text: string;
  quickReplyKeys?: QuickReplyKey[];
};

type UserProfile = {
  name?: string;
  gender?: string;
  phone?: string;
  address?: string;
};

const BOT_USER = {
  _id: 'care_assistant_bot',
  name: 'Trợ lý ảo',
  avatar: 'https://ui-avatars.com/api/?name=Tro+Ly+Ao&background=E91E63&color=fff&size=128&rounded=true',
};

const QUICK_REPLY_ORDER: QuickReplyKey[] = [
  'help',
  'upcoming',
  'history',
  'health',
  'nutrition',
  'account',
];

const QUICK_REPLY_INTENT_MAP: Record<QuickReplyKey, ChatbotIntent> = {
  help: 'help',
  upcoming: 'upcoming',
  history: 'history',
  health: 'health',
  nutrition: 'nutrition',
  account: 'account',
  contact_admin: 'contact_admin',
};

const CACHE_DURATION_MS = 5 * 60 * 1000;
const MAX_HISTORY_MESSAGES = 60;

const createMessageId = () => String(uuid.v4());

const delay = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const createBotMessage = (text: string, quickReplyKeys?: QuickReplyKey[], createdAt?: Date): IMessage => {
  const message: IMessage = {
    _id: createMessageId(),
    text,
    createdAt: createdAt ?? new Date(),
    user: BOT_USER,
  };

  if (quickReplyKeys && quickReplyKeys.length) {
    message.quickReplies = {
      type: 'radio',
      keepIt: false,
      values: quickReplyKeys.map(key => QUICK_REPLY_TEMPLATES[key]),
    };
  }

  return message;
};

const createUserMessage = (text: string, user: FirebaseAuthTypes.User | null): IMessage => ({
  _id: createMessageId(),
  text,
  createdAt: new Date(),
  user: {
    _id: user?.uid ?? 'guest',
    name: user?.displayName ?? 'Bạn',
  },
});

const limitHistory = (history: IMessage[]) => history.slice(0, MAX_HISTORY_MESSAGES);

const extractDate = (value?: FirebaseFirestoreTypes.Timestamp | Date): Date | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if ('toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  return null;
};

const formatAppointmentLine = (serviceName: string, date: Date, status?: string) => {
  const dateText = date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeText = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const statusText = status ? mapStatusToLabel(status) : undefined;

  return `• ${serviceName} vào ${dateText} lúc ${timeText}${statusText ? ` (${statusText})` : ''}`;
};

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

const ChatbotScreen = ({ navigation }: { navigation: any }) => {
  // Ẩn header cũ để dùng custom header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<FirebaseAuthTypes.User | null>(auth().currentUser);
  const [waitingForAdminMessage, setWaitingForAdminMessage] = useState<boolean>(false);

  const appointmentsCacheRef = useRef<CachedValue<AppointmentDocument[]> | null>(null);
  const profileCacheRef = useRef<CachedValue<UserProfile | null> | null>(null);

  useEffect(() => {
    const greeting = createBotMessage(
      'Xin chào! Tôi là trợ lý ảo của bạn. Tôi có thể giúp gì cho bạn hôm nay?',
      undefined,
      new Date(Date.now() - 1000),
    );
    const suggestions = createBotMessage(
      'Bạn có thể hỏi tôi về:\n• Lịch hẹn sắp tới\n• Lịch sử khám\n• Tư vấn sức khỏe & dinh dưỡng\n• Hướng dẫn sử dụng ứng dụng\n• 🔬 Phân tích triệu chứng bằng AI (chụp ảnh)',
      QUICK_REPLY_ORDER,
    );

    setMessages([suggestions, greeting]);
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      setCurrentUser(user);
      appointmentsCacheRef.current = null;
      profileCacheRef.current = null;
    });

    return unsubscribe;
  }, []);

  // Lắng nghe câu trả lời từ Admin
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    try {
      const unsubscribe = listenToAdminReplies(currentUser.uid, adminMessage => {
        if (adminMessage.adminReply) {
          const botMessage = createBotMessage(
            `📨 Admin đã trả lời:\n\n"${adminMessage.adminReply}"\n\n💬 Bạn có thể tiếp tục hỏi bằng cách chọn "Trả lời Admin" bên dưới hoặc đặt câu hỏi mới.`,
            ['contact_admin', 'help', 'upcoming'],
          );
          setMessages(previousMessages => limitHistory(GiftedChat.append(previousMessages, [botMessage])));
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up admin replies listener:', error);
      // Không crash app, chỉ log lỗi
    }
  }, [currentUser]);

  const loadAppointments = useCallback(async (): Promise<AppointmentDocument[]> => {
    if (!currentUser) {
      return [];
    }

    const now = Date.now();
    const cached = appointmentsCacheRef.current;
    if (cached && now - cached.fetchedAt < CACHE_DURATION_MS) {
      return cached.value;
    }

    try {
      const snapshot = await firestore()
        .collection('appointments')
        .where('customerId', '==', currentUser.uid)
        .orderBy('appointmentDateTime', 'desc')
        .get();

      const data: AppointmentDocument[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      appointmentsCacheRef.current = { value: data, fetchedAt: now };
      return data;
    } catch (error) {
      console.error('Chatbot::loadAppointments error', error);
      throw error;
    }
  }, [currentUser]);

  const loadUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!currentUser) {
      return null;
    }

    const now = Date.now();
    const cached = profileCacheRef.current;
    if (cached && now - cached.fetchedAt < CACHE_DURATION_MS) {
      return cached.value;
    }

    try {
      const docSnapshot = await firestore().collection('users').doc(currentUser.uid).get();

      if (!docSnapshot.exists) {
        profileCacheRef.current = { value: null, fetchedAt: now };
        return null;
      }

      const profile = docSnapshot.data() as UserProfile;
      profileCacheRef.current = { value: profile, fetchedAt: now };
      return profile;
    } catch (error) {
      console.error('Chatbot::loadUserProfile error', error);
      return null;
    }
  }, [currentUser]);

  const generateBotReply = useCallback(
    async (rawInput: string): Promise<BotReply> => {
      const trimmed = rawInput.trim();
      console.log('🔍 generateBotReply called:', { trimmed, waitingForAdminMessage });

      if (!trimmed) {
        return {
          text: 'Tôi chưa nghe rõ câu hỏi của bạn. Bạn có thể chọn một trong những lựa chọn bên dưới nhé.',
          quickReplyKeys: QUICK_REPLY_ORDER,
        };
      }

      // Nếu đang ở chế độ nhắn admin, gửi tất cả tin nhắn cho admin
      if (waitingForAdminMessage && !trimmed.startsWith('intent:')) {
        console.log('✅ Đang ở chế độ nhắn Admin');
        // Kiểm tra lệnh thoát
        const exitCommands = ['thoát', 'exit', 'dừng', 'stop', 'hủy', 'cancel'];
        if (exitCommands.some(cmd => trimmed.toLowerCase().includes(cmd))) {
          setWaitingForAdminMessage(false);
          return {
            text: '✅ Đã thoát chế độ nhắn Admin.\n\nBạn có thể tiếp tục chat với trợ lý ảo hoặc chọn chủ đề bên dưới.',
            quickReplyKeys: QUICK_REPLY_ORDER,
          };
        }

        if (!currentUser) {
          setWaitingForAdminMessage(false);
          return {
            text: 'Bạn cần đăng nhập để có thể nhắn tin cho Admin.',
            quickReplyKeys: ['help'],
          };
        }

        try {
          const profile = await loadUserProfile();
          await sendMessageToAdmin(
            currentUser.uid,
            profile?.name || currentUser.displayName || 'Người dùng',
            currentUser.email || '',
            trimmed,
          );

          // GIỮ NGUYÊN state để tiếp tục nhận tin nhắn cho admin
          return {
            text: '✅ Đã gửi: "' + trimmed + '"\n\nAdmin sẽ trả lời sớm. Bạn có thể tiếp tục nhắn tin hoặc gõ "thoát" để dừng.',
            quickReplyKeys: [], // Không hiện quick replies khi đang trong chế độ chat
          };
        } catch (error) {
          console.error('Error sending to admin:', error);
          return {
            text: '❌ Lỗi: Không thể gửi tin nhắn.\n\nVui lòng kiểm tra kết nối hoặc gọi Hotline: 0911550316\n\nGõ "thoát" để dừng nhắn Admin.',
            quickReplyKeys: [],
          };
        }
      }

      let interpretedIntent: ChatbotIntent;
      if (trimmed.startsWith('intent:')) {
        const alias = trimmed.split(':')[1] as QuickReplyKey | undefined;
        interpretedIntent = alias ? QUICK_REPLY_INTENT_MAP[alias] ?? 'help' : 'help';
      } else {
        interpretedIntent = detectIntent(trimmed);
      }

      console.log('🎯 Detected intent:', interpretedIntent, 'for message:', trimmed);

      try {
        switch (interpretedIntent) {
          case 'greeting': {
            const profile = await loadUserProfile();
            const name = profile?.name || currentUser?.displayName || 'bạn';
            return {
              text: `Chào ${name}! 👋\n\nTôi là trợ lý ảo của ứng dụng chăm sóc sức khỏe. Tôi có thể giúp bạn:\n• 📅 Kiểm tra và quản lý lịch hẹn\n• 📖 Hướng dẫn sử dụng ứng dụng (5 tab: Trang chủ, Hỗ trợ, Đặt lịch, Tin tức, Cá nhân)\n• 💪 Tư vấn sức khỏe và dinh dưỡng\n• ☎️ Hỗ trợ Hotline khẩn cấp: 0911550316\n• 🔔 Theo dõi thông báo và nhắc nhở\n\nBạn muốn tìm hiểu điều gì?`,
              quickReplyKeys: QUICK_REPLY_ORDER,
            };
          }

          case 'help': {
            return {
              text:
                '📱 Ứng dụng có 5 tab chính:\n\n🏠 Trang chủ: Xem lịch hẹn sắp tới, tin tức sức khỏe, và truy cập nhanh các tính năng.\n💬 Hỗ trợ: Chat với tôi để được tư vấn và hướng dẫn.\n📅 Đặt lịch: Xem danh sách dịch vụ và đặt lịch hẹn khám.\n📰 Tin tức: Đọc các bài viết về sức khỏe và y tế.\n👤 Cá nhân: Quản lý hồ sơ, xem lịch hẹn, thông báo và đổi mật khẩu.\n\n✨ Tính năng nổi bật:\n• 📞 Hotline: Gọi điện trực tiếp 0911550316 từ trang chủ\n• 🔔 Thông báo thông minh: Cập nhật kịp thời và nhanh chóng\n• 🚀 Lịch hẹn thông minh: Theo dõi trạng thái và lịch sử đặt lịch\n• 🎨 UI/UX chuyên nghiệp: Giao diện dễ tiếp cận và thân thiện\n\nCần hỗ trợ gì thêm không?',
              quickReplyKeys: ['upcoming', 'history', 'account', 'health', 'nutrition'],
            };
          }

          case 'upcoming': {
            if (!currentUser) {
              return {
                text: 'Bạn cần đăng nhập để tôi có thể kiểm tra lịch hẹn giúp bạn.',
                quickReplyKeys: ['help', 'health', 'nutrition'],
              };
            }

            const appointments = await loadAppointments();
            const upcoming = appointments
              .map(item => ({ ...item, date: extractDate(item.appointmentDateTime) }))
              .filter(item => item.date && item.date.getTime() > Date.now())
              .sort((a, b) => (a.date!.getTime() > b.date!.getTime() ? 1 : -1));

            if (upcoming.length === 0) {
              return {
                text:
                  '📅 Hiện bạn chưa có lịch hẹn nào sắp tới.\n\nĐể đặt lịch mới, bạn có thể:\n• Vào tab "Đặt lịch" ở giữa thanh tab\n• Hoặc từ Trang chủ → nhấn "Lịch hẹn"\n• Hoặc từ tab Cá nhân → "Lịch hẹn khám"\n\nNếu gấp, gọi Hotline: 0911550316 để được hỗ trợ ngay!',
                quickReplyKeys: ['help', 'history', 'nutrition'],
              };
            }

            const lines = upcoming.slice(0, 3).map(item =>
              formatAppointmentLine(item.serviceName ?? 'Dịch vụ', item.date!, item.status),
            );

            return {
              text:
                'Đây là các lịch hẹn sắp tới của bạn:\n' +
                lines.join('\n') +
                '\nChúc bạn có trải nghiệm tuyệt vời! Nếu cần chuẩn bị gì trước buổi hẹn, tôi cũng có thể tư vấn.',
              quickReplyKeys: ['history', 'health', 'nutrition'],
            };
          }

          case 'history': {
            if (!currentUser) {
              return {
                text: 'Bạn cần đăng nhập để xem lịch sử hẹn. Vào mục "Đăng nhập" và thử lại nhé!',
                quickReplyKeys: ['help', 'health', 'nutrition'],
              };
            }

            const appointments = await loadAppointments();
            if (appointments.length === 0) {
              return {
                text: '📝 Tôi chưa tìm thấy lịch hẹn nào trong tài khoản của bạn.\n\nĐể xem chi tiết lịch hẹn, bạn có thể:\n• Vào tab "Cá nhân" → "Lịch hẹn khám"\n• Lọc theo trạng thái: Tất cả, Chờ xác nhận, Hoàn thành, Đã hủy\n• Xem chi tiết từng lịch hẹn\n\nBạn muốn đặt lịch mới không?',
                quickReplyKeys: ['help', 'upcoming', 'nutrition'],
              };
            }

            const lines = appointments.slice(0, 4).map(item => {
              const date = extractDate(item.appointmentDateTime);
              if (!date) {
                return `• ${item.serviceName ?? 'Dịch vụ'} (không rõ thời gian) - ${mapStatusToLabel(item.status)}`;
              }
              return formatAppointmentLine(item.serviceName ?? 'Dịch vụ', date, item.status);
            });

            return {
              text:
                'Tổng kết một số lịch hẹn gần đây của bạn:\n' +
                lines.join('\n') +
                '\nBạn có muốn xem chi tiết một lịch hẹn cụ thể không?',
              quickReplyKeys: ['upcoming', 'health', 'account'],
            };
          }

          case 'health': {
            // Nếu câu hỏi chi tiết hoặc có dạng hỏi "làm sao", "cách nào", gọi AI
            const wordCount = trimmed.split(/\s+/).length;
            const hasNumbers = /\d/.test(trimmed);
            const normalized = trimmed.toLowerCase();
            const isQuestionForm =
              normalized.includes('lam sao') ||
              normalized.includes('làm sao') ||
              normalized.includes('lam nhu nao') ||
              normalized.includes('làm như nào') ||
              normalized.includes('cach nao') ||
              normalized.includes('cách nào') ||
              normalized.includes('the nao') ||
              normalized.includes('thế nào') ||
              normalized.match(/\?$/);

            if (wordCount > 10 || hasNumbers || isQuestionForm) {
              console.log('🤖 Calling Gemini AI for detailed health question:', trimmed);
              try {
                const aiResponse = await askGemini(trimmed);
                console.log('✅ Gemini AI response for health:', aiResponse);

                return {
                  text: aiResponse.suggestAdminContact
                    ? `${aiResponse.text}\n\n💡 Cần tư vấn chuyên sâu? Nhắn Admin hoặc gọi: 0911550316`
                    : aiResponse.text,
                  quickReplyKeys: ['contact_admin', 'nutrition', 'upcoming'],
                };
              } catch (error) {
                console.error('❌ Error calling Gemini AI for health:', error);
                return {
                  text: 'Xin lỗi, tôi đang gặp trục trặc kỹ thuật. Bạn có thể:\n• Nhắn cho Admin để được tư vấn trực tiếp\n• Gọi Hotline: 0911550316',
                  quickReplyKeys: ['contact_admin', 'help'],
                };
              }
            }

            // Câu hỏi chung về sức khỏe -> trả lời chuẩn
            const profile = await loadUserProfile();
            const name = profile?.name || currentUser?.displayName || 'bạn';
            const personalized = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
            return {
              text:
                `💪 ${personalized}, để duy trì sức khỏe tốt bạn nên:\n\n🥗 Dinh dưỡng:\n• Ăn uống đầy đủ và cân đối\n• Ưu tiên rau xanh & trái cây\n• Uống đủ 1.5-2 lít nước/ngày\n\n🏃 Vận động:\n• Ít nhất 30 phút mỗi ngày\n• Đi bộ, yoga, đạp xe\n\n😴 Nghỉ ngơi:\n• Ngủ đủ 7-8 tiếng\n• Hạn chế màn hình trước khi ngủ\n\n🔔 Nhắc nhở:\n• Ứng dụng sẽ gửi thông báo nhắc uống nước hàng ngày\n• Nhận thông báo về lịch hẹn sắp tới (24h trước)\n\n☎️ Khẩn cấp? Gọi Hotline: 0911550316`,
              quickReplyKeys: ['upcoming', 'nutrition', 'help'],
            };
          }

          case 'nutrition': {
            // Nếu câu hỏi chi tiết hoặc có dạng hỏi "làm sao", "cách nào", gọi AI
            const wordCount = trimmed.split(/\s+/).length;
            const hasNumbers = /\d/.test(trimmed);
            const normalized = trimmed.toLowerCase();
            const isQuestionForm =
              normalized.includes('lam sao') ||
              normalized.includes('làm sao') ||
              normalized.includes('lam nhu nao') ||
              normalized.includes('làm như nào') ||
              normalized.includes('cach nao') ||
              normalized.includes('cách nào') ||
              normalized.includes('the nao') ||
              normalized.includes('thế nào') ||
              normalized.match(/\?$/);

            if (wordCount > 10 || hasNumbers || isQuestionForm) {
              console.log('🤖 Calling Gemini AI for detailed nutrition question:', trimmed);
              try {
                const aiResponse = await askGemini(trimmed);
                console.log('✅ Gemini AI response for nutrition:', aiResponse);

                return {
                  text: aiResponse.suggestAdminContact
                    ? `${aiResponse.text}\n\n💡 Cần tư vấn chuyên sâu? Nhắn Admin hoặc gọi: 0911550316`
                    : aiResponse.text,
                  quickReplyKeys: ['contact_admin', 'health', 'upcoming'],
                };
              } catch (error) {
                console.error('❌ Error calling Gemini AI for nutrition:', error);
                return {
                  text: 'Xin lỗi, tôi đang gặp trục trặc kỹ thuật. Bạn có thể:\n• Nhắn cho Admin để được tư vấn trực tiếp\n• Gọi Hotline: 0911550316',
                  quickReplyKeys: ['contact_admin', 'help'],
                };
              }
            }

            // Câu hỏi chung về dinh dưỡng -> trả lời chuẩn
            const profile = await loadUserProfile();
            const gender = profile?.gender?.toLowerCase();
            const focus =
              gender === 'nữ'
                ? 'bổ sung thêm sắt và canxi từ rau xanh đậm, đậu phụ và sữa.'
                : 'duy trì khẩu phần giàu đạm lành mạnh như cá, thịt nạc, cùng với nhiều rau củ.';
            return {
              text:
                `🥗 Một chế độ dinh dưỡng cân bằng:\n\n📊 Tỷ lệ khuyến nghị:\n• 50% rau củ và trái cây tươi\n• 25% đạm lành mạnh (cá, đậu, thịt nạc)\n• 25% tinh bột nguyên cám (gạo lứt, yến mạch)\n\n💧 Hydrate:\n• Uống đủ 1.5-2 lít nước/ngày\n• Hạn chế đồ uống có đường\n• Nhận nhắc nhở uống nước từ thông báo\n\n👤 Cá nhân hóa:\n• ${focus}\n\n📰 Đọc thêm:\n• Vào tab "Tin tức" để xem bài viết về dinh dưỡng và sức khỏe\n• Trang chủ cũng hiển thị tin tức nổi bật\n\n☎️ Tư vấn chuyên sâu? Gọi: 0911550316`,
              quickReplyKeys: ['health', 'upcoming', 'history'],
            };
          }

          case 'account': {
            if (!currentUser) {
              return {
                text: 'Bạn chưa đăng nhập. Đăng nhập để tôi giúp kiểm tra hồ sơ của bạn nhé.',
                quickReplyKeys: ['help'],
              };
            }

            const profile = await loadUserProfile();
            if (!profile) {
              return {
                text:
                  'Tôi chưa tìm thấy thông tin hồ sơ. Bạn có thể vào mục "Hồ sơ" để bổ sung họ tên, số điện thoại và địa chỉ, sau đó quay lại hỏi tôi nhé!',
                quickReplyKeys: ['help', 'health'],
              };
            }

            const hasPhone = Boolean(profile.phone);
            const details = [
              profile.name ? `• Họ tên: ${profile.name}` : '• Bạn chưa cập nhật họ tên.',
              hasPhone ? `• Số điện thoại: ${profile.phone}` : '• Bạn chưa thêm số điện thoại.',
              profile.address ? `• Địa chỉ: ${profile.address}` : '• Địa chỉ chưa được cập nhật.',
            ];

            return {
              text:
                '👤 Tôi đã kiểm tra hồ sơ của bạn:\n' +
                details.join('\n') +
                '\n\n📱 Tính năng trong tab Cá nhân:\n• ✏️ Chỉnh sửa thông tin cá nhân\n• 📅 Xem và quản lý lịch hẹn khám\n• 🔔 Thông báo: Lọc (Tất cả/Chưa đọc/Đã đọc), xóa đơn lẻ/tất cả với giao diện đẹp\n• 🔐 Đổi mật khẩu: Thông báo lỗi rõ ràng (VD: "Mật khẩu không đúng" thay vì mã lỗi)\n• 📊 Hiệu suất tối ưu: Tải thông báo nhanh 60-80% hơn trước\n• 🚪 Đăng xuất\n\nBạn có thể cập nhật thông tin bất cứ lúc nào!',
              quickReplyKeys: ['help', 'upcoming', 'history'],
            };
          }

          case 'thanks':
            return {
              text: 'Rất vui khi được giúp bạn! Nếu còn điều gì thắc mắc, cứ hỏi tôi tiếp nhé.',
              quickReplyKeys: QUICK_REPLY_ORDER,
            };

          case 'contact_admin': {
            if (!currentUser) {
              return {
                text: 'Bạn cần đăng nhập để có thể nhắn tin cho Admin.',
                quickReplyKeys: ['help'],
              };
            }

            // Nếu là quick reply (không có nội dung thực), bật chế độ chờ tin nhắn
            if (trimmed === 'intent:contact_admin' || trimmed.toLowerCase().includes('nhắn admin')) {
              setWaitingForAdminMessage(true); // Bật chế độ chờ
              return {
                text: '💬 Chế độ nhắn Admin đã BẬT\n\n📝 Từ giờ, mọi tin nhắn bạn gửi sẽ được chuyển trực tiếp đến Admin cho đến khi bạn:\n• Gõ "thoát" để dừng\n• Thoát ứng dụng\n\n💡 Bắt đầu nhắn tin cho Admin ngay bây giờ!\n\n📞 Gọi Hotline: 0911550316 nếu cần gấp.',
                quickReplyKeys: [],
              };
            }

            // Không bao giờ đến đây vì đã xử lý ở trên
            return {
              text: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
              quickReplyKeys: ['help'],
            };
          }

          case 'fallback':
          default: {
            // Gọi AI để trả lời (bỏ kiểm tra isRelevantQuestion)
            console.log('🤖 Calling Gemini AI for question:', trimmed);
            try {
              const aiResponse = await askGemini(trimmed);
              console.log('✅ Gemini AI response:', aiResponse);

              // Nếu AI không chắc chắn, đề xuất nhắn Admin
              if (aiResponse.suggestAdminContact) {
                return {
                  text: `${aiResponse.text}\n\n💡 Nếu cần hỗ trợ chi tiết hơn, bạn có thể nhắn trực tiếp cho Admin hoặc gọi Hotline: 0911550316`,
                  quickReplyKeys: ['contact_admin', 'help', 'health'],
                };
              }

              return {
                text: aiResponse.text,
                quickReplyKeys: ['contact_admin', 'help', 'upcoming'],
              };
            } catch (error) {
              console.error('❌ AI fallback error:', error);
              return {
                text: '🤔 Xin lỗi, tôi đang gặp chút vấn đề kỹ thuật.\n\nBạn có thể:\n• Chọn một chủ đề bên dưới\n• Nhắn trực tiếp cho Admin\n• Gọi Hotline: 0911550316',
                quickReplyKeys: ['contact_admin', 'help', 'upcoming'],
              };
            }
          }
        }
      } catch (error) {
        console.error('Chatbot::generateBotReply error', error);
        return {
          text: 'Xin lỗi, tôi đang gặp chút trục trặc khi truy xuất dữ liệu. Bạn hãy thử lại sau một lát nhé!',
          quickReplyKeys: ['help', 'health', 'nutrition'],
        };
      }
    },
    [currentUser, loadAppointments, loadUserProfile, waitingForAdminMessage],
  );

  const handleBotResponse = useCallback(
    async (rawInput: string) => {
      setIsTyping(true);
      try {
        const reply = await generateBotReply(rawInput);
        await delay(500);
        const botMessage = createBotMessage(reply.text, reply.quickReplyKeys);
        setMessages(previousMessages =>
          limitHistory(GiftedChat.append(previousMessages, [botMessage])),
        );
      } finally {
        setIsTyping(false);
      }
    },
    [generateBotReply],
  );

  const handleQuickReply = useCallback(
    (replies: Reply[]) => {
      if (!replies || replies.length === 0) {
        return;
      }
      const reply = replies[0];
      const visibleText = reply.title ?? reply.value ?? '';
      if (!visibleText) {
        return;
      }

      const userMessage = createUserMessage(visibleText, currentUser);
      setMessages(previousMessages =>
        limitHistory(GiftedChat.append(previousMessages, [userMessage])),
      );

      const payload = reply.value ?? reply.title;
      handleBotResponse(payload ?? visibleText).catch(error => {
        console.error('Chatbot::handleQuickReply error', error);
      });
    },
    [currentUser, handleBotResponse],
  );

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (!newMessages.length) {
        return;
      }

      setMessages(previousMessages =>
        limitHistory(GiftedChat.append(previousMessages, newMessages)),
      );

      await handleBotResponse(newMessages[0].text);
    },
    [handleBotResponse],
  );

  return (
    <LinearGradient
      colors={['#a8edea', '#fed6e3', '#ffecd2']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.container}
    >
      <CustomHeader title="Hỗ trợ" />
      <GiftedChat
      messages={messages}
      onSend={onSend}
      onQuickReply={handleQuickReply}
      user={{
        _id: currentUser?.uid ?? 'guest',
        name: currentUser?.displayName ?? 'Bạn',
      }}
      isTyping={isTyping}
      alwaysShowSend
      placeholder="Nhập câu hỏi cho trợ lý..."
      showUserAvatar
      renderUsernameOnMessage
      renderBubble={renderBubble}
      renderSend={renderSend}
      renderInputToolbar={renderInputToolbar}
      messagesContainerStyle={styles.listView}
      bottomOffset={40}
      timeFormat="HH:mm"
      dateFormat="DD/MM/YYYY"
      renderAvatarOnTop
      maxComposerHeight={100}
      minComposerHeight={40}
    />
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
  listView: {
    backgroundColor: 'transparent',
  },
  textInput: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 12,
    marginHorizontal: 8,
    color: '#333',
    fontSize: 16,
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 5,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  inputToolbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    marginHorizontal: 8,
    marginBottom: 8,
    paddingVertical: 4,
  },
  bubbleLeft: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bubbleRight: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 4,
  },
  textLeft: {
    color: '#333',
    fontSize: 15,
    lineHeight: 20,
  },
  textRight: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 20,
  },
  timeTextLeft: {
    color: '#999',
    fontSize: 11,
  },
  timeTextRight: {
    color: '#FFF',
    fontSize: 11,
    opacity: 0.8,
  },
  usernameStyle: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  quickReplyStyle: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  quickReplyTextStyle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  inputPrimaryStyle: {
    alignItems: 'center',
  },
});

// Render custom bubble
const renderBubble = (props: any) => {
  return (
    <Bubble
      {...props}
      wrapperStyle={{
        left: styles.bubbleLeft,
        right: styles.bubbleRight,
      }}
      textStyle={{
        left: styles.textLeft,
        right: styles.textRight,
      }}
      timeTextStyle={{
        left: styles.timeTextLeft,
        right: styles.timeTextRight,
      }}
      usernameStyle={styles.usernameStyle}
      quickReplyStyle={styles.quickReplyStyle}
      quickReplyTextStyle={styles.quickReplyTextStyle}
    />
  );
};

// Render custom send button
const renderSend = (props: any) => {
  return (
    <Send {...props} containerStyle={styles.sendContainer}>
      <View style={styles.sendButton}>
        <Icon name="send" size={20} color="#FFF" />
      </View>
    </Send>
  );
};

// Render custom input toolbar
const renderInputToolbar = (props: any) => {
  return (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      primaryStyle={styles.inputPrimaryStyle}
      textInputStyle={styles.textInput}
    />
  );
};

export default ChatbotScreen;
