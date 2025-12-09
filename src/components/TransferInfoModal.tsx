import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { api, TransferInformationPayload } from "../services/api";
import { theme } from "../theme/theme";

type PaymentMethod = "COD" | "TKNH" | "MOMO" | "ZALOPAY";

type TransferInformation = {
  id: number;
  paymentMethod: PaymentMethod;
  isBank: boolean;
  nameBank?: string | null;
  accountNumber?: string | null;
  isActive: boolean;
  userId: number;
};

type FormState = {
  paymentMethod: PaymentMethod;
  isBank: boolean;
  nameBank: string;
  accountNumber: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  userId: number;
};

const PAYMENT_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: "COD", value: "COD" },
  { label: "TKNH", value: "TKNH" },
  { label: "MOMO", value: "MOMO" },
  { label: "ZALOPAY", value: "ZALOPAY" },
];

const TransferInfoModal: React.FC<Props> = ({ visible, onClose, userId }) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<TransferInformation[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<TransferInformation | null>(null);
  const [form, setForm] = useState<FormState>({
    paymentMethod: "COD",
    isBank: true,
    nameBank: "",
    accountNumber: "",
  });

  const loadData = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await api.getTransferInfosByUser(userId);
      setItems((data as TransferInformation[]) || []);
    } catch (error) {
      console.error("Load transfer infos failed", error);
      Alert.alert("Lỗi", "Không thể tải thông tin thanh toán.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const resetForm = () => {
    setForm({
      paymentMethod: "COD",
      isBank: true,
      nameBank: "",
      accountNumber: "",
    });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setFormVisible(true);
  };

  const openEdit = (item: TransferInformation) => {
    setEditing(item);
    setForm({
      paymentMethod: item.paymentMethod,
      isBank: item.isBank ?? true,
      nameBank: item.nameBank || "",
      accountNumber: item.accountNumber || "",
    });
    setFormVisible(true);
  };

  const validateForm = (): string | null => {
    const { paymentMethod, nameBank, accountNumber, isBank } = form;
    if (paymentMethod === "TKNH") {
      if (!nameBank.trim()) return "Vui lòng nhập tên ngân hàng";
      if (!accountNumber.trim()) return "Vui lòng nhập số tài khoản";
    }
    if (paymentMethod === "MOMO") {
      if (!accountNumber.trim()) return "Vui lòng nhập số điện thoại MoMo";
    }
    if (paymentMethod === "ZALOPAY") {
      if (isBank && !nameBank.trim())
        return "Vui lòng nhập tên ngân hàng cho Zalopay";
      if (!accountNumber.trim())
        return isBank
          ? "Vui lòng nhập số tài khoản Zalopay"
          : "Vui lòng nhập số điện thoại Zalopay";
    }
    return null;
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert("Thiếu thông tin", error);
      return;
    }
    try {
      setSaving(true);
      const payload: TransferInformationPayload = {
        paymentMethod: form.paymentMethod,
        isBank: form.isBank,
        nameBank: form.nameBank.trim() || undefined,
        accountNumber: form.accountNumber.trim() || undefined,
      };
      if (editing?.id) {
        await api.updateTransferInfo(editing.id, payload);
      } else {
        await api.createTransferInfo(userId, payload);
      }
      await loadData();
      setFormVisible(false);
      resetForm();
    } catch (err) {
      console.error("Save transfer info failed", err);
      Alert.alert("Lỗi", "Không thể lưu thông tin thanh toán.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: TransferInformation) => {
    Alert.alert(
      "Xóa thông tin",
      "Bạn có chắc muốn xóa phương thức thanh toán này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteTransferInfo(item.id);
              await loadData();
            } catch (err) {
              console.error("Delete transfer info failed", err);
              Alert.alert("Lỗi", "Không thể xóa thông tin thanh toán.");
            }
          },
        },
      ]
    );
  };

  const isZaloPay = form.paymentMethod === "ZALOPAY";
  const isBankFieldVisible = form.paymentMethod === "TKNH" || isZaloPay;
  const showNameBank =
    form.paymentMethod === "TKNH" || (isZaloPay && form.isBank);

  const renderCard = (item: TransferInformation) => {
    const pmLabel =
      PAYMENT_OPTIONS.find((p) => p.value === item.paymentMethod)?.label ||
      item.paymentMethod;
    const accountLabel =
      item.paymentMethod === "MOMO"
        ? "SĐT MoMo"
        : item.paymentMethod === "ZALOPAY" && !item.isBank
        ? "SĐT ZaloPay"
        : "Số tài khoản";
    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleGroup}>
            <Icon name="payment" size={18} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>{pmLabel}</Text>
            {!item.isActive && <Text style={styles.cardBadge}>Đã tắt</Text>}
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => openEdit(item)}
              style={styles.iconButton}
            >
              <Icon name="edit" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={[styles.iconButton, { marginLeft: theme.spacing.xs }]}
            >
              <Icon name="delete" size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        {item.nameBank ? (
          <Text style={styles.cardText}>Ngân hàng: {item.nameBank}</Text>
        ) : null}
        {item.accountNumber ? (
          <Text style={styles.cardText}>
            {accountLabel}: {item.accountNumber}
          </Text>
        ) : (
          <Text style={styles.cardText}>Không có số tài khoản</Text>
        )}
      </View>
    );
  };

  const renderForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.label}>Phương thức</Text>
      <View style={styles.chipRow}>
        {PAYMENT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.chip,
              form.paymentMethod === option.value && styles.chipActive,
            ]}
            onPress={() =>
              setForm((prev) => ({
                ...prev,
                paymentMethod: option.value,
                // Reset phụ thuộc
                isBank: option.value === "ZALOPAY" ? prev.isBank : true,
                nameBank:
                  option.value === "TKNH" || option.value === "ZALOPAY"
                    ? prev.nameBank
                    : "",
                accountNumber: prev.accountNumber,
              }))
            }
          >
            <Text
              style={[
                styles.chipText,
                form.paymentMethod === option.value && styles.chipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isBankFieldVisible && (
        <View style={styles.switchRow}>
          <Text style={styles.label}>Thanh toán qua tài khoản ngân hàng?</Text>
          <Switch
            value={form.isBank}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, isBank: value }))
            }
          />
        </View>
      )}

      {showNameBank && (
        <>
          <Text style={styles.label}>Ngân hàng</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Vietcombank"
            value={form.nameBank}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, nameBank: text }))
            }
          />
        </>
      )}

      <Text style={styles.label}>
        {form.paymentMethod === "MOMO"
          ? "Số điện thoại MoMo"
          : form.paymentMethod === "ZALOPAY" && !form.isBank
          ? "Số điện thoại ZaloPay"
          : "Số tài khoản"}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập số tài khoản / SĐT"
        keyboardType="numeric"
        value={form.accountNumber}
        onChangeText={(text) =>
          setForm((prev) => ({
            ...prev,
            accountNumber: text,
          }))
        }
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={theme.colors.surface} />
        ) : (
          <Text style={styles.saveButtonText}>
            {editing ? "Cập nhật" : "Thêm mới"}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => setFormVisible(false)}
      >
        <Text style={styles.cancelButtonText}>Hủy</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.modalScreen}>
          <View style={styles.modalHeaderBar}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalHeaderButton}
            >
              <Icon name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Thông tin thanh toán</Text>
            <TouchableOpacity
              onPress={openCreate}
              style={styles.modalHeaderButton}
            >
              <Icon name="add" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="credit-card" size={40} color={theme.colors.primary} />
              <Text style={styles.emptyStateTitle}>
                Chưa có phương thức nào
              </Text>
              <Text style={styles.emptyStateDescription}>
                Thêm phương thức thanh toán để khách dễ chuyển khoản.
              </Text>
              <TouchableOpacity style={styles.addButton} onPress={openCreate}>
                <Text style={styles.addButtonText}>Thêm mới</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
            >
              {items.map(renderCard)}
              <TouchableOpacity style={styles.addButton} onPress={openCreate}>
                <Text style={styles.addButtonText}>Thêm mới</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>

      <Modal
        visible={formVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFormVisible(false)}
      >
        <View style={styles.formBackdrop}>
          <View style={styles.formSheet}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {editing ? "Cập nhật thanh toán" : "Thêm mới thanh toán"}
              </Text>
              <TouchableOpacity onPress={() => setFormVisible(false)}>
                <Icon name="close" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>{renderForm()}</ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalScreen: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  modalHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalHeaderButton: {
    padding: theme.spacing.sm,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: theme.colors.mediumGray,
    textAlign: "center",
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: theme.colors.surface,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  cardTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  cardBadge: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.mediumGray,
    fontSize: 12,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: theme.spacing.xs,
  },
  cardText: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 2,
  },
  formBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  formSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.roundness * 2,
    borderTopRightRadius: theme.roundness * 2,
    maxHeight: "80%",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  formContainer: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.text,
    fontWeight: "500",
  },
  chipTextActive: {
    color: theme.colors.surface,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    alignItems: "center",
  },
  saveButtonText: {
    color: theme.colors.surface,
    fontWeight: "700",
  },
  cancelButton: {
    marginTop: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  cancelButtonText: {
    color: theme.colors.mediumGray,
    fontWeight: "600",
  },
});

export default TransferInfoModal;
