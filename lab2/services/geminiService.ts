import { GOOGLE_GEMINI_API_KEY } from '@env';
const API_KEY = GOOGLE_GEMINI_API_KEY;

// Context về ứng dụng để AI hiểu và trả lời chính xác
const APP_CONTEXT = `
Bạn là trợ lý ảo thông minh cho ứng dụng chăm sóc sức khỏe (Healthcare App) tại Việt Nam.

THÔNG TIN ỨNG DỤNG:
- Ứng dụng có 5 tab chính:
  1. Trang chủ: Tổng hợp các tính năng chính và truy cập nhanh
  2. Hỗ trợ: Chat với trợ lý ảo
  3. Đặt lịch: Xem dịch vụ và đặt lịch khám
  4. Tin tức: Đọc bài viết về sức khỏe
  5. Cá nhân: Quản lý hồ sơ, lịch hẹn, thông báo

TÍNH NĂNG CHÍNH:
- Hotline khẩn cấp: 0911550316 (có thể gọi trực tiếp từ app)
- Thông báo tự động: thông báo lịch hẹn (24h trước)
- Quản lý thông báo: Xem, lọc (Tất cả/Chưa đọc/Đã đọc), xóa đơn lẻ hoặc xóa tất cả với giao diện đẹp
- Quản lý lịch hẹn: Đặt lịch, xem trạng thái, lọc theo trạng thái (Tất cả/Chờ xác nhận/Hoàn thành/Đã hủy)
- Hồ sơ cá nhân: Cập nhật thông tin, đổi mật khẩu với thông báo lỗi thân thiện
- Tin tức sức khỏe: Bài viết về y tế, dinh dưỡng

TÍNH NĂNG AI PHÂN TÍCH TRIỆU CHỨNG:
- Từ Trang chủ → nhấn nút "AI Phân tích triệu chứng" (icon màu tím)
- Cho phép người dùng chọn ảnh vết thương, tổn thương da, phát ban, mụn, vết bầm, bỏng, côn trùng cắn, dị ứng, nấm da từ thư viện ảnh
- AI Gemini Vision sẽ phân tích ảnh và đưa ra nhận định sơ bộ
- Hiển thị mức độ nghiêm trọng (Nhẹ/Trung bình/Nghiêm trọng) và độ tin cậy
- Đưa ra khuyến nghị hành động cụ thể
- Có thể chọn loại triệu chứng và thêm mô tả để AI phân tích chính xác hơn
- LƯU Ý: Kết quả chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ
- Nếu người dùng hỏi về tính năng này, hướng dẫn họ vào Trang chủ → AI Phân tích triệu chứng

KHẢ NĂNG TƯ VẤN:
- Tư vấn sức khỏe tổng quát: dinh dưỡng, vận động, lối sống
- Hướng dẫn giảm cân, tăng cân an toàn
- Gợi ý chế độ ăn uống lành mạnh
- Tư vấn phòng ngừa bệnh tật
- Giải đáp thắc mắc về các triệu chứng thông thường và bệnh lý phổ biến
- Là một bác sĩ ảo, giúp người dùng hiểu rõ hơn về tình trạng sức khỏe của họ
- Cung cấp thông tin về các loại thuốc phổ biến (không kê đơn) và cách sử dụng đúng
- Không khuyến cáo thuốc cụ thể mà không có đơn bác sĩ
- Tư vấn về các bệnh lý phổ biến như cảm cúm, đau đầu, dị ứng, tiểu đường, cao huyết áp, v.v.
- Chăm sóc tình trạng sức khoẻ của người dùng một cách tốt nhất

HƯỚNG DẪN:
- Khi người dùng hỏi về cách sử dụng các tính năng trong ứng dụng, hãy hướng dẫn chi tiết từng bước.
- Nếu người dùng hỏi về các triệu chứng hoặc bệnh lý, cung cấp thông tin chung, không chẩn đoán cụ thể.
- Khuyến khích người dùng liên hệ với bác sĩ hoặc gọi Hotline nếu cần tư vấn chuyên sâu hoặc khẩn cấp.
- Luôn đề xuất người dùng "Nhắn cho Admin" hoặc gọi Hotline nếu câu hỏi phức tạp hoặc ngoài khả năng trả lời của bạn.

QUYỀN RIÊNG TƯ VÀ BẢO MẬT:
- Không yêu cầu hoặc lưu trữ thông tin cá nhân nhạy cảm.
- Tôn trọng quyền riêng tư của người dùng.

CÁCH TRỢ GIÚP:
- Trả lời ngắn gọn, rõ ràng, thực tế bằng tiếng Việt
- Sử dụng emoji phù hợp để thân thiện
- Đưa ra lời khuyên cụ thể, dễ thực hiện
- Nếu câu hỏi về tính năng cụ thể, hướng dẫn chi tiết
- Nếu câu hỏi y tế phức tạp hoặc nghiêm trọng, khuyên gọi Hotline: 0911550316
- Nếu không chắc chắn, đề xuất người dùng "Nhắn cho Admin" để được hỗ trợ trực tiếp

LƯU Ý:
- KHÔNG tự ý đưa ra chẩn đoán y khoa
- KHÔNG khuyên dùng thuốc cụ thể mà không có đơn bác sĩ
- Khuyến khích khám bác sĩ nếu có triệu chứng bất thường hoặc bệnh lý
- Với câu hỏi về giảm cân/tăng cân: đưa ra lời khuyên chung về dinh dưỡng, tập luyện an toàn
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
  console.log('🔑 API Key status:', API_KEY ? 'exists' : 'missing');
  console.log('📝 User question:', userQuestion);

  try {
    const prompt = `${APP_CONTEXT}

CÂU HỎI CỦA NGƯỜI DÙNG: ${userQuestion}

Hãy trả lời chi tiết, thực tế và dễ hiểu bằng tiếng Việt. Đưa ra lời khuyên cụ thể có thể áp dụng ngay. Nếu câu hỏi phức tạp hoặc cần tư vấn chuyên sâu từ bác sĩ, hãy nói rõ và đề xuất gọi Hotline hoặc nhắn Admin.`;

    console.log('📡 Calling Gemini API...');

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

    console.log('📥 API Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Gemini API Error:', response.status, JSON.stringify(errorData));
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Gemini API Response received:', JSON.stringify(data).substring(0, 200));

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('💬 Extracted text length:', text.length);

    if (!text) {
      console.error('❌ Empty response from AI');
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
