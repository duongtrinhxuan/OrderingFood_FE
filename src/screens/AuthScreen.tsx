import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme/theme";
import Icon from "react-native-vector-icons/MaterialIcons";

interface AuthScreenProps {
  onLogin: (role: "client" | "restaurant") => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"client" | "restaurant">(
    "client"
  );

  const handleAuth = () => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }

    // Mock authentication - in real app, call API
    onLogin(selectedRole);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.header}
        >
          <View style={styles.logoContainer}>
            <Icon name="restaurant" size={60} color={theme.colors.surface} />
            <Text style={styles.logoText}>FoodOrder</Text>
            <Text style={styles.logoSubtext}>Đặt món ngon, giao nhanh</Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, isLogin && styles.activeTab]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                Đăng nhập
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin && styles.activeTab]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                Đăng ký
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>Bạn là:</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === "client" && styles.activeRoleButton,
                ]}
                onPress={() => setSelectedRole("client")}
              >
                <Icon
                  name="person"
                  size={24}
                  color={
                    selectedRole === "client"
                      ? theme.colors.surface
                      : theme.colors.primary
                  }
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    selectedRole === "client" && styles.activeRoleButtonText,
                  ]}
                >
                  Khách hàng
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === "restaurant" && styles.activeRoleButton,
                ]}
                onPress={() => setSelectedRole("restaurant")}
              >
                <Icon
                  name="restaurant"
                  size={24}
                  color={
                    selectedRole === "restaurant"
                      ? theme.colors.surface
                      : theme.colors.primary
                  }
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    selectedRole === "restaurant" &&
                      styles.activeRoleButtonText,
                  ]}
                >
                  Nhà hàng
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Icon name="person" size={20} color={theme.colors.mediumGray} />
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                value={name}
                onChangeText={setName}
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color={theme.colors.mediumGray} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme.colors.placeholder}
            />
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color={theme.colors.mediumGray} />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={theme.colors.mediumGray} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={theme.colors.placeholder}
            />
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color={theme.colors.mediumGray} />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
          )}

          <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={styles.gradientButton}
            >
              <Text style={styles.authButtonText}>
                {isLogin ? "Đăng nhập" : "Đăng ký"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.surface,
    marginTop: theme.spacing.sm,
  },
  logoSubtext: {
    fontSize: 16,
    color: theme.colors.surface,
    marginTop: theme.spacing.xs,
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderRadius: theme.roundness,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.mediumGray,
  },
  activeTabText: {
    color: theme.colors.surface,
  },
  roleContainer: {
    marginBottom: theme.spacing.lg,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  roleButtons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.roundness,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  activeRoleButton: {
    backgroundColor: theme.colors.primary,
  },
  roleButtonText: {
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.primary,
  },
  activeRoleButtonText: {
    color: theme.colors.surface,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingLeft: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
  },
  authButton: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.roundness,
    overflow: "hidden",
    ...theme.shadows.medium,
  },
  gradientButton: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.surface,
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: theme.spacing.lg,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: theme.colors.primary,
    textDecorationLine: "underline",
  },
});

export default AuthScreen;
