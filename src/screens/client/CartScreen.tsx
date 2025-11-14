import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme/theme";

// Mock cart data
const mockCartItems = [
  {
    id: "1",
    name: "Pizza Margherita",
    price: 250000,
    quantity: 2,
    image: "https://via.placeholder.com/100x100",
    restaurant: "Pizza Hut",
  },
  {
    id: "2",
    name: "Chicken Burger",
    price: 89000,
    quantity: 1,
    image: "https://via.placeholder.com/100x100",
    restaurant: "KFC",
  },
  {
    id: "3",
    name: "Big Mac",
    price: 75000,
    quantity: 3,
    image: "https://via.placeholder.com/100x100",
    restaurant: "McDonald's",
  },
];

const CartScreen = () => {
  const [cartItems, setCartItems] = useState(mockCartItems);
  const [deliveryAddress, setDeliveryAddress] = useState(
    "123 Đường ABC, Quận 1, TP.HCM"
  );
  const [note, setNote] = useState("");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    setCartItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    Alert.alert(
      "Xóa món ăn",
      "Bạn có chắc chắn muốn xóa món ăn này khỏi giỏ hàng?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () =>
            setCartItems((items) => items.filter((item) => item.id !== id)),
        },
      ]
    );
  };

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const calculateDeliveryFee = () => {
    return 15000; // Fixed delivery fee
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee();
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Giỏ hàng trống", "Vui lòng thêm món ăn vào giỏ hàng");
      return;
    }
    Alert.alert("Đặt hàng", "Chuyển đến trang thanh toán");
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemImageContainer}>
        <Icon name="restaurant" size={40} color={theme.colors.primary} />
      </View>

      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.itemRestaurant}>{item.restaurant}</Text>
        <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
      </View>

      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity - 1)}
        >
          <Icon name="remove" size={20} color={theme.colors.primary} />
        </TouchableOpacity>

        <Text style={styles.quantityText}>{item.quantity}</Text>

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity + 1)}
        >
          <Icon name="add" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeItem(item.id)}
      >
        <Icon name="close" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon
            name="shopping-cart"
            size={64}
            color={theme.colors.mediumGray}
          />
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
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cartList}
          />

          {/* Delivery Address */}
          <View style={styles.addressContainer}>
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
            <View style={styles.addressInputContainer}>
              <Icon name="place" size={20} color={theme.colors.primary} />
              <TextInput
                style={styles.addressInput}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Nhập địa chỉ giao hàng"
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
          </View>

          {/* Note */}
          <View style={styles.noteContainer}>
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Ghi chú cho đơn hàng..."
              placeholderTextColor={theme.colors.placeholder}
              multiline
              numberOfLines={3}
            />
          </View>

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
                {formatPrice(calculateDeliveryFee())}
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
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={styles.gradientButton}
            >
              <Text style={styles.checkoutButtonText}>
                Đặt hàng - {formatPrice(calculateTotal())}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
  cartItem: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: "center",
    ...theme.shadows.small,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    backgroundColor: theme.colors.lightOrange,
    borderRadius: theme.roundness / 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  itemDetails: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  itemRestaurant: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.xs,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: theme.roundness / 2,
    backgroundColor: theme.colors.lightOrange,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginHorizontal: theme.spacing.sm,
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    padding: theme.spacing.sm,
  },
  addressContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  addressInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness / 2,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  addressInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
  },
  noteContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  noteInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness / 2,
    padding: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.text,
    textAlignVertical: "top",
  },
  summaryContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
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
    margin: theme.spacing.lg,
    borderRadius: theme.roundness,
    overflow: "hidden",
    ...theme.shadows.medium,
  },
  gradientButton: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.surface,
  },
});

export default CartScreen;
