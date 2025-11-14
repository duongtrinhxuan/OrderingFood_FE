import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import MainTabNavigator from "./MainTabNavigator";
import RestaurantDetailScreen from "../screens/client/RestaurantDetailScreen";

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
        options={{ title: "Chi tiết nhà hàng" }}
      />
    </Stack.Navigator>
  );
};

export default ClientNavigator;
