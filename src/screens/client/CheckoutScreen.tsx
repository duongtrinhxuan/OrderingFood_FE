import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../../theme/theme";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { api } from "../../services/api";
import { formatPrice } from "../../utils/helpers";
import OrderDetailCard from "../../components/OrderDetailCard";
import DiscountModal from "../../components/DiscountModal";
import AddressModal from "../../components/AddressModal";

interface CartItem {
  id: number;
  quantity: number;
  unitPrice: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
    restaurantID?: number;
    restaurant?: {
      id: number;
      name: string;
    };
  };
}

interface Discount {
  id: number;
  type?: number;
  percent?: number;
  discountmoney?: number;
  description: string;
  startTime: string;
  endTime: string;
  status: string;
  minOrderValue?: number;
}

interface Address {
  id: number;
  label: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  latitude?: number;
  longitude?: number;
  userAddress?: {
    id: number;
    isDefault?: boolean;
  };
}

const SHIPPING_FEE = 20000; // Phí ship mặc định
const ORDER_STATUS_PROCESSING = 1; // "Đang xử lý"
const PAYMENT_STATUS_PENDING = 1; // "Chưa hoàn thành"

const CheckoutScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { cartId, refreshCartCount } = useCart();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Order details notes
  const [orderDetailNotes, setOrderDetailNotes] = useState<{
    [key: number]: string;
  }>({});

  // Order note
  const [orderNote, setOrderNote] = useState("");

  // Discount
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(
    null
  );
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Address
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(true);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<string>("COD");

  const paymentMethods = [
    { value: "COD", label: "COD" },
    { value: "Tài khoản ngân hàng", label: "Tài khoản ngân hàng" },
    { value: "Ví MoMo", label: "Ví MoMo" },
    { value: "Zalopay", label: "Zalopay" },
  ];

  // Load cart items
  const loadCartItems = useCallback(async () => {
    if (!cartId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const items = await api.getCartItemsByCart(cartId);
      const activeItems = (items as any[]).filter(
        (item: any) => item.isActive !== false
      );
      setCartItems(activeItems);

      // Initialize notes
      const notes: { [key: number]: string } = {};
      activeItems.forEach((item: any) => {
        notes[item.id] = "";
      });
      setOrderDetailNotes(notes);
    } catch (error: any) {
      console.error("Error loading cart items:", error);
      Alert.alert("Lỗi", "Không thể tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  // Load default address
  const loadDefaultAddress = useCallback(async () => {
    if (!user?.id) {
      setLoadingAddress(false);
      return;
    }

    try {
      setLoadingAddress(true);
      const userAddresses = await api.getUserAddresses(user.id);
      const defaultAddressData = (userAddresses as any[]).find(
        (ua: any) => ua.isDefault || ua.address?.isDefault
      );

      if (defaultAddressData?.address) {
        setSelectedAddress({
          ...defaultAddressData.address,
          userAddress: {
            id: defaultAddressData.id,
            isDefault: defaultAddressData.isDefault,
          },
        });
      } else if (userAddresses && (userAddresses as any[]).length > 0) {
        // Nếu không có default, lấy address đầu tiên
        const firstAddress = (userAddresses as any[])[0];
        if (firstAddress.address) {
          setSelectedAddress({
            ...firstAddress.address,
            userAddress: {
              id: firstAddress.id,
              isDefault: firstAddress.isDefault,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error loading default address:", error);
    } finally {
      setLoadingAddress(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCartItems();
    loadDefaultAddress();
  }, [loadCartItems, loadDefaultAddress]);

  // Calculate subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.unitPrice, 0);
  };

  // Kiểm tra discount có hợp lệ không
  const isDiscountValid = () => {
    if (!selectedDiscount) return false;

    const subtotal = calculateSubtotal();
    const minOrderValue = selectedDiscount.minOrderValue || 0;

    // Kiểm tra minOrderValue
    if (subtotal < minOrderValue) return false;

    // Kiểm tra thời gian áp dụng
    const now = new Date();
    const startTime = selectedDiscount.startTime
      ? new Date(selectedDiscount.startTime)
      : null;
    const endTime = selectedDiscount.endTime
      ? new Date(selectedDiscount.endTime)
      : null;

    if (startTime && now < startTime) return false;
    if (endTime && now > endTime) return false;

    return true;
  };

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    if (!selectedDiscount || !isDiscountValid()) return 0;

    const subtotal = calculateSubtotal();
    const discountType = selectedDiscount.type || 1;
    let discountAmount = 0;

    if (discountType === 1) {
      // Giảm theo phần trăm
      const percent = selectedDiscount.percent || 0;
      discountAmount = Math.floor((subtotal * percent) / 100);
    } else if (discountType === 2) {
      // Giảm theo số tiền cố định
      discountAmount = selectedDiscount.discountmoney || 0;
    } else if (discountType === 3) {
      // Free ship - không giảm tiền, chỉ free ship
      discountAmount = 0;
    }

    return discountAmount;
  };

  // Calculate shipping fee
  const calculateShippingFee = () => {
    if (!selectedDiscount || !isDiscountValid()) {
      return SHIPPING_FEE;
    }

    const discountType = selectedDiscount.type || 1;

    // Type = 3: Free ship
    if (discountType === 3) {
      return 0;
    }

    return SHIPPING_FEE;
  };

  // Calculate total
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    const shippingFee = calculateShippingFee();
    return subtotal - discountAmount + shippingFee;
  };

  // Get restaurant ID from cart items
  const getRestaurantId = () => {
    if (cartItems.length === 0) return null;
    return (
      cartItems[0].product.restaurantID ||
      cartItems[0].product.restaurant?.id ||
      null
    );
  };

  // Handle create order
  const handleCreateOrder = async () => {
    if (!user?.id) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập");
      return;
    }

    if (!selectedAddress) {
      Alert.alert("Lỗi", "Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    const restaurantId = getRestaurantId();
    if (!restaurantId) {
      Alert.alert("Lỗi", "Không thể xác định nhà hàng");
      return;
    }

    try {
      setSubmitting(true);

      const subtotal = calculateSubtotal();
      const discountAmount = calculateDiscountAmount();
      const shippingFee = calculateShippingFee();
      // totalPrice = subtotal - discount (không bao gồm shippingFee vì có field riêng)
      const totalPrice = subtotal - discountAmount;

      // Tạo order
      const order = await api.createOrder({
        totalPrice: totalPrice,
        status: ORDER_STATUS_PROCESSING,
        shippingFee: shippingFee,
        note: orderNote || undefined,
        userId: user.id,
        restaurantId: restaurantId,
        addressId: selectedAddress.id,
        discountId: selectedDiscount?.id,
      });

      const orderId = (order as any).id;

      // Tạo order details
      for (const cartItem of cartItems) {
        await api.createOrderDetail({
          quantity: cartItem.quantity,
          note: orderDetailNotes[cartItem.id] || undefined,
          productId: cartItem.product.id,
          orderId: orderId,
        });
      }

      // Tạo payment
      await api.createPayment({
        paymentMethod: paymentMethod,
        status: PAYMENT_STATUS_PENDING,
        orderId: orderId,
      });

      // Xóa cart items (set isActive = false)
      for (const cartItem of cartItems) {
        await api.deleteCartItem(cartItem.id);
      }

      await refreshCartCount();

      Alert.alert("Thành công", "Đơn hàng đã được tạo thành công!", [
        {
          text: "OK",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      console.error("Error creating order:", error);
      Alert.alert(
        "Lỗi",
        `Không thể tạo đơn hàng: ${error.message || "Vui lòng thử lại"}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getFullAddress = (address: Address) => {
    return `${address.street}, ${address.ward}, ${address.district}, ${address.province}`;
  };

  if (loading || loadingAddress) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông Tin Đơn Hàng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết đơn hàng</Text>
          {cartItems.map((item) => (
            <OrderDetailCard
              key={item.id}
              cartItem={item}
              note={orderDetailNotes[item.id] || ""}
              onNoteChange={(note) => {
                setOrderDetailNotes((prev) => ({
                  ...prev,
                  [item.id]: note,
                }));
              }}
            />
          ))}
        </View>

        {/* Order Note */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú cho đơn hàng</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Nhập ghi chú cho đơn hàng..."
            value={orderNote}
            onChangeText={setOrderNote}
            multiline
            numberOfLines={3}
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        {/* Discount Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mã giảm giá</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowDiscountModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {selectedDiscount
                ? selectedDiscount.type === 3
                  ? `Miễn phí vận chuyển - ${selectedDiscount.description}`
                  : selectedDiscount.type === 1
                  ? `${selectedDiscount.percent}% - ${selectedDiscount.description}`
                  : `${selectedDiscount.discountmoney?.toLocaleString(
                      "vi-VN"
                    )} VND - ${selectedDiscount.description}`
                : "Chọn mã giảm giá"}
            </Text>
            <Icon
              name="chevron-right"
              size={24}
              color={theme.colors.mediumGray}
            />
          </TouchableOpacity>
        </View>

        {/* Address Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowAddressModal(true)}
          >
            <View style={styles.addressContent}>
              <Icon name="location-on" size={20} color={theme.colors.primary} />
              <Text style={styles.selectButtonText} numberOfLines={2}>
                {selectedAddress
                  ? getFullAddress(selectedAddress)
                  : "Chọn địa chỉ giao hàng"}
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={24}
              color={theme.colors.mediumGray}
            />
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.paymentMethodButton,
                  paymentMethod === method.value &&
                    styles.selectedPaymentMethodButton,
                ]}
                onPress={() => setPaymentMethod(method.value)}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === method.value &&
                      styles.selectedPaymentMethodText,
                  ]}
                >
                  {method.label}
                </Text>
                {paymentMethod === method.value && (
                  <Icon
                    name="check-circle"
                    size={20}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(calculateSubtotal())}
              </Text>
            </View>
            {selectedDiscount && isDiscountValid() && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {selectedDiscount.type === 3
                    ? "Miễn phí vận chuyển"
                    : selectedDiscount.type === 1
                    ? `Giảm giá (${selectedDiscount.percent}%)`
                    : "Giảm giá"}
                </Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  {selectedDiscount.type === 3
                    ? "Miễn phí"
                    : `-${formatPrice(calculateDiscountAmount())}`}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí giao hàng</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(calculateShippingFee())}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>
                {formatPrice(calculateTotal())}
              </Text>
            </View>
          </View>
        </View>

        {/* Confirm Button */}
        <View style={styles.footerButtonContainer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleCreateOrder}
            disabled={submitting || cartItems.length === 0}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {submitting ? (
                <ActivityIndicator color={theme.colors.surface} />
              ) : (
                <Text style={styles.confirmButtonText}>
                  Xác nhận tạo đơn hàng
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <DiscountModal
        visible={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSelect={setSelectedDiscount}
        selectedDiscount={selectedDiscount}
        subtotal={calculateSubtotal()}
      />

      {user && (
        <AddressModal
          visible={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onSelect={setSelectedAddress}
          selectedAddress={selectedAddress}
          userId={user.id}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing.lg + 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.navbarHeight + 100,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  noteInput: {
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
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectButtonText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  addressContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  paymentMethods: {
    gap: theme.spacing.sm,
  },
  paymentMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  selectedPaymentMethodButton: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.lightOrange,
  },
  paymentMethodText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  selectedPaymentMethodText: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  summaryContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.mediumGray,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  discountValue: {
    color: theme.colors.success,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  footerButtonContainer: {
    marginBottom: theme.spacing.xxl,
  },
  confirmButton: {
    borderRadius: theme.roundness,
    overflow: "hidden",
    ...theme.shadows.medium,
  },
  gradientButton: {
    paddingVertical: theme.spacing.md + 4,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.surface,
    letterSpacing: 0.5,
  },
});

export default CheckoutScreen;
