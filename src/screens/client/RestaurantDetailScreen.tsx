import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { theme } from "../../theme/theme";
import { api } from "../../services/api";
import { formatDateTime, formatPrice } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: "Đóng cửa", color: theme.colors.error },
  1: { label: "Đang mở", color: theme.colors.success },
  2: { label: "Tạm nghỉ", color: theme.colors.warning },
};

const RestaurantDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { restaurantId } = route.params || {};
  const { user } = useAuth();
  const { cartId, refreshCartCount } = useCart();

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {}
  );

  const loadData = useCallback(async () => {
    if (!restaurantId) {
      return;
    }
    try {
      setLoading(true);
      const [restaurantData, menusData, productsData, feedbackResponse] =
        await Promise.all([
          api.getRestaurantById(restaurantId),
          api.getMenusByRestaurant(restaurantId),
          api.getProductsByRestaurant(restaurantId),
          api.getFeedbacksByRestaurant(restaurantId),
        ]);

      setRestaurant(restaurantData);
      const activeMenus =
        (menusData as any[]).filter((menu) => menu.isActive !== false) || [];
      setMenus(activeMenus);

      const activeProducts =
        (productsData as any[]).filter(
          (product) => product.isActive !== false && product.available !== false
        ) || [];
      setProducts(activeProducts);

      const feedbackList = (feedbackResponse as any)?.feedbacks || [];
      setFeedbacks(feedbackList);

      const initialExpanded: Record<string, boolean> = {};
      activeMenus.forEach((menu) => {
        initialExpanded[`menu-${menu.id}`] = true;
      });
      if (activeProducts.some((product) => !product.menuID)) {
        initialExpanded["menu-null"] = true;
      }
      setExpandedMenus(initialExpanded);
    } catch (error) {
      console.error("Error loading restaurant detail:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin nhà hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const groupedMenus = useMemo(() => {
    const groups =
      menus.map((menu) => ({
        key: `menu-${menu.id}`,
        menuId: menu.id,
        menuName: menu.name,
        products: products.filter((product) => product.menuID === menu.id),
      })) || [];

    const others = products.filter((product) => !product.menuID);
    if (others.length > 0) {
      groups.push({
        key: "menu-null",
        menuId: null,
        menuName: "Khác",
        products: others,
      });
    }
    return groups;
  }, [menus, products]);

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAddToCart = useCallback(
    async (product: any) => {
      if (!user?.id) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để thêm vào giỏ hàng.");
        return;
      }
      try {
        let currentCartId = cartId;
        if (!currentCartId) {
          const cart = await api.getOrCreateUserCart(user.id);
          currentCartId = (cart as any).id;
        }
        if (!currentCartId) {
          Alert.alert("Lỗi", "Không thể tạo giỏ hàng. Vui lòng thử lại.");
          return;
        }

        const productRestaurantId =
          product.restaurantID || product.restaurant?.id || restaurantId;
        const existingCartItems = await api.getCartItemsByCart(currentCartId);
        const activeCartItems = (existingCartItems as any[]).filter(
          (item: any) => item.isActive
        );

        if (activeCartItems.length > 0) {
          const firstItemRestaurantId =
            activeCartItems[0].product?.restaurantID ||
            activeCartItems[0].product?.restaurant?.id;
          if (
            firstItemRestaurantId &&
            firstItemRestaurantId !== productRestaurantId
          ) {
            Alert.alert(
              "Không hợp lệ",
              "Giỏ hàng đang chứa món ăn từ nhà hàng khác. Vui lòng hoàn tất hoặc xóa giỏ hàng hiện tại."
            );
            return;
          }
        }

        let existingItem: any = null;
        try {
          existingItem = await api.getCartItemByCartAndProduct(
            currentCartId,
            product.id
          );
        } catch {
          existingItem = null;
        }

        if (existingItem && existingItem.isActive) {
          await api.updateCartItem(existingItem.id, {
            quantity: (existingItem.quantity || 0) + 1,
          });
        } else if (existingItem && !existingItem.isActive) {
          await api.updateCartItem(existingItem.id, {
            quantity: 1,
            isActive: true,
          });
        } else {
          await api.createCartItem({
            cartId: currentCartId,
            productId: product.id,
            quantity: 1,
            unitPrice: product.price,
          });
        }
        Alert.alert("Thành công", "Đã thêm món vào giỏ hàng.");
        refreshCartCount();
      } catch (error) {
        console.error("Error adding to cart:", error);
        Alert.alert("Lỗi", "Không thể thêm món vào giỏ. Vui lòng thử lại.");
      }
    },
    [user?.id, cartId, restaurantId, refreshCartCount]
  );

  const renderProductCard = (product: any) => (
    <View key={product.id} style={styles.productCard}>
      <Image
        source={{
          uri:
            product.imageUrl ||
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=60",
        }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
        {product.description ? (
          <Text style={styles.productDesc} numberOfLines={2}>
            {product.description}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAddToCart(product)}
      >
        <Icon name="add" size={20} color={theme.colors.surface} />
      </TouchableOpacity>
    </View>
  );

  const renderFeedback = (feedback: any) => {
    const existingResponse =
      feedback.responses &&
      Array.isArray(feedback.responses) &&
      feedback.responses.find((res: any) => res && res.isActive !== false);

    return (
      <View key={feedback.id} style={styles.feedbackCard}>
        <View style={styles.feedbackHeader}>
          <View>
            <Text style={styles.feedbackUser}>
              {feedback.order?.user?.username || "Khách hàng"}
            </Text>
            <Text style={styles.feedbackDate}>
              {feedback.createdAt ? formatDateTime(feedback.createdAt) : ""}
            </Text>
          </View>
          <View style={styles.ratingBadge}>
            <Icon name="star" size={16} color={theme.colors.surface} />
            <Text style={styles.ratingBadgeText}>{feedback.rating}</Text>
          </View>
        </View>
        {feedback.order?.orderDetails?.length ? (
          <Text style={styles.feedbackItems}>
            {feedback.order.orderDetails
              .map(
                (detail: any) =>
                  `${detail.product?.name || "Món"} x${detail.quantity || 0}`
              )
              .join(", ")}
          </Text>
        ) : null}
        <Text style={styles.feedbackContent}>{feedback.content}</Text>
        {feedback.imageUrl ? (
          <Image
            source={{ uri: feedback.imageUrl }}
            style={styles.feedbackImage}
          />
        ) : null}

        {existingResponse ? (
          <View style={styles.feedbackResponseWrapper}>
            <View style={styles.feedbackResponseConnector}>
              <View style={styles.feedbackResponseDot} />
              <View style={styles.feedbackResponseLine} />
            </View>
            <View style={styles.feedbackResponseCard}>
              <View style={styles.feedbackResponseHeader}>
                <Icon
                  name="restaurant"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.feedbackResponseLabel}>
                  Phản hồi từ nhà hàng
                </Text>
                <Text style={styles.feedbackResponseDate}>
                  {existingResponse.createdAt
                    ? formatDateTime(existingResponse.createdAt)
                    : ""}
                </Text>
              </View>
              <Text style={styles.feedbackResponseText}>
                {existingResponse.response || "Nhà hàng đã gửi phản hồi."}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  if (!restaurantId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Không tìm thấy nhà hàng.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri:
            restaurant?.imageUrl ||
            "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=60",
        }}
        style={styles.cover}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.2)", "transparent"]}
          style={styles.coverOverlay}
        />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
      </ImageBackground>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.detailScroll}
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <Text style={styles.restaurantName}>{restaurant?.name}</Text>
            <View style={styles.infoRow}>
              <Icon name="phone" size={18} color={theme.colors.primary} />
              <Text style={styles.infoText}>
                {restaurant?.phone || "Không có"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="schedule" size={18} color={theme.colors.primary} />
              <Text style={styles.infoText}>
                {restaurant?.openTime || "N/A"} -{" "}
                {restaurant?.closeTime || "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="info" size={18} color={theme.colors.primary} />
              <Text style={styles.infoText}>
                {STATUS_MAP[restaurant?.status || 1]?.label || "Hoạt động"}
              </Text>
            </View>
            <View style={styles.ratingRow}>
              <Icon name="star" size={20} color={theme.colors.accent} />
              <Text style={styles.ratingText}>
                {(restaurant?.rating || 0).toFixed(1)}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thực đơn</Text>
            {groupedMenus.length === 0 ? (
              <Text style={styles.emptyText}>
                Nhà hàng chưa cập nhật món ăn.
              </Text>
            ) : (
              groupedMenus.map((group) => (
                <View key={group.key} style={styles.menuGroupCard}>
                  <TouchableOpacity
                    style={styles.menuHeader}
                    onPress={() => toggleMenu(group.key)}
                  >
                    <Text style={styles.menuTitle}>{group.menuName}</Text>
                    <Icon
                      name={
                        expandedMenus[group.key]
                          ? "keyboard-arrow-up"
                          : "keyboard-arrow-down"
                      }
                      size={24}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                  {expandedMenus[group.key] && (
                    <View style={styles.menuProducts}>
                      {group.products.length === 0 ? (
                        <Text style={styles.emptyText}>
                          Chưa có món trong menu này.
                        </Text>
                      ) : (
                        group.products.map(renderProductCard)
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đánh giá từ khách hàng</Text>
            {feedbacks.length === 0 ? (
              <Text style={styles.emptyText}>
                Chưa có đánh giá nào cho nhà hàng này.
              </Text>
            ) : (
              feedbacks.map(renderFeedback)
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  cover: {
    height: 220,
    width: "100%",
  },
  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: "absolute",
    top: theme.spacing.xl,
    left: theme.spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailScroll: {
    flex: 1,
    marginTop: -theme.spacing.xl,
  },
  detailContent: {
    paddingBottom: theme.navbarHeight + theme.spacing.xl,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
    columnGap: theme.spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.mediumGray,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.accent,
    marginLeft: theme.spacing.xs,
  },
  section: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  menuGroupCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
    ...theme.shadows.small,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  menuProducts: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.lightGray,
    marginRight: theme.spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  productPrice: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "bold",
    marginTop: theme.spacing.xs,
  },
  productDesc: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.xs,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  feedbackCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feedbackUser: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  feedbackDate: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.xs,
  },
  feedbackItems: {
    fontSize: 13,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.sm,
  },
  feedbackContent: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  feedbackImage: {
    width: "100%",
    height: 160,
    borderRadius: theme.roundness,
    marginTop: theme.spacing.sm,
  },
  feedbackResponseWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: theme.spacing.sm,
    columnGap: theme.spacing.sm,
  },
  feedbackResponseConnector: {
    alignItems: "center",
    width: 18,
  },
  feedbackResponseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginBottom: 4,
  },
  feedbackResponseLine: {
    width: 2,
    height: 24,
    borderRadius: 1,
    backgroundColor: theme.colors.border,
  },
  feedbackResponseCard: {
    flex: 1,
    backgroundColor: theme.colors.lightOrange,
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
  },
  feedbackResponseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  feedbackResponseLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  feedbackResponseDate: {
    fontSize: 10,
    color: theme.colors.mediumGray,
  },
  feedbackResponseText: {
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 16,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  ratingBadgeText: {
    color: theme.colors.surface,
    marginLeft: theme.spacing.xs,
    fontWeight: "bold",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.mediumGray,
    textAlign: "center",
  },
});

export default RestaurantDetailScreen;
