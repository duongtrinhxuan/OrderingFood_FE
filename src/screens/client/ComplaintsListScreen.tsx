import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { theme } from "../../theme/theme";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import CreateComplaintModal from "../../components/CreateComplaintModal";

export type ClientStackParamList = {
  ComplaintsList: undefined;
  [key: string]: any;
};

type ComplaintsListScreenNavigationProp = StackNavigationProp<
  ClientStackParamList,
  "ComplaintsList"
>;

interface ComplaintReport {
  id: number;
  content: string;
  isRead: boolean;
  isDraft: boolean;
  isActive: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

const ComplaintsListScreen = () => {
  const navigation = useNavigation<ComplaintsListScreenNavigationProp>();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingComplaint, setEditingComplaint] =
    useState<ComplaintReport | null>(null);

  const fetchComplaints = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      setLoading(true);
      const data = await api.getComplaintReportsByUser(user.id);
      if (Array.isArray(data)) {
        setComplaints(data as ComplaintReport[]);
      } else {
        setComplaints([]);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách khiếu nại.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchComplaints().finally(() => setRefreshing(false));
  }, [fetchComplaints]);

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [fetchComplaints])
  );

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setEditingComplaint(null);
    fetchComplaints();
  };

  const handleComplaintPress = (item: ComplaintReport) => {
    // Chỉ cho phép chỉnh sửa nếu isDraft = true
    if (item.isDraft) {
      setEditingComplaint(item);
    }
  };

  const renderComplaintItem = ({ item }: { item: ComplaintReport }) => {
    const isDraft = item.isDraft;
    return (
      <TouchableOpacity
        style={[styles.complaintCard, isDraft && styles.complaintCardDraft]}
        onPress={() => handleComplaintPress(item)}
        activeOpacity={isDraft ? 0.7 : 1}
        disabled={!isDraft}
      >
        <View style={styles.complaintHeader}>
          <View style={styles.complaintIdContainer}>
            <Text style={styles.complaintIdLabel}>Mã:</Text>
            <Text style={styles.complaintIdValue}>#{item.id}</Text>
          </View>
          {item.isDraft && (
            <View style={styles.draftBadge}>
              <Text style={styles.draftBadgeText}>Bản nháp</Text>
            </View>
          )}
          {!item.isRead && !item.isDraft && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>Chưa đọc</Text>
            </View>
          )}
        </View>
        <Text style={styles.complaintContent} numberOfLines={3}>
          {item.content}
        </Text>
        <View style={styles.complaintFooter}>
          <Text style={styles.complaintDate}>
            {new Date(item.createdAt).toLocaleString("vi-VN")}
          </Text>
          {isDraft && (
            <View style={styles.editHint}>
              <Icon name="edit" size={14} color={theme.colors.primary} />
              <Text style={styles.editHintText}>Chạm để chỉnh sửa</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trợ giúp & Hỗ trợ</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={complaints}
          renderItem={renderComplaintItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={64} color={theme.colors.mediumGray} />
              <Text style={styles.emptyText}>Chưa có khiếu nại nào</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Icon name="add" size={28} color={theme.colors.surface} />
      </TouchableOpacity>

      {/* Create Complaint Modal */}
      {user && (
        <CreateComplaintModal
          visible={showCreateModal || editingComplaint !== null}
          onClose={() => {
            setShowCreateModal(false);
            setEditingComplaint(null);
          }}
          onSuccess={handleCreateSuccess}
          userId={user.id}
          complaint={editingComplaint}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.primary,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.surface,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  complaintCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  complaintCardDraft: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: "dashed",
  },
  complaintHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  complaintIdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  complaintIdLabel: {
    fontSize: 14,
    color: theme.colors.mediumGray,
    marginRight: theme.spacing.xs,
  },
  complaintIdValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  draftBadge: {
    backgroundColor: theme.colors.warning || "#FFA726",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  draftBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.surface,
  },
  unreadBadge: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.surface,
  },
  complaintContent: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  complaintFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.xs,
  },
  complaintDate: {
    fontSize: 12,
    color: theme.colors.mediumGray,
  },
  editHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  editHintText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.md,
  },
  fab: {
    position: "absolute",
    bottom: theme.spacing.xl,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.medium,
  },
});

export default ComplaintsListScreen;
