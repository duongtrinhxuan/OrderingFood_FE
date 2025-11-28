import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../theme/theme";
import { api } from "../services/api";
import { formatDate } from "../utils/helpers";

interface DiscountRecord {
  id: number;
  code: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
}

type DiscountListModalProps = {
  visible: boolean;
  onClose: () => void;
};

const DiscountListModal: React.FC<DiscountListModalProps> = ({
  visible,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [discounts, setDiscounts] = useState<DiscountRecord[]>([]);

  const loadDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await api.getDiscounts()) as DiscountRecord[];
      const activeDiscounts = Array.isArray(data)
        ? data.filter((item) => item.status === "ACTIVE")
        : [];
      setDiscounts(activeDiscounts);
    } catch (error) {
      console.error("DiscountListModal: Failed to load discounts", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadDiscounts();
    }
  }, [visible, loadDiscounts]);

  const renderDiscount = ({ item }: { item: DiscountRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.codeBadge}>
          <Icon name="local-offer" size={18} color={theme.colors.primary} />
          <Text style={styles.codeText}>{item.code}</Text>
        </View>
        <Text style={styles.statusBadge}>ACTIVE</Text>
      </View>
      <Text style={styles.description}>
        {item.description || "Không có mô tả"}
      </Text>
      <View style={styles.timeRow}>
        <Icon name="schedule" size={16} color={theme.colors.mediumGray} />
        <Text style={styles.timeLabel}>
          Bắt đầu: {item.startTime ? formatDate(item.startTime) : "Không rõ"}
        </Text>
      </View>
      <View style={styles.timeRow}>
        <Icon name="event" size={16} color={theme.colors.mediumGray} />
        <Text style={styles.timeLabel}>
          Kết thúc: {item.endTime ? formatDate(item.endTime) : "Không rõ"}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Mã giảm giá khả dụng</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={discounts}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={[
                styles.listContent,
                discounts.length === 0 && styles.emptyListContainer,
              ]}
              renderItem={renderDiscount}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  Hiện chưa có mã giảm giá đang hoạt động.
                </Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.roundness * 2,
    borderTopRightRadius: theme.roundness * 2,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  loadingWrapper: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.mediumGray,
    textAlign: "center",
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  codeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
  },
  codeText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.success,
  },
  description: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  timeLabel: {
    fontSize: 13,
    color: theme.colors.mediumGray,
  },
});

export default DiscountListModal;
