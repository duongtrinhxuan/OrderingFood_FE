import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar, StyleSheet, ActivityIndicator, View } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import AuthScreen from "./src/screens/AuthScreen";
import ClientNavigator from "./src/navigation/ClientNavigator";
import SellerNavigator from "./src/navigation/SellerNavigator";
import { theme } from "./src/theme/theme";
import { AuthContext, AuthUser, UserRole } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import { tokenStorage } from "./src/services/api";
import { api } from "./src/services/api";

const Stack = createStackNavigator();

const App = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(user);
  const userRole: UserRole =
    user?.roleId === 2 ? "restaurant" : ("client" as UserRole);

  // Auto-login từ token khi app khởi động
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await tokenStorage.getToken();
        if (token) {
          // Nếu có token, thử lấy thông tin user từ token
          // Giả sử token chứa userId trong payload, ta cần decode hoặc gọi API
          // Tạm thời, ta sẽ lưu userId trong token hoặc gọi API để verify
          // Vì JWT payload không thể decode dễ dàng trong React Native, ta sẽ cần một endpoint để verify token
          // Hoặc ta có thể lưu user info vào AsyncStorage khi login
          // Để đơn giản, ta sẽ lưu user info vào AsyncStorage khi login
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await tokenStorage.removeToken();
    setUser(null);
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View
          style={[
            styles.safeArea,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SafeAreaView style={styles.safeArea}>
          <AuthContext.Provider
            value={{
              user,
              isAuthenticated,
              userRole,
              setUser,
              logout: handleLogout,
            }}
          >
            <CartProvider>
              <NavigationContainer>
                <StatusBar
                  barStyle="dark-content"
                  backgroundColor={theme.colors.primary}
                />
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  {!isAuthenticated ? (
                    <Stack.Screen name="Auth">
                      {(props) => (
                        <AuthScreen
                          {...props}
                          onLogin={(authUser: AuthUser) => setUser(authUser)}
                        />
                      )}
                    </Stack.Screen>
                  ) : userRole === "client" ? (
                    <Stack.Screen name="Main" component={ClientNavigator} />
                  ) : (
                    <Stack.Screen name="Seller" component={SellerNavigator} />
                  )}
                </Stack.Navigator>
              </NavigationContainer>
            </CartProvider>
          </AuthContext.Provider>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background, // Màu nền của ứng dụng
  },
});

export default App;
