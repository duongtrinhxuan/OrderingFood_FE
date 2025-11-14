import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../../theme/theme";
import RestaurantCard from "../../components/RestaurantCard";
import FoodCard from "../../components/FoodCard";
import { useNavigation } from "@react-navigation/native";

// Mock data
const mockSearchResults = [
  {
    id: "1",
    type: "restaurant",
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
    type: "food",
    name: "Pizza Margherita",
    price: 250000,
    image: "https://via.placeholder.com/200x150",
    restaurant: "Pizza Hut",
    rating: 4.5,
  },
  {
    id: "3",
    type: "restaurant",
    name: "KFC",
    rating: 4.3,
    deliveryTime: "20-30 phút",
    deliveryFee: 12000,
    image: "https://via.placeholder.com/300x200",
    categories: ["Fast Food", "Chicken"],
    distance: "1.2 km",
  },
];

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(mockSearchResults);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const navigation = useNavigation<any>();

  const filters = [
    { key: "all", label: "Tất cả" },
    { key: "restaurant", label: "Nhà hàng" },
    { key: "food", label: "Món ăn" },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In real app, call API here
    // For now, filter mock data
    const filtered = mockSearchResults.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === "restaurant") {
      return (
        <RestaurantCard
          restaurant={item}
          onPress={() =>
            navigation.navigate("RestaurantDetail", { restaurant: item })
          }
        />
      );
    } else {
      return <FoodCard food={item} />;
    }
  };

  const renderFilter = (filter: any) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterChip,
        selectedFilter === filter.key && styles.selectedFilterChip,
      ]}
      onPress={() => setSelectedFilter(filter.key)}
    >
      <Text
        style={[
          styles.filterText,
          selectedFilter === filter.key && styles.selectedFilterText,
        ]}
      >
        {filter.label}
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
            onChangeText={handleSearch}
            placeholderTextColor={theme.colors.placeholder}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
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
          {filters.map(renderFilter)}
        </ScrollView>
      </View>

      {/* Results */}
      <FlatList
        data={searchResults}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="search-off" size={64} color={theme.colors.mediumGray} />
            <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
            <Text style={styles.emptySubtext}>
              Thử tìm kiếm với từ khóa khác
            </Text>
          </View>
        }
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
  resultsContainer: {
    paddingVertical: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.sm,
  },
});

export default SearchScreen;
