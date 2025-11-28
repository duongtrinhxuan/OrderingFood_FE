import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../theme/theme";
import { useCart } from "../context/CartContext";

// Import screens
import HomeScreen from "../screens/client/HomeScreen";
import SearchScreen from "../screens/client/SearchScreen";
import CartScreen from "../screens/client/CartScreen";
import OrdersScreen from "../screens/client/OrdersScreen";
import ProfileScreen from "../screens/client/ProfileScreen";

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { cartCount } = useCart();

  return (
    <Tab.Navigator
      safeAreaInsets={{ bottom: 8 }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case "Home":
              iconName = "home";
              break;
            case "Search":
              iconName = "search";
              break;
            case "Cart":
              iconName = "shopping-cart";
              break;
            case "Orders":
              iconName = "receipt";
              break;
            case "Profile":
              iconName = "person";
              break;
            default:
              iconName = "home";
          }

          if (route.name === "Cart" && cartCount > 0) {
            return (
              <View>
                <Icon name={iconName} size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </Text>
                </View>
              </View>
            );
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mediumGray,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 28,
          paddingTop: 6,
          height: 92,
        },
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.surface,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Trang chủ" }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: "Tìm kiếm" }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: "Giỏ hàng" }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: "Đơn hàng" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Cá nhân" }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -8,
    top: -4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default MainTabNavigator;
