import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../../theme/theme";
import RestaurantCard from "../../components/RestaurantCard";
import FoodCard from "../../components/FoodCard";
import FilterModal from "../../components/FilterModal";
import { useNavigation, useRoute } from "@react-navigation/native";
import { api } from "../../services/api";
import {
  calculateDistance,
  formatDistance,
  calculateDeliveryTime,
} from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

type SearchType = "all" | "product" | "restaurant";

interface SearchFilters {
  query: string;
  type: "product" | "restaurant" | null;
  categoryIds: number[];
}

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<SearchType>("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    type: null,
    categoryIds: [],
  });

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]); // Lưu tất cả products để filter
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]); // Lưu products đã filter
  const [productsPage, setProductsPage] = useState(1);
  const [productsDisplayLimit, setProductsDisplayLimit] = useState(5); // Số lượng products đang hiển thị
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsHasMore, setProductsHasMore] = useState(true);

  // Restaurants state
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<any[]>([]); // Lưu tất cả restaurants để filter
  const [restaurantsPage, setRestaurantsPage] = useState(1);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [restaurantsHasMore, setRestaurantsHasMore] = useState(true);

  const [userDefaultAddress, setUserDefaultAddress] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const { user } = useAuth();
  const { cartId, refreshCartCount } = useCart();
  const navigation = useNavigation();
  const route = useRoute();

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

  // Initialize from route params
  useEffect(() => {
    if (route.params) {
      const params = route.params as any;
      if (params.query) {
        setSearchQuery(params.query);
        setFilters((prev) => ({ ...prev, query: params.query }));
      }
      if (params.type) {
        setSelectedFilter(params.type === "product" ? "product" : "restaurant");
      }
      if (params.showFilter) {
        setShowFilterModal(true);
      }
      if (params.categoryIds) {
        setFilters((prev) => ({
          ...prev,
          categoryIds: Array.isArray(params.categoryIds)
            ? params.categoryIds
            : [],
        }));
      }
    }
  }, [route.params]);

  // Load products
  const loadProducts = useCallback(
    async (
      page: number,
      reset: boolean = false,
      overrideQuery?: string,
      overrideCategoryIds?: number[]
    ) => {
      console.log("[loadProducts] Function called with:", {
        page,
        reset,
        overrideQuery,
        overrideCategoryIds,
        productsLoading,
      });

      if (productsLoading) {
        console.log("[loadProducts] Already loading, skipping...");
        return;
      }

      try {
        setProductsLoading(true);
        const query = overrideQuery ?? searchQuery;
        const categoryIds = overrideCategoryIds ?? filters.categoryIds;
        console.log(
          "[loadProducts] Starting load - page:",
          page,
          "reset:",
          reset,
          "query:",
          query,
          "categoryIds:",
          categoryIds
        );
        let allProducts: any[] = [];

        // Nếu không có query và không có categoryIds, load tất cả products
        if (!query && categoryIds.length === 0) {
          allProducts = await api.getAllProducts(page, 50);
        } else {
          // Có query hoặc categoryIds, dùng search API
          // Nếu chỉ có categoryIds mà không có query, vẫn gọi searchProducts với query = undefined
          console.log(
            "[loadProducts] Calling searchProducts with query:",
            query || undefined,
            "categoryIds:",
            categoryIds
          );
          allProducts = await api.searchProducts(
            query || undefined,
            categoryIds.length > 0 ? categoryIds : undefined
          );
          console.log(
            "[loadProducts] Received products:",
            allProducts.length,
            "products"
          );
        }

        // Khi reset, lưu tất cả products vào allProducts và filteredProducts
        // useEffect filter sẽ tự động cập nhật products từ allProducts
        if (reset) {
          // Loại bỏ duplicate khi reset
          const uniqueProducts = Array.from(
            new Map(allProducts.map((p) => [p.id, p])).values()
          );
          console.log(
            "[loadProducts] Reset - Setting allProducts:",
            uniqueProducts.length,
            "products"
          );
          console.log(
            "[loadProducts] Sample products:",
            uniqueProducts.slice(0, 3).map((p) => ({ id: p.id, name: p.name }))
          );
          setAllProducts(uniqueProducts);
          setFilteredProducts(uniqueProducts); // Cập nhật filteredProducts khi reset
          // Cập nhật products ngay lập tức để đảm bảo hiển thị
          setProducts(uniqueProducts);
        } else {
          setAllProducts((prev) => {
            // Loại bỏ duplicate khi thêm mới
            const combined = [...prev, ...productsData];
            return Array.from(new Map(combined.map((p) => [p.id, p])).values());
          });
          setProducts((prev) => {
            // Loại bỏ duplicate trong products hiển thị
            const combined = [...prev, ...productsData];
            return Array.from(new Map(combined.map((p) => [p.id, p])).values());
          });
          setProductsHasMore(endIndex < allProducts.length);
        }

        // Nếu reset, set hasMore dựa trên allProducts.length
        if (reset) {
          setProductsHasMore(false); // Khi reset với advanced filters, không có more
        }
      } catch (error: any) {
        console.error("[loadProducts] Error loading products:", error);
        Alert.alert("Lỗi", "Không thể tải danh sách món ăn.");
      } finally {
        setProductsLoading(false);
        console.log(
          "[loadProducts] Finished loading, productsLoading set to false"
        );
      }
    },
    [filters.categoryIds.join(","), searchQuery, productsLoading]
  );

  // Load restaurants
  const loadRestaurants = useCallback(
    async (
      page: number,
      reset: boolean = false,
      overrideQuery?: string,
      overrideCategoryIds?: number[]
    ) => {
      if (restaurantsLoading) return;

      try {
        setRestaurantsLoading(true);
        const query = overrideQuery ?? searchQuery;
        const categoryIds = overrideCategoryIds ?? filters.categoryIds;
        let allRestaurants: any[] = [];

        // Nếu không có query và không có categoryIds, load tất cả restaurants
        if (!query && categoryIds.length === 0) {
          allRestaurants = await api.getAllRestaurants(page, 50);
        } else {
          // Có query hoặc categoryIds, dùng search API
          // Nếu filters.type === "restaurant", truyền restaurantCategoryIds
          // Nếu filters.type === "product" hoặc null, truyền productCategoryIds
          if (filters.type === "restaurant") {
            allRestaurants = await api.searchRestaurants(
              query || undefined,
              undefined, // productCategoryIds
              categoryIds.length > 0 ? categoryIds : undefined // restaurantCategoryIds
            );
          } else {
            allRestaurants = await api.searchRestaurants(
              query || undefined,
              categoryIds.length > 0 ? categoryIds : undefined, // productCategoryIds
              undefined // restaurantCategoryIds
            );
          }
        }

        if (userDefaultAddress) {
          allRestaurants = allRestaurants.map((restaurant) => {
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
        }

        const limit = 5;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const restaurantsData = allRestaurants.slice(startIndex, endIndex);

        if (reset) {
          // Loại bỏ duplicate khi reset
          const uniqueRestaurants = Array.from(
            new Map(allRestaurants.map((r) => [r.id, r])).values()
          );
          setAllRestaurants(uniqueRestaurants);
          setRestaurants(restaurantsData);
        } else {
          setAllRestaurants((prev) => {
            // Loại bỏ duplicate khi thêm mới
            const combined = [...prev, ...restaurantsData];
            return Array.from(new Map(combined.map((r) => [r.id, r])).values());
          });
          setRestaurants((prev) => {
            // Loại bỏ duplicate trong restaurants hiển thị
            const combined = [...prev, ...restaurantsData];
            return Array.from(new Map(combined.map((r) => [r.id, r])).values());
          });
        }

        setRestaurantsHasMore(endIndex < allRestaurants.length);
      } catch (error: any) {
        console.error("Error loading restaurants:", error);
        Alert.alert("Lỗi", "Không thể tải danh sách nhà hàng.");
      } finally {
        setRestaurantsLoading(false);
      }
    },
    [
      filters.categoryIds.join(","),
      searchQuery,
      restaurantsLoading,
      userDefaultAddress?.latitude,
      userDefaultAddress?.longitude,
    ]
  );

  // Filter products and restaurants based on searchQuery (real-time)
  // Chỉ filter khi không có filters từ FilterModal (filters.query === "" và filters.categoryIds.length === 0)
  useEffect(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    const hasAdvancedFilters =
      filters.query !== "" || filters.categoryIds.length > 0;

    console.log(
      "[useEffect filter] searchQuery:",
      searchQuery,
      "hasAdvancedFilters:",
      hasAdvancedFilters,
      "allProducts.length:",
      allProducts.length,
      "filters:",
      filters
    );

    // Nếu có advanced filters, không filter theo searchQuery nữa (đã filter ở backend)
    if (hasAdvancedFilters) {
      // Chỉ cập nhật display limit cho products và restaurants
      const uniqueProducts = Array.from(
        new Map(allProducts.map((p) => [p.id, p])).values()
      );
      const uniqueRestaurants = Array.from(
        new Map(allRestaurants.map((r) => [r.id, r])).values()
      );

      console.log(
        "[useEffect filter] hasAdvancedFilters=true, uniqueProducts:",
        uniqueProducts.length,
        "filters:",
        filters
      );
      console.log(
        "[useEffect filter] Sample products:",
        uniqueProducts.slice(0, 3).map((p) => ({ id: p.id, name: p.name }))
      );

      // Cập nhật filteredProducts và products từ allProducts (đã được filter ở backend)
      setFilteredProducts(uniqueProducts);
      // Hiển thị tất cả products khi có advanced filters (không limit)
      setProducts(uniqueProducts);
      setProductsHasMore(false); // Không có more khi đã load tất cả từ backend

      const restaurantsToShow = uniqueRestaurants.slice(0, 5);
      setRestaurants(restaurantsToShow);
      setRestaurantsHasMore(uniqueRestaurants.length > 5);
      return;
    }

    // Nếu không có advanced filters, filter theo searchQuery (thanh tìm kiếm đơn lẻ)
    // Loại bỏ duplicate dựa trên id trước khi filter
    const uniqueProducts = Array.from(
      new Map(allProducts.map((p) => [p.id, p])).values()
    );
    const uniqueRestaurants = Array.from(
      new Map(allRestaurants.map((r) => [r.id, r])).values()
    );

    if (trimmedQuery === "") {
      // Nếu searchQuery trống, hiển thị lại tất cả dữ liệu đã load
      setFilteredProducts(uniqueProducts);
      if (uniqueProducts.length > 0) {
        const limit = productsDisplayLimit;
        const productsData = uniqueProducts.slice(0, limit);
        setProducts(productsData);
        setProductsHasMore(uniqueProducts.length > limit);
      }
      if (uniqueRestaurants.length > 0) {
        const limit = 5;
        const restaurantsData = uniqueRestaurants.slice(0, limit);
        setRestaurants(restaurantsData);
        setRestaurantsHasMore(uniqueRestaurants.length > limit);
      }
    } else {
      // Filter products theo tên (chứa các chữ cái đúng thứ tự)
      const filtered = uniqueProducts.filter((product) => {
        const productName = (product.name || "").toLowerCase();
        return productName.includes(trimmedQuery);
      });
      setFilteredProducts(filtered);
      const limit = productsDisplayLimit;
      const productsData = filtered.slice(0, limit);
      setProducts(productsData);
      setProductsHasMore(filtered.length > limit);

      // Filter restaurants theo tên (chứa các chữ cái đúng thứ tự)
      const filteredRestaurants = uniqueRestaurants.filter((restaurant) => {
        const restaurantName = (restaurant.name || "").toLowerCase();
        return restaurantName.includes(trimmedQuery);
      });
      const restaurantsData = filteredRestaurants.slice(0, 5);
      setRestaurants(restaurantsData);
      setRestaurantsHasMore(filteredRestaurants.length > 5);
    }
  }, [
    searchQuery,
    allProducts,
    allRestaurants,
    productsDisplayLimit,
    filters.query,
    filters.categoryIds.length,
    filters.type, // Thêm filters.type vào dependencies
  ]);

  // Load data when filters change
  useEffect(() => {
    console.log(
      "[useEffect filters] Triggered with filters:",
      filters,
      "selectedFilter:",
      selectedFilter
    );
    setProductsPage(1);
    setRestaurantsPage(1);
    setProductsDisplayLimit(5); // Reset display limit khi filter thay đổi

    // Nếu filters rỗng (reset), load tất cả
    const isReset =
      !filters.query && filters.categoryIds.length === 0 && !filters.type;

    console.log("[useEffect filters] isReset:", isReset);

    if (isReset) {
      // Reset về trạng thái ban đầu
      if (selectedFilter === "all" || selectedFilter === "product") {
        loadProducts(1, true, "", []);
      }
      if (selectedFilter === "all" || selectedFilter === "restaurant") {
        loadRestaurants(1, true, "", []);
      }
    } else {
      // Có filters từ FilterModal
      // Chỉ load products nếu selectedFilter là "all" hoặc "product", hoặc filters.type là "product"
      const shouldLoadProducts =
        selectedFilter === "all" ||
        selectedFilter === "product" ||
        filters.type === "product";

      console.log(
        "[useEffect filters] shouldLoadProducts:",
        shouldLoadProducts,
        "selectedFilter:",
        selectedFilter,
        "filters.type:",
        filters.type,
        "filters:",
        filters
      );

      if (shouldLoadProducts) {
        console.log(
          "[useEffect filters] Calling loadProducts with filters:",
          filters
        );
        loadProducts(1, true, filters.query, filters.categoryIds);
      }
      // Chỉ load restaurants nếu selectedFilter là "all" hoặc "restaurant", hoặc filters.type là "restaurant"
      if (
        selectedFilter === "all" ||
        selectedFilter === "restaurant" ||
        filters.type === "restaurant"
      ) {
        loadRestaurants(1, true, filters.query, filters.categoryIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.query,
    filters.type,
    filters.categoryIds.join(","),
    selectedFilter,
  ]);

  const handleSearch = () => {
    setSearchQuery((prev) => prev.trim());
  };

  const handleFilterConfirm = (newFilters: SearchFilters) => {
    console.log("[handleFilterConfirm] newFilters:", newFilters);
    // Reset searchQuery về rỗng khi dùng advanced filter
    setSearchQuery("");

    // Điều hướng đến filter đúng dựa trên type
    if (newFilters.type === "product") {
      setSelectedFilter("product");
    } else if (newFilters.type === "restaurant") {
      setSelectedFilter("restaurant");
    } else {
      // Nếu không có type, về "all"
      setSelectedFilter("all");
    }

    // Cập nhật filters để trigger useEffect load data
    // Không gọi loadProducts trực tiếp ở đây, để useEffect filters xử lý
    const updatedFilters = {
      query: newFilters.query ?? "",
      type: newFilters.type,
      categoryIds: newFilters.categoryIds || [],
    };
    console.log("[handleFilterConfirm] Setting filters:", updatedFilters);
    setFilters(updatedFilters);
  };

  const handleLoadMoreProducts = () => {
    if (productsHasMore && !productsLoading) {
      // Nếu có searchQuery, load thêm từ filteredProducts
      if (searchQuery.trim() !== "" || filteredProducts.length > 0) {
        const newLimit = productsDisplayLimit + 5;
        setProductsDisplayLimit(newLimit);
        const productsData = filteredProducts.slice(0, newLimit);
        setProducts(productsData);
        setProductsHasMore(filteredProducts.length > newLimit);
      } else {
        // Nếu không có searchQuery, load thêm từ API
        const nextPage = productsPage + 1;
        setProductsPage(nextPage);
        loadProducts(nextPage, false, filters.query, filters.categoryIds);
      }
    }
  };

  const handleLoadMoreRestaurants = () => {
    if (restaurantsHasMore && !restaurantsLoading) {
      const nextPage = restaurantsPage + 1;
      setRestaurantsPage(nextPage);
      loadRestaurants(nextPage, false, filters.query, filters.categoryIds);
    }
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

  const renderProduct = ({
    item,
    isVertical = false,
  }: {
    item: any;
    isVertical?: boolean;
  }) => {
    const foodData = {
      id: item.id.toString(),
      name: item.name,
      price: item.price,
      image: item.imageUrl || "https://via.placeholder.com/200x150",
      restaurant: item.restaurant?.name || "Nhà hàng",
      rating:
        typeof item.restaurant?.rating === "number"
          ? item.restaurant.rating
          : 0,
    };

    const handlePress = () => {
      const restaurantId = item.restaurantID || item.restaurant?.id;
      if (!restaurantId) {
        Alert.alert("Thông báo", "Không tìm thấy nhà hàng của món ăn này.");
        return;
      }
      navigation.navigate(
        "RestaurantDetail" as never,
        {
          restaurantId,
          focusProductId: item.id,
        } as never
      );
    };

    return (
      <FoodCard
        food={foodData}
        onPress={handlePress}
        onAddToCart={() => handleAddToCart(item)}
        vertical={isVertical} // Dùng layout dọc khi filter "Món ăn", ngang khi filter "Tất cả"
        available={item.available !== false}
      />
    );
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
      image: item.imageUrl || "https://via.placeholder.com/300x200",
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
          navigation.navigate(
            "RestaurantDetail" as never,
            {
              restaurantId: item.id,
            } as never
          )
        }
      />
    );
  };

  const renderFilterChip = (key: SearchType, label: string) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.filterChip,
        selectedFilter === key && styles.selectedFilterChip,
      ]}
      onPress={() => setSelectedFilter(key)}
    >
      <Text
        style={[
          styles.filterText,
          selectedFilter === key && styles.selectedFilterText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
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
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="clear" size={24} color={theme.colors.mediumGray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {renderFilterChip("all", "Tất cả")}
          {renderFilterChip("product", "Món ăn")}
          {renderFilterChip("restaurant", "Nhà hàng")}
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Icon name="tune" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView
        style={styles.resultsContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Products Section */}
        {(selectedFilter === "all" || selectedFilter === "product") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Món ăn</Text>
            {selectedFilter === "all" ? (
              // Hiển thị ngang khi filter là "Tất cả"
              <FlatList
                data={products}
                renderItem={({ item }) =>
                  renderProduct({ item, isVertical: false })
                }
                keyExtractor={(item, index) => `product-${item.id}-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.productList}
                onEndReached={handleLoadMoreProducts}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  productsLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.primary}
                      />
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  !productsLoading ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        Không tìm thấy món ăn
                      </Text>
                    </View>
                  ) : null
                }
              />
            ) : (
              // Hiển thị dọc 2 cột khi filter là "Món ăn"
              <>
                {products.length === 0 && !productsLoading ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Không tìm thấy món ăn</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.productsList}>
                      {products.map((item, index) => (
                        <View
                          key={`product-${item.id}-${index}`}
                          style={styles.productListItem}
                        >
                          {renderProduct({ item, isVertical: true })}
                        </View>
                      ))}
                    </View>
                    {productsLoading && (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.primary}
                        />
                      </View>
                    )}
                    {productsHasMore && !productsLoading && (
                      <TouchableOpacity
                        style={styles.loadMoreButton}
                        onPress={handleLoadMoreProducts}
                      >
                        <Text style={styles.loadMoreText}>Xem thêm</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </>
            )}
          </View>
        )}

        {/* Restaurants Section */}
        {(selectedFilter === "all" || selectedFilter === "restaurant") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nhà hàng</Text>
            <FlatList
              data={restaurants}
              renderItem={renderRestaurant}
              keyExtractor={(item) => `restaurant-${item.id}`}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              onEndReached={handleLoadMoreRestaurants}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                restaurantsLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primary}
                    />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                !restaurantsLoading ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      Không tìm thấy nhà hàng
                    </Text>
                  </View>
                ) : null
              }
            />
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onConfirm={handleFilterConfirm}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchHeader: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
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
  filterChip: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedFilterChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.mediumGray,
  },
  selectedFilterText: {
    color: theme.colors.surface,
  },
  filterIconButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.lightOrange,
    borderRadius: theme.roundness / 2,
    marginLeft: theme.spacing.sm,
  },
  resultsContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.navbarHeight + theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  productItem: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  productsList: {
    paddingHorizontal: 0,
  },
  productListItem: {
    marginHorizontal: theme.spacing.lg, // Giống với RestaurantCard
    marginBottom: theme.spacing.md,
  },
  loadMoreButton: {
    padding: theme.spacing.md,
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    marginTop: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  loadingContainer: {
    padding: theme.spacing.md,
    alignItems: "center",
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.mediumGray,
  },
});

export default SearchScreen;
