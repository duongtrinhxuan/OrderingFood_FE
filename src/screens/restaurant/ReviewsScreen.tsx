import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../../theme/theme";
import { api, buildImageUrl } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { formatDateTime } from "../../utils/helpers";
import { useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

type FeedbackResponse = {
  id: number;
  content?: string;
  response?: string;
  createdAt?: string;
  imageUrl?: string;
  isActive?: boolean;
};

type FeedbackOrderItem = {
  id: number;
  quantity: number;
  product?: { id: number; name: string };
};

type FeedbackOrder = {
  id: number;
  user?: { username: string };
  orderDetails?: FeedbackOrderItem[];
};

type Feedback = {
  id: number;
  rating: number;
  content: string;
  imageUrl?: string;
  createdAt?: string;
  responses?: FeedbackResponse[];
  order?: FeedbackOrder;
};

type Summary = {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
};

const ratingFilters = [
  { key: "all", label: "Tất cả" },
  { key: "5", label: "5 sao" },
  { key: "4", label: "4 sao" },
  { key: "3", label: "3 sao" },
  { key: "2", label: "2 sao" },
  { key: "1", label: "1 sao" },
];

const ReviewsScreen = () => {
  const { user } = useAuth();
  const route = useRoute<any>();
  const routeRestaurantId = route?.params?.restaurantId
    ? Number(route.params.restaurantId)
    : null;
  const [restaurantId, setRestaurantId] = useState<number | null>(
    routeRestaurantId ?? null
  );
  const [selectedRating, setSelectedRating] = useState("all");
  const [reviews, setReviews] = useState<Feedback[]>([]);
  const [summary, setSummary] = useState<Summary>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [responseFormVisibleId, setResponseFormVisibleId] = useState<
    number | null
  >(null);
  const [editingResponseId, setEditingResponseId] = useState<number | null>(
    null
  );
  const [responseForm, setResponseForm] = useState({
    content: "",
    response: "",
    imageUrl: "",
  });
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showOverview, setShowOverview] = useState(true);

  useEffect(() => {
    setRestaurantId(routeRestaurantId ?? null);
  }, [routeRestaurantId]);

  const fetchRestaurant = useCallback(async () => {
    if (routeRestaurantId || !user?.id) return;
    try {
      const data = await api.getRestaurantsByOwner(user.id);
      const restaurants = (data as any[]) || [];
      if (restaurants.length > 0) {
        setRestaurantId(restaurants[0].id);
      } else {
        setRestaurantId(null);
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      setRestaurantId(null);
    }
  }, [routeRestaurantId, user?.id]);

  useEffect(() => {
    if (!routeRestaurantId) {
      fetchRestaurant();
    }
  }, [fetchRestaurant, routeRestaurantId]);

  const fetchRestaurantInfo = useCallback(
    async (targetId?: number) => {
      const id = targetId ?? restaurantId;
      if (!id) {
        setRestaurantInfo(null);
        return;
      }
      try {
        const data = await api.getRestaurantById(id);
        setRestaurantInfo(data);
      } catch (error) {
        console.error("Error loading restaurant info:", error);
        setRestaurantInfo(null);
      }
    },
    [restaurantId]
  );

  const resetResponseForm = () => {
    setResponseForm({
      content: "",
      response: "",
      imageUrl: "",
    });
    setEditingResponseId(null);
  };

  const handleToggleResponseForm = (feedback: Feedback, response?: any) => {
    if (responseFormVisibleId === feedback.id && !response) {
      setResponseFormVisibleId(null);
      resetResponseForm();
      return;
    }

    setEditingResponseId(response?.id ?? null);
    setResponseForm({
      content: response?.content || "",
      response: response?.response || "",
      imageUrl: response?.imageUrl || "",
    });
    setResponseFormVisibleId(feedback.id);
  };

  const handlePickResponseImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Thiếu quyền truy cập",
        "Ứng dụng cần quyền truy cập thư viện ảnh."
      );
      return;
    }

    try {
      setUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const uploaded = await api.uploadAvatar(result.assets[0].uri);
      setResponseForm((prev) => ({ ...prev, imageUrl: uploaded.url }));
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể tải ảnh, vui lòng thử lại."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitResponse = async (feedback: Feedback) => {
    if (!responseForm.content.trim() || !responseForm.response.trim()) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ tiêu đề và nội dung."
      );
      return;
    }

    const ownerId = restaurantInfo?.user?.id || user?.id;
    if (!ownerId) {
      Alert.alert("Lỗi", "Không thể xác định người phản hồi.");
      return;
    }

    try {
      setSubmittingResponse(true);
      if (editingResponseId) {
        await api.updateResponse(editingResponseId, {
          content: responseForm.content.trim(),
          response: responseForm.response.trim(),
          imageUrl: responseForm.imageUrl || undefined,
        });
      } else {
        await api.createResponse({
          sentId: ownerId,
          feedbackId: feedback.id,
          content: responseForm.content.trim(),
          response: responseForm.response.trim(),
          imageUrl: responseForm.imageUrl || undefined,
        });
      }
      resetResponseForm();
      setResponseFormVisibleId(null);
      await loadReviews();
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể gửi phản hồi.");
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleDeleteResponse = async (feedback: Feedback, response: any) => {
    if (!response) return;
    Alert.alert("Xác nhận", "Bạn có chắc muốn ẩn phản hồi này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        style: "destructive",
        onPress: async () => {
          try {
            await api.updateResponse(response.id, {
              isActive: false,
            });
            if (responseFormVisibleId === feedback.id) {
              setResponseFormVisibleId(null);
              resetResponseForm();
            }
            await loadReviews();
          } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể xóa phản hồi.");
          }
        },
      },
    ]);
  };

  const loadReviews = useCallback(async () => {
    if (!restaurantId) {
      setReviews([]);
      setSummary({
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (!refreshing) {
        setLoading(true);
      }
      const ratingFilter =
        selectedRating === "all" ? undefined : parseInt(selectedRating, 10);
      const data = await api.getFeedbacksByRestaurant(
        restaurantId,
        ratingFilter
      );
      setReviews((data as any)?.feedbacks || []);
      setSummary(
        (data as any)?.summary || {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        }
      );
      await fetchRestaurantInfo(restaurantId);
    } catch (error) {
      console.error("Error loading feedbacks:", error);
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId, selectedRating, refreshing, fetchRestaurantInfo]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReviews();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Icon
        key={index}
        name={index < rating ? "star" : "star-border"}
        size={16}
        color={theme.colors.accent}
      />
    ));
  };

  const renderRatingFilter = (filter: (typeof ratingFilters)[number]) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterChip,
        selectedRating === filter.key && styles.selectedFilterChip,
      ]}
      onPress={() => setSelectedRating(filter.key)}
    >
      <Text
        style={[
          styles.filterText,
          selectedRating === filter.key && styles.selectedFilterText,
        ]}
      >
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  const getOrderItems = (order?: FeedbackOrder) => {
    if (!order?.orderDetails?.length) return "Không có món ăn";
    return order.orderDetails
      .map(
        (detail) =>
          `${detail.product?.name || "Món ăn"} x${detail.quantity || 0}`
      )
      .join(", ");
  };

  const renderReview = ({ item }: { item: Feedback }) => {
    const activeResponses =
      item.responses?.filter((res) => res && res.isActive !== false) || [];
    const formExpanded = responseFormVisibleId === item.id;
    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.customerInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.order?.user?.username?.[0] || "U"}
              </Text>
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>
                {item.order?.user?.username || "Khách hàng"}
              </Text>
              <Text style={styles.reviewDate}>
                {item.createdAt ? formatDateTime(item.createdAt) : ""}
              </Text>
            </View>
          </View>
          <View style={styles.ratingContainer}>{renderStars(item.rating)}</View>
        </View>

        <Text style={styles.orderItems}>{getOrderItems(item.order)}</Text>
        <Text style={styles.comment}>{item.content}</Text>
        {item.imageUrl ? (
          <Image
            source={{ uri: buildImageUrl(item.imageUrl) || undefined }}
            style={styles.feedbackImage}
          />
        ) : null}

        {activeResponses.map((resp, idx) => (
          <View
            style={styles.responseWrapper}
            key={`resp-${item.id}-${resp.id}-${idx}`}
          >
            <View style={styles.responseConnector}>
              <View style={styles.responseConnectorDot} />
              <View style={styles.responseConnectorLine} />
              <Icon
                name="subdirectory-arrow-right"
                size={20}
                color={theme.colors.mediumGray}
                style={styles.responseConnectorArrow}
              />
            </View>
            <View style={styles.responseContainer}>
              <View style={styles.responseHeader}>
                <Icon
                  name="restaurant"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.responseLabel}>Phản hồi từ nhà hàng</Text>
                <Text style={styles.responseDate}>
                  {resp.createdAt ? formatDateTime(resp.createdAt) : ""}
                </Text>
              </View>
              {resp.imageUrl ? (
                <Image
                  source={{
                    uri: buildImageUrl(resp.imageUrl) || undefined,
                  }}
                  style={styles.responseImage}
                />
              ) : null}
              {resp.content ? (
                <Text style={styles.responseTitle}>{resp.content}</Text>
              ) : null}
              <Text style={styles.responseText}>
                {resp.response || "Nhà hàng đã phản hồi."}
              </Text>
              <View style={styles.responseActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleToggleResponseForm(item, resp)}
                >
                  <Icon name="edit" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDeleteResponse(item, resp)}
                >
                  <Icon name="delete" size={18} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.reviewActions}>
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => {
              resetResponseForm();
              handleToggleResponseForm(item);
            }}
          >
            <Icon name="reply" size={16} color={theme.colors.primary} />
            <Text style={styles.replyText}>Thêm phản hồi</Text>
            <Icon
              name={formExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={18}
              color={theme.colors.primary}
              style={styles.replyArrow}
            />
          </TouchableOpacity>
        </View>

        {formExpanded && (
          <View style={styles.responseForm}>
            <Text style={styles.formLabel}>Tiêu đề</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Nhập tiêu đề"
              value={responseForm.content}
              onChangeText={(text) =>
                setResponseForm((prev) => ({ ...prev, content: text }))
              }
            />
            <Text style={styles.formLabel}>Nội dung phản hồi</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea]}
              placeholder="Nhập nội dung phản hồi"
              value={responseForm.response}
              onChangeText={(text) =>
                setResponseForm((prev) => ({ ...prev, response: text }))
              }
              multiline
            />
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={handlePickResponseImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <>
                  <Icon name="photo" size={18} color={theme.colors.primary} />
                  <Text style={styles.imagePickerText}>
                    {responseForm.imageUrl ? "Đổi ảnh" : "Thêm ảnh"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {responseForm.imageUrl ? (
              <Image
                source={{
                  uri: buildImageUrl(responseForm.imageUrl) || undefined,
                }}
                style={styles.responseImagePreview}
              />
            ) : null}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => handleSubmitResponse(item)}
                disabled={submittingResponse}
              >
                {submittingResponse ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.submitButtonText}>Xác nhận</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setResponseFormVisibleId(null);
                  resetResponseForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const restaurantRating = Number(restaurantInfo?.rating ?? 0);
  const averageRatingValue =
    restaurantRating > 0
      ? restaurantRating
      : Number(summary?.averageRating || 0);
  const totalReviews = Number(summary?.totalReviews || 0);
  const distribution = summary?.distribution || {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  const distributionEntries = useMemo(
    () =>
      Object.keys(distribution)
        .sort((a, b) => Number(b) - Number(a))
        .map((rating) => ({
          rating: Number(rating),
          count: Number(distribution[Number(rating)] || 0),
        })),
    [distribution]
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.reviewsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="star" size={64} color={theme.colors.mediumGray} />
            <Text style={styles.emptyText}>Không có đánh giá</Text>
            <Text style={styles.emptySubtext}>
              Chưa có đánh giá nào trong mục này
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.toggleHeader}>
        <Text style={styles.sectionTitle}>Tổng quan đánh giá</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowOverview((prev) => !prev)}
        >
          <Icon
            name={showOverview ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={28}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
      {showOverview && (
        <View style={styles.overviewContainer}>
          <View style={styles.overviewCard}>
            <View style={styles.ratingSummary}>
              <Text style={styles.averageRating}>
                {averageRatingValue.toFixed(1)}
              </Text>
              <View style={styles.starsContainer}>
                {renderStars(Math.round(averageRatingValue))}
              </View>
              <Text style={styles.totalReviews}>{totalReviews} đánh giá</Text>
            </View>
            <View style={styles.ratingBreakdown}>
              {distributionEntries.map(({ rating, count }) => (
                <View key={rating} style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>{rating} sao</Text>
                  <View style={styles.ratingBarContainer}>
                    <View
                      style={[
                        styles.ratingBar,
                        {
                          width:
                            totalReviews > 0
                              ? `${(count / totalReviews) * 100}%`
                              : "0%",
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.ratingCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      <View style={styles.filtersContainer}>
        <FlatList
          data={ratingFilters}
          renderItem={({ item }) => renderRatingFilter(item)}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        />
      </View>

      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  toggleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  toggleButton: {
    padding: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  toggleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  toggleButton: {
    padding: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  overviewContainer: {
    padding: theme.spacing.lg,
  },
  overviewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
  },
  ratingSummary: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  starsContainer: {
    flexDirection: "row",
    marginVertical: theme.spacing.sm,
  },
  totalReviews: {
    fontSize: 14,
    color: theme.colors.mediumGray,
  },
  ratingBreakdown: {
    marginTop: theme.spacing.md,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  ratingLabel: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    width: 40,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 4,
    marginHorizontal: theme.spacing.sm,
  },
  ratingBar: {
    height: "100%",
    backgroundColor: theme.colors.accent,
    borderRadius: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    width: 24,
    textAlign: "right",
  },
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filtersScroll: {
    paddingHorizontal: theme.spacing.lg,
  },
  filterChip: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedFilterChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.mediumGray,
  },
  selectedFilterText: {
    color: theme.colors.surface,
  },
  reviewsList: {
    padding: theme.spacing.lg,
    paddingBottom: theme.navbarHeight + theme.spacing.md,
  },
  reviewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.lightOrange,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  reviewDate: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: "row",
  },
  orderItems: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.sm,
    fontStyle: "italic",
  },
  comment: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  feedbackImage: {
    width: "100%",
    height: 160,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.sm,
  },
  responseWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  responseConnector: {
    alignItems: "center",
    width: 24,
  },
  responseConnectorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginBottom: 4,
  },
  responseConnectorLine: {
    width: 2,
    height: 24,
    backgroundColor: theme.colors.border,
    borderRadius: 1,
  },
  responseConnectorArrow: {
    marginTop: 4,
  },
  responseContainer: {
    flex: 1,
    backgroundColor: theme.colors.lightOrange,
    borderRadius: theme.roundness / 2,
    padding: theme.spacing.md,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  responseDate: {
    fontSize: 10,
    color: theme.colors.mediumGray,
  },
  responseText: {
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 16,
  },
  responseImage: {
    width: "100%",
    height: 160,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.sm,
  },
  responseTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  responseActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    columnGap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  iconButton: {
    padding: theme.spacing.xs,
  },
  reviewActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  replyText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: "600",
  },
  replyArrow: {
    marginLeft: theme.spacing.xs,
  },
  responseForm: {
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  formTextarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.roundness,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  imagePickerText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "500",
  },
  responseImagePreview: {
    width: "100%",
    height: 160,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.sm,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: theme.spacing.sm,
  },
  submitButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness,
    alignItems: "center",
  },
  submitButtonText: {
    color: theme.colors.surface,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.roundness,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
  },
  cancelButtonText: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 16,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ReviewsScreen;
