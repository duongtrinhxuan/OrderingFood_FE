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

// Mock order data
const mockOrders = [
  {
    id: '1',
    restaurant: 'Pizza Hut',
    status: 'delivering',
    items: [
      {name: 'Pizza Margherita', quantity: 2},
      {name: 'Coca Cola', quantity: 1},
    ],
    total: 515000,
    orderTime: '2024-01-15 14:30',
    deliveryTime: '25-35 phút',
    image: 'https://via.placeholder.com/100x100',
  },
  {
    id: '2',
    restaurant: 'KFC',
    status: 'completed',
    items: [
      {name: 'Chicken Burger', quantity: 1},
      {name: 'French Fries', quantity: 1},
    ],
    total: 101000,
    orderTime: '2024-01-14 19:45',
    deliveryTime: 'Đã giao',
    image: 'https://via.placeholder.com/100x100',
  },
  {
    id: '3',
    restaurant: 'McDonald\'s',
    status: 'cancelled',
    items: [
      {name: 'Big Mac', quantity: 1},
    ],
    total: 75000,
    orderTime: '2024-01-13 12:15',
    deliveryTime: 'Đã hủy',
    image: 'https://via.placeholder.com/100x100',
  },
];

const OrdersScreen = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [orders] = useState(mockOrders);

  const statusFilters = [
    {key: 'all', label: 'Tất cả'},
    {key: 'delivering', label: 'Đang giao'},
    {key: 'completed', label: 'Hoàn thành'},
    {key: 'cancelled', label: 'Đã hủy'},
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivering':
        return theme.colors.warning;
      case 'completed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.mediumGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivering':
        return 'Đang giao';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const filteredOrders = orders.filter(order => 
    selectedStatus === 'all' || order.status === selectedStatus
  );

  const renderStatusFilter = (filter: any) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterChip,
        selectedStatus === filter.key && styles.selectedFilterChip,
      ]}
      onPress={() => setSelectedStatus(filter.key)}>
      <Text
        style={[
          styles.filterText,
          selectedStatus === filter.key && styles.selectedFilterText,
        ]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrder = ({item}: {item: any}) => (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantImageContainer}>
            <Icon name="restaurant" size={24} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.restaurantName}>{item.restaurant}</Text>
            <Text style={styles.orderTime}>{item.orderTime}</Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(item.status)},
            ]}>
            <Text style={styles.statusText}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.orderItems}>
        {item.items.map((orderItem: any, index: number) => (
          <Text key={index} style={styles.orderItemText}>
            {orderItem.quantity}x {orderItem.name}
          </Text>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.deliveryInfo}>
          <Icon name="schedule" size={16} color={theme.colors.mediumGray} />
          <Text style={styles.deliveryText}>{item.deliveryTime}</Text>
        </View>
        <Text style={styles.orderTotal}>{formatPrice(item.total)}</Text>
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Xem chi tiết</Text>
        </TouchableOpacity>
        {item.status === 'delivering' && (
          <TouchableOpacity style={styles.trackButton}>
            <Icon name="my-location" size={16} color={theme.colors.primary} />
            <Text style={styles.trackButtonText}>Theo dõi</Text>
          </TouchableOpacity>
        )}
        {item.status === 'completed' && (
          <TouchableOpacity style={styles.reorderButton}>
            <Text style={styles.reorderButtonText}>Đặt lại</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={statusFilters}
          renderItem={({item}) => renderStatusFilter(item)}
          keyExtractor={item => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt" size={64} color={theme.colors.mediumGray} />
            <Text style={styles.emptyText}>Không có đơn hàng</Text>
            <Text style={styles.emptySubtext}>
              Bạn chưa có đơn hàng nào
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
  ordersList: {
    padding: theme.spacing.lg,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  restaurantImageContainer: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.lightOrange,
    borderRadius: theme.roundness / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  orderTime: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.xs,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness / 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  orderItems: {
    marginBottom: theme.spacing.sm,
  },
  orderItemText: {
    fontSize: 14,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.xs,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginLeft: theme.spacing.xs,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.roundness / 2,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.roundness / 2,
    backgroundColor: theme.colors.lightOrange,
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  reorderButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.roundness / 2,
    backgroundColor: theme.colors.primary,
  },
  reorderButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.surface,
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

export default OrdersScreen;
