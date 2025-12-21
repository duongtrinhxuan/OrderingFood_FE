import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { api } from "../services/api";

interface CartContextValue {
  cartCount: number;
  refreshCartCount: () => Promise<void>;
  cartId: number | null;
}

const CartContext = createContext<CartContextValue>({
  cartCount: 0,
  refreshCartCount: async () => {},
  cartId: null,
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartCount, setCartCount] = useState(0);
  const [cartId, setCartId] = useState<number | null>(null);
  const { user } = useAuth();

  const refreshCartCount = useCallback(async () => {
    if (!user?.id) {
      setCartCount(0);
      setCartId(null);
      return;
    }

    // Chỉ refresh cart cho customer (roleId = 1)
    const roleId =
      typeof user.roleId === "string" ? parseInt(user.roleId, 10) : user.roleId;
    if (roleId !== 1) {
      setCartCount(0);
      setCartId(null);
      return;
    }

    try {
      const cart = await api.getOrCreateUserCart(user.id);
      if (cart && (cart as any).items) {
        // Chỉ đếm items có isActive = true
        const items = (cart as any).items.filter(
          (item: any) => item.isActive === true
        );
        setCartCount(items.length);
        setCartId((cart as any).id);
      } else {
        setCartCount(0);
        setCartId(null);
      }
    } catch (error) {
      console.error("Error refreshing cart count:", error);
      setCartCount(0);
      setCartId(null);
    }
  }, [user?.id, user?.roleId]);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCartCount, cartId }}>
      {children}
    </CartContext.Provider>
  );
};
