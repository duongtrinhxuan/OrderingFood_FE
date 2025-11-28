import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme/theme";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import UpdateUserModal from "../../components/UpdateUserModal";
import ManageAddressModal from "../../components/ManageAddressModal";
import NotificationsModal, {
  NotificationRecord,
} from "../../components/NotificationsModal";
import { useFocusEffect } from "@react-navigation/native";
import DiscountListModal from "../../components/DiscountListModal";

const ProfileScreen = () => {
  const { user, setUser, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => logout() },
    ]);
  };

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      const userData = await api.getUserProfile(user.id);
      if (userData) {
        setUser(userData as any);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      setLoadingNotifications(true);
      const data = await api.getNotificationsByReceiver(user.id);
      if (Array.isArray(data)) {
        setNotifications(data as NotificationRecord[]);
        const unread = data.filter(
          (item: NotificationRecord) => !item.isRead
        ).length;
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [user?.id]);

  const fetchOrderStats = useCallback(async () => {
    if (!user?.id) {
      setTotalOrders(0);
      setTotalReviews(0);
      return;
    }

    try {
      const data = await api.getOrdersByUser(user.id);
      const orders = (Array.isArray(data) ? data : []) as any[];

      // Tổng số đơn hàng mà khách hàng đã đặt
      setTotalOrders(orders.length);

      // Tổng số lượt đánh giá mà khách hàng đã thực hiện
      const reviewCount = orders.reduce((sum, order) => {
        const feedbacks = Array.isArray(order.feedbacks) ? order.feedbacks : [];
        return sum + feedbacks.length;
      }, 0);

      setTotalReviews(reviewCount);
    } catch (error) {
      console.error("Error fetching order stats:", error);
    }
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchUserProfile(),
      fetchNotifications(),
      fetchOrderStats(),
    ]).finally(() => setRefreshing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleUpdateSuccess = () => {
    fetchUserProfile();
  };

  const handleNotificationPress = useCallback(
    async (notification: NotificationRecord) => {
      if (!notification || notification.isRead) {
        return;
      }
      try {
        await api.markNotificationAsRead(notification.id);
        await fetchNotifications();
      } catch (error) {
        Alert.alert("Lỗi", "Không thể cập nhật trạng thái thông báo.");
        console.error("Error marking notification as read:", error);
      }
    },
    [fetchNotifications]
  );

  const handleOpenNotifications = () => {
    setNotificationsVisible(true);
    fetchNotifications();
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      fetchOrderStats();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id])
  );

  const handleOpenDiscounts = () => {
    setDiscountModalVisible(true);
  };

  const menuItems = [
    {
      id: "1",
      title: "Thông tin cá nhân",
      icon: "person",
      onPress: () => setShowUpdateModal(true),
    },
    {
      id: "2",
      title: "Địa chỉ giao hàng",
      icon: "place",
      onPress: () => setShowAddressModal(true),
    },
    {
      id: "4",
      title: "Mã giảm giá",
      icon: "local-offer",
      onPress: handleOpenDiscounts,
    },
    {
      id: "6",
      title: "Thông báo",
      icon: "notifications",
      onPress: handleOpenNotifications,
      badgeCount: unreadCount,
    },
    {
      id: "7",
      title: "Cài đặt",
      icon: "settings",
      onPress: () => {},
    },
    {
      id: "8",
      title: "Trợ giúp & Hỗ trợ",
      icon: "help",
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
          {item.badgeCount && item.badgeCount > 0 ? (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {item.badgeCount > 99 ? "99+" : item.badgeCount.toString()}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.menuItemText}>{item.title}</Text>
      </View>
      <Icon name="chevron-right" size={24} color={theme.colors.mediumGray} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
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
                  user?.avatar ||
                  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?fit=crop&w=200&h=200",
              }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.userName}>{user?.username || "Người dùng"}</Text>
          <Text style={styles.userEmail}>{user?.email || ""}</Text>
          <Text style={styles.userPhone}>{user?.phone || "Chưa cập nhật"}</Text>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalOrders}</Text>
          <Text style={styles.statLabel}>Đơn hàng</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalReviews}</Text>
          <Text style={styles.statLabel}>Đánh giá</Text>
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

      {/* Update User Modal */}
      {user && (
        <UpdateUserModal
          visible={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={handleUpdateSuccess}
          user={user}
        />
      )}

      {/* Manage Address Modal */}
      {user && (
        <ManageAddressModal
          visible={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          userId={user.id}
        />
      )}

      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        notifications={notifications}
        loading={loadingNotifications}
        onRefresh={fetchNotifications}
        onNotificationPress={handleNotificationPress}
      />
      <DiscountListModal
        visible={discountModalVisible}
        onClose={() => setDiscountModalVisible(false)}
      />
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
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: 16,
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
    opacity: 0.9,
  },
  userPhone: {
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
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.error,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: "700",
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
  scrollContent: {
    paddingBottom: theme.navbarHeight + theme.spacing.md,
  },
});

export default ProfileScreen;
