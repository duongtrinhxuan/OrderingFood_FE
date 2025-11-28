import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import MainTabNavigator from "./MainTabNavigator";
import RestaurantDetailScreen from "../screens/client/RestaurantDetailScreen";
import CheckoutScreen from "../screens/client/CheckoutScreen";
import OrderDetailScreen from "../screens/client/OrderDetailScreen";

const Stack = createStackNavigator();

const ClientNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
    </Stack.Navigator>
  );
};

export default ClientNavigator;
