import { detectIntent, mapStatusToLabel, normalizeText } from '../lab2/utils/chatbot';

describe('chatbot intent detection', () => {
  it('detects greeting intent with diacritics', () => {
    expect(detectIntent('Xin chào trợ lý!')).toBe('greeting');
  });

  it('detects help intent for usage questions', () => {
    expect(detectIntent('Làm sao để đặt lịch hẹn?')).toBe('help');
  });

  it('detects upcoming appointment intent', () => {
    expect(detectIntent('Cho tôi xem lịch sắp tới')).toBe('upcoming');
  });

  it('returns fallback when message is empty', () => {
    expect(detectIntent('   ')).toBe('fallback');
  });
});

describe('chatbot status label mapping', () => {
  it('maps known status codes to Vietnamese labels', () => {
    expect(mapStatusToLabel('pending')).toBe('Chờ xác nhận');
    expect(mapStatusToLabel('confirmed')).toBe('Đã xác nhận');
    expect(mapStatusToLabel('completed')).toBe('Đã hoàn thành');
  });

  it('handles unknown or missing statuses gracefully', () => {
    expect(mapStatusToLabel('unknown')).toBe('Không rõ');
    expect(mapStatusToLabel(undefined)).toBe('Không rõ');
    expect(mapStatusToLabel(null)).toBe('Không rõ');
  });
});

describe('chatbot text normalization', () => {
  it('removes diacritics and lowercases text', () => {
    expect(normalizeText('Đặt LỊCH')).toBe('dat lich');
  });
});
