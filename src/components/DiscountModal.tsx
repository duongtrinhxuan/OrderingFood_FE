import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../theme/theme";
import { api } from "../services/api";
import { formatDate } from "../utils/helpers";
import { formatPrice } from "../utils/helpers";

interface Discount {
  id: number;
  type?: number;
  percent?: number;
  discountmoney?: number;
  description: string;
  startTime: string;
  endTime: string;
  status: string;
  minOrderValue?: number;
}

interface DiscountModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (discount: Discount | null) => void;
  selectedDiscount: Discount | null;
  subtotal: number;
}

const DiscountModal: React.FC<DiscountModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedDiscount,
  subtotal,
}) => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadDiscounts();
    }
  }, [visible]);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const data = await api.getDiscounts();
      const allDiscounts = data as Discount[];

      console.log("DiscountModal: All discounts from API:", allDiscounts);

      // Filter discounts theo status ACTIVE và thời gian hiện tại
      const now = new Date();
      const validDiscounts = allDiscounts.filter((discount) => {
        // Kiểm tra status phải là "ACTIVE" (chữ hoa)
        if (discount.status !== "ACTIVE") {
          console.log(
            `DiscountModal: Discount ${discount.id} has status ${discount.status}, not ACTIVE`
          );
          return false;
        }

        // Kiểm tra thời gian: startTime <= now <= endTime
        const startTime = discount.startTime
          ? new Date(discount.startTime)
          : null;
        const endTime = discount.endTime ? new Date(discount.endTime) : null;

        if (startTime && now < startTime) {
          console.log(
            `DiscountModal: Discount ${discount.id} hasn't started yet`
          );
          return false;
        }

        if (endTime && now > endTime) {
          console.log(`DiscountModal: Discount ${discount.id} has expired`);
          return false;
        }

        // Kiểm tra minOrderValue theo subtotal hiện tại
        const minOrder = discount.minOrderValue || 0;
        if (subtotal < minOrder) {
          console.log(
            `DiscountModal: Discount ${discount.id} requires minOrder ${minOrder}, subtotal=${subtotal}`
          );
          return false;
        }

        // Nếu không có startTime hoặc endTime, vẫn cho phép (nếu status là ACTIVE)
        console.log(`DiscountModal: Discount ${discount.id} is valid`);
        return true;
      });

      console.log("DiscountModal: Valid discounts:", validDiscounts);
      setDiscounts(validDiscounts);
    } catch (error) {
      console.error("DiscountModal: Error loading discounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (discount: Discount) => {
    if (selectedDiscount?.id === discount.id) {
      onSelect(null);
    } else {
      onSelect(discount);
    }
  };

  const handleConfirm = () => {
    onClose();
  };

  const renderDiscount = ({ item }: { item: Discount }) => {
    const isSelected = selectedDiscount?.id === item.id;
    const discountType = item.type || 1;
    const discountDisplay =
      discountType === 1
        ? `${item.percent || 0}%`
        : discountType === 2
        ? `${formatPrice(item.discountmoney || 0)}`
        : "Miễn phí vận chuyển";

    return (
      <TouchableOpacity
        style={[styles.discountCard, isSelected && styles.selectedDiscountCard]}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.discountContent}>
          <View style={styles.discountHeader}>
            <Text style={styles.discountPercent}>{discountDisplay}</Text>
            {isSelected && (
              <Icon
                name="check-circle"
                size={24}
                color={theme.colors.primary}
              />
            )}
          </View>
          <Text style={styles.discountDescription}>{item.description}</Text>
          <Text style={styles.discountTime}>
            {formatDate(item.startTime)} - {formatDate(item.endTime)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Chọn mã giảm giá</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={discounts}
              renderItem={renderDiscount}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Không có mã giảm giá nào</Text>
                </View>
              }
            />
          )}

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.roundness * 2,
    borderTopRightRadius: theme.roundness * 2,
    maxHeight: "80%",
    paddingBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  discountCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedDiscountCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.lightOrange,
  },
  discountContent: {
    flex: 1,
  },
  discountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  discountPercent: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  discountDescription: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  discountTime: {
    fontSize: 12,
    color: theme.colors.mediumGray,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.mediumGray,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.surface,
  },
});

export default DiscountModal;
