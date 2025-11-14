import React from "react";
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

const DashboardScreen = () => {
  const stats = [
    {
      title: "Đơn hàng hôm nay",
      value: "24",
      change: "+12%",
      icon: "receipt",
      color: theme.colors.primary,
    },
    {
      title: "Doanh thu hôm nay",
      value: "2.4M",
      change: "+8%",
      icon: "attach-money",
      color: theme.colors.success,
    },
    {
      title: "Đánh giá trung bình",
      value: "4.7",
      change: "+0.2",
      icon: "star",
      color: theme.colors.warning,
    },
    {
      title: "Khách hàng mới",
      value: "15",
      change: "+5",
      icon: "person-add",
      color: theme.colors.info,
    },
  ];

  const recentOrders = [
    {
      id: "1",
      customer: "Nguyễn Văn A",
      items: "Pizza Margherita x2",
      total: 500000,
      status: "preparing",
      time: "14:30",
    },
    {
      id: "2",
      customer: "Trần Thị B",
      items: "Chicken Burger x1",
      total: 89000,
      status: "ready",
      time: "14:15",
    },
    {
      id: "3",
      customer: "Lê Văn C",
      items: "Big Mac x1, Coca Cola x2",
      total: 125000,
      status: "delivering",
      time: "14:00",
    },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing":
        return theme.colors.warning;
      case "ready":
        return theme.colors.info;
      case "delivering":
        return theme.colors.success;
      default:
        return theme.colors.mediumGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "preparing":
        return "Đang chuẩn bị";
      case "ready":
        return "Sẵn sàng";
      case "delivering":
        return "Đang giao";
      default:
        return status;
    }
  };

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

  const renderOrderItem = (order: any) => (
    <TouchableOpacity key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.customerName}>{order.customer}</Text>
          <Text style={styles.orderTime}>{order.time}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>
      <Text style={styles.orderItems}>{order.items}</Text>
      <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
    </TouchableOpacity>
  );

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
            <Text style={styles.restaurantName}>Pizza Hut - Quận 1</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Icon name="notifications" size={24} color={theme.colors.surface} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>
        <View style={styles.statsGrid}>{stats.map(renderStatCard)}</View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Icon name="add" size={24} color={theme.colors.primary} />
            <Text style={styles.quickActionText}>Thêm món</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Icon name="edit" size={24} color={theme.colors.primary} />
            <Text style={styles.quickActionText}>Sửa thực đơn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Icon name="trending-up" size={24} color={theme.colors.primary} />
            <Text style={styles.quickActionText}>Xem báo cáo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Icon name="settings" size={24} color={theme.colors.primary} />
            <Text style={styles.quickActionText}>Cài đặt</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.recentOrdersContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        {recentOrders.map(renderOrderItem)}
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
