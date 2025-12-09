import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../../theme/theme";
import RestaurantCard from "../../components/RestaurantCard";
import FoodCard from "../../components/FoodCard";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { api, buildImageUrl } from "../../services/api";
import {
  calculateDistance,
  formatDistance,
  calculateDeliveryTime,
  formatDate,
} from "../../utils/helpers";

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  available?: boolean;
  isActive?: boolean;
  restaurantID: number;
  restaurant?: {
    id: number;
    name: string;
    rating?: number;
  };
  categories?: Array<{
    id?: number;
    name?: string;
    categoryId?: number;
    category?: { id: number };
  }>;
}

interface Restaurant {
  id: number;
  name: string;
  imageUrl?: string;
  rating?: number;
  address?: {
    latitude: number;
    longitude: number;
  };
  categories?: Array<{
    id: number;
    category: {
      id: number;
      name: string;
    };
  }>;
  products?: Product[];
}

interface Discount {
  id: number;
  code: string;
  description: string;
  percent: number;
  startTime: string;
  endTime: string;
  status: string;
}

interface ProductCategory {
  id: number;
  name: string;
}

const HomeScreen = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userDefaultAddress, setUserDefaultAddress] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const { user } = useAuth();
  const { cartId, refreshCartCount } = useCart();
  const navigation = useNavigation<any>();

  // Load user default address
  useEffect(() => {
    const loadUserAddress = async () => {
      if (!user?.id) {
        setUserDefaultAddress(null);
        return;
      }

      try {
        const userAddresses = await api.getUserAddresses(user.id);
        const defaultAddress = (userAddresses as any[]).find(
          (ua: any) => ua.address?.isDefault
        );
        if (defaultAddress?.address) {
          const newAddress = {
            latitude: defaultAddress.address.latitude,
            longitude: defaultAddress.address.longitude,
          };
          // Chỉ update nếu giá trị thay đổi
          setUserDefaultAddress((prev) => {
            if (
              prev?.latitude === newAddress.latitude &&
              prev?.longitude === newAddress.longitude
            ) {
              return prev;
            }
            return newAddress;
          });
        } else {
          setUserDefaultAddress(null);
        }
      } catch (error) {
        console.error("Error loading user address:", error);
        setUserDefaultAddress(null);
      }
    };

    loadUserAddress();
  }, [user?.id]);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load discounts (Active status, sorted by startTime)
      const discountsData = await api.getDiscounts();
      const activeDiscounts = (discountsData as Discount[])
        .filter((d) => d.status === "ACTIVE" || d.status === "Active")
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      setDiscounts(activeDiscounts);

      // Load popular products (top 5 có nhiều order nhất)
      const popularProductsData = await api.getPopularProducts();
      setPopularProducts(popularProductsData as Product[]);

      // Load restaurants and calculate distance
      const restaurantsData = await api.getAllRestaurants(1, 10);
      let restaurants = restaurantsData as Restaurant[];

      // Calculate distance if user has default address
      if (userDefaultAddress) {
        restaurants = restaurants.map((restaurant) => {
          if (restaurant.address) {
            const distance = calculateDistance(
              userDefaultAddress.latitude,
              userDefaultAddress.longitude,
              restaurant.address.latitude,
              restaurant.address.longitude
            );
            return { ...restaurant, distance };
          }
          return restaurant;
        });
        // Sort by distance
        restaurants.sort((a: any, b: any) => {
          const distA = a.distance || Infinity;
          const distB = b.distance || Infinity;
          return distA - distB;
        });
      }

      setNearbyRestaurants(restaurants.slice(0, 5));
    } catch (error: any) {
      console.error("Error loading data:", error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [userDefaultAddress]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const handleSearchPress = () => {
    navigation.navigate("Search" as never);
  };

  const renderRestaurant = ({ item }: { item: any }) => {
    const ratingValue =
      typeof item.rating === "number" && !Number.isNaN(item.rating)
        ? item.rating
        : 0;

    // Tính khoảng cách nếu có tọa độ customer và nhà hàng
    let distance = item.distance;
    if (!distance && userDefaultAddress && item.address) {
      distance = calculateDistance(
        userDefaultAddress.latitude,
        userDefaultAddress.longitude,
        item.address.latitude,
        item.address.longitude
      );
    }

    const restaurantData = {
      id: item.id.toString(),
      name: item.name,
      rating: ratingValue,
      deliveryTime: distance
        ? calculateDeliveryTime(distance)
        : "Không xác định",
      deliveryFee: 20000, // Phí ship mặc định 20.000đ
      image:
        buildImageUrl(item.imageUrl) || "https://via.placeholder.com/300x200",
      categories:
        item.categories?.map(
          (c: any) => c.name || c.category?.name || "Nhà hàng"
        ) || [],
      distance: distance ? formatDistance(distance) : "Không xác định",
    };

    return (
      <RestaurantCard
        restaurant={restaurantData}
        onPress={() =>
          navigation.navigate("RestaurantDetail", { restaurantId: item.id })
        }
      />
    );
  };

  const handleAddToCart = async (product: any) => {
    if (!user?.id) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }

    try {
      // Lấy hoặc tạo cart
      let currentCartId = cartId;
      if (!currentCartId) {
        const cart = await api.getOrCreateUserCart(user.id);
        currentCartId = (cart as any).id;
      }

      if (!currentCartId) {
        Alert.alert("Lỗi", "Không thể tạo giỏ hàng. Vui lòng thử lại.");
        return;
      }

      // Lấy restaurantId của product đang thêm
      const productRestaurantId =
        product.restaurantID || product.restaurant?.id;

      if (!productRestaurantId) {
        Alert.alert("Lỗi", "Không thể xác định nhà hàng của sản phẩm.");
        return;
      }

      // Kiểm tra các cart items hiện có trong giỏ hàng
      const existingCartItems = await api.getCartItemsByCart(currentCartId);
      const activeCartItems = (existingCartItems as any[]).filter(
        (item: any) => item.isActive
      );

      // Nếu giỏ hàng đã có items, kiểm tra restaurantId
      if (activeCartItems.length > 0) {
        const firstItemRestaurantId =
          activeCartItems[0].product?.restaurantID ||
          activeCartItems[0].product?.restaurant?.id;

        if (firstItemRestaurantId !== productRestaurantId) {
          Alert.alert(
            "Không hợp lệ",
            "Giỏ hàng đang chứa món ăn từ nhà hàng khác. Vui lòng xóa các món hiện có hoặc đặt hàng riêng."
          );
          return;
        }
      }

      // Kiểm tra xem product đã có trong cart chưa (bao gồm cả isActive = false)
      let existingItem: any = null;
      try {
        existingItem = await api.getCartItemByCartAndProduct(
          currentCartId,
          product.id
        );
      } catch (error) {
        // Không tìm thấy, sẽ tạo mới
      }

      if (existingItem) {
        if (existingItem.isActive) {
          // Nếu đã active, tăng quantity lên 1
          const newQuantity = existingItem.quantity + 1;
          const newUnitPrice = product.price * newQuantity;
          await api.updateCartItem(existingItem.id, {
            quantity: newQuantity,
            unitPrice: newUnitPrice,
          });
        } else {
          // Nếu isActive = false, set lại isActive = true và quantity = 1
          await api.updateCartItem(existingItem.id, {
            quantity: 1,
            unitPrice: product.price,
            isActive: true,
          });
        }
      } else {
        // Tạo cart item mới
        await api.createCartItem({
          cartId: currentCartId,
          productId: product.id,
          quantity: 1,
          unitPrice: product.price,
        });
      }

      await refreshCartCount();
      Alert.alert("Thành công", "Đã thêm vào giỏ hàng");
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      Alert.alert("Lỗi", "Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
    }
  };

  const renderFood = ({ item }: { item: Product }) => {
    const foodData = {
      id: item.id.toString(),
      name: item.name,
      price: item.price,
      image:
        buildImageUrl(item.imageUrl) || "https://via.placeholder.com/200x150",
      restaurant: item.restaurant?.name || "Nhà hàng",
      rating: item.restaurant?.rating || 4.0,
    };

    const handlePress = () => {
      const restaurantId = item.restaurantID || item.restaurant?.id;
      if (!restaurantId) {
        Alert.alert("Thông báo", "Không tìm thấy nhà hàng của món ăn này.");
        return;
      }
      navigation.navigate("RestaurantDetail", {
        restaurantId,
        focusProductId: item.id,
      });
    };

    return (
      <FoodCard
        food={foodData}
        onPress={handlePress}
        onAddToCart={() => handleAddToCart(item)}
        available={item.available !== false}
      />
    );
  };

  const renderDiscount = ({ item }: { item: Discount }) => (
    <View style={styles.discountCard}>
      <View style={styles.discountCardHeader}>
        <View style={styles.discountCodeBadge}>
          <Icon name="local-offer" size={18} color={theme.colors.primary} />
          <Text style={styles.discountCodeText}>{item.code}</Text>
        </View>
        <Text style={styles.discountStatusBadge}>ACTIVE</Text>
      </View>
      <Text style={styles.discountDescription}>
        {item.description || "Không có mô tả"}
      </Text>
      <View style={styles.discountTimeRow}>
        <Icon name="schedule" size={16} color={theme.colors.mediumGray} />
        <Text style={styles.discountTimeLabel}>
          Bắt đầu: {item.startTime ? formatDate(item.startTime) : "Không rõ"}
        </Text>
      </View>
      <View style={styles.discountTimeRow}>
        <Icon name="event" size={16} color={theme.colors.mediumGray} />
        <Text style={styles.discountTimeLabel}>
          Kết thúc: {item.endTime ? formatDate(item.endTime) : "Không rõ"}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with search icon */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Trang chủ</Text>
          <TouchableOpacity
            style={styles.searchIconButton}
            onPress={handleSearchPress}
          >
            <Icon name="search" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Discounts - hiển thị dọc */}
      {discounts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mã giảm giá</Text>
          </View>
          <FlatList
            data={discounts}
            renderItem={renderDiscount}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.discountList}
          />
        </View>
      )}

      {/* Popular Foods */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Món ăn phổ biến</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Search", { type: "product" })}
          >
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={popularProducts}
          renderItem={renderFood}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.foodList}
        />
      </View>

      {/* Nearby Restaurants */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nhà hàng gần đây</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Search", { type: "restaurant" })
            }
          >
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={nearbyRestaurants}
          renderItem={renderRestaurant}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.navbarHeight + theme.spacing.md,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.surface,
  },
  searchIconButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  discountList: {
    paddingHorizontal: theme.spacing.lg,
  },
  discountCard: {
    width: "100%",
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  discountCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  discountCodeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
  },
  discountCodeText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  discountStatusBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.success,
  },
  discountDescription: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  discountTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  discountTimeLabel: {
    fontSize: 13,
    color: theme.colors.mediumGray,
  },
  foodList: {
    paddingHorizontal: theme.spacing.lg,
  },
});

export default HomeScreen;
