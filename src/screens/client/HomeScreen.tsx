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
import CategoryChip from "../../components/CategoryChip";
import DiscountCard from "../../components/DiscountCard";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { api } from "../../services/api";
import { calculateDistance, formatDistance } from "../../utils/helpers";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
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
      if (!user?.id) return;

      try {
        const userAddresses = await api.getUserAddresses(user.id);
        const defaultAddress = (userAddresses as any[]).find(
          (ua: any) => ua.address?.isDefault
        );
        if (defaultAddress?.address) {
          setUserDefaultAddress({
            latitude: defaultAddress.address.latitude,
            longitude: defaultAddress.address.longitude,
          });
        }
      } catch (error) {
        console.error("Error loading user address:", error);
      }
    };

    loadUserAddress();
  }, [user?.id]);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load categories
      const categoriesData = await api.getProductCategories();
      setCategories(categoriesData as ProductCategory[]);

      // Load discounts (Active status, sorted by startTime, limit 3)
      const discountsData = await api.getDiscounts();
      const activeDiscounts = (discountsData as Discount[])
        .filter((d) => d.status === "Active")
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
        .slice(0, 3);
      setDiscounts(activeDiscounts);

      // Load popular products (top 5 có nhiều order nhất)
      const popularProductsData = await api.getPopularProducts();
      const selectedSet = new Set(selectedCategories);
      const getCategoryId = (category: any) => {
        if (!category) return null;
        if (typeof category === "number") return category;
        return (
          category.id ?? category.categoryId ?? category.category?.id ?? null
        );
      };
      const matchesProductCategories = (product: Product) => {
        if (selectedSet.size === 0) return true;
        if (product.isActive === false || product.available === false) {
          return false;
        }
        if (!product.categories || product.categories.length === 0) {
          return false;
        }
        return product.categories.some((category: any) => {
          const categoryId = getCategoryId(category);
          return categoryId !== null && selectedSet.has(categoryId);
        });
      };

      let popular = popularProductsData as Product[];
      if (selectedSet.size > 0) {
        popular = popular.filter((product) =>
          matchesProductCategories(product)
        );
      }
      setPopularProducts(popular);

      // Load restaurants and calculate distance
      let restaurants: Restaurant[] = [];
      if (selectedSet.size > 0) {
        const filteredRestaurants = await api.searchRestaurants(
          undefined,
          selectedCategories
        );
        restaurants = filteredRestaurants as Restaurant[];
      } else {
        const restaurantsData = await api.getAllRestaurants(1, 10);
        restaurants = restaurantsData as Restaurant[];
      }

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

      if (selectedSet.size > 0) {
        restaurants = restaurants.filter((restaurant: any) =>
          (restaurant.products || []).some((product: any) =>
            matchesProductCategories(product)
          )
        );
      }
      setNearbyRestaurants(restaurants.slice(0, 5));
    } catch (error: any) {
      console.error("Error loading data:", error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [userDefaultAddress, selectedCategories]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate("Search", {
        query: searchQuery.trim(),
        categoryIds: selectedCategories,
      });
    }
  };

  const handleFilterPress = () => {
    navigation.navigate("Search", {
      showFilter: true,
    });
  };

  const handleCategorySelect = (categoryId: number | null) => {
    if (categoryId === null) {
      setSelectedCategories([]);
      return;
    }
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const renderRestaurant = ({ item }: { item: any }) => {
    const ratingValue =
      typeof item.rating === "number" && !Number.isNaN(item.rating)
        ? item.rating
        : 0;
    const restaurantData = {
      id: item.id.toString(),
      name: item.name,
      rating: ratingValue,
      deliveryTime: "25-35 phút",
      deliveryFee: 15000,
      image: item.imageUrl || "https://via.placeholder.com/300x200",
      categories:
        item.categories?.map(
          (c: any) => c.name || c.category?.name || "Nhà hàng"
        ) || [],
      distance: item.distance
        ? formatDistance(item.distance)
        : "Không xác định",
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
      image: item.imageUrl || "https://via.placeholder.com/200x150",
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
      />
    );
  };

  const renderDiscount = ({ item }: { item: Discount }) => (
    <DiscountCard discount={item} />
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
      {/* Header with search */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <View style={styles.searchContainer}>
          <Icon name="search" size={24} color={theme.colors.mediumGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm món ăn, nhà hàng..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholderTextColor={theme.colors.placeholder}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={handleFilterPress}
          >
            <Icon name="tune" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          <CategoryChip
            title="Tất cả"
            isSelected={selectedCategories.length === 0}
            onPress={() => handleCategorySelect(null)}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              title={category.name}
              isSelected={selectedCategories.includes(category.id)}
              onPress={() => handleCategorySelect(category.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Discounts - hiển thị dọc */}
      {discounts.length > 0 && (
        <View style={styles.section}>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.small,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
  },
  filterButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.lightOrange,
    borderRadius: theme.roundness / 2,
  },
  categoriesContainer: {
    paddingVertical: theme.spacing.md,
  },
  categoriesScroll: {
    paddingHorizontal: theme.spacing.lg,
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
    gap: theme.spacing.md,
  },
  foodList: {
    paddingHorizontal: theme.spacing.lg,
  },
});

export default HomeScreen;
