import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../theme/theme";

interface FoodCardProps {
  food: {
    id: string;
    name: string;
    price: number;
    image: string;
    restaurant: string;
    rating: number;
  };
  onPress?: () => void;
  onAddToCart?: () => void;
}

const FoodCard: React.FC<FoodCardProps> = ({ food, onPress, onAddToCart }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: food.image }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {food.name}
        </Text>

        <Text style={styles.restaurant} numberOfLines={1}>
          {food.restaurant}
        </Text>

        <View style={styles.ratingContainer}>
          <Icon name="star" size={14} color={theme.colors.accent} />
          <Text style={styles.ratingText}>{food.rating}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(food.price)}</Text>
          <TouchableOpacity style={styles.addButton} onPress={onAddToCart}>
            <Icon name="add" size={20} color={theme.colors.surface} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    marginRight: theme.spacing.md,
    overflow: "hidden",
    ...theme.shadows.medium,
  },
  image: {
    width: "100%",
    height: 120,
  },
  content: {
    padding: theme.spacing.md,
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
    marginBottom: theme.spacing.sm,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  ratingText: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginLeft: theme.spacing.xs,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness / 2,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default FoodCard;
