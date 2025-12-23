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
  Image,
  ScrollView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../../theme/theme";
import { useAuth } from "../../context/AuthContext";
import { api, buildImageUrl } from "../../services/api";
import { formatDateTime, formatPrice } from "../../utils/helpers";
import { useRoute } from "@react-navigation/native";
import OrderJourneyModal from "../../components/OrderJourneyModal";

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
    avatar?: string;
  };
  address?: {
    street?: string;
    ward?: string;
    district?: string;
    province?: string;
  };
  orderDetails?: OrderDetail[];
  discount?: {
    code?: string;
    percent?: number;
  };
  payments?: {
    id: number;
    paymentMethod?: string;
    status?: number;
    createdAt?: string;
  }[];
  feedbacks?: {
    id: number;
    rating: number;
    content?: string;
    imageUrl?: string;
    createdAt?: string;
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
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(
    null
  );
  const [journeyModalVisible, setJourneyModalVisible] = useState(false);

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
      const orderList = (data as Order[]) || [];
      setOrders(orderList);
      if (selectedOrder) {
        const updatedDetail = orderList.find(
          (order) => order.id === selectedOrder.id
        );
        if (updatedDetail) {
          setSelectedOrder(updatedDetail);
        }
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentRestaurantId, selectedStatus, selectedOrder?.id]);

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
      const raw = (error as any)?.message || "";
      let parsedMsg = raw;
      try {
        const json = JSON.parse(raw);
        parsedMsg = json?.message || raw;
      } catch {
        // keep raw
      }
      if (
        typeof parsedMsg === "string" &&
        parsedMsg.includes("Thanh toán chưa hoàn tất")
      ) {
        Alert.alert(
          "Không thể cập nhật",
          "Đơn hàng chưa được thanh toán. Vui lòng xác nhận thanh toán trước khi đổi trạng thái."
        );
      } else if (
        typeof parsedMsg === "string" &&
        parsedMsg.includes("COD chưa thanh toán")
      ) {
        Alert.alert(
          "Không thể hoàn thành",
          "Đơn COD chưa thanh toán. Cần xác nhận đã nhận tiền trước khi hoàn thành."
        );
      } else {
        Alert.alert(
          "Lỗi",
          typeof parsedMsg === "string"
            ? parsedMsg
            : "Không thể cập nhật trạng thái đơn hàng."
        );
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const handleCloseOrderDetail = () => {
    setDetailModalVisible(false);
    setSelectedOrder(null);
  };

  const handleUpdateStatusFromDetail = () => {
    if (selectedOrder) {
      handleOpenStatusModal(selectedOrder);
    }
  };

  const getLatestPayment = (order?: Order) => {
    if (!order?.payments || order.payments.length === 0) return null;
    return order.payments.reduce((latest, current) => {
      if (!current) return latest;
      if (!latest) return current;
      const lt = latest.createdAt ? new Date(latest.createdAt).getTime() : 0;
      const ct = current.createdAt ? new Date(current.createdAt).getTime() : 0;
      return ct > lt ? current : latest;
    }, null as any);
  };

  const getOrderPaymentStatusText = (order: Order) => {
    const latest = getLatestPayment(order);
    if (!latest) return "Chưa có thông tin thanh toán";
    if (latest.status === 2) return "Đã thanh toán";
    if (latest.status === 1) return "Chưa thanh toán";
    return "Chưa có thông tin thanh toán";
  };

  const handleOpenPaymentStatusModal = () => {
    if (!selectedOrder?.payments || selectedOrder.payments.length === 0) {
      return;
    }
    const firstPending = selectedOrder.payments.find(
      (p) => p && p.status === 1
    );
    setSelectedPaymentId(firstPending?.id ?? selectedOrder.payments[0].id);
    setPaymentModalVisible(true);
  };

  const handleConfirmPaymentStatus = async () => {
    if (!selectedOrder || selectedPaymentId == null) {
      return;
    }
    try {
      const payment = selectedOrder.payments?.find(
        (p) => p && p.id === selectedPaymentId
      );
      if (!payment) {
        return;
      }
      await api.updatePayment(payment.id, { status: 2 });
      setPaymentModalVisible(false);
      await loadOrders();
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
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
    const paymentStatusText = getOrderPaymentStatusText(item);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleOpenOrderDetail(item)}
        style={styles.orderCard}
      >
        <View style={styles.orderHeader}>
          <View style={styles.customerRow}>
            <Image
              source={{
                uri:
                  buildImageUrl(item.user?.avatar) ||
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fit=crop&w=200&q=60",
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.orderId}>#{item.id}</Text>
              <Text style={styles.customerName}>
                {item.user?.username || "Khách hàng"}
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

        <View style={styles.paymentStatusRow}>
          <Icon
            name={
              paymentStatusText === "Đã thanh toán" ? "check-circle" : "payment"
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
      </TouchableOpacity>
    );
  };

  const renderFeedbackCard = (order: Order) => {
    if (order.status !== 4 || !order.feedbacks?.length) {
      return null;
    }
    const feedback = order.feedbacks[0];
    return (
      <View style={styles.detailFeedbackCard}>
        <View style={styles.detailFeedbackHeader}>
          <Icon name="star" size={16} color={theme.colors.accent} />
          <Text style={styles.detailFeedbackTitle}>Nhận xét của khách</Text>
          <Text style={styles.detailFeedbackDate}>
            {feedback.createdAt ? formatDateTime(feedback.createdAt) : ""}
          </Text>
        </View>
        <Text style={styles.detailFeedbackRating}>{feedback.rating} / 5</Text>
        {feedback.content ? (
          <Text style={styles.detailFeedbackText}>{feedback.content}</Text>
        ) : null}
        {feedback.imageUrl ? (
          <Image
            source={{ uri: buildImageUrl(feedback.imageUrl) || undefined }}
            style={styles.detailFeedbackImage}
          />
        ) : null}
      </View>
    );
  };

  const renderOrderDetailModal = () => {
    if (!selectedOrder) return null;

    const addressText = getAddressText(selectedOrder);
    const total =
      (selectedOrder.totalPrice || 0) + (selectedOrder.shippingFee || 0);
    const latestPayment = getLatestPayment(selectedOrder);
    const paymentMethod = latestPayment?.paymentMethod || "Chưa cập nhật";
    const discountText = selectedOrder.discount?.code
      ? `${selectedOrder.discount.code}${
          selectedOrder.discount.percent
            ? ` - ${selectedOrder.discount.percent}%`
            : ""
        }`
      : "Không áp dụng";
    const statusInfo = getStatusInfo(selectedOrder.status);
    const paymentStatusText = getOrderPaymentStatusText(selectedOrder);

    return (
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseOrderDetail}
      >
        <View style={styles.detailModalScreen}>
          <View style={styles.detailModalHeader}>
            <TouchableOpacity
              style={styles.detailModalBackButton}
              onPress={handleCloseOrderDetail}
            >
              <Icon name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.detailModalTitle}>
              Đơn hàng #{selectedOrder.id}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={styles.detailModalBody}
            contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>
                Thông tin khách hàng
              </Text>
              <View style={styles.detailCustomerRow}>
                <Image
                  source={{
                    uri:
                      buildImageUrl(selectedOrder.user?.avatar) ||
                      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?fit=crop&w=200&h=200",
                  }}
                  style={styles.detailAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailCustomerName}>
                    {selectedOrder.user?.username || "Khách hàng"}
                  </Text>
                  <Text style={styles.detailCustomerContact}>
                    {selectedOrder.user?.phone || "Không có số điện thoại"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.detailStatusBadge,
                    { backgroundColor: statusInfo.color },
                  ]}
                >
                  <Text style={styles.detailStatusText}>
                    {statusInfo.label}
                  </Text>
                </View>
              </View>
              <View style={styles.detailInfoRow}>
                <Icon name="place" size={16} color={theme.colors.mediumGray} />
                <Text style={styles.detailInfoText}>{addressText}</Text>
              </View>
              <View style={styles.detailInfoRow}>
                <Icon
                  name="schedule"
                  size={16}
                  color={theme.colors.mediumGray}
                />
                <Text style={styles.detailInfoText}>
                  {formatDateTime(selectedOrder.createdAt)}
                </Text>
              </View>
              {paymentStatusText && (
                <TouchableOpacity
                  style={styles.detailInfoRow}
                  activeOpacity={0.7}
                  onPress={handleOpenPaymentStatusModal}
                >
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
                      styles.detailInfoText,
                      paymentStatusText === "Đã thanh toán"
                        ? { color: theme.colors.success }
                        : { color: theme.colors.warning },
                    ]}
                  >
                    Trạng thái thanh toán: {paymentStatusText}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Chi tiết đơn hàng</Text>
              {selectedOrder.orderDetails?.map((item) => (
                <View key={item.id} style={styles.detailItemRow}>
                  <Text style={styles.detailItemName}>
                    {item.quantity} x {item.product?.name || "Món ăn"}
                  </Text>
                  <Text style={styles.detailItemPrice}>
                    {formatPrice(
                      (item.product?.price || 0) * (item.quantity || 0)
                    )}
                  </Text>
                </View>
              ))}
              <View style={styles.detailSummaryRow}>
                <Text style={styles.detailSummaryLabel}>Phí giao hàng</Text>
                <Text style={styles.detailSummaryValue}>
                  {formatPrice(selectedOrder.shippingFee || 0)}
                </Text>
              </View>
              <View style={styles.detailSummaryRow}>
                <Text style={styles.detailSummaryLabel}>Mã giảm giá</Text>
                <Text style={styles.detailSummaryValue}>{discountText}</Text>
              </View>
              <View style={styles.detailSummaryRow}>
                <Text style={styles.detailSummaryLabel}>
                  Phương thức thanh toán
                </Text>
                <Text style={styles.detailSummaryValue}>{paymentMethod}</Text>
              </View>
              <View
                style={[styles.detailSummaryRow, styles.detailSummaryTotal]}
              >
                <Text style={styles.detailSummaryLabel}>Tổng cộng</Text>
                <Text style={styles.detailSummaryTotalValue}>
                  {formatPrice(total)}
                </Text>
              </View>
              {selectedOrder.note ? (
                <Text style={styles.detailNote}>
                  Ghi chú: {selectedOrder.note}
                </Text>
              ) : null}
            </View>

            {renderFeedbackCard(selectedOrder)}

            {(selectedOrder.status === 2 ||
              selectedOrder.status === 3 ||
              selectedOrder.status === 4 ||
              selectedOrder.status === 5) && (
              <TouchableOpacity
                style={styles.detailSecondaryButton}
                onPress={() => setJourneyModalVisible(true)}
              >
                <Icon
                  name="timeline"
                  size={18}
                  color={theme.colors.primary}
                  style={{ marginRight: theme.spacing.xs }}
                />
                <Text style={styles.detailSecondaryButtonText}>
                  Theo dõi hành trình đơn
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.detailPrimaryButton}
              onPress={handleUpdateStatusFromDetail}
            >
              <Icon
                name="sync"
                size={18}
                color={theme.colors.surface}
                style={{ marginRight: theme.spacing.xs }}
              />
              <Text style={styles.detailPrimaryButtonText}>
                Cập nhật trạng thái
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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

      {renderOrderDetailModal()}

      {/* Payment status modal */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn giao dịch thanh toán</Text>
            {selectedOrder?.payments?.map((payment) => (
              <TouchableOpacity
                key={payment.id}
                style={[
                  styles.statusOption,
                  selectedPaymentId === payment.id &&
                    styles.selectedStatusOption,
                ]}
                onPress={() => setSelectedPaymentId(payment.id)}
              >
                <Text style={styles.paymentMethodText}>
                  {payment.paymentMethod || "Không rõ phương thức"}
                </Text>
                <Text style={styles.paymentMetaText}>
                  {payment.createdAt
                    ? formatDateTime(payment.createdAt)
                    : "Không rõ thời gian"}
                </Text>
                <Text style={styles.paymentMetaText}>
                  Trạng thái:{" "}
                  {payment.status === 2 ? "Đã thanh toán" : "Chưa thanh toán"}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleConfirmPaymentStatus}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: theme.colors.surface },
                  ]}
                >
                  Xác nhận đã thanh toán
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {selectedOrder && (
        <OrderJourneyModal
          visible={journeyModalVisible}
          onClose={() => setJourneyModalVisible(false)}
          orderId={selectedOrder.id}
          canEdit={true}
        />
      )}

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
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.lightGray,
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
  paymentMethodText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  paymentMetaText: {
    fontSize: 12,
    color: theme.colors.mediumGray,
  },
  detailModalScreen: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  detailModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailModalBackButton: {
    padding: theme.spacing.xs,
  },
  detailModalTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  detailModalBody: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  detailSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.small,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  detailCustomerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  detailAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.lightOrange,
  },
  detailCustomerName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  detailCustomerContact: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.xs,
  },
  detailStatusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.surface,
  },
  detailInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  detailInfoText: {
    fontSize: 13,
    color: theme.colors.mediumGray,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  detailItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  detailItemName: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  detailItemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  detailSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.xs,
  },
  detailSummaryLabel: {
    fontSize: 13,
    color: theme.colors.mediumGray,
  },
  detailSummaryValue: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: "600",
  },
  detailSummaryTotal: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  detailSummaryTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  detailNote: {
    marginTop: theme.spacing.sm,
    fontSize: 13,
    color: theme.colors.mediumGray,
    fontStyle: "italic",
  },
  detailPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  detailPrimaryButtonText: {
    color: theme.colors.surface,
    fontWeight: "600",
  },
  detailSecondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  detailSecondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  detailFeedbackCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailFeedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  detailFeedbackTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  detailFeedbackDate: {
    fontSize: 11,
    color: theme.colors.mediumGray,
  },
  detailFeedbackRating: {
    fontSize: 32,
    fontWeight: "700",
    color: theme.colors.accent,
    marginVertical: theme.spacing.xs,
  },
  detailFeedbackText: {
    fontSize: 13,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    lineHeight: 18,
  },
  detailFeedbackImage: {
    width: "100%",
    height: 160,
    borderRadius: theme.roundness,
  },
});

export default OrdersManagementScreen;
