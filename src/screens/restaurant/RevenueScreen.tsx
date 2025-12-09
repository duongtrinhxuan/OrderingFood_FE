import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRoute } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { api, buildImageUrl } from "../../services/api";
import { theme } from "../../theme/theme";

type PeriodKey = "today" | "week" | "month" | "year";

type RevenueSummary = {
  period: PeriodKey;
  comparisonLabel: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  growthRate: number;
  chart: { label: string; revenue: number }[];
  topProducts: {
    productId: number;
    name: string;
    quantity: number;
    revenue: number;
    imageUrl?: string | null;
  }[];
  menuRevenue: {
    menuId: number | null;
    menuName: string;
    revenue: number;
  }[];
};

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Hôm nay" },
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
  { key: "year", label: "Năm nay" },
];

const RevenueScreen = () => {
  const route = useRoute<any>();
  const { user } = useAuth();
  const routeRestaurantId = route?.params?.restaurantId;

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("today");
  const [restaurantId, setRestaurantId] = useState<number | null>(
    routeRestaurantId ?? null
  );
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingRestaurant, setFetchingRestaurant] = useState(false);

  useEffect(() => {
    setRestaurantId(routeRestaurantId ?? null);
  }, [routeRestaurantId]);

  const fetchRestaurant = useCallback(async () => {
    if (routeRestaurantId || !user?.id) return;
    try {
      setFetchingRestaurant(true);
      const data = await api.getRestaurantsByOwner(user.id);
      const restaurants = (data as any[]) || [];
      if (restaurants.length > 0) {
        setRestaurantId(restaurants[0].id);
      } else {
        setRestaurantId(null);
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      setRestaurantId(null);
    } finally {
      setFetchingRestaurant(false);
    }
  }, [routeRestaurantId, user?.id]);

  useEffect(() => {
    if (!routeRestaurantId) {
      fetchRestaurant();
    }
  }, [fetchRestaurant, routeRestaurantId]);

  const fetchSummary = useCallback(async () => {
    if (!restaurantId) {
      setSummary(null);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getRestaurantRevenueSummary(
        restaurantId,
        selectedPeriod
      );
      setSummary(data as RevenueSummary);
    } catch (error: any) {
      console.error("Error loading revenue summary:", error);
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể tải dữ liệu doanh thu. Vui lòng thử lại."
      );
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, selectedPeriod]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const safeTopProducts = summary?.topProducts ?? [];
  const safeMenuRevenue = summary?.menuRevenue ?? [];
  console.log(
    "Period:",
    selectedPeriod,
    "Top len:",
    safeTopProducts.length,
    "Menu len:",
    safeMenuRevenue.length
  );

  const growthColor =
    (summary?.growthRate || 0) >= 0 ? theme.colors.success : theme.colors.error;
  const growthIcon =
    (summary?.growthRate || 0) >= 0 ? "trending-up" : "trending-down";

  const renderPeriodFilter = (period: (typeof PERIODS)[number]) => (
    <TouchableOpacity
      key={period.key}
      style={[
        styles.periodChip,
        selectedPeriod === period.key && styles.selectedPeriodChip,
      ]}
      onPress={() => setSelectedPeriod(period.key)}
    >
      <Text
        style={[
          styles.periodText,
          selectedPeriod === period.key && styles.selectedPeriodText,
        ]}
      >
        {period.label}
      </Text>
    </TouchableOpacity>
  );

  const renderChart = () => {
    if (!summary || !summary.chart || summary.chart.length === 0) {
      return (
        <Text style={styles.emptyHint}>
          Chưa có dữ liệu doanh thu theo ngày cho giai đoạn này.
        </Text>
      );
    }

    const maxRevenue = Math.max(...summary.chart.map((c) => c.revenue), 1);

    return (
      <View style={styles.dailyRevenueGrid}>
        {summary.chart.map((item) => (
          <View key={item.label} style={styles.dailyItem}>
            <Text style={styles.dayText}>{item.label}</Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.revenueBar,
                  {
                    height: (item.revenue / maxRevenue) * 120 || 2,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.dailyRevenueText}>
              {formatPrice(item.revenue)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTopProduct = (
    product: RevenueSummary["topProducts"][number],
    index: number
  ) => {
    const fallbackImage =
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?fit=crop&w=200&q=60";
    return (
      <View key={product.productId} style={styles.topItemCard}>
        <View style={styles.itemRank}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        <Image
          source={{ uri: buildImageUrl(product.imageUrl) || fallbackImage }}
          style={styles.itemImage}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{product.name}</Text>
          <Text style={styles.itemSales}>{product.quantity} món</Text>
        </View>
        <View style={styles.itemMeta}>
          <Text style={styles.itemRevenue}>{formatPrice(product.revenue)}</Text>
        </View>
      </View>
    );
  };

  const renderMenuRevenue = (
    menu: RevenueSummary["menuRevenue"][number],
    index: number
  ) => (
    <View key={`${menu.menuId}-${index}`} style={styles.breakdownItem}>
      <View style={styles.breakdownIcon}>
        <Icon name="restaurant-menu" size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.breakdownContent}>
        <Text style={styles.breakdownTitle}>{menu.menuName}</Text>
        <Text style={styles.breakdownValue}>{formatPrice(menu.revenue)}</Text>
      </View>
    </View>
  );

  if (fetchingRestaurant) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!restaurantId) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.emptyHint}>
          Bạn chưa có nhà hàng nào để xem báo cáo.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {PERIODS.map(renderPeriodFilter)}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : summary ? (
        <View key={`summary-${summary.period}`}>
          <View style={styles.overviewContainer}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={styles.overviewCard}
            >
              <View style={styles.overviewHeader}>
                <Text style={styles.overviewTitle}>Tổng doanh thu</Text>
                <View style={styles.growthContainer}>
                  <Icon name={growthIcon} size={16} color={growthColor} />
                  <Text style={[styles.growthText, { color: growthColor }]}>
                    {summary.growthRate >= 0 ? "+" : ""}
                    {Math.abs(summary.growthRate).toFixed(1)}%
                  </Text>
                </View>
              </View>
              <Text style={styles.revenueAmount}>
                {formatPrice(summary.totalRevenue)}
              </Text>
              <Text style={styles.growthLabel}>{summary.comparisonLabel}</Text>
            </LinearGradient>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Icon name="receipt" size={24} color={theme.colors.primary} />
                <Text style={styles.statValue}>{summary.totalOrders}</Text>
                <Text style={styles.statLabel}>Tổng đơn hàng</Text>
              </View>
              <View style={styles.statCard}>
                <Icon
                  name="attach-money"
                  size={24}
                  color={theme.colors.success}
                />
                <Text style={styles.statValue}>
                  {formatPrice(summary.averageOrderValue)}
                </Text>
                <Text style={styles.statLabel}>Giá trị TB/đơn</Text>
              </View>
            </View>
          </View>

          {selectedPeriod !== "today" && (
            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>Doanh thu theo ngày</Text>
              {renderChart()}
            </View>
          )}

          <View style={styles.topItemsContainer}>
            <Text style={styles.sectionTitle}>Món bán chạy</Text>
            {safeTopProducts.length === 0 ? (
              <Text style={styles.emptyHint}>
                Chưa có dữ liệu món bán chạy.
              </Text>
            ) : (
              <View style={styles.topItemsList}>
                {safeTopProducts.map((item, index) =>
                  renderTopProduct(item, index)
                )}
              </View>
            )}
          </View>

          <View style={styles.breakdownContainer}>
            <Text style={styles.sectionTitle}>
              Phân tích doanh thu theo menu
            </Text>
            {safeMenuRevenue.length === 0 ? (
              <Text style={styles.emptyHint}>
                Chưa có dữ liệu doanh thu theo menu.
              </Text>
            ) : (
              <View style={styles.breakdownGrid}>
                {safeMenuRevenue.map(renderMenuRevenue)}
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyHint}>
            Không có dữ liệu doanh thu trong giai đoạn này.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: theme.navbarHeight + theme.spacing.xl,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
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
  periodChip: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedPeriodChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.mediumGray,
  },
  selectedPeriodText: {
    color: theme.colors.surface,
  },
  overviewContainer: {
    padding: theme.spacing.lg,
  },
  overviewCard: {
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  overviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  overviewTitle: {
    fontSize: 16,
    color: theme.colors.surface,
    opacity: 0.9,
  },
  growthLabel: {
    marginTop: theme.spacing.xs,
    fontSize: 12,
    color: theme.colors.surface,
    opacity: 0.85,
  },
  growthContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  growthText: {
    fontSize: 14,
    color: theme.colors.surface,
    marginLeft: theme.spacing.xs,
    fontWeight: "bold",
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.surface,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    alignItems: "center",
    width: "48%",
    ...theme.shadows.small,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.xs,
  },
  chartContainer: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  emptyHint: {
    fontSize: 14,
    color: theme.colors.mediumGray,
    textAlign: "center",
  },
  chart: {
    height: 200,
  },
  dailyRevenueGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 180,
  },
  dailyItem: {
    alignItems: "center",
    flex: 1,
  },
  dayText: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.sm,
  },
  barContainer: {
    height: 120,
    width: 20,
    justifyContent: "flex-end",
    marginBottom: theme.spacing.sm,
  },
  revenueBar: {
    width: "100%",
    borderRadius: 2,
  },
  dailyRevenueText: {
    fontSize: 10,
    color: theme.colors.mediumGray,
  },
  topItemsContainer: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
  },
  topItemsList: {
    marginTop: theme.spacing.md,
  },
  topItemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemRank: {
    width: 30,
    alignItems: "center",
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.lightGray,
  },
  rankText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  itemInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    marginRight: theme.spacing.md,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  itemSales: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.xs,
  },
  itemMeta: {
    alignItems: "flex-end",
  },
  itemRevenue: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  breakdownContainer: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.small,
  },
  breakdownGrid: {
    marginTop: theme.spacing.md,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.lightOrange,
    borderRadius: theme.roundness / 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  breakdownContent: {
    flex: 1,
  },
  breakdownTitle: {
    fontSize: 14,
    color: theme.colors.mediumGray,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
});

export default RevenueScreen;
