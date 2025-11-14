import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme/theme";

const RevenueScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  const periods = [
    { key: "today", label: "Hôm nay" },
    { key: "week", label: "Tuần này" },
    { key: "month", label: "Tháng này" },
    { key: "year", label: "Năm nay" },
  ];

  const revenueData = {
    today: {
      totalRevenue: 2500000,
      totalOrders: 24,
      averageOrder: 104167,
      growth: 12,
    },
    week: {
      totalRevenue: 15000000,
      totalOrders: 156,
      averageOrder: 96154,
      growth: 8,
    },
    month: {
      totalRevenue: 65000000,
      totalOrders: 678,
      averageOrder: 95870,
      growth: 15,
    },
    year: {
      totalRevenue: 780000000,
      totalOrders: 8124,
      averageOrder: 96012,
      growth: 22,
    },
  };

  const topSellingItems = [
    { name: "Pizza Margherita", sales: 45, revenue: 11250000 },
    { name: "Chicken Burger", sales: 38, revenue: 3382000 },
    { name: "Big Mac", sales: 32, revenue: 2400000 },
    { name: "Coca Cola", sales: 28, revenue: 420000 },
    { name: "French Fries", sales: 25, revenue: 1250000 },
  ];

  const dailyRevenue = [
    { day: "T2", revenue: 1200000 },
    { day: "T3", revenue: 1800000 },
    { day: "T4", revenue: 2200000 },
    { day: "T5", revenue: 1900000 },
    { day: "T6", revenue: 2500000 },
    { day: "T7", revenue: 2800000 },
    { day: "CN", revenue: 2100000 },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const currentData = revenueData[selectedPeriod as keyof typeof revenueData];

  const renderPeriodFilter = (period: any) => (
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

  const renderTopSellingItem = (item: any, index: number) => (
    <View key={index} style={styles.topItemCard}>
      <View style={styles.itemRank}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSales}>{item.sales} đơn</Text>
      </View>
      <Text style={styles.itemRevenue}>{formatPrice(item.revenue)}</Text>
    </View>
  );

  const renderDailyRevenue = (day: any, index: number) => (
    <View key={index} style={styles.dailyItem}>
      <Text style={styles.dayText}>{day.day}</Text>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.revenueBar,
            {
              height: (day.revenue / 3000000) * 100,
              backgroundColor: theme.colors.primary,
            },
          ]}
        />
      </View>
      <Text style={styles.dailyRevenueText}>
        {formatPrice(day.revenue).replace("₫", "K")}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Period Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {periods.map(renderPeriodFilter)}
        </ScrollView>
      </View>

      {/* Revenue Overview */}
      <View style={styles.overviewContainer}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.overviewCard}
        >
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Tổng doanh thu</Text>
            <View style={styles.growthContainer}>
              <Icon name="trending-up" size={16} color={theme.colors.surface} />
              <Text style={styles.growthText}>+{currentData.growth}%</Text>
            </View>
          </View>
          <Text style={styles.revenueAmount}>
            {formatPrice(currentData.totalRevenue)}
          </Text>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="receipt" size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{currentData.totalOrders}</Text>
            <Text style={styles.statLabel}>Đơn hàng</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="attach-money" size={24} color={theme.colors.success} />
            <Text style={styles.statValue}>
              {formatPrice(currentData.averageOrder).replace("₫", "K")}
            </Text>
            <Text style={styles.statLabel}>TB/Đơn</Text>
          </View>
        </View>
      </View>

      {/* Daily Revenue Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Doanh thu theo ngày</Text>
        <View style={styles.chart}>
          <View style={styles.dailyRevenueGrid}>
            {dailyRevenue.map(renderDailyRevenue)}
          </View>
        </View>
      </View>

      {/* Top Selling Items */}
      <View style={styles.topItemsContainer}>
        <Text style={styles.sectionTitle}>Món bán chạy</Text>
        <View style={styles.topItemsList}>
          {topSellingItems.map(renderTopSellingItem)}
        </View>
      </View>

      {/* Revenue Breakdown */}
      <View style={styles.breakdownContainer}>
        <Text style={styles.sectionTitle}>Phân tích doanh thu</Text>
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownIcon}>
              <Icon name="restaurant" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.breakdownContent}>
              <Text style={styles.breakdownTitle}>Dine-in</Text>
              <Text style={styles.breakdownValue}>
                {formatPrice(currentData.totalRevenue * 0.3)}
              </Text>
            </View>
          </View>
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownIcon}>
              <Icon
                name="delivery-dining"
                size={20}
                color={theme.colors.secondary}
              />
            </View>
            <View style={styles.breakdownContent}>
              <Text style={styles.breakdownTitle}>Delivery</Text>
              <Text style={styles.breakdownValue}>
                {formatPrice(currentData.totalRevenue * 0.7)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
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
  chart: {
    height: 200,
  },
  dailyRevenueGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: "100%",
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
  rankText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  itemInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
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
