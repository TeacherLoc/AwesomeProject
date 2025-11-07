import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GiftedChat, IMessage, Reply } from 'react-native-gifted-chat';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import uuid from 'react-native-uuid';

import {
  detectIntent,
  mapStatusToLabel,
  QUICK_REPLY_TEMPLATES,
  type QuickReplyKey,
  type ChatbotIntent,
} from '../utils/chatbot';

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
  avatar: 'https://placehold.co/140x140?text=BOT',
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

const ChatbotScreen = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<FirebaseAuthTypes.User | null>(auth().currentUser);

  const appointmentsCacheRef = useRef<CachedValue<AppointmentDocument[]> | null>(null);
  const profileCacheRef = useRef<CachedValue<UserProfile | null> | null>(null);

  useEffect(() => {
    const greeting = createBotMessage(
      'Xin chào! Tôi là trợ lý ảo của bạn. Tôi có thể giúp gì cho bạn hôm nay?',
      undefined,
      new Date(Date.now() - 1000),
    );
    const suggestions = createBotMessage(
      'Bạn có thể hỏi tôi về:\n• Lịch hẹn sắp tới\n• Lịch sử khám\n• Tư vấn sức khỏe & dinh dưỡng\n• Hướng dẫn sử dụng ứng dụng',
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
      if (!trimmed) {
        return {
          text: 'Tôi chưa nghe rõ câu hỏi của bạn. Bạn có thể chọn một trong những lựa chọn bên dưới nhé.',
          quickReplyKeys: QUICK_REPLY_ORDER,
        };
      }

      let interpretedIntent: ChatbotIntent;
      if (trimmed.startsWith('intent:')) {
        const alias = trimmed.split(':')[1] as QuickReplyKey | undefined;
        interpretedIntent = alias ? QUICK_REPLY_INTENT_MAP[alias] ?? 'help' : 'help';
      } else {
        interpretedIntent = detectIntent(trimmed);
      }

      try {
        switch (interpretedIntent) {
          case 'greeting': {
            const profile = await loadUserProfile();
            const name = profile?.name || currentUser?.displayName || 'bạn';
            return {
              text: `Chào ${name}! Tôi có thể giúp bạn kiểm tra lịch hẹn, hướng dẫn sử dụng ứng dụng hoặc chia sẻ bí quyết chăm sóc sức khỏe. Bạn muốn tìm hiểu điều gì trước?`,
              quickReplyKeys: QUICK_REPLY_ORDER,
            };
          }

          case 'help': {
            return {
              text:
                'Bạn có thể sử dụng ứng dụng như sau:\n1. Đặt lịch: vào tab "Dịch vụ", chọn dịch vụ và làm theo bước hướng dẫn.\n2. Theo dõi lịch: mở tab "Lịch hẹn" để xem, cập nhật hoặc hủy lịch.\n3. Cập nhật hồ sơ: vào mục "Hồ sơ" để chỉnh sửa thông tin cá nhân.\nNếu cần hỗ trợ thêm, hãy cho tôi biết nhé!',
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
                  'Hiện bạn chưa có lịch hẹn nào sắp tới. Bạn có thể vào tab "Dịch vụ" để đặt lịch mới hoặc hỏi tôi nếu cần hướng dẫn.',
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
                text: 'Tôi chưa tìm thấy lịch hẹn nào trong tài khoản của bạn. Bạn muốn đặt lịch mới không?',
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
            const profile = await loadUserProfile();
            const name = profile?.name || currentUser?.displayName || 'bạn';
            const personalized = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
            return {
              text:
                `${personalized}, để duy trì sức khỏe tốt bạn nên:\n• Ăn uống đầy đủ và cân đối, ưu tiên rau xanh & trái cây.\n• Vận động ít nhất 30 phút mỗi ngày (đi bộ, yoga, đạp xe).\n• Ngủ đủ 7-8 tiếng và hạn chế màn hình trước khi ngủ.\n• Kiểm tra sức khỏe định kỳ nếu cảm thấy bất thường.\nNếu bạn có lịch hẹn sắp tới, hãy đến đúng giờ và chuẩn bị câu hỏi cho bác sĩ nhé!`,
              quickReplyKeys: ['upcoming', 'nutrition', 'help'],
            };
          }

          case 'nutrition': {
            const profile = await loadUserProfile();
            const gender = profile?.gender?.toLowerCase();
            const focus =
              gender === 'nữ'
                ? 'bổ sung thêm sắt và canxi từ rau xanh đậm, đậu phụ và sữa.'
                : 'duy trì khẩu phần giàu đạm lành mạnh như cá, thịt nạc, cùng với nhiều rau củ.';
            return {
              text:
                `Một chế độ dinh dưỡng cân bằng nên bao gồm:\n• 50% rau củ và trái cây tươi.\n• 25% đạm lành mạnh (cá, đậu, thịt nạc).\n• 25% tinh bột nguyên cám (gạo lứt, yến mạch).\n• Uống đủ 1.5-2 lít nước mỗi ngày và hạn chế đồ uống có đường.\nNgoài ra, hãy ${focus} Nếu cần thực đơn chi tiết, bạn có thể hỏi chuyên gia dinh dưỡng tại cơ sở nhé!`,
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
                'Tôi đã kiểm tra hồ sơ của bạn:\n' +
                details.join('\n') +
                '\nBạn có thể vào mục "Hồ sơ" để chỉnh sửa hoặc bổ sung thông tin bất cứ lúc nào.',
              quickReplyKeys: ['help', 'upcoming', 'history'],
            };
          }

          case 'thanks':
            return {
              text: 'Rất vui khi được giúp bạn! Nếu còn điều gì thắc mắc, cứ hỏi tôi tiếp nhé.',
              quickReplyKeys: QUICK_REPLY_ORDER,
            };

          case 'fallback':
          default:
            return {
              text:
                'Tôi chưa hiểu rõ yêu cầu của bạn. Bạn có thể hỏi tôi về lịch hẹn, hướng dẫn sử dụng ứng dụng hoặc xin tư vấn sức khỏe/dinh dưỡng. Hãy thử lại với một từ khóa cụ thể nhé!',
              quickReplyKeys: QUICK_REPLY_ORDER,
            };
        }
      } catch (error) {
        console.error('Chatbot::generateBotReply error', error);
        return {
          text: 'Xin lỗi, tôi đang gặp chút trục trặc khi truy xuất dữ liệu. Bạn hãy thử lại sau một lát nhé!',
          quickReplyKeys: ['help', 'health', 'nutrition'],
        };
      }
    },
    [currentUser, loadAppointments, loadUserProfile],
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
    />
  );
};

export default ChatbotScreen;
