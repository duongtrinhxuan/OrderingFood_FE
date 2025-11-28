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
    return `http://${host}:5000`;
  }

  // Fallback: thử detect IP từ network interface hoặc dùng localhost
  return "http://localhost:5000";
};

const API_BASE_URL = resolveApiBaseUrl();

// Export API_BASE_URL để các file khác có thể sử dụng
export { API_BASE_URL };

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

  // Nếu response status là 204 (No Content), không có body để parse
  if (response.status === 204) {
    return undefined as T;
  }

  // Kiểm tra xem response có content không
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const text = await response.text();
    if (text && text.trim().length > 0) {
      return JSON.parse(text);
    }
  }

  return undefined as T;
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
  updateMenu(
    menuId: number,
    payload: {
      name?: string;
      isActive?: boolean;
    }
  ) {
    return request(`/menus/${menuId}`, "PATCH", payload);
  },
  deleteMenu(menuId: number) {
    return request(`/menus/${menuId}`, "DELETE");
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
  // Discount APIs
  getDiscounts() {
    return request("/discounts", "GET");
  },
  getOrdersByUser(userId: number, status?: number) {
    const query = status ? `?status=${status}` : "";
    return request(`/orders/user/${userId}/orders${query}`, "GET");
  },
  getOrderById(orderId: number) {
    return request(`/orders/${orderId}`, "GET");
  },
  getOrdersByRestaurant(restaurantId: number, status?: number) {
    const query = status ? `?status=${status}` : "";
    return request(`/orders/restaurant/${restaurantId}/orders${query}`, "GET");
  },
  updateOrder(
    orderId: number,
    payload: {
      status?: number;
      note?: string;
    }
  ) {
    return request(`/orders/${orderId}`, "PATCH", payload);
  },
  getNotificationsByReceiver(userId: number) {
    return request(`/notifications/receiver/${userId}`, "GET");
  },
  markNotificationAsRead(notificationId: number) {
    return request(`/notifications/${notificationId}/read`, "PATCH", {});
  },
  getRestaurantRevenueSummary(restaurantId: number, period: string) {
    const params = new URLSearchParams();
    if (period) {
      params.append("period", period);
    }
    const query = params.toString();
    return request(
      `/revenue-reports/restaurant/${restaurantId}/summary${
        query ? `?${query}` : ""
      }`,
      "GET"
    );
  },
  getRestaurantDashboardSummary(restaurantId: number) {
    return request(
      `/restaurant-dashboard/restaurant/${restaurantId}/summary`,
      "GET"
    );
  },
  // Feedback APIs
  getFeedbackByOrder(orderId: number) {
    return request(`/feedbacks/order/${orderId}`, "GET");
  },
  getFeedbacksByRestaurant(restaurantId: number, rating?: number) {
    const query = rating ? `?rating=${rating}` : "";
    return request(`/feedbacks/restaurant/${restaurantId}${query}`, "GET");
  },
  createFeedback(payload: {
    orderId: number;
    rating: number;
    content: string;
    imageUrl?: string;
  }) {
    return request("/feedbacks", "POST", payload);
  },
  updateFeedback(
    feedbackId: number,
    payload: {
      rating?: number;
      content?: string;
      imageUrl?: string;
    }
  ) {
    return request(`/feedbacks/${feedbackId}`, "PATCH", payload);
  },
  deleteFeedback(feedbackId: number) {
    return request(`/feedbacks/${feedbackId}`, "DELETE");
  },
  // Response APIs
  createResponse(payload: {
    sentId: number;
    feedbackId: number;
    content?: string;
    imageUrl?: string;
    response?: string;
  }) {
    return request("/responses", "POST", payload);
  },
  updateResponse(
    responseId: number,
    payload: {
      content?: string;
      imageUrl?: string;
      response?: string;
    }
  ) {
    return request(`/responses/${responseId}`, "PATCH", payload);
  },
  deleteResponse(responseId: number) {
    return request(`/responses/${responseId}`, "DELETE");
  },
  // Search APIs
  searchProducts(query?: string, categoryIds?: number[]) {
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (categoryIds && categoryIds.length > 0) {
      params.append("categoryIds", categoryIds.join(","));
    }
    return request(`/products/search?${params.toString()}`, "GET");
  },
  searchRestaurants(query?: string, categoryIds?: number[]) {
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (categoryIds && categoryIds.length > 0) {
      params.append("categoryIds", categoryIds.join(","));
    }
    return request(`/restaurants/search?${params.toString()}`, "GET");
  },
  // Get popular products (top 5)
  getPopularProducts() {
    return request("/products/popular", "GET");
  },
  // Get all products (tạm thời lấy tất cả, có thể thêm pagination sau)
  getAllProducts(page: number = 1, limit: number = 5) {
    return request("/products", "GET");
  },
  // Get all restaurants (tạm thời lấy tất cả, có thể thêm pagination sau)
  getAllRestaurants(page: number = 1, limit: number = 5) {
    return request("/restaurants", "GET");
  },
  // Cart APIs
  getCartByUser(userId: number) {
    return request(`/carts/user/${userId}`, "GET");
  },
  getOrCreateUserCart(userId: number) {
    return request(`/carts/user/${userId}/get-or-create`, "GET");
  },
  // Cart Item APIs
  getCartItemsByCart(cartId: number) {
    return request(`/cart-items/cart/${cartId}`, "GET");
  },
  createCartItem(payload: {
    cartId: number;
    productId: number;
    quantity?: number;
    unitPrice?: number;
  }) {
    return request("/cart-items", "POST", payload);
  },
  updateCartItem(
    cartItemId: number,
    payload: {
      quantity?: number;
      unitPrice?: number;
      isActive?: boolean;
    }
  ) {
    return request(`/cart-items/${cartItemId}`, "PATCH", payload);
  },
  deleteCartItem(cartItemId: number) {
    return request(`/cart-items/${cartItemId}`, "DELETE");
  },
  getCartItemByCartAndProduct(cartId: number, productId: number) {
    return request(`/cart-items/cart/${cartId}/product/${productId}`, "GET");
  },
  // Order APIs
  createOrder(payload: {
    totalPrice: number;
    status: number;
    shippingFee: number;
    note?: string;
    userId: number;
    restaurantId: number;
    addressId: number;
    discountId?: number;
  }) {
    return request("/orders", "POST", payload);
  },
  // Order Detail APIs
  createOrderDetail(payload: {
    quantity: number;
    note?: string;
    productId: number;
    orderId: number;
  }) {
    return request("/order-details", "POST", payload);
  },
  // Payment APIs
  createPayment(payload: {
    paymentMethod: string;
    status: number;
    orderId: number;
  }) {
    return request("/payments", "POST", payload);
  },
};
