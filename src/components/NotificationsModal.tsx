import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../theme/theme";
import { formatDateTime } from "../utils/helpers";

export interface NotificationRecord {
  id: number;
  content: string;
  type: number;
  isRead: boolean;
  sentId: number;
  receivedId: number;
  orderId?: number;
  createdAt: string;
  sender?: {
    id: number;
    username?: string;
  };
  order?: {
    id: number;
    restaurant?: {
      name?: string;
    };
  };
}

type Props = {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationRecord[];
  loading: boolean;
  onRefresh: () => void;
  onNotificationPress: (notification: NotificationRecord) => void;
};

const NotificationsModal: React.FC<Props> = ({
  visible,
  onClose,
  notifications,
  loading,
  onRefresh,
  onNotificationPress,
}) => {
  const renderItem = ({ item }: { item: NotificationRecord }) => {
    const iconName = item.type === 1 ? "receipt-long" : "notifications";
    const statusBadge = !item.isRead ? styles.badgeUnread : undefined;

    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => onNotificationPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.iconWrapper}>
          <Icon
            name={iconName}
            size={24}
            color={item.isRead ? theme.colors.mediumGray : theme.colors.primary}
          />
          {statusBadge && <View style={statusBadge} />}
        </View>
        <View style={styles.cardContent}>
          <Text
            style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]}
          >
            {item.type === 1 ? "Cập nhật đơn hàng" : "Thông báo"}
          </Text>
          <Text style={styles.cardDescription}>{item.content}</Text>
          <Text style={styles.cardMeta}>
            {`Từ ${item.order?.restaurant?.name || "nhà hàng"} cho đơn #${
              item.orderId || item.order?.id || "?"
            }`}
          </Text>
          <Text style={styles.cardTime}>{formatDateTime(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Thông báo</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon
                name="notifications-none"
                size={48}
                color={theme.colors.mediumGray}
              />
              <Text style={styles.emptyTitle}>Không có thông báo</Text>
              <Text style={styles.emptyDescription}>
                Khi nhà hàng cập nhật đơn hàng của bạn, thông báo sẽ xuất hiện ở
                đây.
              </Text>
              <TouchableOpacity
                onPress={onRefresh}
                style={styles.refreshButton}
              >
                <Text style={styles.refreshText}>Tải lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              onRefresh={onRefresh}
              refreshing={loading}
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xl,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  emptyDescription: {
    textAlign: "center",
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.xs,
  },
  refreshButton: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.primary,
  },
  refreshText: {
    color: theme.colors.surface,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: theme.navbarHeight,
  },
  card: {
    flexDirection: "row",
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  cardUnread: {
    backgroundColor: theme.colors.lightOrange,
    borderColor: theme.colors.secondary,
  },
  cardContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.mediumGray,
    textTransform: "uppercase",
    marginBottom: theme.spacing.xs,
  },
  cardTitleUnread: {
    color: theme.colors.primary,
  },
  cardDescription: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardMeta: {
    fontSize: 13,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.xs,
  },
  cardTime: {
    fontSize: 12,
    color: theme.colors.mediumGray,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badgeUnread: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.error,
  },
});

export default NotificationsModal;
