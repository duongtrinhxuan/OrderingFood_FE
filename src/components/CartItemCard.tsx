import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../theme/theme";
import { formatPrice } from "../utils/helpers";

interface CartItemCardProps {
  cartItem: {
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
  };
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove?: () => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({
  cartItem,
  onIncrease,
  onDecrease,
  onRemove,
}) => {
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri:
            cartItem.product.imageUrl || "https://via.placeholder.com/100x100",
        }}
        style={styles.image}
      />

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {cartItem.product.name}
        </Text>
        <Text style={styles.restaurant} numberOfLines={1}>
          {cartItem.product.restaurant?.name || "Nhà hàng"}
        </Text>
        <Text style={styles.price}>{formatPrice(cartItem.product.price)}</Text>
      </View>

      <View style={styles.quantitySection}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity style={styles.quantityButton} onPress={onDecrease}>
            <Icon name="remove" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <Text style={styles.quantityText}>{cartItem.quantity}</Text>

          <TouchableOpacity style={styles.quantityButton} onPress={onIncrease}>
            <Icon name="add" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.unitPrice}>{formatPrice(cartItem.unitPrice)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: "center",
    ...theme.shadows.small,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: theme.roundness / 2,
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  restaurant: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.xs,
  },
  price: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.primary,
  },
  quantitySection: {
    alignItems: "flex-end",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
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
    minWidth: 24,
    textAlign: "center",
  },
  unitPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
});

export default CartItemCard;
