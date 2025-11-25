import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme/theme";
import { useAuth } from "../../context/AuthContext";

const RestaurantProfileScreen = () => {
  const { user, logout } = useAuth();
  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => logout() },
    ]);
  };

  const menuItems = [
    {
      id: "1",
      title: "Thông tin nhà hàng",
      icon: "restaurant",
      onPress: () => {},
    },
    {
      id: "2",
      title: "Địa chỉ nhà hàng",
      icon: "place",
      onPress: () => {},
    },
    {
      id: "3",
      title: "Giờ mở cửa",
      icon: "schedule",
      onPress: () => {},
    },
    {
      id: "4",
      title: "Phương thức thanh toán",
      icon: "payment",
      onPress: () => {},
    },
    {
      id: "5",
      title: "Thông báo",
      icon: "notifications",
      onPress: () => {},
    },
    {
      id: "6",
      title: "Cài đặt",
      icon: "settings",
      onPress: () => {},
    },
    {
      id: "7",
      title: "Trợ giúp & Hỗ trợ",
      icon: "help",
      onPress: () => {},
    },
    {
      id: "8",
      title: "Về ứng dụng",
      icon: "info",
      onPress: () => {},
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

  return (
    <ScrollView style={styles.container}>
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
                  user?.avatar ||
                  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?fit=crop&w=200&h=200",
              }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <Icon name="camera-alt" size={16} color={theme.colors.surface} />
            </TouchableOpacity>
          </View>
          <Text style={styles.restaurantName}>{user?.username}</Text>
          <Text style={styles.restaurantEmail}>{user?.email}</Text>
          <Text style={styles.restaurantPhone}>
            {user?.phone || "Chưa cập nhật"}
          </Text>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>678</Text>
          <Text style={styles.statLabel}>Tổng đơn hàng</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>4.7</Text>
          <Text style={styles.statLabel}>Đánh giá TB</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>65M</Text>
          <Text style={styles.statLabel}>Doanh thu tháng</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>{menuItems.map(renderMenuItem)}</View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={24} color={theme.colors.error} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: theme.colors.surface,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  restaurantEmail: {
    fontSize: 16,
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
    opacity: 0.9,
  },
  restaurantPhone: {
    fontSize: 14,
    color: theme.colors.surface,
    opacity: 0.8,
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
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.error,
    ...theme.shadows.small,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.error,
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
