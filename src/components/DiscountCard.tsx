import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../theme/theme";
import { LinearGradient } from "expo-linear-gradient";

interface DiscountCardProps {
  discount: {
    id: number;
    code: string;
    description: string;
    percent: number;
    startTime: string;
    endTime: string;
    status: string;
  };
  onPress?: () => void;
}

const DiscountCard: React.FC<DiscountCardProps> = ({ discount, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.warning]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.percentContainer}>
              <Text style={styles.percentText}>{discount.percent}%</Text>
              <Text style={styles.percentLabel}>GIẢM</Text>
            </View>
            <Icon name="local-offer" size={32} color={theme.colors.surface} />
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {discount.description || `Giảm ${discount.percent}% cho đơn hàng`}
          </Text>

          <View style={styles.timeContainer}>
            <View style={styles.timeItem}>
              <Icon name="schedule" size={14} color={theme.colors.surface} />
              <Text style={styles.timeText}>
                Bắt đầu: {formatDate(discount.startTime)}
              </Text>
            </View>
            <View style={styles.timeItem}>
              <Icon name="event" size={14} color={theme.colors.surface} />
              <Text style={styles.timeText}>
                Kết thúc: {formatDate(discount.endTime)}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness,
    overflow: "hidden",
    ...theme.shadows.medium,
  },
  gradient: {
    padding: theme.spacing.md,
    minWidth: 280,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  percentContainer: {
    alignItems: "flex-start",
  },
  percentText: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.surface,
  },
  percentLabel: {
    fontSize: 12,
    color: theme.colors.surface,
    opacity: 0.9,
    marginTop: -4,
  },
  description: {
    fontSize: 14,
    color: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  timeContainer: {
    gap: theme.spacing.xs,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.surface,
    opacity: 0.9,
  },
});

export default DiscountCard;
