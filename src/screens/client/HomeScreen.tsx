import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  RefreshControl,
} from "react-native";
// Thay đổi import từ react-native-linear-gradient sang expo-linear-gradient
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../../theme/theme";
import RestaurantCard from "../../components/RestaurantCard";
import FoodCard from "../../components/FoodCard";
import CategoryChip from "../../components/CategoryChip";
import { useNavigation } from "@react-navigation/native";

// Mock data
const mockRestaurants = [
  {
    id: "1",
    name: "Pizza Hut",
    rating: 4.5,
    deliveryTime: "25-35 phút",
    deliveryFee: 15000,
    image: "https://via.placeholder.com/300x200",
    categories: ["Pizza", "Fast Food"],
    distance: "0.8 km",
  },
  {
    id: "2",
    name: "KFC",
    rating: 4.3,
    deliveryTime: "20-30 phút",
    deliveryFee: 12000,
    image: "https://via.placeholder.com/300x200",
    categories: ["Fast Food", "Chicken"],
    distance: "1.2 km",
  },
  {
    id: "3",
    name: "McDonald's",
    rating: 4.2,
    deliveryTime: "15-25 phút",
    deliveryFee: 10000,
    image: "https://via.placeholder.com/300x200",
    categories: ["Fast Food", "Burger"],
    distance: "0.5 km",
  },
];

const mockFoods = [
  {
    id: "1",
    name: "Pizza Margherita",
    price: 250000,
    image: "https://via.placeholder.com/200x150",
    restaurant: "Pizza Hut",
    rating: 4.5,
  },
  {
    id: "2",
    name: "Chicken Burger",
    price: 89000,
    image: "https://via.placeholder.com/200x150",
    restaurant: "KFC",
    rating: 4.3,
  },
  {
    id: "3",
    name: "Big Mac",
    price: 75000,
    image: "https://via.placeholder.com/200x150",
    restaurant: "McDonald's",
    rating: 4.2,
  },
];

const categories = [
  "Tất cả",
  "Pizza",
  "Burger",
  "Chicken",
  "Fast Food",
  "Asian",
  "Dessert",
  "Drinks",
];

const HomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderRestaurant = ({ item }: { item: any }) => (
    <RestaurantCard
      restaurant={item}
      onPress={() =>
        navigation.navigate("RestaurantDetail", { restaurant: item })
      }
    />
  );

  const renderFood = ({ item }: { item: any }) => <FoodCard food={item} />;

  return (
    <ScrollView
      style={styles.container}
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
            placeholderTextColor={theme.colors.placeholder}
          />
          <TouchableOpacity style={styles.filterButton}>
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
          {categories.map((category) => (
            <CategoryChip
              key={category}
              title={category}
              isSelected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Promotions Banner */}
      <View style={styles.promotionContainer}>
        <LinearGradient
          colors={[theme.colors.accent, theme.colors.warning]}
          style={styles.promotionBanner}
        >
          <View style={styles.promotionContent}>
            <View>
              <Text style={styles.promotionTitle}>Giảm 50%</Text>
              <Text style={styles.promotionSubtitle}>Đơn hàng đầu tiên</Text>
            </View>
            <Icon name="local-offer" size={40} color={theme.colors.surface} />
          </View>
        </LinearGradient>
      </View>

      {/* Popular Foods */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Món ăn phổ biến</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={mockFoods}
          renderItem={renderFood}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.foodList}
        />
      </View>

      {/* Nearby Restaurants */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nhà hàng gần đây</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={mockRestaurants}
          renderItem={renderRestaurant}
          keyExtractor={(item) => item.id}
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
  promotionContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  promotionBanner: {
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  promotionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  promotionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.surface,
  },
  promotionSubtitle: {
    fontSize: 16,
    color: theme.colors.surface,
    marginTop: theme.spacing.xs,
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
  foodList: {
    paddingHorizontal: theme.spacing.lg,
  },
});

export default HomeScreen;
