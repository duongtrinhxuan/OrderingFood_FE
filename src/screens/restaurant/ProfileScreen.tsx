import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme/theme";
import { useAuth } from "../../context/AuthContext";
import { api, buildImageUrl } from "../../services/api";
import { formatPrice } from "../../utils/helpers";
import UpdateRestaurantModal from "../../components/UpdateRestaurantModal";
import UpdateAddressModal from "../../components/UpdateAddressModal";
import { SellerStackParamList } from "../../navigation/SellerNavigator";

interface RestaurantProfileScreenProps {
  restaurantId?: number;
}

type Restaurant = {
  id: number;
  name: string;
  imageUrl?: string;
  phone?: string;
  openTime?: string;
  closeTime?: string;
  rating?: number;
  status?: number;
  addressId?: number;
};

type Address = {
  id: number;
  label: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  latitude: number;
  longitude: number;
};

type NavigationProp = StackNavigationProp<SellerStackParamList>;

const RestaurantProfileScreen: React.FC<RestaurantProfileScreenProps> = ({
  restaurantId,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    monthlyRevenue: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchRestaurant = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      if (!refreshing) {
        setLoading(true);
      }
      const restaurantData = await api.getRestaurantById(restaurantId);
      const restaurantInfo = restaurantData as any;
      setRestaurant(restaurantInfo as Restaurant);

      // Load address nếu có addressId
      if (restaurantInfo.addressId) {
        try {
          const addressData = await api.getAddressById(
            restaurantInfo.addressId
          );
          setAddress(addressData as Address);
        } catch (error) {
          console.error("Error loading address:", error);
        }
      }
    } catch (error: any) {
      console.error("Error fetching restaurant:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin nhà hàng.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  const fetchStats = useCallback(async () => {
    if (!restaurantId) {
      setStats({ totalOrders: 0, monthlyRevenue: 0 });
      return;
    }

    try {
      setStatsLoading(true);
      const [ordersData, revenueSummary] = await Promise.all([
        api.getOrdersByRestaurant(restaurantId),
        api.getRestaurantRevenueSummary(restaurantId, "month"),
      ]);

      const totalOrders = Array.isArray(ordersData) ? ordersData.length : 0;
      const monthlyRevenue = Number((revenueSummary as any)?.totalRevenue ?? 0);
      setStats({
        totalOrders,
        monthlyRevenue: Number.isFinite(monthlyRevenue) ? monthlyRevenue : 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats({ totalOrders: 0, monthlyRevenue: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchRestaurant();
    fetchStats();
  }, [fetchRestaurant, fetchStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchRestaurant(), fetchStats()]).finally(() =>
      setRefreshing(false)
    );
  }, [fetchRestaurant, fetchStats]);

  const handleUpdateSuccess = () => {
    fetchRestaurant();
    fetchStats();
  };

  const handleBack = () => {
    navigation.navigate("SellerProfile");
  };

  const getStatusText = (status?: number) => {
    switch (status) {
      case 0:
        return "Đóng cửa";
      case 1:
        return "Mở cửa";
      case 2:
        return "Tạm nghỉ";
      default:
        return "Chưa xác định";
    }
  };

  if (loading && !restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Không tìm thấy thông tin nhà hàng</Text>
      </View>
    );
  }

  const menuItems = [
    {
      id: "1",
      title: "Thông tin nhà hàng",
      icon: "restaurant",
      onPress: () => setShowUpdateModal(true),
    },
    {
      id: "2",
      title: "Địa chỉ nhà hàng",
      icon: "place",
      onPress: () => {
        if (address) {
          setShowAddressModal(true);
        } else {
          Alert.alert("Lỗi", "Nhà hàng chưa có địa chỉ.");
        }
      },
    },
  ];

  const renderMenuItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          <Icon name={item.icon} size={24} color={theme.colors.primary} />
        </View>
        <Text style={styles.menuItemText}>{item.title}</Text>
      </View>
      <Icon name="chevron-right" size={24} color={theme.colors.mediumGray} />
    </TouchableOpacity>
  );

  const ratingValue =
    typeof restaurant.rating === "number" && !Number.isNaN(restaurant.rating)
      ? restaurant.rating
      : 0;
  const totalOrdersDisplay = statsLoading
    ? "..."
    : stats.totalOrders.toString();
  const monthlyRevenueDisplay = statsLoading
    ? "..."
    : formatPrice(stats.monthlyRevenue);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  buildImageUrl(restaurant.imageUrl) ||
                  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?fit=crop&w=800&q=80",
              }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <View style={styles.infoRow}>
            <Icon name="star" size={16} color={theme.colors.accent} />
            <Text style={styles.infoText}>{ratingValue.toFixed(1)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="access-time" size={16} color={theme.colors.surface} />
            <Text style={styles.infoText}>
              {restaurant.openTime || "N/A"} - {restaurant.closeTime || "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="info" size={16} color={theme.colors.surface} />
            <Text style={styles.infoText}>
              {getStatusText(restaurant.status)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalOrdersDisplay}</Text>
          <Text style={styles.statLabel}>Tổng đơn hàng</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{ratingValue.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Đánh giá TB</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{monthlyRevenueDisplay}</Text>
          <Text style={styles.statLabel}>Doanh thu tháng</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>{menuItems.map(renderMenuItem)}</View>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Icon name="arrow-back" size={24} color={theme.colors.primary} />
        <Text style={styles.backButtonText}>Thoát</Text>
      </TouchableOpacity>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
      </View>

      {/* Update Restaurant Modal */}
      <UpdateRestaurantModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSuccess={handleUpdateSuccess}
        restaurant={restaurant}
      />

      {/* Update Address Modal */}
      {address && (
        <UpdateAddressModal
          visible={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onSuccess={handleUpdateSuccess}
          address={address}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
  },
  header: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  profileInfo: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.surface,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.surface,
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginTop: -theme.spacing.lg,
    borderRadius: theme.roundness,
    paddingVertical: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  menuContainer: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    borderRadius: theme.roundness,
    ...theme.shadows.small,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.lightOrange,
    borderRadius: theme.roundness / 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  menuItemText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  versionContainer: {
    alignItems: "center",
    paddingBottom: theme.spacing.xl,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.mediumGray,
  },
});

export default RestaurantProfileScreen;
