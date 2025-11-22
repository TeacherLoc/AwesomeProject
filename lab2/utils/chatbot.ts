const DIACRITIC_REGEX = /[\u0300-\u036f]/g;

export type ChatbotIntent =
  | 'help'
  | 'upcoming'
  | 'history'
  | 'health'
  | 'nutrition'
  | 'account'
  | 'greeting'
  | 'thanks'
  | 'fallback';

type KeywordConfig = {
  intent: ChatbotIntent;
  keywords: string[];
};

const KEYWORD_CONFIG: KeywordConfig[] = [
  {
    intent: 'thanks',
    keywords: ['cam on', 'cam on ban', 'thank', 'thanks', 'gratitude'],
  },
  {
    intent: 'greeting',
    keywords: ['xin chao', 'chao', 'hello', 'hi', 'good morning', 'good evening'],
  },
  {
    intent: 'help',
    keywords: [
      'huong dan',
      'cach dung',
      'cach su dung',
      'cach hoat dong',
      'duong dan',
      'huong dan su dung',
      'lam sao',
      'giup toi',
      'tro giup',
      'dat lich the nao',
      'dang ky',
      'tinh nang',
      'co gi',
      'lam duoc gi',
      'ung dung nay',
      'tab',
      'hotline',
      'thong bao',
    ],
  },
  {
    intent: 'upcoming',
    keywords: ['lich sap toi', 'cuoc hen sap toi', 'hen sap den', 'lich sap den'],
  },
  {
    intent: 'history',
    keywords: ['lich su', 'lich hen truoc', 'da kham', 'nhat ky', 'lich cu', 'lich hen cu'],
  },
  {
    intent: 'health',
    keywords: ['suc khoe', 'tap luyen', 'tap the duc', 'benh tat', 'khoe manh'],
  },
  {
    intent: 'nutrition',
    keywords: ['dinh duong', 'thuc an', 'an uong', 'thuc don', 'an gi'],
  },
  {
    intent: 'account',
    keywords: ['tai khoan', 'ho so', 'doi mat khau', 'cap nhat thong tin', 'profile', 'thong tin ca nhan'],
  },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Đã hoàn thành',
  rejected: 'Đã từ chối',
  cancelled_by_customer: 'Khách hủy',
  cancelled_by_admin: 'Cơ sở hủy',
};

export const normalizeText = (input: string): string =>
  input
    .normalize('NFD')
    .replace(DIACRITIC_REGEX, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .trim();

const containsKeyword = (text: string, keyword: string): boolean => text.includes(keyword);

export const detectIntent = (rawMessage: string): ChatbotIntent => {
  const normalized = normalizeText(rawMessage);
  if (!normalized) {
    return 'fallback';
  }

  for (const entry of KEYWORD_CONFIG) {
    if (entry.keywords.some(keyword => containsKeyword(normalized, keyword))) {
      return entry.intent;
    }
  }

  return 'fallback';
};

export const mapStatusToLabel = (status?: string | null): string => {
  if (!status) {
    return 'Không rõ';
  }
  const key = status.toLowerCase();
  return STATUS_LABELS[key] ?? 'Không rõ';
};

export const QUICK_REPLY_TEMPLATES = {
  help: { title: 'Hướng dẫn sử dụng', value: 'intent:help' },
  upcoming: { title: 'Lịch hẹn sắp tới', value: 'intent:upcoming' },
  history: { title: 'Lịch sử khám', value: 'intent:history' },
  health: { title: 'Tư vấn sức khỏe', value: 'intent:health' },
  nutrition: { title: 'Tư vấn dinh dưỡng', value: 'intent:nutrition' },
  account: { title: 'Hồ sơ của tôi', value: 'intent:account' },
} as const;

export type QuickReplyKey = keyof typeof QUICK_REPLY_TEMPLATES;
