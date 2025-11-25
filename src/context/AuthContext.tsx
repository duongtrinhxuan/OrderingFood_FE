import React, { createContext, useContext } from "react";

export type UserRole = "client" | "restaurant";

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  roleId: number;
  phone?: string;
  avatar?: string;
  gender?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  userRole: UserRole;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const noop = () => {};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  userRole: "client",
  setUser: noop,
  logout: noop,
});

export const useAuth = () => useContext(AuthContext);
