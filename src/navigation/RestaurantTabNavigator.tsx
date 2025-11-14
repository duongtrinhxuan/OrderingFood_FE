import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '../theme/theme';

// Import screens
import RestaurantDashboardScreen from '../screens/restaurant/DashboardScreen';
import OrdersManagementScreen from '../screens/restaurant/OrdersManagementScreen';
import MenuManagementScreen from '../screens/restaurant/MenuManagementScreen';
import RevenueScreen from '../screens/restaurant/RevenueScreen';
import ReviewsScreen from '../screens/restaurant/ReviewsScreen';

const Tab = createBottomTabNavigator();

const RestaurantTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Orders':
              iconName = 'receipt';
              break;
            case 'Menu':
              iconName = 'restaurant-menu';
              break;
            case 'Revenue':
              iconName = 'trending-up';
              break;
            case 'Reviews':
              iconName = 'star';
              break;
            default:
              iconName = 'dashboard';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mediumGray,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.surface,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      })}>
      <Tab.Screen
        name="Dashboard"
        component={RestaurantDashboardScreen}
        options={{title: 'Tổng quan'}}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersManagementScreen}
        options={{title: 'Đơn hàng'}}
      />
      <Tab.Screen
        name="Menu"
        component={MenuManagementScreen}
        options={{title: 'Thực đơn'}}
      />
      <Tab.Screen
        name="Revenue"
        component={RevenueScreen}
        options={{title: 'Doanh thu'}}
      />
      <Tab.Screen
        name="Reviews"
        component={ReviewsScreen}
        options={{title: 'Đánh giá'}}
      />
    </Tab.Navigator>
  );
};

export default RestaurantTabNavigator;
