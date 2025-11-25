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
  console.log("API request:", method, API_BASE_URL + path);
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

export const api = {
  login(payload: LoginPayload) {
    return request("/auth/login", "POST", payload);
  },
  createUser(payload: CreateUserPayload) {
    return request("/users", "POST", payload);
  },
  createCart(payload: CreateCartPayload) {
    return request("/carts", "POST", payload);
  },
};
