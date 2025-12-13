import { GOOGLE_GEMINI_API_KEY } from '@env';
import RNFS from 'react-native-fs';

const API_KEY = GOOGLE_GEMINI_API_KEY;

// Context chuyên môn cho phân tích triệu chứng da liễu/vết thương
const MEDICAL_ANALYSIS_CONTEXT = `
Bạn là một AI y tế chuyên phân tích hình ảnh da liễu và vết thương. Bạn được thiết kế để hỗ trợ người dùng hiểu sơ bộ về tình trạng của họ.

VAI TRÒ:
- Phân tích hình ảnh vết thương, tổn thương da, phát ban, mụn, vết bầm, v.v.
- Đưa ra nhận định SƠ BỘ về tình trạng có thể
- Gợi ý mức độ nghiêm trọng và khuyến nghị hành động
- LUÔN khuyến khích người dùng đi khám bác sĩ để có chẩn đoán chính xác

QUY TẮC QUAN TRỌNG:
1. KHÔNG đưa ra chẩn đoán y khoa chính thức
2. KHÔNG kê đơn thuốc
3. LUÔN khuyên gặp bác sĩ với các tổn thương nghiêm trọng
4. Sử dụng ngôn ngữ dễ hiểu, không quá chuyên môn
5. Trả lời bằng tiếng Việt

ĐỊNH DẠNG PHẢN HỒI:
📋 **NHẬN DIỆN SƠ BỘ:**
[Mô tả những gì nhìn thấy trong ảnh]

🔍 **PHÂN TÍCH:**
[Các khả năng có thể xảy ra dựa trên hình ảnh]

⚠️ **MỨC ĐỘ:**
[Nhẹ/Trung bình/Nghiêm trọng - Cần theo dõi/Nên khám/Khám ngay]

💡 **KHUYẾN NGHỊ:**
[Các bước hành động cụ thể]

🏥 **LƯU Ý:**
Đây chỉ là nhận định sơ bộ từ AI, không thay thế chẩn đoán của bác sĩ. Vui lòng đến cơ sở y tế để được khám và điều trị chính xác.
`;

export interface SymptomAnalysisResult {
  analysis: string;
  severity: 'low' | 'medium' | 'high' | 'unknown';
  confidence: number;
  suggestDoctor: boolean;
  error?: string;
}

/**
 * Phân tích ảnh triệu chứng với Gemini Vision API
 * @param imageUri - URI của ảnh (local file path hoặc base64)
 * @param additionalContext - Mô tả thêm từ người dùng (tùy chọn)
 */
export const analyzeSymptomImage = async (
  imageUri: string,
  additionalContext?: string
): Promise<SymptomAnalysisResult> => {
  console.log('🔬 Starting symptom analysis...');
  console.log('📸 Image URI:', imageUri);

  try {
    // Chuyển đổi ảnh sang base64
    let base64Image: string;
    let mimeType: string = 'image/jpeg';

    if (imageUri.startsWith('data:')) {
      // Đã là base64
      const matches = imageUri.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Image = matches[2];
      } else {
        throw new Error('Invalid base64 format');
      }
    } else {
      // Đọc file và convert sang base64
      const filePath = imageUri.replace('file://', '');
      base64Image = await RNFS.readFile(filePath, 'base64');

      // Detect mime type from extension
      if (imageUri.toLowerCase().includes('.png')) {
        mimeType = 'image/png';
      } else if (imageUri.toLowerCase().includes('.gif')) {
        mimeType = 'image/gif';
      } else if (imageUri.toLowerCase().includes('.webp')) {
        mimeType = 'image/webp';
      }
    }

    console.log('📦 Image converted to base64, length:', base64Image.length);
    console.log('📄 MIME type:', mimeType);

    // Tạo prompt với context bổ sung từ người dùng
    const userPrompt = additionalContext
      ? `Người dùng mô tả: "${additionalContext}"\n\nHãy phân tích hình ảnh này và đưa ra nhận định sơ bộ về tình trạng da/vết thương.`
      : 'Hãy phân tích hình ảnh này và đưa ra nhận định sơ bộ về tình trạng da/vết thương.';

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${MEDICAL_ANALYSIS_CONTEXT}\n\n${userPrompt}`,
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE',
        },
      ],
    };

    console.log('📡 Calling Gemini Vision API...');

    // Sử dụng gemini-2.0-flash cho vision
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('📥 API Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Gemini Vision API Error:', response.status, JSON.stringify(errorData));

      if (response.status === 400) {
        return {
          analysis: '❌ Không thể phân tích ảnh này. Vui lòng chụp lại ảnh rõ hơn hoặc chọn ảnh khác.',
          severity: 'unknown',
          confidence: 0,
          suggestDoctor: true,
          error: 'Invalid image',
        };
      }

      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Gemini Vision API Response received');

    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!analysisText) {
      throw new Error('Empty response from AI');
    }

    // Phân tích mức độ nghiêm trọng từ nội dung
    let severity: 'low' | 'medium' | 'high' | 'unknown' = 'unknown';
    const lowerText = analysisText.toLowerCase();

    if (lowerText.includes('nghiêm trọng') || lowerText.includes('khám ngay') || lowerText.includes('cấp cứu')) {
      severity = 'high';
    } else if (lowerText.includes('trung bình') || lowerText.includes('nên khám') || lowerText.includes('theo dõi')) {
      severity = 'medium';
    } else if (lowerText.includes('nhẹ') || lowerText.includes('không đáng lo')) {
      severity = 'low';
    }

    // Tính confidence dựa trên độ dài và chi tiết của phản hồi
    const confidence = Math.min(0.85, Math.max(0.3, analysisText.length / 1500));

    return {
      analysis: analysisText,
      severity,
      confidence,
      suggestDoctor: severity === 'high' || severity === 'medium' || severity === 'unknown',
    };

  } catch (error: any) {
    console.error('❌ Symptom analysis error:', error);

    return {
      analysis: '⚠️ Không thể phân tích ảnh lúc này.\n\n**Nguyên nhân có thể:**\n• Kết nối mạng không ổn định\n• Ảnh không hợp lệ hoặc quá lớn\n• Dịch vụ AI tạm thời gián đoạn\n\n**Khuyến nghị:**\n• Thử chụp lại ảnh với ánh sáng tốt hơn\n• Kiểm tra kết nối Internet\n• Nếu tình trạng nghiêm trọng, hãy gọi Hotline: 0911550316',
      severity: 'unknown',
      confidence: 0,
      suggestDoctor: true,
      error: error.message,
    };
  }
};

/**
 * Validate ảnh trước khi phân tích
 */
export const validateImage = async (imageUri: string): Promise<{ valid: boolean; message?: string }> => {
  try {
    if (!imageUri) {
      return { valid: false, message: 'Chưa chọn ảnh' };
    }

    const filePath = imageUri.replace('file://', '');
    const stat = await RNFS.stat(filePath);

    // Kiểm tra kích thước file (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (stat.size > maxSize) {
      return { valid: false, message: 'Ảnh quá lớn (tối đa 10MB)' };
    }

    // Kiểm tra định dạng
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExt = validExtensions.some(ext =>
      imageUri.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt && !imageUri.includes('cache')) {
      // Có thể là ảnh từ camera, cho phép
      console.log('⚠️ Unknown extension, allowing anyway');
    }

    return { valid: true };
  } catch (error) {
    console.error('Image validation error:', error);
    return { valid: false, message: 'Không thể đọc file ảnh' };
  }
};

/**
 * Các loại tổn thương phổ biến để gợi ý cho người dùng
 */
export const COMMON_SYMPTOMS = [
  { id: 'wound', label: 'Vết thương hở', icon: '🩹' },
  { id: 'rash', label: 'Phát ban/Mẩn đỏ', icon: '🔴' },
  { id: 'acne', label: 'Mụn/Mụn trứng cá', icon: '😓' },
  { id: 'bruise', label: 'Vết bầm tím', icon: '💜' },
  { id: 'burn', label: 'Vết bỏng', icon: '🔥' },
  { id: 'insect', label: 'Côn trùng cắn', icon: '🐜' },
  { id: 'allergy', label: 'Dị ứng da', icon: '⚡' },
  { id: 'fungal', label: 'Nấm da', icon: '🍄' },
  { id: 'other', label: 'Khác', icon: '❓' },
];
