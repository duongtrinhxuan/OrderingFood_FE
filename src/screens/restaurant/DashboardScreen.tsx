import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme/theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { formatPrice, formatDateTime } from "../../utils/helpers";

interface DashboardScreenProps {
  restaurantId?: number;
}

type DashboardScreenComponentProps = DashboardScreenProps & {
  route?: any;
  navigation?: any;
};

interface OrderDetail {
  id: number;
  quantity: number;
  product?: { id: number; name: string };
}

interface Order {
  id: number;
  status: number;
  totalPrice: number;
  shippingFee: number;
  createdAt: string;
  user?: { id: number; username: string };
  orderDetails?: OrderDetail[];
}

const ORDER_STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: "Đang xử lý", color: theme.colors.warning },
  2: { label: "Đã xác nhận", color: theme.colors.info },
  3: { label: "Đang giao", color: theme.colors.primary },
  4: { label: "Hoàn thành", color: theme.colors.success },
  5: { label: "Đã hủy", color: theme.colors.error },
};

const DashboardScreen: React.FC<DashboardScreenComponentProps> = ({
  restaurantId,
}) => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const routeRestaurantId = route?.params?.restaurantId;
  const { user } = useAuth();
  const [currentRestaurantId, setCurrentRestaurantId] = useState<number | null>(
    restaurantId ?? routeRestaurantId ?? null
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<{
    ordersToday: number;
    ordersChange: number;
    revenueToday: number;
    revenueChange: number;
    customersToday: number;
    customersChange: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null);

  const fetchRestaurant = useCallback(async () => {
    if (restaurantId || !user?.id) return;
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
    setCurrentRestaurantId(restaurantId ?? routeRestaurantId ?? null);
  }, [restaurantId, routeRestaurantId]);

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
      const data = await api.getOrdersByRestaurant(currentRestaurantId);
      const orderData = (data as Order[]) || [];
      setOrders(orderData);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [currentRestaurantId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const loadRestaurantInfo = useCallback(async () => {
    if (!currentRestaurantId) {
      setRestaurantInfo(null);
      return;
    }
    try {
      const data = await api.getRestaurantById(currentRestaurantId);
      setRestaurantInfo(data);
    } catch (error) {
      console.error("Error loading restaurant info:", error);
      setRestaurantInfo(null);
    }
  }, [currentRestaurantId]);

  useEffect(() => {
    loadRestaurantInfo();
  }, [loadRestaurantInfo]);

  const loadDashboardStats = useCallback(async () => {
    if (!currentRestaurantId) {
      setDashboardStats(null);
      return;
    }
    try {
      setStatsLoading(true);
      const data = await api.getRestaurantDashboardSummary(currentRestaurantId);
      setDashboardStats(data as any);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      setDashboardStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [currentRestaurantId]);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  // Debug customersToday
  useEffect(() => {
    if (dashboardStats) {
      console.log(
        "[Dashboard] customersToday:",
        dashboardStats.customersToday,
        "customersChange:",
        dashboardStats.customersChange
      );
    }
  }, [dashboardStats]);

  const formatPercent = (value?: number | null) => {
    if (value === null || value === undefined) {
      return "0%";
    }
    if (value > 0) return `+${value}%`;
    if (value < 0) return `${value}%`;
    return "0%";
  };

  const statsData = [
    {
      title: "Đơn hàng hôm nay",
      value: dashboardStats
        ? dashboardStats.ordersToday.toString()
        : statsLoading
        ? "..."
        : "0",
      change: formatPercent(dashboardStats?.ordersChange),
      icon: "receipt",
      color: theme.colors.primary,
    },
    {
      title: "Doanh thu hôm nay",
      value: dashboardStats
        ? formatPrice(dashboardStats.revenueToday)
        : statsLoading
        ? "..."
        : formatPrice(0),
      change: formatPercent(dashboardStats?.revenueChange),
      icon: "attach-money",
      color: theme.colors.success,
    },
    {
      title: "Đánh giá trung bình",
      value: restaurantInfo
        ? Number(restaurantInfo.rating || 0).toFixed(1)
        : statsLoading
        ? "..."
        : "0.0",
      change: "",
      icon: "star",
      color: theme.colors.warning,
    },
    {
      title: "Khách hàng đã đặt",
      value: dashboardStats
        ? dashboardStats.customersToday.toString()
        : statsLoading
        ? "..."
        : "0",
      change: formatPercent(dashboardStats?.customersChange),
      icon: "people",
      color: theme.colors.info,
    },
  ];

  const recentOrders = orders
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const renderStatCard = (stat: any) => (
    <View key={stat.title} style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: stat.color + "20" }]}>
          <Icon name={stat.icon} size={24} color={stat.color} />
        </View>
        <Text style={[styles.statChange, { color: stat.color }]}>
          {stat.change}
        </Text>
      </View>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statTitle}>{stat.title}</Text>
    </View>
  );

  const renderOrderItem = (order: Order) => (
    <TouchableOpacity
      key={order.id}
      style={styles.orderCard}
      onPress={() => navigation.navigate("Orders" as never)}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.customerName}>
            {order.user?.username || "Khách hàng"}
          </Text>
          <Text style={styles.orderTime}>
            {formatDateTime(order.createdAt)}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: ORDER_STATUS_MAP[order.status]?.color },
          ]}
        >
          <Text style={styles.statusText}>
            {ORDER_STATUS_MAP[order.status]?.label || "Không xác định"}
          </Text>
        </View>
      </View>
      <Text style={styles.orderItems}>
        {order.orderDetails
          ?.map(
            (detail) =>
              `${detail.product?.name || "Món"} x${detail.quantity || 0}`
          )
          .join(", ")}
      </Text>
      <Text style={styles.orderTotal}>
        {formatPrice(order.totalPrice + (order.shippingFee || 0))}
      </Text>
    </TouchableOpacity>
  );

  const handleNavigate = (tab: string) => {
    navigation.navigate(tab as never);
  };

  if (loading && orders.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Xin chào!</Text>
            <Text style={styles.restaurantName}>
              {restaurantInfo?.name || "Cửa hàng của bạn"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>
        <View style={styles.statsGrid}>{statsData.map(renderStatCard)}</View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleNavigate("Menu")}
          >
            <Icon name="add" size={24} color={theme.colors.primary} />
            <Text style={styles.quickActionText}>Thêm món</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleNavigate("Menu")}
          >
            <Icon name="edit" size={24} color={theme.colors.primary} />
            <Text style={styles.quickActionText}>Sửa thực đơn</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleNavigate("Revenue")}
          >
            <Icon name="trending-up" size={24} color={theme.colors.primary} />
            <Text style={styles.quickActionText}>Xem báo cáo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleNavigate("Profile")}
          >
            <Icon name="settings" size={24} color={theme.colors.primary} />
            <Text style={styles.quickActionText}>Cài đặt</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.recentOrdersContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
          <TouchableOpacity onPress={() => handleNavigate("Orders")}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        {recentOrders.length === 0 ? (
          <View style={styles.emptyRecentOrders}>
            <Icon name="receipt" size={48} color={theme.colors.mediumGray} />
            <Text style={styles.emptyText}>Chưa có đơn hàng gần đây</Text>
          </View>
        ) : (
          recentOrders.map(renderOrderItem)
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 16,
    color: theme.colors.surface,
    opacity: 0.9,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.surface,
    marginTop: theme.spacing.xs,
  },
  notificationButton: {
    position: "relative",
    padding: theme.spacing.sm,
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationText: {
    fontSize: 12,
    fontWeight: "bold",
    color: theme.colors.surface,
  },
  statsContainer: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    width: "48%",
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.roundness / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  statChange: {
    fontSize: 12,
    fontWeight: "bold",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statTitle: {
    fontSize: 12,
    color: theme.colors.mediumGray,
  },
  quickActionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    width: "48%",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  recentOrdersContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  emptyRecentOrders: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
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
  orderItems: {
    fontSize: 14,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.sm,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
});

export default DashboardScreen;
