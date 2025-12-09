import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

import { theme } from "../../theme/theme";
import { useAuth } from "../../context/AuthContext";
import { api, buildImageUrl } from "../../services/api";
import { SellerStackParamList } from "../../navigation/SellerNavigator";
import { StackNavigationProp } from "@react-navigation/stack";
import CreateRestaurantModal from "../../components/CreateRestaurantModal";
import TransferInfoModal from "../../components/TransferInfoModal";

type SellerProfileScreenNavigationProp = StackNavigationProp<
  SellerStackParamList,
  "SellerProfile"
>;

type Restaurant = {
  id: number;
  name: string;
  imageUrl?: string;
  phone?: string;
  openTime?: string;
  closeTime?: string;
  rating?: number;
  status?: number;
  address?: {
    label: string;
    province: string;
    district: string;
    ward: string;
    street: string;
  };
};

interface Props {
  navigation: SellerProfileScreenNavigationProp;
}

const SellerProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, setUser, logout } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [form, setForm] = useState({
    email: "",
    username: "",
    phone: "",
    gender: "male",
  });

  const fetchMonthlyRevenue = useCallback(
    async (ownedRestaurants: Restaurant[]) => {
      if (!ownedRestaurants || ownedRestaurants.length === 0) {
        setMonthlyRevenue(0);
        return;
      }

      try {
        const summaries = await Promise.all(
          ownedRestaurants.map((restaurant) =>
            api
              .getRestaurantRevenueSummary(restaurant.id, "month")
              .catch((error) => {
                console.error(
                  `Failed to load revenue for restaurant ${restaurant.id}`,
                  error
                );
                return null;
              })
          )
        );

        const total = summaries.reduce((sum, summary) => {
          const value = Number((summary as any)?.totalRevenue ?? 0);
          return Number.isFinite(value) ? sum + value : sum;
        }, 0);

        setMonthlyRevenue(total);
      } catch (error) {
        console.error("Failed to aggregate monthly revenue", error);
        setMonthlyRevenue(0);
      }
    },
    []
  );

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      if (!refreshing) {
        setLoading(true);
      }
      const [userDetail, ownedRestaurants] = (await Promise.all([
        api.getUserProfile(user.id),
        api.getRestaurantsByOwner(user.id),
      ])) as [any, Restaurant[]];
      setProfile(userDetail);
      setForm({
        email: userDetail.email ?? "",
        username: userDetail.username ?? "",
        phone: userDetail.phone ?? "",
        gender: userDetail.gender ?? "male",
      });
      setRestaurants(ownedRestaurants);
      fetchMonthlyRevenue(ownedRestaurants);
      setUser({
        id: userDetail.id,
        email: userDetail.email,
        username: userDetail.username,
        roleId: userDetail.roleId,
        phone: userDetail.phone,
        gender: userDetail.gender,
      });
    } catch (error) {
      console.error("Load seller profile failed", error);
      Alert.alert("Lỗi", "Không thể tải thông tin. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, refreshing, setUser, fetchMonthlyRevenue]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const stats = useMemo(() => {
    const count = restaurants.length;
    const avg =
      count === 0
        ? 0
        : restaurants.reduce(
            (sum, item) =>
              sum + (typeof item.rating === "number" ? item.rating : 0),
            0
          ) / count;
    return {
      restaurantCount: count,
      averageRating: Number.isFinite(avg) ? avg : 0,
      totalRevenue: monthlyRevenue,
    };
  }, [restaurants, monthlyRevenue]);

  const formatRestaurantRating = (rating?: number) => {
    if (typeof rating === "number" && !Number.isNaN(rating)) {
      return rating.toFixed(1);
    }
    return "0.0";
  };

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập bị từ chối",
        "Ứng dụng cần quyền truy cập ảnh để cập nhật avatar."
      );
      return false;
    }
    return true;
  };

  const handlePickAvatar = async () => {
    if (!user?.id) {
      return;
    }

    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      return;
    }

    try {
      // Bỏ qua mediaTypes để dùng mặc định (chỉ ảnh)
      // Hoặc có thể dùng: mediaTypes: 'images' nếu API hỗ trợ
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        aspect: [1, 1],
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setUploadingAvatar(true);
      const asset = result.assets[0];

      // Upload ảnh lên backend: backend trả về path tương đối
      const uploadResult = await api.uploadAvatar(asset.uri);
      const avatarPath = uploadResult.url;

      console.log("Avatar path:", avatarPath);

      // Cập nhật avatar path vào database
      await api.updateUser(user.id, { avatar: avatarPath });

      // Cập nhật cả user và profile state ngay lập tức
      const updatedUser = {
        ...user,
        avatar: avatarPath,
      };
      setUser(updatedUser);

      // Cập nhật profile state để avatar hiển thị ngay
      if (profile) {
        setProfile({
          ...profile,
          avatar: avatarPath,
        });
      }

      // Refresh data để đảm bảo đồng bộ
      await fetchData();
      Alert.alert("Thành công", "Ảnh đại diện đã được cập nhật.");
    } catch (error: any) {
      console.error("Upload avatar failed", error);
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể cập nhật avatar. Vui lòng thử lại."
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveInfo = async () => {
    if (!user?.id) {
      return;
    }

    try {
      setSaving(true);
      await api.updateUser(user.id, form);
      Alert.alert("Thành công", "Thông tin đã được cập nhật.");
      fetchData();
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể cập nhật thông tin. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRestaurant = () => {
    console.log(
      "handleCreateRestaurant called, setting showCreateModal to true"
    );
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    fetchData();
  };

  const handleOpenRestaurant = (restaurantId: number) => {
    navigation.navigate("RestaurantTabs", { restaurantId });
  };

  const renderInfoForm = () => (
    <View>
      <TextInput
        style={styles.input}
        placeholder="Họ và tên"
        value={form.username}
        onChangeText={(text) => handleChange("username", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={form.email}
        onChangeText={(text) => handleChange("email", text)}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Số điện thoại"
        value={form.phone}
        onChangeText={(text) => handleChange("phone", text)}
        keyboardType="phone-pad"
      />
      <Text style={styles.label}>Giới tính</Text>
      <View style={styles.genderRow}>
        {(["male", "female"] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.genderButton,
              form.gender === option && styles.genderButtonActive,
            ]}
            onPress={() => handleChange("gender", option)}
          >
            <Icon
              name={option === "male" ? "male" : "female"}
              size={20}
              color={
                form.gender === option
                  ? theme.colors.surface
                  : theme.colors.primary
              }
            />
            <Text
              style={[
                styles.genderButtonText,
                form.gender === option && styles.genderButtonTextActive,
              ]}
            >
              {option === "male" ? "Nam" : "Nữ"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSaveInfo}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={theme.colors.surface} />
        ) : (
          <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const actionItems = [
    {
      key: "info",
      label: "Thông tin cá nhân",
      icon: "person",
      onPress: () => setShowInfoModal(true),
    },
    {
      key: "payment",
      label: "Thông tin thanh toán",
      icon: "payment",
      onPress: () => setShowPaymentModal(true),
    },
  ];

  // Ưu tiên avatar từ user state (được cập nhật ngay sau upload)
  // sau đó mới dùng profile?.avatar
  const avatarUri =
    buildImageUrl(user?.avatar || profile?.avatar) ||
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?fit=crop&w=400&h=400";

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchData();
          }}
        />
      }
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={handlePickAvatar}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator color={theme.colors.surface} size="small" />
              ) : (
                <Icon
                  name="camera-alt"
                  size={16}
                  color={theme.colors.surface}
                />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{profile?.username}</Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>
          <Text style={styles.userPhone}>
            {profile?.phone || "Chưa cập nhật số điện thoại"}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.restaurantCount}</Text>
          <Text style={styles.statLabel}>Nhà hàng sở hữu</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {stats.averageRating.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Rating trung bình</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {stats.totalRevenue.toLocaleString("vi-VN")}đ
          </Text>
          <Text style={styles.statLabel}>Doanh thu</Text>
        </View>
      </View>

      <View style={styles.tabWrapper}>
        {actionItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.tabButton}
            onPress={item.onPress}
          >
            <Icon name={item.icon} size={20} color={theme.colors.primary} />
            <Text style={styles.tabButtonText}>{item.label}</Text>
            <Icon
              name="chevron-right"
              size={20}
              color={theme.colors.mediumGray}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nhà hàng đang quản lý</Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleCreateRestaurant}
        >
          <Icon name="add" size={20} color={theme.colors.primary} />
          <Text style={styles.secondaryButtonText}>Tạo mới</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ marginVertical: theme.spacing.lg }}
          color={theme.colors.primary}
        />
      ) : restaurants.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="restaurant" size={32} color={theme.colors.primary} />
          <Text style={styles.emptyStateTitle}>
            Hãy khám phá quản lý nhà hàng
          </Text>
          <Text style={styles.emptyStateDescription}>
            Bạn chưa thêm nhà hàng nào. Nhấn “Tạo mới” để bắt đầu bán hàng ngay
            hôm nay.
          </Text>
        </View>
      ) : (
        restaurants.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.restaurantCard}
            onPress={() => handleOpenRestaurant(item.id)}
          >
            <Image
              source={{
                uri:
                  buildImageUrl(item.imageUrl) ||
                  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?fit=crop&w=800&q=80",
              }}
              style={styles.restaurantImage}
            />
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{item.name}</Text>
              <Text style={styles.restaurantMeta}>
                {item.address?.label || "Chưa có địa chỉ"}
              </Text>
              <View style={styles.restaurantStatsRow}>
                <View style={styles.restaurantStat}>
                  <Icon
                    name="access-time"
                    size={14}
                    color={theme.colors.mediumGray}
                  />
                  <Text style={styles.restaurantStatText}>
                    {item.openTime || "N/A"} - {item.closeTime || "N/A"}
                  </Text>
                </View>
              </View>
              <View style={styles.restaurantStatsRow}>
                <View style={styles.restaurantStat}>
                  <Icon name="star" size={16} color="#F5A623" />
                  <Text style={styles.restaurantStatText}>
                    {formatRestaurantRating(item.rating)}
                  </Text>
                </View>
                <View style={styles.restaurantStat}>
                  <Icon
                    name={item.status === 1 ? "check-circle" : "cancel"}
                    size={16}
                    color={item.status === 1 ? "#2ecc71" : "#e74c3c"}
                  />
                  <Text
                    style={[
                      styles.restaurantStatText,
                      {
                        color: item.status === 1 ? "#2ecc71" : "#e74c3c",
                      },
                    ]}
                  >
                    {item.status === 1 ? "Đang hoạt động" : "Tạm dừng"}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Icon name="logout" size={20} color={theme.colors.error} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      <CreateRestaurantModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        defaultPhone={user?.phone || ""}
        userId={user?.id || 0}
      />
      <Modal
        visible={showInfoModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalScreen}>
          <View style={styles.modalHeaderBar}>
            <TouchableOpacity
              onPress={() => setShowInfoModal(false)}
              style={styles.modalHeaderButton}
            >
              <Icon name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Thông tin cá nhân</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>
          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={false}
          >
            {renderInfoForm()}
          </ScrollView>
        </View>
      </Modal>
      <TransferInfoModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        userId={user?.id || 0}
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
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: theme.colors.surface,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    width: 32,
    height: 32,
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
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.xs,
    textAlign: "center",
    paddingHorizontal: theme.spacing.sm,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  tabWrapper: {
    flexDirection: "column",
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  activeTabButton: {
    backgroundColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  activeTabButtonText: {
    color: theme.colors.surface,
  },
  card: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness,
    ...theme.shadows.small,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  genderRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.roundness,
    gap: theme.spacing.xs,
  },
  genderButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  genderButtonText: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  genderButtonTextActive: {
    color: theme.colors.surface,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    alignItems: "center",
  },
  saveButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: theme.colors.mediumGray,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cardContent: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.mediumGray,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  restaurantCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: theme.roundness,
    overflow: "hidden",
    ...theme.shadows.small,
  },
  restaurantImage: {
    width: 110,
    height: 110,
  },
  restaurantInfo: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: "space-between",
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  restaurantMeta: {
    fontSize: 13,
    color: theme.colors.mediumGray,
  },
  restaurantStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  restaurantStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  restaurantStatText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  modalScreen: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  modalHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalHeaderButton: {
    padding: theme.spacing.xs,
  },
  modalHeaderTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  modalHeaderSpacer: {
    width: 24,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  modalBodyContent: {
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.roundness,
    gap: theme.spacing.xs,
  },
  logoutText: {
    color: theme.colors.error,
    fontWeight: "600",
  },
});

export default SellerProfileScreen;
