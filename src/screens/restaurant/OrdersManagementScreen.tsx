import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '../../theme/theme';

// Mock orders data
const mockOrders = [
  {
    id: '1',
    customer: 'Nguyễn Văn A',
    phone: '0123456789',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    items: [
      {name: 'Pizza Margherita', quantity: 2, price: 250000},
      {name: 'Coca Cola', quantity: 1, price: 15000},
    ],
    total: 515000,
    status: 'pending',
    orderTime: '2024-01-15 14:30',
    deliveryTime: '25-35 phút',
    note: 'Không hành tây',
  },
  {
    id: '2',
    customer: 'Trần Thị B',
    phone: '0987654321',
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    items: [
      {name: 'Chicken Burger', quantity: 1, price: 89000},
    ],
    total: 101000,
    status: 'preparing',
    orderTime: '2024-01-15 14:15',
    deliveryTime: '20-30 phút',
    note: '',
  },
  {
    id: '3',
    customer: 'Lê Văn C',
    phone: '0369852147',
    address: '789 Đường DEF, Quận 3, TP.HCM',
    items: [
      {name: 'Big Mac', quantity: 1, price: 75000},
      {name: 'Coca Cola', quantity: 2, price: 30000},
    ],
    total: 125000,
    status: 'ready',
    orderTime: '2024-01-15 14:00',
    deliveryTime: '15-25 phút',
    note: 'Giao nhanh',
  },
  {
    id: '4',
    customer: 'Phạm Thị D',
    phone: '0741852963',
    address: '321 Đường GHI, Quận 4, TP.HCM',
    items: [
      {name: 'Pizza Pepperoni', quantity: 1, price: 280000},
    ],
    total: 295000,
    status: 'delivering',
    orderTime: '2024-01-15 13:45',
    deliveryTime: 'Đang giao',
    note: '',
  },
  {
    id: '5',
    customer: 'Hoàng Văn E',
    phone: '0852741963',
    address: '654 Đường JKL, Quận 5, TP.HCM',
    items: [
      {name: 'Fish Burger', quantity: 2, price: 120000},
    ],
    total: 135000,
    status: 'completed',
    orderTime: '2024-01-15 13:30',
    deliveryTime: 'Đã giao',
    note: '',
  },
];

const OrdersManagementScreen = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [orders, setOrders] = useState(mockOrders);

  const statusFilters = [
    {key: 'all', label: 'Tất cả'},
    {key: 'pending', label: 'Chờ xác nhận'},
    {key: 'preparing', label: 'Đang chuẩn bị'},
    {key: 'ready', label: 'Sẵn sàng'},
    {key: 'delivering', label: 'Đang giao'},
    {key: 'completed', label: 'Hoàn thành'},
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'preparing':
        return theme.colors.info;
      case 'ready':
        return theme.colors.primary;
      case 'delivering':
        return theme.colors.success;
      case 'completed':
        return theme.colors.mediumGray;
      default:
        return theme.colors.mediumGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'preparing':
        return 'Đang chuẩn bị';
      case 'ready':
        return 'Sẵn sàng';
      case 'delivering':
        return 'Đang giao';
      case 'completed':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? {...order, status: newStatus} : order
      )
    );
  };

  const handleStatusUpdate = (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    let actionText = '';

    switch (currentStatus) {
      case 'pending':
        nextStatus = 'preparing';
        actionText = 'Xác nhận đơn hàng';
        break;
      case 'preparing':
        nextStatus = 'ready';
        actionText = 'Món ăn sẵn sàng';
        break;
      case 'ready':
        nextStatus = 'delivering';
        actionText = 'Bắt đầu giao hàng';
        break;
      case 'delivering':
        nextStatus = 'completed';
        actionText = 'Hoàn thành đơn hàng';
        break;
      default:
        return;
    }

    Alert.alert(
      'Cập nhật trạng thái',
      `Bạn có chắc chắn muốn ${actionText.toLowerCase()}?`,
      [
        {text: 'Hủy', style: 'cancel'},
        {
          text: 'Xác nhận',
          onPress: () => updateOrderStatus(orderId, nextStatus),
        },
      ]
    );
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
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>#{item.id}</Text>
          <Text style={styles.customerName}>{item.customer}</Text>
          <Text style={styles.orderTime}>{item.orderTime}</Text>
        </View>
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

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Icon name="phone" size={16} color={theme.colors.mediumGray} />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="place" size={16} color={theme.colors.mediumGray} />
          <Text style={styles.detailText}>{item.address}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="schedule" size={16} color={theme.colors.mediumGray} />
          <Text style={styles.detailText}>{item.deliveryTime}</Text>
        </View>
        {item.note && (
          <View style={styles.detailRow}>
            <Icon name="note" size={16} color={theme.colors.mediumGray} />
            <Text style={styles.detailText}>{item.note}</Text>
          </View>
        )}
      </View>

      <View style={styles.orderItems}>
        <Text style={styles.itemsTitle}>Món đã đặt:</Text>
        {item.items.map((orderItem: any, index: number) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {orderItem.quantity}x {orderItem.name}
            </Text>
            <Text style={styles.itemPrice}>
              {formatPrice(orderItem.price * orderItem.quantity)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>
          Tổng: {formatPrice(item.total)}
        </Text>
        {item.status !== 'completed' && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => handleStatusUpdate(item.id, item.status)}>
            <Text style={styles.updateButtonText}>
              {item.status === 'pending' && 'Xác nhận'}
              {item.status === 'preparing' && 'Sẵn sàng'}
              {item.status === 'ready' && 'Giao hàng'}
              {item.status === 'delivering' && 'Hoàn thành'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
              Chưa có đơn hàng nào trong trạng thái này
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
  orderId: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.xs,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  orderTime: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.xs,
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
  orderDetails: {
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  orderItems: {
    marginBottom: theme.spacing.sm,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  itemName: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    flex: 1,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness / 2,
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
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

export default OrdersManagementScreen;
