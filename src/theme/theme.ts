import { DefaultTheme } from "react-native-paper";

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#FF6B35", // Orange chủ đạo
    secondary: "#4ECDC4", // Teal
    accent: "#FFE66D", // Yellow accent
    background: "#F8F9FA", // Light gray background
    surface: "#FFFFFF", // White surface
    text: "#2C3E50", // Dark blue-gray text
    placeholder: "#95A5A6", // Gray placeholder
    disabled: "#BDC3C7", // Light gray disabled
    error: "#E74C3C", // Red error
    success: "#27AE60", // Green success
    warning: "#F39C12", // Orange warning
    info: "#3498DB", // Blue info
    // Custom colors
    lightOrange: "#FFE5D9",
    lightTeal: "#E8F8F5",
    lightYellow: "#FFF9E6",
    darkGray: "#34495E",
    mediumGray: "#7F8C8D",
    lightGray: "#ECF0F1",
    border: "#E1E8ED",
    shadow: "rgba(0, 0, 0, 0.1)",
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: "System",
      fontWeight: "400" as const,
    },
    medium: {
      fontFamily: "System",
      fontWeight: "500" as const,
    },
    light: {
      fontFamily: "System",
      fontWeight: "300" as const,
    },
    thin: {
      fontFamily: "System",
      fontWeight: "100" as const,
    },
  },
  roundness: 12,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  navbarHeight: 92, // Chiều cao của bottom tab navigator
  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};
