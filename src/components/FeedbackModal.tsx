import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { theme } from "../theme/theme";
import { api, buildImageUrl } from "../services/api";

export type OrderFeedbackResponse = {
  id: number;
  content?: string;
  imageUrl?: string;
  response?: string;
  createdAt?: string;
  sender?: {
    id?: number;
    username?: string;
    avatar?: string;
  };
};

export type OrderFeedback = {
  id: number;
  rating: number;
  content: string;
  imageUrl?: string;
  createdAt?: string;
  responses?: OrderFeedbackResponse[];
};

type FeedbackModalProps = {
  visible: boolean;
  orderId: number;
  orderName?: string;
  orderItemsSummary?: string;
  existingFeedback?: OrderFeedback | null;
  onClose: () => void;
  onSuccess: () => void;
};

const MAX_COMMENT_LENGTH = 500;

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  orderId,
  orderName,
  orderItemsSummary,
  existingFeedback,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState(existingFeedback?.rating || 5);
  const [content, setContent] = useState(existingFeedback?.content || "");
  const [imageUrl, setImageUrl] = useState(existingFeedback?.imageUrl || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(existingFeedback?.rating || 5);
      setContent(existingFeedback?.content || "");
      setImageUrl(existingFeedback?.imageUrl || "");
    }
  }, [existingFeedback, visible]);

  const ratingLabel = useMemo(() => {
    switch (rating) {
      case 5:
        return "Tuyệt vời";
      case 4:
        return "Rất tốt";
      case 3:
        return "Bình thường";
      case 2:
        return "Chưa hài lòng";
      case 1:
        return "Rất tệ";
      default:
        return "";
    }
  }, [rating]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Không có quyền truy cập",
        "Ứng dụng cần quyền truy cập thư viện ảnh để tiếp tục."
      );
      return;
    }

    try {
      setUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const uploaded = await api.uploadAvatar(result.assets[0].uri);
      setImageUrl(uploaded.url);
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể tải ảnh, vui lòng thử lại."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert("Thiếu nội dung", "Vui lòng nhập nội dung nhận xét.");
      return;
    }

    try {
      setSubmitting(true);
      if (existingFeedback) {
        await api.updateFeedback(existingFeedback.id, {
          rating,
          content: content.trim(),
          imageUrl: imageUrl || undefined,
        });
      } else {
        await api.createFeedback({
          orderId,
          rating,
          content: content.trim(),
          imageUrl: imageUrl || undefined,
        });
      }
      onSuccess();
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể lưu nhận xét.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Đóng</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {existingFeedback ? "Cập nhật nhận xét" : "Tạo nhận xét"}
          </Text>
          <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Text style={styles.saveText}>Xác nhận</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {orderName ? (
            <View style={styles.orderInfo}>
              <Text style={styles.orderLabel}>{orderName}</Text>
              {orderItemsSummary ? (
                <Text style={styles.orderItems}>{orderItemsSummary}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.ratingContainer}>
            <Text style={styles.sectionTitle}>Đánh giá của bạn</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setRating(value)}
                  style={styles.starButton}
                >
                  <Icon
                    name={value <= rating ? "star" : "star-border"}
                    size={32}
                    color={theme.colors.accent}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>{ratingLabel}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.sectionTitle}>Nội dung chi tiết</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Hãy chia sẻ trải nghiệm của bạn..."
              value={content}
              onChangeText={(text) =>
                text.length <= MAX_COMMENT_LENGTH && setContent(text)
              }
              multiline
            />
            <Text style={styles.helperText}>
              {content.length}/{MAX_COMMENT_LENGTH} ký tự
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.sectionTitle}>Hình ảnh minh họa</Text>
            {imageUrl ? (
              <View style={styles.imagePreviewWrapper}>
                <Image
                  source={{ uri: buildImageUrl(imageUrl) || imageUrl }}
                  style={styles.imagePreview}
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setImageUrl("")}
                >
                  <Icon name="close" size={18} color={theme.colors.surface} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={handlePickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <>
                    <Icon
                      name="photo-camera"
                      size={28}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.imagePickerText}>Thêm ảnh</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.mediumGray,
  },
  saveText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  orderInfo: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  orderLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  orderItems: {
    fontSize: 12,
    color: theme.colors.mediumGray,
  },
  ratingContainer: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  starButton: {
    marginRight: theme.spacing.sm,
  },
  ratingLabel: {
    fontSize: 14,
    color: theme.colors.mediumGray,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  textArea: {
    minHeight: 120,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    textAlignVertical: "top",
    fontSize: 14,
    color: theme.colors.text,
  },
  helperText: {
    marginTop: theme.spacing.xs,
    fontSize: 12,
    color: theme.colors.mediumGray,
    textAlign: "right",
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
    borderRadius: theme.roundness,
    paddingVertical: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  imagePickerText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.primary,
  },
  imagePreviewWrapper: {
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: theme.roundness,
  },
  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: theme.roundness,
    padding: 4,
  },
});

export default FeedbackModal;
