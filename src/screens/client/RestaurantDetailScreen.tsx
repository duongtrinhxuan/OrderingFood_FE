import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../theme/theme";

const mockMenuItems = [
  {
    id: "m1",
    name: "Pizza Margherita",
    price: 250000,
    image: "https://via.placeholder.com/200x150",
  },
  {
    id: "m2",
    name: "Pizza Pepperoni",
    price: 280000,
    image: "https://via.placeholder.com/200x150",
  },
  {
    id: "m3",
    name: "Coca Cola",
    price: 15000,
    image: "https://via.placeholder.com/200x150",
  },
  {
    id: "m4",
    name: "French Fries",
    price: 30000,
    image: "https://via.placeholder.com/200x150",
  },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price
  );

const RestaurantDetailScreen = ({ route }: any) => {
  const { restaurant } = route.params || {};
  const reviewsCount = restaurant?.reviewsCount ?? 128;

  const renderMenuItem = ({ item }: { item: any }) => (
    <View style={styles.menuItem}>
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.menuImage}
        imageStyle={styles.menuImageStyle}
      >
        <LinearGradient
          colors={["#00000040", "#00000010"]}
          style={styles.menuImageOverlay}
        />
      </ImageBackground>
      <View style={styles.menuInfo}>
        <Text style={styles.menuName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.menuPrice}>{formatPrice(item.price)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: restaurant?.image }}
        style={styles.cover}
        imageStyle={styles.coverImage}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.2)", "transparent"]}
          style={styles.coverOverlay}
        />
      </ImageBackground>

      <View style={styles.headerCard}>
        <Text style={styles.restaurantName}>{restaurant?.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="star" size={18} color={theme.colors.accent} />
            <Text style={styles.metaText}>
              {restaurant?.rating} ({reviewsCount} đánh giá)
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="place" size={18} color={theme.colors.mediumGray} />
            <Text style={styles.metaText}>{restaurant?.distance}</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Thực đơn</Text>
        <FlatList
          data={mockMenuItems}
          keyExtractor={(it) => it.id}
          renderItem={renderMenuItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.menuList}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  cover: {
    height: 200,
  },
  coverImage: {
    width: "100%",
  },
  coverOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginTop: -theme.spacing.lg,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: theme.spacing.lg,
  },
  metaText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.mediumGray,
    fontSize: 14,
  },
  menuSection: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  menuList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  menuItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
    ...theme.shadows.small,
  },
  menuImage: {
    height: 140,
    width: "100%",
  },
  menuImageStyle: {
    width: "100%",
  },
  menuImageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  menuInfo: {
    padding: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuName: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.md,
    fontWeight: "500",
  },
  menuPrice: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
});

export default RestaurantDetailScreen;
