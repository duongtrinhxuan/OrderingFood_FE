import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar, StyleSheet } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import AuthScreen from "./src/screens/AuthScreen";
import ClientNavigator from "./src/navigation/ClientNavigator";
import RestaurantTabNavigator from "./src/navigation/RestaurantTabNavigator";
import { theme } from "./src/theme/theme";
import { AuthContext, AuthUser, UserRole } from "./src/context/AuthContext";

const Stack = createStackNavigator();

const App = () => {
  const [user, setUser] = React.useState<AuthUser | null>(null);

  const isAuthenticated = Boolean(user);
  const userRole: UserRole =
    user?.roleId === 2 ? "restaurant" : ("client" as UserRole);

  const handleLogout = () => setUser(null);

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
                  <Stack.Screen
                    name="Restaurant"
                    component={RestaurantTabNavigator}
                  />
                )}
              </Stack.Navigator>
            </NavigationContainer>
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
