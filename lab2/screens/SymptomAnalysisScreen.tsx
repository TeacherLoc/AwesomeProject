
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import {
  analyzeSymptomImage,
  validateImage,
  COMMON_SYMPTOMS,
  SymptomAnalysisResult,
} from '../services/symptomAnalysisService';


const { width } = Dimensions.get('window');

// Custom Header Component
const CustomHeader = ({ title, onBack }: { title: string; onBack: () => void }) => {
  return (
    <LinearGradient
      colors={['rgba(120, 220, 215, 0.98)', 'rgba(254, 214, 227, 0.9)', 'rgba(255, 236, 210, 0.95)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.customHeader}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Icon name="healing" size={28} color="#E91E63" />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>
    </LinearGradient>
  );
};

// Severity Badge Component
const SeverityBadge = ({ severity }: { severity: string }) => {
  const getSeverityStyle = () => {
    switch (severity) {
      case 'low':
        return { bg: '#E8F5E9', color: '#2E7D32', text: '🟢 Nhẹ' };
      case 'medium':
        return { bg: '#FFF3E0', color: '#EF6C00', text: '🟡 Trung bình' };
      case 'high':
        return { bg: '#FFEBEE', color: '#C62828', text: '🔴 Nghiêm trọng' };
      default:
        return { bg: '#F5F5F5', color: '#757575', text: '⚪ Chưa xác định' };
    }
  };

  const style = getSeverityStyle();

  return (
    <View style={[styles.severityBadge, { backgroundColor: style.bg }]}>
      <Text style={[styles.severityText, { color: style.color }]}>{style.text}</Text>
    </View>
  );
};

const SymptomAnalysisScreen = ({ navigation }: { navigation: any }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<SymptomAnalysisResult | null>(null);

  // Ẩn header mặc định
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleImagePick = useCallback(async (type: 'camera' | 'gallery') => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: false,
    };

    const callback = async (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
        return;
      }

      const uri = response.assets?.[0]?.uri;
      if (uri) {
        // Validate ảnh
        const validation = await validateImage(uri);
        if (!validation.valid) {
          Alert.alert('Lỗi', validation.message || 'Ảnh không hợp lệ');
          return;
        }

        setSelectedImage(uri);
        setAnalysisResult(null);
      }
    };

    if (type === 'camera') {
      launchCamera(options, callback);
    } else {
      launchImageLibrary(options, callback);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedImage) {
      Alert.alert('Thông báo', 'Vui lòng chọn hoặc chụp ảnh trước khi phân tích.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Tạo context bổ sung từ mô tả và loại triệu chứng
      let additionalContext = '';

      if (selectedSymptom) {
        const symptomLabel = COMMON_SYMPTOMS.find(s => s.id === selectedSymptom)?.label;
        if (symptomLabel) {
          additionalContext += `Loại triệu chứng: ${symptomLabel}. `;
        }
      }

      if (description.trim()) {
        additionalContext += description.trim();
      }

      const result = await analyzeSymptomImage(selectedImage, additionalContext || undefined);
      setAnalysisResult(result);

      // Nếu nghiêm trọng, hiện cảnh báo
      if (result.severity === 'high') {
        Alert.alert(
          '⚠️ Cảnh báo',
          'Tình trạng có vẻ nghiêm trọng. Bạn nên đến cơ sở y tế để được khám và điều trị ngay.',
          [
            { text: 'Gọi Hotline', onPress: () => console.log('Call hotline') },
            { text: 'Đã hiểu', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Lỗi', 'Không thể phân tích ảnh. Vui lòng thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedImage, description, selectedSymptom]);

  const handleReset = useCallback(() => {
    setSelectedImage(null);
    setDescription('');
    setSelectedSymptom(null);
    setAnalysisResult(null);
  }, []);

  return (
    <LinearGradient
      colors={['#a8edea', '#fed6e3', '#ffecd2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <CustomHeader title="Phân Tích Triệu Chứng" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hướng dẫn */}
        <View style={styles.infoCard}>
          <Icon name="info" size={24} color="#1976D2" />
          <Text style={styles.infoText}>
            Chụp hoặc chọn ảnh vết thương/tổn thương da để AI phân tích sơ bộ.
            Kết quả chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ.
          </Text>
        </View>

        {/* Khu vực chọn ảnh */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>📸 Ảnh triệu chứng</Text>

          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={handleReset}>
                <Icon name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="add-a-photo" size={48} color="#9E9E9E" />
              <Text style={styles.placeholderText}>Chưa có ảnh</Text>
            </View>
          )}

          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={[styles.imageButton, styles.galleryButton, styles.fullWidthButton]}
              onPress={() => handleImagePick('gallery')}
            >
              <Icon name="photo-library" size={22} color="#fff" />
              <Text style={styles.imageButtonText}>Chọn ảnh từ thư viện</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chọn loại triệu chứng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Loại triệu chứng (tuỳ chọn)</Text>
          <View style={styles.symptomsGrid}>
            {COMMON_SYMPTOMS.map((symptom) => (
              <TouchableOpacity
                key={symptom.id}
                style={[
                  styles.symptomChip,
                  selectedSymptom === symptom.id && styles.symptomChipSelected,
                ]}
                onPress={() => setSelectedSymptom(
                  selectedSymptom === symptom.id ? null : symptom.id
                )}
              >
                <Text style={styles.symptomIcon}>{symptom.icon}</Text>
                <Text style={[
                  styles.symptomLabel,
                  selectedSymptom === symptom.id && styles.symptomLabelSelected,
                ]}>
                  {symptom.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mô tả thêm */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Mô tả thêm (tuỳ chọn)</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Ví dụ: Đau nhức, ngứa, xuất hiện 2 ngày trước..."
            placeholderTextColor="#9E9E9E"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        {/* Nút phân tích */}
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            (!selectedImage || isAnalyzing) && styles.analyzeButtonDisabled,
          ]}
          onPress={handleAnalyze}
          disabled={!selectedImage || isAnalyzing}
        >
          {isAnalyzing ? (
            <View style={styles.analyzingContent}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.analyzeButtonText}>Đang phân tích...</Text>
            </View>
          ) : (
            <View style={styles.analyzingContent}>
              <Icon name="biotech" size={24} color="#fff" />
              <Text style={styles.analyzeButtonText}>Phân tích với AI</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Kết quả phân tích */}
        {analysisResult && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>📋 Kết quả phân tích</Text>
              <SeverityBadge severity={analysisResult.severity} />
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultText}>{analysisResult.analysis}</Text>
            </View>

            {/* Confidence indicator */}
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Độ tin cậy:</Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    { width: `${analysisResult.confidence * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.confidenceValue}>
                {Math.round(analysisResult.confidence * 100)}%
              </Text>
            </View>

            {/* Khuyến nghị đi khám */}
            {analysisResult.suggestDoctor && (
              <View style={styles.doctorSuggestion}>
                <Icon name="local-hospital" size={24} color="#C62828" />
                <Text style={styles.doctorSuggestionText}>
                  Khuyến nghị: Nên đến cơ sở y tế để được khám và tư vấn chính xác.
                </Text>
              </View>
            )}

            {/* Nút hành động */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('ServicesTab', { screen: 'CustomerServiceList' })}
              >
                <Icon name="event" size={20} color="#1976D2" />
                <Text style={styles.actionButtonText}>Đặt lịch khám</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleReset}
              >
                <Icon name="refresh" size={20} color="#757575" />
                <Text style={styles.actionButtonTextSecondary}>
                  Phân tích mới
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Icon name="warning" size={18} color="#FF9800" />
          <Text style={styles.disclaimerText}>
            Lưu ý: AI chỉ đưa ra nhận định sơ bộ dựa trên hình ảnh.
            Kết quả không thay thế chẩn đoán của bác sĩ chuyên khoa.
            Nếu tình trạng nghiêm trọng, hãy gọi Hotline: 0911550316
          </Text>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  imageSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  selectedImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 6,
  },
  imagePlaceholder: {
    height: 180,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9E9E9E',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  galleryButton: {
    backgroundColor: '#7C4DFF',
  },
  fullWidthButton: {
    flex: 1,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  symptomChipSelected: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  symptomIcon: {
    fontSize: 16,
  },
  symptomLabel: {
    fontSize: 13,
    color: '#333',
  },
  symptomLabelSelected: {
    color: '#fff',
  },
  descriptionInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  analyzeButton: {
    backgroundColor: '#00BFA5',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#00BFA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#BDBDBD',
    shadowOpacity: 0,
  },
  analyzingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  severityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 13,
    color: '#757575',
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    width: 40,
    textAlign: 'right',
  },
  doctorSuggestion: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  doctorSuggestionText: {
    flex: 1,
    fontSize: 13,
    color: '#C62828',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#F57C00',
    lineHeight: 18,
  },
});

export default SymptomAnalysisScreen;
