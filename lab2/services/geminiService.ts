import { GOOGLE_GEMINI_API_KEY } from '@env';

// API Key được lấy từ biến môi trường .env
// ⚠️ LƯU Ý: Cần cấu hình file .env với GOOGLE_GEMINI_API_KEY
// Hướng dẫn lấy API key:
// 1. Truy cập: https://aistudio.google.com/app/apikey
// 2. Đăng nhập tài khoản Google
// 3. Click "Create API key"
// 4. Copy API key và thêm vào file .env: GOOGLE_GEMINI_API_KEY=your_key_here
const API_KEY = GOOGLE_GEMINI_API_KEY;

// Context về ứng dụng để AI hiểu và trả lời chính xác
const APP_CONTEXT = `
Bạn là trợ lý ảo thông minh cho ứng dụng chăm sóc sức khỏe (Healthcare App) tại Việt Nam.

THÔNG TIN ỨNG DỤNG:
- Ứng dụng có 5 tab chính:
  1. Trang chủ: Xem lịch hẹn sắp tới, tin tức sức khỏe
  2. Hỗ trợ: Chat với trợ lý ảo
  3. Đặt lịch: Xem dịch vụ và đặt lịch khám
  4. Tin tức: Đọc bài viết về sức khỏe
  5. Cá nhân: Quản lý hồ sơ, lịch hẹn, thông báo

TÍNH NĂNG CHÍNH:
- Hotline khẩn cấp: 0911550316 (có thể gọi trực tiếp từ app)
- Thông báo tự động: Nhắc uống nước hàng ngày, thông báo lịch hẹn (24h trước)
- Quản lý lịch hẹn: Đặt lịch, xem trạng thái, lọc theo trạng thái (Tất cả/Chờ xác nhận/Hoàn thành/Đã hủy)
- Hồ sơ cá nhân: Cập nhật thông tin, đổi mật khẩu
- Tin tức sức khỏe: Bài viết về y tế, dinh dưỡng

CÁCH TRỢ GIÚP:
- Trả lời ngắn gọn, rõ ràng bằng tiếng Việt
- Sử dụng emoji phù hợp để thân thiện
- Nếu câu hỏi về tính năng cụ thể, hướng dẫn chi tiết
- Nếu câu hỏi y tế phức tạp, khuyên gọi Hotline: 0911550316
- Nếu không chắc chắn, đề xuất người dùng "Nhắn cho Admin" để được hỗ trợ trực tiếp

LƯU Ý:
- KHÔNG tự ý đưa ra chẩn đoán y khoa
- KHÔNG khuyên dùng thuốc cụ thể
- Khuyến khích khám bác sĩ nếu có triệu chứng bất thường
`;

export interface GeminiResponse {
  text: string;
  confidence: 'high' | 'medium' | 'low';
  suggestAdminContact?: boolean;
}

/**
 * Gọi Gemini AI để trả lời câu hỏi tự do (dùng REST API thay vì SDK)
 */
export const askGemini = async (userQuestion: string): Promise<GeminiResponse> => {
  try {
    const prompt = `${APP_CONTEXT}

CÂUHỎI CỦA NGƯỜI DÙNG: ${userQuestion}

Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt. Nếu câu hỏi phức tạp hoặc cần hỗ trợ chuyên sâu, đề xuất người dùng gọi Hotline hoặc nhắn cho Admin.`;

    // Gọi Gemini REST API (thử model gemini-2.5-flash theo document)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', response.status, errorData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error('Empty response from AI');
    }

    // Đánh giá độ tin cậy dựa trên độ dài và nội dung
    let confidence: 'high' | 'medium' | 'low' = 'high';
    let suggestAdminContact = false;

    // Nếu câu trả lời quá ngắn (<50 ký tự) -> confidence thấp
    if (text.length < 50) {
      confidence = 'low';
      suggestAdminContact = true;
    }
    // Nếu chứa từ "không chắc", "có thể", "tôi không biết" -> medium confidence
    else if (
      text.includes('không chắc') ||
      text.includes('có thể') ||
      text.includes('không biết') ||
      text.includes('tôi không rõ')
    ) {
      confidence = 'medium';
      suggestAdminContact = true;
    }

    return {
      text,
      confidence,
      suggestAdminContact,
    };
  } catch (error: any) {
    console.error('Gemini AI error:', error);

    // Nếu lỗi 404 - API key không hợp lệ hoặc chưa được cấu hình
    if (error.message?.includes('404')) {
      return {
        text: '⚠️ Tính năng AI chatbot chưa được cấu hình đúng.\n\n💡 Hiện tại bạn có thể:\n• Chọn các câu hỏi gợi ý bên dưới\n• Nhắn trực tiếp cho Admin để được hỗ trợ\n• Gọi Hotline: 0911550316 nếu cần gấp',
        confidence: 'low',
        suggestAdminContact: true,
      };
    }

    return {
      text: 'Xin lỗi, tôi đang gặp chút trục trặc kỹ thuật. Bạn có thể:\n• Chọn câu hỏi gợi ý bên dưới\n• Nhắn cho Admin để được hỗ trợ trực tiếp\n• Gọi Hotline: 0911550316',
      confidence: 'low',
      suggestAdminContact: true,
    };
  }
};

/**
 * Kiểm tra xem câu hỏi có liên quan đến y tế/ứng dụng không
 */
export const isRelevantQuestion = (question: string): boolean => {
  const irrelevantKeywords = [
    'thời tiết',
    'bóng đá',
    'ca nhạc',
    'phim',
    'game',
    'chính trị',
    'kinh tế',
    'chứng khoán',
  ];

  const normalizedQuestion = question.toLowerCase();
  return !irrelevantKeywords.some(keyword => normalizedQuestion.includes(keyword));
};
