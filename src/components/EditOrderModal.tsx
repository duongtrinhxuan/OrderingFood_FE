import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../theme/theme";
import { api } from "../services/api";
import { formatPrice } from "../utils/helpers";

interface OrderDetail {
  id: number;
  quantity: number;
  note?: string;
  product?: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
  };
}

interface Address {
  id: number;
  label: string;
  street: string;
  ward: string;
  district: string;
  province: string;
}

interface Discount {
  id: number;
  code: string;
  percent?: number;
  status: string;
}

interface Order {
  id: number;
  note?: string;
  addressId?: number;
  discountId?: number;
  orderDetails?: OrderDetail[];
  payments?: {
    id: number;
    paymentMethod: string;
  }[];
}

interface EditOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order: Order;
  userId: number;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  visible,
  onClose,
  onSuccess,
  order,
  userId,
}) => {
  const [note, setNote] = useState(order.note || "");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    order.addressId || null
  );
  const [selectedDiscountId, setSelectedDiscountId] = useState<number | null>(
    order.discountId || null
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
    order.payments?.[0]?.paymentMethod || "COD"
  );
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>(
    order.orderDetails || []
  );

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const loadAddresses = useCallback(async () => {
    try {
      const data = await api.getUserAddresses(userId);
      const addressList = (data as any[]) || [];
      setAddresses(addressList.map((ua: any) => ua.address));
    } catch (error) {
      console.error("Error loading addresses:", error);
    }
  }, [userId]);

  const loadDiscounts = useCallback(async () => {
    try {
      const data = await api.getDiscounts();
      const discountList = (data as any[]) || [];
      setDiscounts(discountList.filter((d: Discount) => d.status === "ACTIVE"));
    } catch (error) {
      console.error("Error loading discounts:", error);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setLoadingData(true);
      Promise.all([loadAddresses(), loadDiscounts()]).finally(() => {
        setLoadingData(false);
      });
    }
  }, [visible, loadAddresses, loadDiscounts]);

  useEffect(() => {
    if (visible && order) {
      setNote(order.note || "");
      setSelectedAddressId(order.addressId || null);
      setSelectedDiscountId(order.discountId || null);
      setSelectedPaymentMethod(order.payments?.[0]?.paymentMethod || "COD");
      setOrderDetails(order.orderDetails || []);
    }
  }, [visible, order]);

  const handleUpdateQuantity = (detailId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setOrderDetails((prev) =>
      prev.map((detail) =>
        detail.id === detailId ? { ...detail, quantity: newQuantity } : detail
      )
    );
  };

  const handleRemoveDetail = (detailId: number) => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa món này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          setOrderDetails((prev) => prev.filter((d) => d.id !== detailId));
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!selectedAddressId) {
      Alert.alert("Lỗi", "Vui lòng chọn địa chỉ giao hàng.");
      return;
    }

    if (orderDetails.length === 0) {
      Alert.alert("Lỗi", "Đơn hàng phải có ít nhất một món.");
      return;
    }

    try {
      setLoading(true);

      // Prepare orderDetails payload
      const orderDetailsPayload = orderDetails
        .filter((detail) => detail.product?.id && detail.quantity > 0)
        .map((detail) => ({
          id: detail.id,
          productId: detail.product!.id,
          quantity: detail.quantity,
          note: detail.note || undefined,
        }));

      if (orderDetailsPayload.length === 0) {
        Alert.alert("Lỗi", "Đơn hàng phải có ít nhất một món hợp lệ.");
        setLoading(false);
        return;
      }

      // Prepare payment payload
      const paymentPayload = {
        paymentMethod: selectedPaymentMethod,
        status: 1, // Default: pending
      };

      // Cập nhật đơn hàng với đầy đủ thông tin
      await api.updateOrder(order.id, {
        note: note.trim() || undefined,
        status: order.status, // Giữ nguyên status
        addressId: selectedAddressId || undefined,
        discountId: selectedDiscountId || null,
        orderDetails: orderDetailsPayload,
        payment: paymentPayload,
      });

      Alert.alert("Thành công", "Đã cập nhật đơn hàng.");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating order:", error);
      Alert.alert("Lỗi", error?.message || "Không thể cập nhật đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const selectedDiscount = discounts.find((d) => d.id === selectedDiscountId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa đơn hàng</Text>
          <View style={{ width: 24 }} />
        </View>

        {loadingData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Note */}
            <View style={styles.section}>
              <Text style={styles.label}>Ghi chú đơn hàng</Text>
              <TextInput
                style={styles.textInput}
                value={note}
                onChangeText={setNote}
                placeholder="Nhập ghi chú (tùy chọn)"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Address */}
            <View style={styles.section}>
              <Text style={styles.label}>Địa chỉ giao hàng *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.addressScroll}
              >
                {addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.addressCard,
                      selectedAddressId === address.id &&
                        styles.addressCardSelected,
                    ]}
                    onPress={() => setSelectedAddressId(address.id)}
                  >
                    <Text style={styles.addressLabel}>{address.label}</Text>
                    <Text style={styles.addressText} numberOfLines={2}>
                      {`${address.street}, ${address.ward}, ${address.district}, ${address.province}`}
                    </Text>
                    {selectedAddressId === address.id && (
                      <Icon
                        name="check-circle"
                        size={20}
                        color={theme.colors.primary}
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Discount */}
            <View style={styles.section}>
              <Text style={styles.label}>Mã giảm giá</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.discountScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.discountCard,
                    !selectedDiscountId && styles.discountCardSelected,
                  ]}
                  onPress={() => setSelectedDiscountId(null)}
                >
                  <Text
                    style={[
                      styles.discountText,
                      !selectedDiscountId && styles.discountTextSelected,
                    ]}
                  >
                    Không áp dụng
                  </Text>
                </TouchableOpacity>
                {discounts.map((discount) => (
                  <TouchableOpacity
                    key={discount.id}
                    style={[
                      styles.discountCard,
                      selectedDiscountId === discount.id &&
                        styles.discountCardSelected,
                    ]}
                    onPress={() => setSelectedDiscountId(discount.id)}
                  >
                    <Text
                      style={[
                        styles.discountText,
                        selectedDiscountId === discount.id &&
                          styles.discountTextSelected,
                      ]}
                    >
                      {discount.code} - {discount.percent || 0}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Payment Method */}
            <View style={styles.section}>
              <Text style={styles.label}>Phương thức thanh toán</Text>
              <View style={styles.paymentRow}>
                {["COD", "BANK_TRANSFER", "MOMO", "ZALOPAY"].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentButton,
                      selectedPaymentMethod === method &&
                        styles.paymentButtonSelected,
                    ]}
                    onPress={() => setSelectedPaymentMethod(method)}
                  >
                    <Text
                      style={[
                        styles.paymentText,
                        selectedPaymentMethod === method &&
                          styles.paymentTextSelected,
                      ]}
                    >
                      {method === "COD"
                        ? "Tiền mặt"
                        : method === "BANK_TRANSFER"
                        ? "Chuyển khoản"
                        : method === "MOMO"
                        ? "MoMo"
                        : "ZaloPay"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Order Details */}
            <View style={styles.section}>
              <Text style={styles.label}>Các món đã đặt</Text>
              {orderDetails.map((detail) => (
                <View key={detail.id} style={styles.detailCard}>
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailName}>
                      {detail.product?.name || "Món ăn"}
                    </Text>
                    <Text style={styles.detailPrice}>
                      {formatPrice(detail.product?.price || 0)}
                    </Text>
                  </View>
                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        handleUpdateQuantity(detail.id, detail.quantity - 1)
                      }
                    >
                      <Icon
                        name="remove"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{detail.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        handleUpdateQuantity(detail.id, detail.quantity + 1)
                      }
                    >
                      <Icon name="add" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveDetail(detail.id)}
                    >
                      <Icon
                        name="delete"
                        size={20}
                        color={theme.colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.surface} />
            ) : (
              <>
                <Icon name="check" size={20} color={theme.colors.surface} />
                <Text style={styles.saveButtonText}>Xác nhận cập nhật</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing.lg + 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 80,
    textAlignVertical: "top",
  },
  addressScroll: {
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  addressCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    minWidth: 200,
    position: "relative",
  },
  addressCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.lightOrange,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  addressText: {
    fontSize: 12,
    color: theme.colors.mediumGray,
  },
  checkIcon: {
    position: "absolute",
    top: theme.spacing.xs,
    right: theme.spacing.xs,
  },
  discountScroll: {
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  discountCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  discountCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.lightOrange,
  },
  discountText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  discountTextSelected: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  paymentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  paymentButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    minWidth: 100,
  },
  paymentButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.lightOrange,
  },
  paymentText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: "center",
  },
  paymentTextSelected: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  detailCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailInfo: {
    marginBottom: theme.spacing.sm,
  },
  detailName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  detailPrice: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  detailActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityButton: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness / 2,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    minWidth: 40,
    textAlign: "center",
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
  footer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.surface,
    marginLeft: theme.spacing.xs,
  },
});

export default EditOrderModal;
