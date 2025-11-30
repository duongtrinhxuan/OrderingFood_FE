import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../theme/theme";
import { api } from "../services/api";

interface ComplaintReport {
  id: number;
  content: string;
  isDraft: boolean;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: number;
  complaint?: ComplaintReport | null; // Nếu có thì là edit mode
};

const CreateComplaintModal: React.FC<Props> = ({
  visible,
  onClose,
  onSuccess,
  userId,
  complaint,
}) => {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // Khi modal mở hoặc complaint thay đổi, cập nhật content
  useEffect(() => {
    if (visible && complaint) {
      setContent(complaint.content || "");
    } else if (visible && !complaint) {
      setContent("");
    }
  }, [visible, complaint]);

  const handleSaveDraft = async () => {
    if (!content.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung khiếu nại.");
      return;
    }

    try {
      setSaving(true);
      if (complaint) {
        // Edit mode: chỉ cập nhật content, giữ nguyên isDraft = true
        await api.updateComplaintReport(complaint.id, {
          content: content.trim(),
          isDraft: true,
        });
        Alert.alert("Thành công", "Đã cập nhật bản nháp.");
      } else {
        // Create mode: tạo mới
        await api.createComplaintReport({
          userId,
          content: content.trim(),
          isDraft: true,
          isRead: false,
        });
        Alert.alert("Thành công", "Đã lưu bản nháp.");
      }
      setContent("");
      onSuccess();
    } catch (error: any) {
      console.error("Error saving draft:", error);
      Alert.alert("Lỗi", "Không thể lưu bản nháp. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!content.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung khiếu nại.");
      return;
    }

    try {
      setSending(true);
      if (complaint) {
        // Edit mode: cập nhật content và set isDraft = false
        await api.updateComplaintReport(complaint.id, {
          content: content.trim(),
          isDraft: false,
        });
        Alert.alert("Thành công", "Đã gửi khiếu nại thành công.");
      } else {
        // Create mode: tạo mới
        await api.createComplaintReport({
          userId,
          content: content.trim(),
          isDraft: false,
          isRead: false,
        });
        Alert.alert("Thành công", "Đã gửi khiếu nại thành công.");
      }
      setContent("");
      onSuccess();
    } catch (error: any) {
      console.error("Error sending complaint:", error);
      Alert.alert("Lỗi", "Không thể gửi khiếu nại. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (content.trim()) {
      Alert.alert(
        "Xác nhận",
        "Bạn có muốn đóng? Nội dung chưa được lưu sẽ bị mất.",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đóng",
            style: "destructive",
            onPress: () => {
              setContent("");
              onClose();
            },
          },
        ]
      );
    } else {
      setContent("");
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {complaint ? "Chỉnh sửa khiếu nại" : "Tạo khiếu nại mới"}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.label}>Nội dung khiếu nại</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập nội dung khiếu nại của bạn..."
                placeholderTextColor={theme.colors.mediumGray}
                multiline
                numberOfLines={8}
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.draftButton]}
                onPress={handleSaveDraft}
                disabled={saving || sending}
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                ) : (
                  <>
                    <Icon
                      name="save"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.draftButtonText}>Lưu bản nháp</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.sendButton]}
                onPress={handleSend}
                disabled={saving || sending}
              >
                {sending ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.surface}
                  />
                ) : (
                  <>
                    <Icon
                      name="send"
                      size={20}
                      color={theme.colors.surface}
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.sendButtonText}>Gửi</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.roundness * 2,
    borderTopRightRadius: theme.roundness * 2,
    maxHeight: "90%",
    paddingBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    padding: theme.spacing.lg,
    maxHeight: 400,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.text,
    minHeight: 150,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    ...theme.shadows.small,
  },
  draftButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  draftButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.surface,
    marginLeft: theme.spacing.xs,
  },
  buttonIcon: {
    marginRight: 0,
  },
});

export default CreateComplaintModal;
