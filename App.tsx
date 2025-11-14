import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar, StyleSheet, View } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// Import screens
import AuthScreen from "./src/screens/AuthScreen";
import MainTabNavigator from "./src/navigation/MainTabNavigator";
import ClientNavigator from "./src/navigation/ClientNavigator";
import RestaurantTabNavigator from "./src/navigation/RestaurantTabNavigator";

// Import theme
import { theme } from "./src/theme/theme";
import { AuthContext } from "./src/context/AuthContext";

const Stack = createStackNavigator();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userRole, setUserRole] = React.useState<"client" | "restaurant">(
    "client"
  );

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SafeAreaView style={styles.safeArea}>
          <AuthContext.Provider
            value={{
              isAuthenticated,
              userRole,
              login: (role) => {
                setUserRole(role);
                setIsAuthenticated(true);
              },
              logout: () => {
                setIsAuthenticated(false);
              },
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
                        onLogin={(role: "client" | "restaurant") => {
                          setUserRole(role);
                          setIsAuthenticated(true);
                        }}
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
