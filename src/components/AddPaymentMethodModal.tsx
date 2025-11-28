import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../theme/theme";
import { api } from "../services/api";

interface AddPaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId: number;
}

// Danh sách các payment method có sẵn
const PAYMENT_METHODS = [
  { value: "COD", label: "Thanh toán khi nhận hàng (COD)" },
  { value: "MOMO", label: "Ví MoMo" },
  { value: "TKNH", label: "Chuyển khoản ngân hàng" },
  { value: "Zalopay", label: "Ví ZaloPay" },
];

const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
  visible,
  onClose,
  onSuccess,
  orderId,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [existingPayments, setExistingPayments] = useState<
    Array<{ id: number; paymentMethod: string; status: number }>
  >([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // Lấy danh sách payments hiện có của order
  useEffect(() => {
    if (visible && orderId) {
      loadExistingPayments();
    }
  }, [visible, orderId, loadExistingPayments]);

  const loadExistingPayments = React.useCallback(async () => {
    if (!orderId) return;
    try {
      setLoadingPayments(true);
      const payments = await api.getPaymentsByOrder(orderId);
      setExistingPayments(payments as any[]);
    } catch (error: any) {
      console.error("Error loading payments:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách phương thức thanh toán.");
    } finally {
      setLoadingPayments(false);
    }
  }, [orderId]);

  // Lọc ra các payment method đã có
  const existingMethods = existingPayments.map((p) => p.paymentMethod);
  const availableMethods = PAYMENT_METHODS.filter(
    (method) => !existingMethods.includes(method.value)
  );

  const handleSelectMethod = (method: string) => {
    setSelectedMethod(method);
  };

  const handleConfirm = async () => {
    if (!selectedMethod) {
      Alert.alert("Lỗi", "Vui lòng chọn phương thức thanh toán.");
      return;
    }

    try {
      setLoading(true);
      await api.createPayment({
        paymentMethod: selectedMethod,
        status: 1, // Pending
        orderId: orderId,
      });

      Alert.alert("Thành công", "Đã thêm phương thức thanh toán.");
      onSuccess();
      onClose();
      setSelectedMethod(null);
    } catch (error: any) {
      console.error("Error creating payment:", error);
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể thêm phương thức thanh toán."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thêm phương thức thanh toán</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {loadingPayments ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.modalBody}>
              {availableMethods.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Icon name="info" size={48} color={theme.colors.mediumGray} />
                  <Text style={styles.emptyText}>
                    Đã thêm tất cả phương thức thanh toán có sẵn.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>
                    Chọn phương thức thanh toán
                  </Text>
                  {availableMethods.map((method) => (
                    <TouchableOpacity
                      key={method.value}
                      style={[
                        styles.methodCard,
                        selectedMethod === method.value &&
                          styles.methodCardSelected,
                      ]}
                      onPress={() => handleSelectMethod(method.value)}
                    >
                      <View style={styles.methodCardContent}>
                        <View
                          style={[
                            styles.radioButton,
                            selectedMethod === method.value &&
                              styles.radioButtonSelected,
                          ]}
                        >
                          {selectedMethod === method.value && (
                            <View style={styles.radioButtonInner} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.methodLabel,
                            selectedMethod === method.value &&
                              styles.methodLabelSelected,
                          ]}
                        >
                          {method.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelButton, loading && styles.buttonDisabled]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedMethod || loading || availableMethods.length === 0) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={
                !selectedMethod || loading || availableMethods.length === 0
              }
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.surface} />
              ) : (
                <Text style={styles.confirmButtonText}>Xác nhận</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness * 2,
    width: "90%",
    maxHeight: "80%",
    ...theme.shadows.large,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  modalBody: {
    padding: theme.spacing.lg,
    maxHeight: 400,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  methodCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  methodCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.lightOrange,
  },
  methodCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  methodLabel: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  methodLabelSelected: {
    fontWeight: "600",
    color: theme.colors.primary,
  },
  modalFooter: {
    flexDirection: "row",
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.surface,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default AddPaymentMethodModal;
