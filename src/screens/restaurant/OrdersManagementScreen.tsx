import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../../theme/theme";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { formatDateTime, formatPrice } from "../../utils/helpers";
import { useRoute } from "@react-navigation/native";

interface OrderDetail {
  id: number;
  quantity: number;
  product?: {
    id: number;
    name: string;
    price: number;
  };
}

interface OrdersManagementScreenProps {
  restaurantId?: number;
}

type OrdersManagementScreenComponentProps = OrdersManagementScreenProps & {
  route?: any;
  navigation?: any;
};

interface Order {
  id: number;
  status: number;
  totalPrice: number;
  shippingFee: number;
  note?: string;
  createdAt: string;
  user?: {
    username: string;
    phone?: string;
  };
  address?: {
    street?: string;
    ward?: string;
    district?: string;
    province?: string;
  };
  orderDetails?: OrderDetail[];
}

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả", status: undefined },
  { key: "processing", label: "Đang xử lý", status: 1 },
  { key: "confirmed", label: "Đã xác nhận", status: 2 },
  { key: "delivering", label: "Đang giao", status: 3 },
  { key: "completed", label: "Hoàn thành", status: 4 },
  { key: "cancelled", label: "Đã hủy", status: 5 },
];

const STATUS_OPTIONS = [
  { value: 1, label: "Đang xử lý" },
  { value: 2, label: "Đã xác nhận" },
  { value: 3, label: "Đang giao" },
  { value: 4, label: "Hoàn thành" },
  { value: 5, label: "Đã hủy" },
];

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: "Đang xử lý", color: theme.colors.warning },
  2: { label: "Đã xác nhận", color: theme.colors.info },
  3: { label: "Đang giao", color: theme.colors.primary },
  4: { label: "Hoàn thành", color: theme.colors.success },
  5: { label: "Đã hủy", color: theme.colors.error },
};

const DEFAULT_DELIVERY_TIME = "25-35 phút";

const OrdersManagementScreen: React.FC<
  OrdersManagementScreenComponentProps
> = ({ restaurantId }) => {
  const { user } = useAuth();
  const route = useRoute<any>();
  const routeRestaurantId = route?.params?.restaurantId;

  const [currentRestaurantId, setCurrentRestaurantId] = useState<number | null>(
    restaurantId ?? routeRestaurantId ?? null
  );
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [orderUpdating, setOrderUpdating] = useState<Order | null>(null);
  const [selectedStatusOption, setSelectedStatusOption] = useState<
    number | null
  >(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    setCurrentRestaurantId(restaurantId ?? routeRestaurantId ?? null);
  }, [restaurantId, routeRestaurantId]);

  const fetchRestaurant = useCallback(async () => {
    if (restaurantId || !user?.id) {
      return;
    }
    try {
      const data = await api.getRestaurantsByOwner(user.id);
      const restaurants = data as any[];
      if (restaurants && restaurants.length > 0) {
        setCurrentRestaurantId(restaurants[0].id);
      } else {
        setCurrentRestaurantId(null);
      }
    } catch (error) {
      console.error("Error loading restaurant:", error);
      setCurrentRestaurantId(null);
    }
  }, [restaurantId, user?.id]);

  useEffect(() => {
    if (!restaurantId && !routeRestaurantId) {
      fetchRestaurant();
    }
  }, [fetchRestaurant, restaurantId, routeRestaurantId]);

  const loadOrders = useCallback(async () => {
    if (!currentRestaurantId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const statusFilter = STATUS_FILTERS.find(
        (filter) => filter.key === selectedStatus
      )?.status;
      const data = await api.getOrdersByRestaurant(
        currentRestaurantId,
        statusFilter
      );
      setOrders((data as Order[]) || []);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentRestaurantId, selectedStatus]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusInfo = (status: number) =>
    STATUS_MAP[status] || {
      label: "Không xác định",
      color: theme.colors.mediumGray,
    };

  const getAddressText = (order: Order) => {
    if (!order.address) return "Không có địa chỉ";
    const { street, ward, district, province } = order.address;
    return [street, ward, district, province].filter(Boolean).join(", ");
  };

  const handleOpenStatusModal = (order: Order) => {
    setOrderUpdating(order);
    setSelectedStatusOption(order.status);
    setStatusModalVisible(true);
  };

  const handleConfirmStatus = async () => {
    if (!orderUpdating || selectedStatusOption === null) {
      return;
    }
    try {
      setUpdatingStatus(true);
      await api.updateOrder(orderUpdating.id, {
        status: selectedStatusOption,
      });
      setStatusModalVisible(false);
      setOrderUpdating(null);
      setSelectedStatusOption(null);
      loadOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return theme.colors.warning;
      case "preparing":
        return theme.colors.info;
      case "ready":
        return theme.colors.primary;
      case "delivering":
        return theme.colors.success;
      case "completed":
        return theme.colors.mediumGray;
      default:
        return theme.colors.mediumGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "preparing":
        return "Đang chuẩn bị";
      case "ready":
        return "Sẵn sàng";
      case "delivering":
        return "Đang giao";
      case "completed":
        return "Hoàn thành";
      default:
        return status;
    }
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
    const statusInfo = getStatusInfo(item.status);
    const total = (item.totalPrice || 0) + (item.shippingFee || 0);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>#{item.id}</Text>
            <Text style={styles.customerName}>
              {item.user?.username || "Khách hàng"}
            </Text>
            <Text style={styles.orderTime}>
              {formatDateTime(item.createdAt)}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
          >
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Icon name="phone" size={16} color={theme.colors.mediumGray} />
            <Text style={styles.detailText}>
              {item.user?.phone || "Không có số điện thoại"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="place" size={16} color={theme.colors.mediumGray} />
            <Text style={styles.detailText}>{getAddressText(item)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="schedule" size={16} color={theme.colors.mediumGray} />
            <Text style={styles.detailText}>{DEFAULT_DELIVERY_TIME}</Text>
          </View>
          {item.note ? (
            <View style={styles.detailRow}>
              <Icon name="note" size={16} color={theme.colors.mediumGray} />
              <Text style={styles.detailText}>{item.note}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.orderItems}>
          <Text style={styles.itemsTitle}>Món đã đặt:</Text>
          {item.orderDetails?.map((orderItem) => (
            <View key={orderItem.id} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {orderItem.quantity}x {orderItem.product?.name || "Món ăn"}
              </Text>
              <Text style={styles.itemPrice}>
                {formatPrice(
                  (orderItem.product?.price || 0) * (orderItem.quantity || 0)
                )}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>Tổng: {formatPrice(total)}</Text>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => handleOpenStatusModal(item)}
          >
            <Text style={styles.updateButtonText}>Cập nhật trạng thái</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <View style={styles.emptyContainer}>
            <Icon name="receipt" size={64} color={theme.colors.mediumGray} />
            <Text style={styles.emptyText}>Không có đơn hàng</Text>
            <Text style={styles.emptySubtext}>
              Chưa có đơn hàng nào trong trạng thái này
            </Text>
          </View>
        }
      />

      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cập nhật trạng thái đơn hàng</Text>
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusOption,
                  selectedStatusOption === option.value &&
                    styles.selectedStatusOption,
                ]}
                onPress={() => setSelectedStatusOption(option.value)}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    selectedStatusOption === option.value &&
                      styles.selectedStatusOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setStatusModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleConfirmStatus}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: theme.colors.surface },
                    ]}
                  >
                    Xác nhận
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  orderId: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.xs,
  },
  customerName: {
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
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: theme.colors.surface,
  },
  orderDetails: {
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  orderItems: {
    marginBottom: theme.spacing.sm,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  itemName: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    flex: 1,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.text,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness / 2,
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: theme.colors.surface,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.roundness * 2,
    borderTopRightRadius: theme.roundness * 2,
    padding: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statusOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  selectedStatusOption: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.lightOrange,
  },
  statusOptionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedStatusOptionText: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.lg,
  },
  modalButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
  },
  modalConfirmButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
});

export default OrdersManagementScreen;
