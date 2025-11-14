import React, { createContext, useContext } from "react";

type UserRole = "client" | "restaurant";

interface AuthContextValue {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (role: UserRole) => void;
  logout: () => void;
}

const noop = () => {};

export const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  userRole: "client",
  login: noop,
  logout: noop,
});

export const useAuth = () => useContext(AuthContext);
