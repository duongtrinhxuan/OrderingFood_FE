import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../../theme/theme";
import { api, buildImageUrl } from "../../services/api";
import { formatDateTime, formatPrice } from "../../utils/helpers";
import FeedbackModal, { OrderFeedback } from "../../components/FeedbackModal";
import OrderJourneyModal from "../../components/OrderJourneyModal";
import EditOrderModal from "../../components/EditOrderModal";
import AddPaymentMethodModal from "../../components/AddPaymentMethodModal";
import { useAuth } from "../../context/AuthContext";

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

interface Order {
  id: number;
  status: number;
  totalPrice: number;
  shippingFee: number;
  note?: string;
  createdAt: string;
  restaurant?: {
    id: number;
    name: string;
    imageUrl?: string;
  };
  user?: {
    username: string;
    email: string;
  };
  address?: {
    street: string;
    ward: string;
    district: string;
    province: string;
  };
  discount?: {
    code: string;
    percent?: number;
  };
  orderDetails?: OrderDetail[];
  payments?: {
    id: number;
    paymentMethod: string;
    status: number;
  }[];
  feedbacks?: OrderFeedback[];
}

const ORDER_STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: "Đang xử lý", color: theme.colors.warning },
  2: { label: "Đã xác nhận", color: theme.colors.info },
  3: { label: "Đang giao", color: theme.colors.primary },
  4: { label: "Hoàn thành", color: theme.colors.success },
  5: { label: "Đã hủy", color: theme.colors.error },
};

const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params as { orderId: number };
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [journeyModalVisible, setJourneyModalVisible] = useState(false);
  const [editOrderModalVisible, setEditOrderModalVisible] = useState(false);
  const [addPaymentModalVisible, setAddPaymentModalVisible] = useState(false);
  const [transferInfos, setTransferInfos] = useState<any[]>([]);
  const [loadingTransferInfos, setLoadingTransferInfos] = useState(false);
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(true);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getOrderById(orderId);
      setOrder(data as Order);
    } catch (error) {
      console.error("Error loading order:", error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    const loadTransfers = async () => {
      if (!order?.restaurant) return;
      const ownerId =
        (order.restaurant as any).userId ||
        (order.restaurant as any).ownerId ||
        (order.restaurant as any).createdById;
      if (!ownerId) return;
      try {
        setLoadingTransferInfos(true);
        const data = await api.getTransferInfosByUser(ownerId);
        const allTransferInfos = Array.isArray(data) ? data : [];
        // Chỉ hiển thị những transfer-information có isActive = true của seller trong giao diện customer
        const activeTransferInfos = allTransferInfos.filter(
          (item: any) => item.isActive !== false
        );
        setTransferInfos(activeTransferInfos);
      } catch (error) {
        console.error("Error loading transfer informations:", error);
      } finally {
        setLoadingTransferInfos(false);
      }
    };
    loadTransfers();
  }, [order?.restaurant]);

  const existingFeedback = order?.feedbacks?.[0] || null;

  const getStatusInfo = () => {
    if (!order)
      return { label: "Không xác định", color: theme.colors.mediumGray };
    return (
      ORDER_STATUS_MAP[order.status] || {
        label: "Không xác định",
        color: theme.colors.mediumGray,
      }
    );
  };

  const getFullAddress = () => {
    if (!order?.address) return "Không có địa chỉ";
    const { street, ward, district, province } = order.address;
    return `${street}, ${ward}, ${district}, ${province}`;
  };

  const getLatestPayment = () => {
    if (!order?.payments || order.payments.length === 0) return null;
    return order.payments.reduce((latest, current) => {
      if (!current) return latest;
      if (!latest) return current;
      const latestTime = (latest as any).createdAt
        ? new Date((latest as any).createdAt).getTime()
        : 0;
      const currentTime = (current as any).createdAt
        ? new Date((current as any).createdAt).getTime()
        : 0;
      return currentTime > latestTime ? current : latest;
    }, null as any);
  };

  const normalizePaymentMethod = (method?: string) => {
    if (!method) return "Không có thông tin";
    const upper = method.toUpperCase();
    if (upper === "BANK_TRANSFER") return "TKNH";
    return upper;
  };

  const getPaymentMethod = () => {
    const latestPayment = getLatestPayment();
    return normalizePaymentMethod(latestPayment?.paymentMethod);
  };

  const getPaymentStatusText = () => {
    if (!order || !order.payments?.length) {
      return null;
    }
    const latestPayment = getLatestPayment();
    if (!latestPayment) return null;
    if (latestPayment.status === 2) return "Đã thanh toán";
    if (latestPayment.status === 1) return "Chưa thanh toán";
    return null;
  };

  const handleDeleteFeedback = () => {
    if (!existingFeedback) return;
    Alert.alert("Xóa nhận xét", "Bạn chắc chắn muốn xóa nhận xét này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteFeedback(existingFeedback.id);
            await loadOrder();
          } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể xóa nhận xét.");
          }
        },
      },
    ]);
  };

  const handleFeedbackSuccess = () => {
    setFeedbackModalVisible(false);
    loadOrder();
  };

  const handleCancelOrder = () => {
    if (!order) return;
    Alert.alert("Xác nhận hủy đơn", "Bạn có chắc chắn muốn hủy đơn hàng này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Có, hủy đơn",
        style: "destructive",
        onPress: async () => {
          try {
            await api.updateOrder(order.id, { status: 5 });
            Alert.alert("Thành công", "Đã hủy đơn hàng.");
            await loadOrder();
          } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể hủy đơn hàng.");
          }
        },
      },
    ]);
  };

  const handleEditOrderSuccess = () => {
    setEditOrderModalVisible(false);
    loadOrder();
  };

  const renderStars = (value: number) => {
    return (
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name={star <= value ? "star" : "star-border"}
            size={20}
            color={theme.colors.accent}
          />
        ))}
      </View>
    );
  };

  if (loading || !order) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const statusInfo = getStatusInfo();
  const subtotal = order.totalPrice;
  const shippingFee = order.shippingFee || 0;
  const total = subtotal + shippingFee;
  const paymentStatusText = getPaymentStatusText();
  const latestPayment = getLatestPayment();
  const paymentZalo =
    latestPayment?.paymentMethod?.toUpperCase() === "ZALOPAY"
      ? latestPayment
      : null;
  const activePaymentMethod = getPaymentMethod();
  const transferInfosFiltered = transferInfos.filter((t) =>
    activePaymentMethod
      ? (t.paymentMethod || "").toUpperCase() ===
        (activePaymentMethod || "").toUpperCase()
      : true
  );

  const renderTransferCard = (info: any, idx: number) => {
    // Tính toán các giá trị cần thiết
    const zalopayAmount = Math.max(0, Math.round(total || 0));
    const note = `Thanh toan don hang ${order.id}`;
    const isZalopay = info.paymentMethod?.toUpperCase() === "ZALOPAY";

    // Xác định loại QR code cần tạo
    let qrData: string;
    let qrUrl: string;

    if (isZalopay) {
      if (info.isBank === false && info.accountNumber) {
        // Trường hợp 1: Zalopay với số điện thoại ví - dùng format chuẩn zalopay://quickpay
        qrData = `zalopay://quickpay?phone=${encodeURIComponent(
          info.accountNumber
        )}&amount=${encodeURIComponent(
          zalopayAmount
        )}&note=${encodeURIComponent(note)}`;
        qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          qrData
        )}`;
      } else if (info.isBank === true && info.accountNumber && info.nameBank) {
        // Trường hợp 2: Zalopay với chuyển khoản ngân hàng - dùng VietQR chuẩn
        // Map tên ngân hàng sang bankCode của VietQR
        const bankName = (info.nameBank || "").trim().toLowerCase();
        let bankCode: string | undefined;

        // Danh sách các ngân hàng được hỗ trợ bởi VietQR
        if (bankName.includes("acb")) bankCode = "acb";
        else if (bankName.includes("vietcombank") || bankName.includes("vcb"))
          bankCode = "vcb";
        else if (bankName.includes("techcombank") || bankName.includes("tcb"))
          bankCode = "tcb";
        else if (bankName.includes("vietinbank") || bankName.includes("vib"))
          bankCode = "vib";
        else if (bankName.includes("bidv")) bankCode = "bidv";
        else if (bankName.includes("agribank") || bankName.includes("agb"))
          bankCode = "agb";
        else if (bankName.includes("sacombank") || bankName.includes("stb"))
          bankCode = "stb";
        else if (bankName.includes("mbbank") || bankName.includes("mb"))
          bankCode = "mb";
        else if (bankName.includes("vpbank")) bankCode = "vpbank";
        else if (bankName.includes("tpbank") || bankName.includes("tpbank"))
          bankCode = "tpbank";
        else if (bankName.includes("shb")) bankCode = "shb";
        else if (bankName.includes("eximbank")) bankCode = "eximbank";
        else if (bankName.includes("msb")) bankCode = "msb";
        else if (bankName.includes("hdbank")) bankCode = "hdbank";
        else if (bankName.includes("vietabank") || bankName.includes("vab"))
          bankCode = "vab";
        else if (bankName.includes("seabank")) bankCode = "seabank";
        else if (bankName.includes("pvbank")) bankCode = "pvbank";
        else if (bankName.includes("ocb")) bankCode = "ocb";
        else if (bankName.includes("namabank")) bankCode = "namabank";
        else if (bankName.includes("publicbank")) bankCode = "publicbank";
        else if (bankName.includes("vietbank")) bankCode = "vietbank";
        else if (bankName.includes("baoviet")) bankCode = "baoviet";
        else if (bankName.includes("abbank")) bankCode = "abbank";
        else if (
          bankName.includes("vietcapitalbank") ||
          bankName.includes("vccb")
        )
          bankCode = "vccb";
        else if (bankName.includes("scb")) bankCode = "scb";
        else if (bankName.includes("vrb")) bankCode = "vrb";
        else if (bankName.includes("donga")) bankCode = "donga";
        else if (bankName.includes("bacabank")) bankCode = "bacabank";
        else if (bankName.includes("kienlongbank") || bankName.includes("klb"))
          bankCode = "klb";
        else if (
          bankName.includes("lienvietpostbank") ||
          bankName.includes("lpb")
        )
          bankCode = "lpb";
        else if (bankName.includes("gpbank")) bankCode = "gpbank";
        else if (bankName.includes("vietabank") || bankName.includes("vab"))
          bankCode = "vab";
        else if (bankName.includes("sgb")) bankCode = "sgb";
        else if (bankName.includes("ncb")) bankCode = "ncb";
        else if (bankName.includes("oceanbank")) bankCode = "oceanbank";
        else if (bankName.includes("pbank")) bankCode = "pbank";
        else if (bankName.includes("pvcombank")) bankCode = "pvcombank";
        else if (bankName.includes("vietbank")) bankCode = "vietbank";
        else if (bankName.includes("vietabank") || bankName.includes("vab"))
          bankCode = "vab";

        if (bankCode) {
          // Sử dụng VietQR với format chuẩn (có logo) để đảm bảo quét được
          qrUrl = `https://img.vietqr.io/image/${bankCode}-${encodeURIComponent(
            info.accountNumber
          )}-compact2.png?amount=${zalopayAmount}&addInfo=${encodeURIComponent(
            note
          )}`;
        } else {
          // Nếu không tìm thấy bankCode, dùng format Zalopay chuẩn
          qrData = `ZALOPAY|${info.accountNumber}|${info.nameBank}|${zalopayAmount}|order:${order.id}`;
          qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            qrData
          )}`;
        }
      } else {
        // Trường hợp 3: Zalopay nhưng thiếu thông tin - dùng format mặc định
        qrData = `ZALOPAY|${info.accountNumber || ""}|${
          info.nameBank || ""
        }|${zalopayAmount}|order:${order.id}`;
        qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          qrData
        )}`;
      }
    } else {
      // Không phải Zalopay - giữ nguyên logic cũ hoặc xử lý tương tự
      qrData = `${info.paymentMethod || ""}|${info.accountNumber || ""}|${
        info.nameBank || ""
      }|${zalopayAmount}|order:${order.id}`;
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        qrData
      )}`;
    }
    return (
      <View key={`${info.id || idx}`} style={styles.transferCard}>
        <View style={styles.transferRow}>
          <Text style={styles.transferLabel}>Phương thức:</Text>
          <Text style={styles.transferValue}>
            {info.paymentMethod || "ZALOPAY"}
          </Text>
        </View>
        {info.nameBank ? (
          <View style={styles.transferRow}>
            <Text style={styles.transferLabel}>Ngân hàng:</Text>
            <Text style={styles.transferValue}>{info.nameBank}</Text>
          </View>
        ) : null}
        {info.accountNumber ? (
          <View style={styles.transferRow}>
            <Text style={styles.transferLabel}>
              {info.paymentMethod === "ZALOPAY" && info.isBank === false
                ? "SĐT Zalopay"
                : "Số tài khoản"}
              :
            </Text>
            <Text style={styles.transferValue}>{info.accountNumber}</Text>
          </View>
        ) : null}
        {paymentZalo ? (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Quét QR để thanh toán Zalopay</Text>
            <Image source={{ uri: qrUrl }} style={styles.qrImage} />
            <Text style={styles.qrAmount}>
              Số tiền: {formatPrice(total || 0)}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status + Created time */}
        <View style={styles.section}>
          <View
            style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
          >
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
          <Text style={styles.createdAt}>
            Thời gian tạo: {formatDateTime(order.createdAt)}
          </Text>
        </View>

        {/* Action buttons for status 1 */}
        {order.status === 1 && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.editOrderButton}
              onPress={() => setEditOrderModalVisible(true)}
            >
              <Icon name="edit" size={18} color={theme.colors.primary} />
              <Text style={styles.editOrderButtonText}>
                Chỉnh sửa thông tin đơn hàng
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelOrderButton}
              onPress={handleCancelOrder}
            >
              <Icon name="cancel" size={18} color={theme.colors.error} />
              <Text style={styles.cancelOrderButtonText}>Hủy đơn hàng</Text>
            </TouchableOpacity>
          </View>
        )}

        {order.status === 2 ||
        order.status === 3 ||
        order.status === 4 ||
        order.status === 5 ? (
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => setJourneyModalVisible(true)}
          >
            <Icon name="timeline" size={18} color={theme.colors.primary} />
            <Text style={styles.trackButtonText}>Theo dõi hành trình đơn</Text>
          </TouchableOpacity>
        ) : null}

        {order.status === 4 ? (
          <TouchableOpacity
            style={[
              styles.reviewCta,
              existingFeedback
                ? styles.reviewCtaOutlined
                : styles.reviewCtaFilled,
            ]}
            onPress={() => setFeedbackModalVisible(true)}
          >
            <Icon
              name="rate-review"
              size={18}
              color={
                existingFeedback ? theme.colors.primary : theme.colors.surface
              }
            />
            <Text
              style={[
                styles.reviewCtaText,
                existingFeedback
                  ? { color: theme.colors.primary }
                  : { color: theme.colors.surface },
              ]}
            >
              {existingFeedback ? "Cập nhật nhận xét" : "Nhận xét về đơn hàng"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {existingFeedback ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nhận xét của bạn</Text>
              <View style={styles.feedbackActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setFeedbackModalVisible(true)}
                >
                  <Icon name="edit" size={16} color={theme.colors.primary} />
                  <Text style={styles.editButtonText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteFeedback}
                >
                  <Icon name="delete" size={16} color={theme.colors.error} />
                  <Text style={styles.deleteButtonText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.feedbackCard}>
              {renderStars(existingFeedback.rating)}
              <Text style={styles.feedbackDate}>
                {existingFeedback.createdAt
                  ? formatDateTime(existingFeedback.createdAt)
                  : ""}
              </Text>
              <Text style={styles.feedbackContent}>
                {existingFeedback.content}
              </Text>
              {existingFeedback.imageUrl ? (
                <Image
                  source={{
                    uri: buildImageUrl(existingFeedback.imageUrl) || undefined,
                  }}
                  style={styles.feedbackImage}
                />
              ) : null}
              {existingFeedback.responses &&
              existingFeedback.responses.length > 0 ? (
                <View style={styles.responseBox}>
                  <View style={styles.responseHeader}>
                    <Icon
                      name="restaurant"
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.responseLabel}>
                      Phản hồi từ nhà hàng
                    </Text>
                  </View>
                  <Text style={styles.responseContent}>
                    {existingFeedback.responses[0].content ||
                      existingFeedback.responses[0].response ||
                      "Nhà hàng đã phản hồi."}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Các món đã đặt</Text>
          {order.orderDetails?.map((detail) => (
            <View key={detail.id} style={styles.orderDetailCard}>
              <View style={styles.orderDetailContent}>
                <Image
                  source={{
                    uri:
                      buildImageUrl(
                        detail.product?.imageUrl ||
                          (detail.product as any)?.image
                      ) || "https://via.placeholder.com/80x80",
                  }}
                  style={styles.productImage}
                />
                <View style={styles.orderDetailInfo}>
                  <Text style={styles.productName}>
                    {detail.product?.name || "Món ăn"}
                  </Text>
                  <Text style={styles.productPrice}>
                    {formatPrice(detail.product?.price || 0)}
                  </Text>
                  <Text style={styles.productQuantity}>
                    Số lượng: {detail.quantity}
                  </Text>
                </View>
              </View>
              {detail.note ? (
                <Text style={styles.detailNote}>Ghi chú: {detail.note}</Text>
              ) : null}
            </View>
          ))}
        </View>

        {/* Order Note */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú đơn hàng</Text>
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              {order.note || "Không có ghi chú"}
            </Text>
          </View>
        </View>

        {/* Restaurant Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin nhà hàng</Text>
          <View style={styles.restaurantCard}>
            <Image
              source={{
                uri:
                  buildImageUrl(order.restaurant?.imageUrl) ||
                  "https://via.placeholder.com/100x100",
              }}
              style={styles.restaurantImageLarge}
            />
            <View>
              <Text style={styles.restaurantName}>
                {order.restaurant?.name || "Nhà hàng"}
              </Text>
            </View>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin người đặt</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Tên:</Text>
            <Text style={styles.infoValue}>
              {order.user?.username || "Người dùng"}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Địa chỉ:</Text>
            <Text style={styles.infoValue}>{getFullAddress()}</Text>
          </View>
        </View>

        {/* Discount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mã giảm giá</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>
              {order.discount
                ? `${order.discount.code} - ${order.discount.percent || 0}%`
                : "Không áp dụng"}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsPaymentExpanded((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Icon
                name={
                  isPaymentExpanded
                    ? "keyboard-arrow-up"
                    : "keyboard-arrow-down"
                }
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {isPaymentExpanded && (
            <>
              <View style={styles.infoCard}>
                <View style={styles.paymentMethodRow}>
                  <Icon name="payment" size={18} color={theme.colors.primary} />
                  <Text style={styles.infoValue}>{getPaymentMethod()}</Text>
                </View>
              </View>
              {paymentStatusText && (
                <>
                  <View style={[styles.infoCard, styles.paymentStatusCard]}>
                    <View style={styles.paymentStatusRow}>
                      <Icon
                        name={
                          paymentStatusText === "Đã thanh toán"
                            ? "check-circle"
                            : "payment"
                        }
                        size={18}
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
                        Trạng thái thanh toán: {paymentStatusText}
                      </Text>
                    </View>
                  </View>
                  {order.status === 4 &&
                    paymentStatusText === "Chưa thanh toán" && (
                      <TouchableOpacity
                        style={styles.addPaymentButton}
                        onPress={() => setAddPaymentModalVisible(true)}
                      >
                        <Icon
                          name="add-circle"
                          size={18}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.addPaymentButtonText}>
                          Thêm phương thức thanh toán
                        </Text>
                      </TouchableOpacity>
                    )}
                </>
              )}

              <View style={styles.transferSection}>
                <Text style={styles.sectionSubtitle}>
                  Thông tin thanh toán (theo phương thức {activePaymentMethod})
                </Text>
                {loadingTransferInfos ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : transferInfosFiltered.length === 0 ? (
                  <Text style={styles.infoValue}>
                    Chưa có thông tin thanh toán cho phương thức này.
                  </Text>
                ) : (
                  transferInfosFiltered.map(renderTransferCard)
                )}
              </View>
            </>
          )}
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng cộng</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí giao hàng</Text>
            <Text style={styles.summaryValue}>{formatPrice(shippingFee)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {order ? (
        <>
          <FeedbackModal
            visible={feedbackModalVisible}
            onClose={() => setFeedbackModalVisible(false)}
            onSuccess={handleFeedbackSuccess}
            orderId={order.id}
            orderName={order.restaurant?.name}
            orderItemsSummary={order.orderDetails
              ?.map(
                (detail) =>
                  `${detail.product?.name || "Món ăn"} x${detail.quantity || 0}`
              )
              .join(", ")}
            existingFeedback={existingFeedback}
          />
          <OrderJourneyModal
            visible={journeyModalVisible}
            onClose={() => setJourneyModalVisible(false)}
            orderId={order.id}
            canEdit={false}
          />
          {user && (
            <EditOrderModal
              visible={editOrderModalVisible}
              onClose={() => setEditOrderModalVisible(false)}
              onSuccess={handleEditOrderSuccess}
              order={order}
              userId={user.id}
            />
          )}
          <AddPaymentMethodModal
            visible={addPaymentModalVisible}
            onClose={() => setAddPaymentModalVisible(false)}
            onSuccess={() => {
              loadOrder();
            }}
            orderId={order.id}
          />
        </>
      ) : null}
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
    paddingBottom: theme.navbarHeight + theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  reviewCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.roundness,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  reviewCtaFilled: {
    backgroundColor: theme.colors.primary,
  },
  reviewCtaOutlined: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  reviewCtaText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: theme.spacing.xs,
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  feedbackCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ratingRow: {
    flexDirection: "row",
    marginBottom: theme.spacing.xs,
  },
  feedbackDate: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.sm,
  },
  feedbackContent: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  feedbackImage: {
    width: "100%",
    height: 180,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.sm,
  },
  feedbackActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.roundness / 2,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  editButtonText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.roundness / 2,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  deleteButtonText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: "600",
  },
  responseBox: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.roundness / 2,
    backgroundColor: theme.colors.lightOrange,
    padding: theme.spacing.md,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  responseLabel: {
    marginLeft: theme.spacing.xs,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  responseContent: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.sm,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.surface,
  },
  createdAt: {
    fontSize: 14,
    color: theme.colors.mediumGray,
  },
  orderDetailCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  orderDetailContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: theme.roundness,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.lightOrange,
  },
  orderDetailInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  productPrice: {
    fontSize: 14,
    color: theme.colors.primary,
    marginVertical: theme.spacing.xs,
  },
  productQuantity: {
    fontSize: 14,
    color: theme.colors.mediumGray,
  },
  detailNote: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.mediumGray,
  },
  noteBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  noteText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  restaurantCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    ...theme.shadows.small,
  },
  restaurantImageLarge: {
    width: 72,
    height: 72,
    borderRadius: theme.roundness,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.lightOrange,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.text,
  },
  paymentStatusCard: {
    marginTop: theme.spacing.xs,
  },
  paymentStatusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentStatusText: {
    marginLeft: theme.spacing.xs,
    fontSize: 14,
    fontWeight: "600",
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
  actionButtonsContainer: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  editOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  editOrderButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  cancelOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    marginHorizontal: theme.spacing.md,
  },
  cancelOrderButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.error,
    marginLeft: theme.spacing.xs,
  },
  addPaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  addPaymentButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  transferSection: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  toggleButton: {
    padding: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.xs,
  },
  transferCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  transferRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  transferLabel: {
    color: theme.colors.mediumGray,
    fontSize: 13,
  },
  transferValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  qrContainer: {
    marginTop: theme.spacing.sm,
    alignItems: "center",
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  qrImage: {
    width: 160,
    height: 160,
    marginVertical: theme.spacing.xs,
  },
  qrAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  zaloLinkButton: {
    marginTop: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
  },
  zaloLinkButtonText: {
    color: theme.colors.surface,
    fontWeight: "700",
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default OrderDetailScreen;
