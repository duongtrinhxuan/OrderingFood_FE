import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { theme } from "../../theme/theme";
import { api, buildImageUrl } from "../../services/api";

interface MenuManagementScreenProps {
  restaurantId: number;
}

type Menu = {
  id: number;
  name: string;
  restaurantID: number;
  isActive: boolean;
};

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  restaurantID: number;
  menuID?: number;
  menu?: Menu;
  categories?: Array<{ id: number; name: string }>;
};

type ProductCategory = {
  id: number;
  name: string;
  isActive: boolean;
};

const MenuManagementScreen: React.FC<MenuManagementScreenProps> = ({
  restaurantId,
}) => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null); // null = "Tất cả"
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showManageMenuModal, setShowManageMenuModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null);
  const [editingMenuName, setEditingMenuName] = useState("");

  // Form states
  const [menuForm, setMenuForm] = useState({ name: "" });
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    available: true,
    menuID: undefined as number | undefined,
    selectedCategories: [] as number[],
  });

  const fetchMenus = useCallback(async () => {
    try {
      const data = await api.getMenusByRestaurant(restaurantId);
      setMenus(data as Menu[]);
    } catch (error: any) {
      console.error("Error fetching menus:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách menu.");
    }
  }, [restaurantId]);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.getProductsByRestaurant(restaurantId);
      setProducts(data as Product[]);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách sản phẩm.");
    }
  }, [restaurantId]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.getProductCategories();
      // Đảm bảo load tất cả categories (kể cả inactive nếu cần)
      setCategories(data as ProductCategory[]);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách danh mục sản phẩm.");
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchMenus(), fetchProducts(), fetchCategories()]);
    setLoading(false);
  }, [fetchMenus, fetchProducts, fetchCategories]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchMenus(), fetchProducts()]);
    setRefreshing(false);
  }, [fetchMenus, fetchProducts]);

  const filteredProducts = selectedMenuId
    ? products.filter((p) => p.menuID === selectedMenuId)
    : products;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Menu handlers
  const handleCreateMenu = async () => {
    if (!menuForm.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên menu.");
      return;
    }

    try {
      await api.createMenu({
        name: menuForm.name,
        restaurantID: restaurantId,
        isActive: true,
      });
      Alert.alert("Thành công", "Menu đã được tạo.");
      setMenuForm({ name: "" });
      setShowMenuModal(false);
      await fetchMenus();
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể tạo menu.");
    }
  };

  const handleStartEditMenu = (menu: Menu) => {
    setEditingMenuId(menu.id);
    setEditingMenuName(menu.name);
  };

  const handleSaveMenuName = async () => {
    if (!editingMenuId) return;
    const trimmedName = editingMenuName.trim();
    if (!trimmedName) {
      Alert.alert("Lỗi", "Vui lòng nhập tên menu.");
      return;
    }
    try {
      await api.updateMenu(editingMenuId, { name: trimmedName });
      setEditingMenuId(null);
      setEditingMenuName("");
      await fetchMenus();
      Alert.alert("Thành công", "Đã cập nhật tên menu.");
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể cập nhật menu.");
    }
  };

  const handleDeactivateMenu = (menu: Menu) => {
    Alert.alert("Ẩn menu", "Bạn có chắc chắn muốn ẩn menu này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xác nhận",
        style: "destructive",
        onPress: async () => {
          try {
            await api.updateMenu(menu.id, { isActive: false });
            await fetchMenus();
            Alert.alert("Thành công", "Menu đã được ẩn.");
          } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể cập nhật menu.");
          }
        },
      },
    ]);
  };

  // Product handlers
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập bị từ chối",
        "Ứng dụng cần quyền truy cập ảnh để upload ảnh sản phẩm."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        aspect: [16, 9],
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setUploadingImage(true);
      const uploadResult = await api.uploadAvatar(result.assets[0].uri);
      // Backend trả về path tương đối, lưu nguyên path này
      setProductForm({ ...productForm, imageUrl: uploadResult.url });
      Alert.alert("Thành công", "Ảnh đã được upload.");
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể upload ảnh.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleCategory = (categoryId: number) => {
    setProductForm((prev) => {
      const isSelected = prev.selectedCategories.includes(categoryId);
      return {
        ...prev,
        selectedCategories: isSelected
          ? prev.selectedCategories.filter((id) => id !== categoryId)
          : [...prev.selectedCategories, categoryId],
      };
    });
  };

  const handleCreateProduct = async () => {
    if (!productForm.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên sản phẩm.");
      return;
    }
    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập giá hợp lệ.");
      return;
    }

    try {
      const product = await api.createProduct({
        name: productForm.name,
        description: productForm.description || undefined,
        price: parseFloat(productForm.price),
        imageUrl: productForm.imageUrl || undefined,
        available: productForm.available,
        restaurantID: restaurantId,
        menuID: productForm.menuID,
        isActive: true,
      });

      // Tạo category-product-maps
      for (const categoryId of productForm.selectedCategories) {
        try {
          await api.createCategoryProductMap({
            productId: (product as any).id,
            categoryId,
          });
        } catch (error) {
          console.error("Error creating category map:", error);
        }
      }

      Alert.alert("Thành công", "Sản phẩm đã được tạo.");
      resetProductForm();
      setShowProductModal(false);
      await fetchProducts();
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể tạo sản phẩm.");
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    if (!productForm.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên sản phẩm.");
      return;
    }
    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập giá hợp lệ.");
      return;
    }

    try {
      await api.updateProduct(editingProduct.id, {
        name: productForm.name,
        description: productForm.description || undefined,
        price: parseFloat(productForm.price),
        imageUrl: productForm.imageUrl || undefined,
        available: productForm.available,
        menuID: productForm.menuID,
      });

      Alert.alert("Thành công", "Sản phẩm đã được cập nhật.");
      resetProductForm();
      setEditingProduct(null);
      setShowProductModal(false);
      await fetchProducts();
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể cập nhật sản phẩm.");
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert("Xóa sản phẩm", "Bạn có chắc chắn muốn xóa sản phẩm này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteProduct(product.id);
            Alert.alert("Thành công", "Sản phẩm đã được xóa.");
            await fetchProducts();
          } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể xóa sản phẩm.");
          }
        },
      },
    ]);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      imageUrl: product.imageUrl || "",
      available: product.available,
      menuID: product.menuID,
      selectedCategories: product.categories?.map((c) => c.id) || [],
    });
    setShowProductModal(true);
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      available: true,
      menuID: undefined,
      selectedCategories: [],
    });
    setEditingProduct(null);
  };

  const renderMenuChip = (menu: Menu | "all" | "add") => {
    if (menu === "all") {
      const isSelected = selectedMenuId === null;
      return (
        <TouchableOpacity
          key="all"
          style={[styles.menuChip, isSelected && styles.selectedMenuChip]}
          onPress={() => setSelectedMenuId(null)}
        >
          <Text
            style={[
              styles.menuChipText,
              isSelected && styles.selectedMenuChipText,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
      );
    }

    if (menu === "add") {
      return (
        <TouchableOpacity
          key="add"
          style={[styles.menuChip, styles.addMenuChip]}
          onPress={() => setShowMenuModal(true)}
        >
          <Icon name="add" size={16} color={theme.colors.primary} />
          <Text style={styles.addMenuChipText}>Thêm mới menu</Text>
        </TouchableOpacity>
      );
    }

    const isSelected = selectedMenuId === menu.id;
    return (
      <TouchableOpacity
        key={menu.id}
        style={[styles.menuChip, isSelected && styles.selectedMenuChip]}
        onPress={() => setSelectedMenuId(menu.id)}
      >
        <Text
          style={[
            styles.menuChipText,
            isSelected && styles.selectedMenuChipText,
          ]}
        >
          {menu.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image
        source={{
          uri:
            buildImageUrl(item.imageUrl) ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?fit=crop&w=800&q=80",
        }}
        style={styles.productImage}
      />
      <View style={styles.productContent}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.name}</Text>
          <View
            style={[
              styles.availabilityBadge,
              {
                backgroundColor: item.available
                  ? theme.colors.success
                  : theme.colors.error,
              },
            ]}
          >
            <Text style={styles.availabilityText}>
              {item.available ? "Có" : "Hết"}
            </Text>
          </View>
        </View>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description || "Không có mô tả"}
        </Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
          {item.menu && (
            <Text style={styles.productMenu}>{item.menu.name}</Text>
          )}
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditProduct(item)}
        >
          <Icon name="edit" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteProduct(item)}
        >
          <Icon name="delete" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý thực đơn</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetProductForm();
            setShowProductModal(true);
          }}
        >
          <Icon name="add" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Menu Filters */}
      <View style={styles.menusContainer}>
        <FlatList
          data={["all", ...menus, "add"]}
          renderItem={({ item }) =>
            renderMenuChip(item as Menu | "all" | "add")
          }
          keyExtractor={(item, index) =>
            typeof item === "string" ? item : `menu-${item.id}`
          }
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.menusScroll}
        />
        <TouchableOpacity
          style={styles.manageMenuButton}
          onPress={() => setShowManageMenuModal(true)}
        >
          <Icon name="settings" size={18} color={theme.colors.primary} />
          <Text style={styles.manageMenuButtonText}>Quản lý menu</Text>
        </TouchableOpacity>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon
              name="restaurant-menu"
              size={64}
              color={theme.colors.mediumGray}
            />
            <Text style={styles.emptyText}>Chưa có sản phẩm</Text>
            <Text style={styles.emptySubtext}>
              Thêm sản phẩm đầu tiên vào thực đơn
            </Text>
          </View>
        }
      />

      {/* Manage Menu Modal */}
      <Modal
        visible={showManageMenuModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowManageMenuModal(false);
          setEditingMenuId(null);
          setEditingMenuName("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.manageMenuModal}>
            <View style={styles.manageMenuHeader}>
              <Text style={styles.modalTitle}>Quản lý menu</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowManageMenuModal(false);
                  setShowMenuModal(true);
                }}
              >
                <Icon name="add" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.manageMenuList}>
              {menus.map((menu) => (
                <View key={menu.id} style={styles.manageMenuItem}>
                  <View style={styles.manageMenuInfo}>
                    <Text style={styles.manageMenuName}>{menu.name}</Text>
                    <Text style={styles.manageMenuStatus}>
                      {menu.isActive ? "Đang hoạt động" : "Đã ẩn"}
                    </Text>
                  </View>
                  <View style={styles.manageMenuActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleStartEditMenu(menu)}
                    >
                      <Icon
                        name="edit"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeactivateMenu(menu)}
                    >
                      <Icon
                        name="delete"
                        size={20}
                        color={theme.colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                  {editingMenuId === menu.id && (
                    <View style={styles.editMenuRow}>
                      <TextInput
                        style={styles.input}
                        value={editingMenuName}
                        onChangeText={setEditingMenuName}
                        placeholder="Nhập tên menu"
                      />
                      <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSaveMenuName}
                      >
                        <Text style={styles.submitButtonText}>Lưu</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.submitButton, { marginTop: theme.spacing.md }]}
              onPress={() => setShowManageMenuModal(false)}
            >
              <Text style={styles.submitButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Menu Modal */}
      <Modal
        visible={showMenuModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMenuModal(false)}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Thêm menu mới</Text>
            <TouchableOpacity onPress={handleCreateMenu}>
              <Text style={styles.saveText}>Lưu</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.menuFormBody}>
            <Text style={styles.label}>Tên menu *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên menu"
              value={menuForm.name}
              onChangeText={(text) => setMenuForm({ name: text })}
            />
            <Text style={styles.menuFormHint}>
              Tên menu giúp bạn nhóm các món ăn theo chủ đề (ví dụ: Món chính,
              Đồ uống, Combo…)
            </Text>
          </View>
        </View>
      </Modal>

      {/* Create/Edit Product Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowProductModal(false);
          resetProductForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowProductModal(false);
                resetProductForm();
              }}
            >
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}
            </Text>
            <TouchableOpacity
              onPress={
                editingProduct ? handleUpdateProduct : handleCreateProduct
              }
            >
              <Text style={styles.saveText}>Lưu</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên sản phẩm *</Text>
              <TextInput
                style={styles.input}
                value={productForm.name}
                onChangeText={(text) =>
                  setProductForm({ ...productForm, name: text })
                }
                placeholder="Nhập tên sản phẩm"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={productForm.description}
                onChangeText={(text) =>
                  setProductForm({ ...productForm, description: text })
                }
                placeholder="Nhập mô tả sản phẩm"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Giá (VND) *</Text>
              <TextInput
                style={styles.input}
                value={productForm.price}
                onChangeText={(text) =>
                  setProductForm({ ...productForm, price: text })
                }
                placeholder="Nhập giá sản phẩm"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ảnh sản phẩm</Text>
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={handlePickImage}
                disabled={uploadingImage}
              >
                {productForm.imageUrl ? (
                  <Image
                    source={{ uri: buildImageUrl(productForm.imageUrl) }}
                    style={styles.previewImage}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    {uploadingImage ? (
                      <ActivityIndicator color={theme.colors.primary} />
                    ) : (
                      <>
                        <Icon
                          name="add-photo-alternate"
                          size={32}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.imagePlaceholderText}>
                          Chọn ảnh sản phẩm
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Menu</Text>
              <View style={styles.menuSelectContainer}>
                {menus.map((menu) => (
                  <TouchableOpacity
                    key={menu.id}
                    style={[
                      styles.menuSelectButton,
                      productForm.menuID === menu.id &&
                        styles.selectedMenuSelectButton,
                    ]}
                    onPress={() =>
                      setProductForm({
                        ...productForm,
                        menuID:
                          productForm.menuID === menu.id ? undefined : menu.id,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.menuSelectButtonText,
                        productForm.menuID === menu.id &&
                          styles.selectedMenuSelectButtonText,
                      ]}
                    >
                      {menu.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Danh mục sản phẩm</Text>
              <View style={styles.categoriesContainer}>
                {categories.map((category) => {
                  const isSelected = productForm.selectedCategories.includes(
                    category.id
                  );
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        isSelected && styles.selectedCategoryChip,
                      ]}
                      onPress={() => handleToggleCategory(category.id)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && styles.selectedCategoryChipText,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={styles.availabilityToggle}
                onPress={() =>
                  setProductForm({
                    ...productForm,
                    available: !productForm.available,
                  })
                }
              >
                <Icon
                  name={
                    productForm.available
                      ? "check-circle"
                      : "radio-button-unchecked"
                  }
                  size={24}
                  color={
                    productForm.available
                      ? theme.colors.success
                      : theme.colors.mediumGray
                  }
                />
                <Text style={styles.availabilityLabel}>Có sẵn</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness / 2,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  menusContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menusScroll: {
    paddingHorizontal: theme.spacing.lg,
  },
  menuChip: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedMenuChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  menuChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.mediumGray,
  },
  selectedMenuChipText: {
    color: theme.colors.surface,
  },
  addMenuChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    borderColor: theme.colors.primary,
  },
  addMenuChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.primary,
  },
  manageMenuButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    alignSelf: "flex-start",
    marginLeft: theme.spacing.lg,
  },
  manageMenuButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  productsList: {
    padding: theme.spacing.lg,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: theme.roundness / 2,
    marginRight: theme.spacing.md,
  },
  productContent: {
    flex: 1,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    flex: 1,
  },
  availabilityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness / 2,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: "bold",
    color: theme.colors.surface,
  },
  productDescription: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.sm,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  productMenu: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    backgroundColor: theme.colors.lightGray,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness / 2,
  },
  productActions: {
    justifyContent: "space-between",
    paddingLeft: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 16,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  manageMenuModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness * 2,
    padding: theme.spacing.lg,
    width: "90%",
    maxHeight: "80%",
  },
  manageMenuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  manageMenuList: {
    maxHeight: "70%",
  },
  manageMenuItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  manageMenuInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  manageMenuName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  manageMenuStatus: {
    fontSize: 12,
    color: theme.colors.mediumGray,
  },
  manageMenuActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  editMenuRow: {
    marginTop: theme.spacing.sm,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness * 2,
    padding: theme.spacing.lg,
    width: "80%",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  menuFormBody: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  menuFormHint: {
    fontSize: 14,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.mediumGray,
  },
  saveText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  modalBody: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness / 2,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  imagePicker: {
    marginTop: theme.spacing.xs,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: theme.roundness,
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: theme.roundness,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  imagePlaceholderText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.mediumGray,
    fontSize: 14,
  },
  menuSelectContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  menuSelectButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedMenuSelectButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  menuSelectButtonText: {
    fontSize: 14,
    color: theme.colors.mediumGray,
  },
  selectedMenuSelectButtonText: {
    color: theme.colors.surface,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  categoryChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedCategoryChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: theme.colors.mediumGray,
  },
  selectedCategoryChipText: {
    color: theme.colors.surface,
  },
  availabilityToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  availabilityLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  submitButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default MenuManagementScreen;
