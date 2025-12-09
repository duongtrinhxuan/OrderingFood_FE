import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";

import { theme } from "../theme/theme";
import { api } from "../services/api";
import { AuthUser } from "../context/AuthContext";

interface AuthScreenProps {
  onLogin: (user: AuthUser) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [selectedRole, setSelectedRole] = useState<"client" | "restaurant">(
    "client"
  );
  const [loading, setLoading] = useState(false);

  const disabled = useMemo(
    () =>
      loading ||
      !email ||
      !password ||
      (!isLogin &&
        (!fullName ||
          !phone ||
          !confirmPassword ||
          password !== confirmPassword)),
    [loading, email, password, isLogin, fullName, phone, confirmPassword]
  );

  const buildAuthUser = (payload: any): AuthUser => ({
    id: payload.id,
    email: payload.email,
    username: payload.username,
    roleId: payload.roleId,
    phone: payload.phone ?? undefined,
    avatar: payload.avatar ?? undefined,
    gender: payload.gender ?? undefined,
  });

  const handleAuth = async () => {
    try {
      if (!email || !password) {
        Alert.alert("Lỗi", "Vui lòng nhập email và mật khẩu.");
        return;
      }

      setLoading(true);

      if (isLogin) {
        const response = await api.login({ email, password });
        // response.user chứa thông tin user, response.accessToken đã được lưu tự động
        onLogin(buildAuthUser(response.user));
        return;
      }

      if (!fullName || !phone) {
        Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin đăng ký.");
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
        return;
      }

      const roleId = selectedRole === "client" ? 1 : 2;
      const createdUser = await api.createUser({
        email,
        username: fullName,
        password,
        phone,
        gender,
        roleId,
        isActive: true,
      });

      if (roleId === 1) {
        await api.createCart({
          userId: createdUser.id,
          status: "ACTIVE",
          isActive: true,
        });
      }

      onLogin(buildAuthUser(createdUser));
    } catch (error: any) {
      Alert.alert(
        "Thao tác thất bại",
        error?.message || "Vui lòng thử lại sau ít phút."
      );
    } finally {
      setLoading(false);
    }
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

          {!isLogin && (
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
          )}

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Icon name="person" size={20} color={theme.colors.mediumGray} />
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                value={fullName}
                onChangeText={setFullName}
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
            <>
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

              <View style={styles.roleContainer}>
                <Text style={styles.roleLabel}>Giới tính</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      gender === "male" && styles.activeRoleButton,
                    ]}
                    onPress={() => setGender("male")}
                  >
                    <Icon
                      name="male"
                      size={24}
                      color={
                        gender === "male"
                          ? theme.colors.surface
                          : theme.colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.roleButtonText,
                        gender === "male" && styles.activeRoleButtonText,
                      ]}
                    >
                      Nam
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      gender === "female" && styles.activeRoleButton,
                    ]}
                    onPress={() => setGender("female")}
                  >
                    <Icon
                      name="female"
                      size={24}
                      color={
                        gender === "female"
                          ? theme.colors.surface
                          : theme.colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.roleButtonText,
                        gender === "female" && styles.activeRoleButtonText,
                      ]}
                    >
                      Nữ
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
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

          <TouchableOpacity
            style={[styles.authButton, disabled && styles.disabledButton]}
            onPress={handleAuth}
            disabled={disabled}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.surface} />
              ) : (
                <Text style={styles.authButtonText}>
                  {isLogin ? "Đăng nhập" : "Đăng ký"}
                </Text>
              )}
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
  disabledButton: {
    opacity: 0.7,
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
