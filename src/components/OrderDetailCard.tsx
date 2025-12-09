import React from "react";
import { View, Text, StyleSheet, Image, TextInput } from "react-native";
import { theme } from "../theme/theme";
import { formatPrice } from "../utils/helpers";
import { buildImageUrl } from "../services/api";

interface OrderDetailCardProps {
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
  note: string;
  onNoteChange: (note: string) => void;
}

const OrderDetailCard: React.FC<OrderDetailCardProps> = ({
  cartItem,
  note,
  onNoteChange,
}) => {
  const imageUri = buildImageUrl(cartItem.product.imageUrl);

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri:
            imageUri ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?fit=crop&w=400&q=60",
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
        <Text style={styles.quantity}>Số lượng: {cartItem.quantity}</Text>
      </View>

      <View style={styles.noteContainer}>
        <Text style={styles.noteLabel}>Ghi chú:</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Thêm ghi chú cho món này..."
          value={note}
          onChangeText={onNoteChange}
          multiline
          numberOfLines={2}
          placeholderTextColor={theme.colors.placeholder}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: theme.roundness / 2,
    marginBottom: theme.spacing.sm,
  },
  content: {
    marginBottom: theme.spacing.sm,
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
    marginBottom: theme.spacing.xs,
  },
  quantity: {
    fontSize: 14,
    color: theme.colors.text,
  },
  noteContainer: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.xs,
  },
  noteInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness / 2,
    padding: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 60,
    textAlignVertical: "top",
  },
});

export default OrderDetailCard;
