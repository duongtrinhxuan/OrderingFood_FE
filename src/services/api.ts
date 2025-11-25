import Constants from "expo-constants";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

const resolveApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, "");
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:3000`;
  }

  return "http://192.168.1.9:5000";
};

const API_BASE_URL = resolveApiBaseUrl();

async function request<T>(
  path: string,
  method: HttpMethod = "GET",
  body?: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Đã xảy ra lỗi, vui lòng thử lại.");
  }

  return response.json();
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateUserPayload {
  email: string;
  username: string;
  password: string;
  phone?: string;
  gender: string;
  avatar?: string;
  roleId: number;
  isActive?: boolean;
}

export interface CreateCartPayload {
  userId: number;
  status?: string;
  isActive?: boolean;
}

export interface UpdateUserPayload {
  email?: string;
  username?: string;
  password?: string;
  phone?: string;
  gender?: string;
  avatar?: string;
}

export interface CreateAddressPayload {
  label: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CreateRestaurantPayload {
  name: string;
  imageUrl?: string;
  phone?: string;
  openTime?: string;
  closeTime?: string;
  status?: number;
  userId: number;
  addressId: number;
  isActive?: boolean;
}

async function uploadFile(
  uri: string,
  fieldName: string = "file"
): Promise<{ url: string }> {
  const formData = new FormData();

  // Tạo file object từ URI cho React Native
  const filename = uri.split("/").pop() || `avatar-${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  // Trên React Native, FormData cần object với uri, name, type
  formData.append(fieldName, {
    uri,
    name: filename,
    type,
  } as any);

  const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
    method: "POST",
    body: formData,
    // Không set Content-Type header, để browser tự động set với boundary
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Không thể upload ảnh. Vui lòng thử lại.";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  login(payload: LoginPayload) {
    return request("/auth/login", "POST", payload);
  },
  getUserProfile(userId: number) {
    return request(`/auth/user/${userId}`, "GET");
  },
  updateUser(userId: number, payload: UpdateUserPayload) {
    return request(`/users/${userId}`, "PATCH", payload);
  },
  createUser(payload: CreateUserPayload) {
    return request("/users", "POST", payload);
  },
  createCart(payload: CreateCartPayload) {
    return request("/carts", "POST", payload);
  },
  getRestaurantsByOwner(userId: number) {
    return request(`/restaurants/owner/${userId}`, "GET");
  },
  uploadAvatar(uri: string) {
    return uploadFile(uri, "file");
  },
  createAddress(payload: CreateAddressPayload) {
    return request("/addresses", "POST", payload);
  },
  createRestaurant(payload: CreateRestaurantPayload) {
    return request("/restaurants", "POST", payload);
  },
  reverseGeocode(lat: number, lng: number) {
    return request(`/geocoding/reverse?lat=${lat}&lng=${lng}`, "GET");
  },
  // Restaurant APIs
  getRestaurantById(restaurantId: number) {
    return request(`/restaurants/${restaurantId}`, "GET");
  },
  updateRestaurant(
    restaurantId: number,
    payload: {
      name?: string;
      imageUrl?: string;
      phone?: string;
      openTime?: string;
      closeTime?: string;
      status?: number;
    }
  ) {
    return request(`/restaurants/${restaurantId}`, "PATCH", payload);
  },
  // Address APIs
  getAddressById(addressId: number) {
    return request(`/addresses/${addressId}`, "GET");
  },
  updateAddress(
    addressId: number,
    payload: {
      label?: string;
      province?: string;
      district?: string;
      ward?: string;
      street?: string;
      latitude?: number;
      longitude?: number;
      isDefault?: boolean;
    }
  ) {
    return request(`/addresses/${addressId}`, "PATCH", payload);
  },
  // User Address APIs
  getUserAddresses(userId: number) {
    return request(`/user-addresses/user/${userId}`, "GET");
  },
  createUserAddress(payload: {
    userId: number;
    addressId: number;
    isActive?: boolean;
  }) {
    return request("/user-addresses", "POST", payload);
  },
  updateUserAddress(
    userAddressId: number,
    payload: {
      userId?: number;
      addressId?: number;
      isActive?: boolean;
    }
  ) {
    return request(`/user-addresses/${userAddressId}`, "PATCH", payload);
  },
  deleteUserAddress(userAddressId: number) {
    return request(`/user-addresses/${userAddressId}`, "DELETE");
  },
  // Menu APIs
  getMenusByRestaurant(restaurantId: number) {
    return request(`/menus/restaurant/${restaurantId}`, "GET");
  },
  createMenu(payload: {
    name: string;
    restaurantID: number;
    isActive?: boolean;
  }) {
    return request("/menus", "POST", payload);
  },
  // Product APIs
  getProductsByRestaurant(restaurantId: number) {
    return request(`/products/restaurant/${restaurantId}`, "GET");
  },
  createProduct(payload: {
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    available?: boolean;
    restaurantID: number;
    menuID?: number;
    isActive?: boolean;
  }) {
    return request("/products", "POST", payload);
  },
  updateProduct(
    productId: number,
    payload: {
      name?: string;
      description?: string;
      price?: number;
      imageUrl?: string;
      available?: boolean;
      menuID?: number;
    }
  ) {
    return request(`/products/${productId}`, "PATCH", payload);
  },
  deleteProduct(productId: number) {
    return request(`/products/${productId}`, "DELETE");
  },
  // Product Category APIs
  getProductCategories() {
    return request("/product-categories", "GET");
  },
  // Category Product Map APIs
  createCategoryProductMap(payload: { productId: number; categoryId: number }) {
    return request("/category-product-maps", "POST", payload);
  },
  deleteCategoryProductMap(mapId: number) {
    return request(`/category-product-maps/${mapId}`, "DELETE");
  },
  // Restaurant Category APIs
  getRestaurantCategories() {
    return request("/restaurant-categories", "GET");
  },
  // Category Restaurant Map APIs
  getCategoryRestaurantMapsByRestaurant(restaurantId: number) {
    return request(
      `/category-restaurant-maps/restaurant/${restaurantId}`,
      "GET"
    );
  },
  createCategoryRestaurantMap(payload: {
    restaurantId: number;
    categoryId: number;
    isActive?: boolean;
  }) {
    return request("/category-restaurant-maps", "POST", payload);
  },
  updateCategoryRestaurantMapIsActive(
    restaurantId: number,
    categoryId: number,
    isActive: boolean
  ) {
    return request(
      `/category-restaurant-maps/restaurant/${restaurantId}/category/${categoryId}`,
      "PATCH",
      { isActive }
    );
  },
};
