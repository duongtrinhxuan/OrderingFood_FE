import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import SellerProfileScreen from "../screens/restaurant/SellerProfileScreen";
import RestaurantTabNavigator from "./RestaurantTabNavigator";

export type SellerStackParamList = {
  SellerProfile: undefined;
  RestaurantTabs: { restaurantId: number };
};

const Stack = createStackNavigator<SellerStackParamList>();

const SellerNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
      <Stack.Screen name="RestaurantTabs" component={RestaurantTabNavigator} />
    </Stack.Navigator>
  );
};

export default SellerNavigator;
