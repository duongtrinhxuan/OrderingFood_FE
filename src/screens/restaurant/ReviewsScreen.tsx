import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '../../theme/theme';

// Mock reviews data
const mockReviews = [
  {
    id: '1',
    customer: 'Nguyễn Văn A',
    avatar: 'https://via.placeholder.com/50x50',
    rating: 5,
    comment: 'Pizza rất ngon, giao hàng nhanh. Sẽ đặt lại!',
    date: '2024-01-15',
    orderItems: 'Pizza Margherita x2',
    response: null,
  },
  {
    id: '2',
    customer: 'Trần Thị B',
    avatar: 'https://via.placeholder.com/50x50',
    rating: 4,
    comment: 'Chicken Burger ngon nhưng hơi nhỏ. Phục vụ tốt.',
    date: '2024-01-14',
    orderItems: 'Chicken Burger x1',
    response: {
      text: 'Cảm ơn bạn đã phản hồi. Chúng tôi sẽ cải thiện kích thước burger.',
      date: '2024-01-14',
    },
  },
  {
    id: '3',
    customer: 'Lê Văn C',
    avatar: 'https://via.placeholder.com/50x50',
    rating: 3,
    comment: 'Big Mac bình thường, không có gì đặc biệt.',
    date: '2024-01-13',
    orderItems: 'Big Mac x1, Coca Cola x2',
    response: null,
  },
  {
    id: '4',
    customer: 'Phạm Thị D',
    avatar: 'https://via.placeholder.com/50x50',
    rating: 5,
    comment: 'Món ăn tuyệt vời! Nhân viên thân thiện, giao hàng đúng giờ.',
    date: '2024-01-12',
    orderItems: 'Pizza Pepperoni x1',
    response: null,
  },
  {
    id: '5',
    customer: 'Hoàng Văn E',
    avatar: 'https://via.placeholder.com/50x50',
    rating: 2,
    comment: 'Giao hàng chậm, món ăn nguội. Không hài lòng.',
    date: '2024-01-11',
    orderItems: 'Fish Burger x2',
    response: {
      text: 'Xin lỗi vì sự bất tiện. Chúng tôi sẽ cải thiện dịch vụ giao hàng.',
      date: '2024-01-11',
    },
  },
];

const ReviewsScreen = () => {
  const [selectedRating, setSelectedRating] = useState('all');
  const [reviews] = useState(mockReviews);

  const ratingFilters = [
    {key: 'all', label: 'Tất cả'},
    {key: '5', label: '5 sao'},
    {key: '4', label: '4 sao'},
    {key: '3', label: '3 sao'},
    {key: '2', label: '2 sao'},
    {key: '1', label: '1 sao'},
  ];

  const averageRating = 4.2;
  const totalReviews = reviews.length;
  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  const filteredReviews = reviews.filter(review =>
    selectedRating === 'all' || review.rating.toString() === selectedRating
  );

  const renderStars = (rating: number) => {
    return Array.from({length: 5}, (_, index) => (
      <Icon
        key={index}
        name={index < rating ? 'star' : 'star-border'}
        size={16}
        color={theme.colors.accent}
      />
    ));
  };

  const renderRatingFilter = (filter: any) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterChip,
        selectedRating === filter.key && styles.selectedFilterChip,
      ]}
      onPress={() => setSelectedRating(filter.key)}>
      <Text
        style={[
          styles.filterText,
          selectedRating === filter.key && styles.selectedFilterText,
        ]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  const renderReview = ({item}: {item: any}) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.customerInfo}>
          <Image source={{uri: item.avatar}} style={styles.avatar} />
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{item.customer}</Text>
            <Text style={styles.reviewDate}>{item.date}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          {renderStars(item.rating)}
        </View>
      </View>

      <Text style={styles.orderItems}>{item.orderItems}</Text>
      <Text style={styles.comment}>{item.comment}</Text>

      {item.response && (
        <View style={styles.responseContainer}>
          <View style={styles.responseHeader}>
            <Icon name="restaurant" size={16} color={theme.colors.primary} />
            <Text style={styles.responseLabel}>Phản hồi từ nhà hàng</Text>
            <Text style={styles.responseDate}>{item.response.date}</Text>
          </View>
          <Text style={styles.responseText}>{item.response.text}</Text>
        </View>
      )}

      <View style={styles.reviewActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="thumb-up" size={16} color={theme.colors.mediumGray} />
          <Text style={styles.actionText}>Hữu ích</Text>
        </TouchableOpacity>
        {!item.response && (
          <TouchableOpacity style={styles.replyButton}>
            <Icon name="reply" size={16} color={theme.colors.primary} />
            <Text style={styles.replyText}>Phản hồi</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Rating Overview */}
      <View style={styles.overviewContainer}>
        <View style={styles.overviewCard}>
          <View style={styles.ratingSummary}>
            <Text style={styles.averageRating}>{averageRating}</Text>
            <View style={styles.starsContainer}>
              {renderStars(Math.floor(averageRating))}
            </View>
            <Text style={styles.totalReviews}>{totalReviews} đánh giá</Text>
          </View>
          <View style={styles.ratingBreakdown}>
            {Object.entries(ratingDistribution)
              .reverse()
              .map(([rating, count]) => (
                <View key={rating} style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>{rating} sao</Text>
                  <View style={styles.ratingBarContainer}>
                    <View
                      style={[
                        styles.ratingBar,
                        {
                          width: `${(count / totalReviews) * 100}%`,
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

      {/* Rating Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={ratingFilters}
          renderItem={({item}) => renderRatingFilter(item)}
          keyExtractor={item => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        />
      </View>

      {/* Reviews List */}
      <FlatList
        data={filteredReviews}
        renderItem={renderReview}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.reviewsList}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  starsContainer: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    width: 20,
    textAlign: 'right',
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
    fontWeight: '500',
    color: theme.colors.mediumGray,
  },
  selectedFilterText: {
    color: theme.colors.surface,
  },
  reviewsList: {
    padding: theme.spacing.lg,
  },
  reviewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  reviewDate: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  orderItems: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.sm,
    fontStyle: 'italic',
  },
  comment: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  responseContainer: {
    backgroundColor: theme.colors.lightOrange,
    borderRadius: theme.roundness / 2,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: 'bold',
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
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginLeft: theme.spacing.xs,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 16,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default ReviewsScreen;
