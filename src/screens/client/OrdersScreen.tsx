import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../../theme/theme";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { formatPrice, formatDateTime } from "../../utils/helpers";
import { useNavigation } from "@react-navigation/native";
import FeedbackModal, { OrderFeedback } from "../../components/FeedbackModal";

interface OrderDetail {
  id: number;
  quantity: number;
  product?: {
    id: number;
    name: string;
    imageUrl?: string;
  };
}

interface Order {
  id: number;
  status: number;
  totalPrice: number;
  shippingFee: number;
  createdAt: string;
  restaurant?: {
    id: number;
    name: string;
    imageUrl?: string;
  };
  orderDetails?: OrderDetail[];
  feedbacks?: OrderFeedback[];
  payments?: {
    id: number;
    paymentMethod?: string;
    status?: number;
  }[];
}

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả", status: undefined },
  { key: "processing", label: "Đang xử lý", status: 1 },
  { key: "confirmed", label: "Đã xác nhận", status: 2 },
  { key: "delivering", label: "Đang giao", status: 3 },
  { key: "completed", label: "Hoàn thành", status: 4 },
  { key: "cancelled", label: "Đã hủy", status: 5 },
];

const ORDER_STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: "Đang xử lý", color: theme.colors.warning },
  2: { label: "Đã xác nhận", color: theme.colors.info },
  3: { label: "Đang giao", color: theme.colors.primary },
  4: { label: "Hoàn thành", color: theme.colors.success },
  5: { label: "Đã hủy", color: theme.colors.error },
};

const OrdersScreen = () => {
  const navigation = useNavigation();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { user } = useAuth();

  const currentStatusFilter = STATUS_FILTERS.find(
    (filter) => filter.key === selectedStatus
  );

  const loadOrders = useCallback(async () => {
    if (!user?.id) {
      setOrders([]);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getOrdersByUser(
        user.id,
        currentStatusFilter?.status
      );
      setOrders((data as Order[]) || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, currentStatusFilter?.status]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const openFeedbackModal = (order: Order) => {
    setSelectedOrder(order);
    setFeedbackModalVisible(true);
  };

  const closeFeedbackModal = () => {
    setSelectedOrder(null);
    setFeedbackModalVisible(false);
  };

  const handleFeedbackSaved = () => {
    closeFeedbackModal();
    loadOrders();
  };

  const buildOrderItemsSummary = (orderDetails?: OrderDetail[]) => {
    if (!orderDetails || orderDetails.length === 0) return "";
    return orderDetails
      .map((detail) => {
        const name = detail.product?.name || "Món ăn";
        return `${name} x${detail.quantity || 0}`;
      })
      .join(", ");
  };

  const renderStatusFilter = (filter: (typeof STATUS_FILTERS)[number]) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterChip,
        selectedStatus === filter.key && styles.selectedFilterChip,
      ]}
      onPress={() => setSelectedStatus(filter.key)}
    >
      <Text
        style={[
          styles.filterText,
          selectedStatus === filter.key && styles.selectedFilterText,
        ]}
      >
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrder = ({ item }: { item: Order }) => {
    const statusInfo = ORDER_STATUS_MAP[item.status] || {
      label: "Không xác định",
      color: theme.colors.mediumGray,
    };
    const orderTotal =
      (item.totalPrice || 0) + (item.shippingFee ? item.shippingFee : 0);
    const orderDetails = item.orderDetails || [];
    const existingFeedback = item.feedbacks?.[0];

    let paymentStatusText: string | null = null;
    if (item.status === 4 && item.payments && item.payments.length > 0) {
      const hasPaid = item.payments.some((p) => p && p.status === 2);
      const allPending = item.payments.every((p) => p && p.status === 1);
      if (hasPaid) {
        paymentStatusText = "Đã thanh toán";
      } else if (allPending) {
        paymentStatusText = "Chưa thanh toán";
      }
    }

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate(
            "OrderDetail" as never,
            {
              orderId: item.id,
            } as never
          )
        }
      >
        <View style={styles.orderHeader}>
          <View style={styles.restaurantInfo}>
            <Image
              source={{
                uri:
                  item.restaurant?.imageUrl ||
                  "https://via.placeholder.com/80x80",
              }}
              style={styles.restaurantImage}
            />
            <View>
              <Text style={styles.restaurantName}>
                {item.restaurant?.name || "Nhà hàng"}
              </Text>
              <Text style={styles.orderTime}>
                {formatDateTime(item.createdAt)}
              </Text>
            </View>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
          >
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={styles.orderItems}>
          {orderDetails.length > 0 ? (
            orderDetails.map((detail) => (
              <View key={detail.id} style={styles.orderDetailRow}>
                <Text style={styles.orderItemText}>
                  {detail.product?.name || "Món ăn"}
                </Text>
                <Text style={styles.orderItemQuantity}>
                  x{detail.quantity || 0}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.orderItemText}>Không có món ăn</Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.deliveryInfo}>
            <Icon name="schedule" size={16} color={theme.colors.mediumGray} />
            <Text style={styles.deliveryText}>25-35 phút</Text>
          </View>
          <Text style={styles.orderTotal}>{formatPrice(orderTotal)}</Text>
        </View>

        {paymentStatusText && (
          <View style={styles.paymentStatusRow}>
            <Icon
              name={
                paymentStatusText === "Đã thanh toán"
                  ? "check-circle"
                  : "payment"
              }
              size={16}
              color={
                paymentStatusText === "Đã thanh toán"
                  ? theme.colors.success
                  : theme.colors.warning
              }
            />
            <Text
              style={[
                styles.paymentStatusText,
                paymentStatusText === "Đã thanh toán"
                  ? { color: theme.colors.success }
                  : { color: theme.colors.warning },
              ]}
            >
              {paymentStatusText}
            </Text>
          </View>
        )}

        {item.status === 4 ? (
          <TouchableOpacity
            style={[
              styles.reviewButton,
              existingFeedback
                ? styles.reviewButtonOutlined
                : styles.reviewButtonFilled,
            ]}
            onPress={() => openFeedbackModal(item)}
          >
            <Icon
              name="rate-review"
              size={16}
              color={
                existingFeedback ? theme.colors.primary : theme.colors.surface
              }
            />
            <Text
              style={[
                styles.reviewButtonText,
                existingFeedback
                  ? { color: theme.colors.primary }
                  : { color: theme.colors.surface },
              ]}
            >
              {existingFeedback ? "Cập nhật nhận xét" : "Nhận xét về đơn hàng"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  };

  const isEmpty = !loading && orders.length === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Đơn hàng</Text>

      <View style={styles.filtersContainer}>
        <FlatList
          data={STATUS_FILTERS}
          renderItem={({ item }) => renderStatusFilter(item)}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        />
      </View>

      {loading && orders.length === 0 ? (
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.ordersList,
            { paddingBottom: theme.navbarHeight + theme.spacing.md },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            isEmpty ? (
              <View style={styles.emptyContainer}>
                <Icon
                  name="receipt"
                  size={64}
                  color={theme.colors.mediumGray}
                />
                <Text style={styles.emptyText}>Không có đơn hàng</Text>
                <Text style={styles.emptySubtext}>
                  Bạn chưa có đơn hàng nào
                </Text>
              </View>
            ) : null
          }
        />
      )}
      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={closeFeedbackModal}
        onSuccess={handleFeedbackSaved}
        orderId={selectedOrder?.id || 0}
        orderName={selectedOrder?.restaurant?.name}
        orderItemsSummary={buildOrderItemsSummary(selectedOrder?.orderDetails)}
        existingFeedback={selectedOrder?.feedbacks?.[0]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filtersScroll: {
    paddingHorizontal: theme.spacing.lg,
  },
  filterChip: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedFilterChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.mediumGray,
  },
  selectedFilterText: {
    color: theme.colors.surface,
  },
  ordersList: {
    padding: theme.spacing.lg,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  restaurantInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  restaurantImage: {
    width: 48,
    height: 48,
    borderRadius: theme.roundness,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.lightOrange,
  },
  restaurantImageContainer: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.lightOrange,
    borderRadius: theme.roundness / 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  orderTime: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness / 2,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: theme.colors.surface,
  },
  orderItems: {
    marginVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
  },
  orderDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
  },
  orderItemText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  orderItemQuantity: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.roundness,
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  reviewButtonFilled: {
    backgroundColor: theme.colors.primary,
  },
  reviewButtonOutlined: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: theme.spacing.xs,
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryText: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginLeft: theme.spacing.xs,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  paymentStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.xs,
  },
  paymentStatusText: {
    marginLeft: theme.spacing.xs,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 16,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
});

export default OrdersScreen;
