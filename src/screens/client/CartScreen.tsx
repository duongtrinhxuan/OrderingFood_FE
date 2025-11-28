import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { theme } from "../../theme/theme";
import CartItemCard from "../../components/CartItemCard";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { api } from "../../services/api";
import { formatPrice } from "../../utils/helpers";

interface CartItem {
  id: number;
  quantity: number;
  unitPrice: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
    restaurant?: {
      id: number;
      name: string;
    };
  };
}

const SHIPPING_FEE = 20000; // Phí ship mặc định

const CartScreen = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  const { user } = useAuth();
  const { cartId, refreshCartCount } = useCart();
  const navigation = useNavigation();

  // Debug: Log cartId changes
  useEffect(() => {
    console.log("CartScreen: cartId changed to:", cartId);
  }, [cartId]);

  const loadCartItems = useCallback(async () => {
    if (!user?.id) {
      console.log("CartScreen: No user ID");
      setCartItems([]);
      setLoading(false);
      return;
    }

    if (!cartId) {
      console.log("CartScreen: No cartId, trying to get or create cart");
      try {
        const cart = await api.getOrCreateUserCart(user.id);
        const newCartId = (cart as any).id;
        if (!newCartId) {
          console.log("CartScreen: Could not get cart ID");
          setCartItems([]);
          setLoading(false);
          return;
        }
        // Retry with new cartId
        const items = await api.getCartItemsByCart(newCartId);
        console.log("CartScreen: Loaded items:", items);
        const activeItems = (items as any[]).filter(
          (item: any) => item.isActive !== false
        );
        console.log("CartScreen: Active items:", activeItems);
        setCartItems(activeItems);
        setLoading(false);
        return;
      } catch (error: any) {
        console.error("CartScreen: Error getting cart:", error);
        setCartItems([]);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      console.log("CartScreen: Loading cart items for cartId:", cartId);
      const items = await api.getCartItemsByCart(cartId);
      console.log(
        "CartScreen: Raw items from API:",
        JSON.stringify(items, null, 2)
      );

      // Kiểm tra nếu items là array
      if (!Array.isArray(items)) {
        console.log("CartScreen: Items is not an array:", typeof items);
        setCartItems([]);
        setLoading(false);
        return;
      }

      // Đảm bảo chỉ lấy items có isActive = true
      const activeItems = items.filter(
        (item: any) => item.isActive !== false && item.isActive !== null
      );
      console.log(
        "CartScreen: Filtered active items count:",
        activeItems.length
      );
      console.log(
        "CartScreen: Active items:",
        JSON.stringify(activeItems, null, 2)
      );

      // Kiểm tra cấu trúc dữ liệu
      if (activeItems.length > 0) {
        const firstItem = activeItems[0];
        console.log("CartScreen: First item structure:", {
          hasProduct: !!firstItem.product,
          productName: firstItem.product?.name,
          quantity: firstItem.quantity,
          unitPrice: firstItem.unitPrice,
        });
      }

      setCartItems(activeItems);
    } catch (error: any) {
      console.error("CartScreen: Error loading cart items:", error);
      console.error(
        "CartScreen: Error details:",
        error.message || JSON.stringify(error, null, 2)
      );
      // Không hiển thị alert nếu chỉ là giỏ hàng trống
      if (error.message && !error.message.includes("404")) {
        Alert.alert(
          "Lỗi",
          `Không thể tải giỏ hàng: ${error.message || "Vui lòng thử lại"}`
        );
      }
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, cartId]);

  useEffect(() => {
    loadCartItems();
  }, [loadCartItems]);

  // Reload cart items when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Refresh cart count first to get latest cartId
      refreshCartCount().then(() => {
        // Then load cart items
        loadCartItems();
      });
    }, [loadCartItems, refreshCartCount])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCartItems().finally(() => {
      setRefreshing(false);
      refreshCartCount();
    });
  }, [loadCartItems, refreshCartCount]);

  const handleIncrease = async (item: CartItem) => {
    if (updatingItemId !== null) return;

    try {
      setUpdatingItemId(item.id);
      const newQuantity = item.quantity + 1;
      const newUnitPrice = item.product.price * newQuantity;

      await api.updateCartItem(item.id, {
        quantity: newQuantity,
        unitPrice: newUnitPrice,
      });

      await loadCartItems();
      await refreshCartCount();
    } catch (error: any) {
      console.error("Error updating cart item:", error);
      Alert.alert("Lỗi", "Không thể cập nhật số lượng. Vui lòng thử lại.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleDecrease = async (item: CartItem) => {
    if (updatingItemId !== null) return;

    if (item.quantity <= 1) {
      handleRemove(item);
      return;
    }

    try {
      setUpdatingItemId(item.id);
      const newQuantity = item.quantity - 1;
      const newUnitPrice = item.product.price * newQuantity;

      await api.updateCartItem(item.id, {
        quantity: newQuantity,
        unitPrice: newUnitPrice,
      });

      await loadCartItems();
      await refreshCartCount();
    } catch (error: any) {
      console.error("Error updating cart item:", error);
      Alert.alert("Lỗi", "Không thể cập nhật số lượng. Vui lòng thử lại.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = (item: CartItem) => {
    Alert.alert(
      "Xóa món ăn",
      "Bạn có chắc chắn muốn xóa món ăn này khỏi giỏ hàng?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteCartItem(item.id);
              await loadCartItems();
              await refreshCartCount();
            } catch (error: any) {
              console.error("Error removing cart item:", error);
              Alert.alert("Lỗi", "Không thể xóa món ăn. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.unitPrice, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + SHIPPING_FEE;
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Giỏ hàng trống", "Vui lòng thêm món ăn vào giỏ hàng");
      return;
    }
    navigation.navigate("Checkout" as never);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <CartItemCard
      cartItem={item}
      onIncrease={() => handleIncrease(item)}
      onDecrease={() => handleDecrease(item)}
      onRemove={() => handleRemove(item)}
    />
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Giỏ hàng trống</Text>
          <Text style={styles.emptySubtext}>
            Thêm món ăn yêu thích vào giỏ hàng
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.cartList,
              { paddingBottom: 200 + theme.navbarHeight }, // Thêm padding để không bị che bởi summary, button và navbar
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />

          {/* Fixed Bottom Section */}
          <View style={styles.bottomSection}>
            {/* Order Summary */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính</Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(calculateSubtotal())}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí giao hàng</Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(SHIPPING_FEE)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Tổng cộng</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(calculateTotal())}
                </Text>
              </View>
            </View>

            {/* Checkout Button */}
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.checkoutButtonText}>
                  Tiến hành mua hàng
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 16,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  cartList: {
    padding: theme.spacing.lg,
  },
  bottomSection: {
    position: "absolute",
    bottom: theme.navbarHeight,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  summaryContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.mediumGray,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  checkoutButton: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness,
    overflow: "hidden",
    ...theme.shadows.medium,
  },
  gradientButton: {
    paddingVertical: theme.spacing.md + 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.surface,
    letterSpacing: 0.5,
  },
});

export default CartScreen;
