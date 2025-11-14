import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '../../theme/theme';

// Mock menu data
const mockMenuItems = [
  {
    id: '1',
    name: 'Pizza Margherita',
    description: 'Pizza với phô mai mozzarella, cà chua tươi và húng quế',
    price: 250000,
    image: 'https://via.placeholder.com/200x150',
    category: 'Pizza',
    isAvailable: true,
  },
  {
    id: '2',
    name: 'Chicken Burger',
    description: 'Burger gà giòn với rau xanh và sốt đặc biệt',
    price: 89000,
    image: 'https://via.placeholder.com/200x150',
    category: 'Burger',
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Big Mac',
    description: 'Burger bò với phô mai, rau xanh và sốt Big Mac',
    price: 75000,
    image: 'https://via.placeholder.com/200x150',
    category: 'Burger',
    isAvailable: false,
  },
  {
    id: '4',
    name: 'Coca Cola',
    description: 'Nước ngọt có ga Coca Cola 330ml',
    price: 15000,
    image: 'https://via.placeholder.com/200x150',
    category: 'Drinks',
    isAvailable: true,
  },
];

const categories = ['Tất cả', 'Pizza', 'Burger', 'Drinks', 'Dessert'];

const MenuManagementScreen = () => {
  const [menuItems, setMenuItems] = useState(mockMenuItems);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Pizza',
    isAvailable: true,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const filteredItems = menuItems.filter(item =>
    selectedCategory === 'Tất cả' || item.category === selectedCategory
  );

  const toggleAvailability = (id: string) => {
    setMenuItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? {...item, isAvailable: !item.isAvailable} : item
      )
    );
  };

  const deleteItem = (id: string) => {
    Alert.alert(
      'Xóa món ăn',
      'Bạn có chắc chắn muốn xóa món ăn này?',
      [
        {text: 'Hủy', style: 'cancel'},
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () =>
            setMenuItems(prevItems => prevItems.filter(item => item.id !== id)),
        },
      ]
    );
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const item = {
      id: Date.now().toString(),
      ...newItem,
      price: parseInt(newItem.price),
      image: 'https://via.placeholder.com/200x150',
    };

    setMenuItems(prevItems => [...prevItems, item]);
    setNewItem({
      name: '',
      description: '',
      price: '',
      category: 'Pizza',
      isAvailable: true,
    });
    setShowAddModal(false);
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      isAvailable: item.isAvailable,
    });
    setShowAddModal(true);
  };

  const handleUpdateItem = () => {
    if (!newItem.name || !newItem.price) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setMenuItems(prevItems =>
      prevItems.map(item =>
        item.id === editingItem?.id
          ? {
              ...item,
              ...newItem,
              price: parseInt(newItem.price),
            }
          : item
      )
    );

    setNewItem({
      name: '',
      description: '',
      price: '',
      category: 'Pizza',
      isAvailable: true,
    });
    setEditingItem(null);
    setShowAddModal(false);
  };

  const renderCategoryFilter = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.filterChip,
        selectedCategory === category && styles.selectedFilterChip,
      ]}
      onPress={() => setSelectedCategory(category)}>
      <Text
        style={[
          styles.filterText,
          selectedCategory === category && styles.selectedFilterText,
        ]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  const renderMenuItem = ({item}: {item: any}) => (
    <View style={styles.menuItemCard}>
      <Image source={{uri: item.image}} style={styles.itemImage} />
      
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <TouchableOpacity
            style={[
              styles.availabilityButton,
              {backgroundColor: item.isAvailable ? theme.colors.success : theme.colors.error},
            ]}
            onPress={() => toggleAvailability(item.id)}>
            <Text style={styles.availabilityText}>
              {item.isAvailable ? 'Có' : 'Hết'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
        </View>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditItem(item)}>
          <Icon name="edit" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => deleteItem(item.id)}>
          <Icon name="delete" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý thực đơn</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}>
          <Icon name="add" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Category Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={categories}
          renderItem={({item}) => renderCategoryFilter(item)}
          keyExtractor={item => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        />
      </View>

      {/* Menu Items */}
      <FlatList
        data={filteredItems}
        renderItem={renderMenuItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="restaurant-menu" size={64} color={theme.colors.mediumGray} />
            <Text style={styles.emptyText}>Chưa có món ăn</Text>
            <Text style={styles.emptySubtext}>
              Thêm món ăn đầu tiên vào thực đơn
            </Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Sửa món ăn' : 'Thêm món ăn'}
            </Text>
            <TouchableOpacity onPress={editingItem ? handleUpdateItem : handleAddItem}>
              <Text style={styles.saveText}>Lưu</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên món ăn *</Text>
              <TextInput
                style={styles.input}
                value={newItem.name}
                onChangeText={text => setNewItem({...newItem, name: text})}
                placeholder="Nhập tên món ăn"
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newItem.description}
                onChangeText={text => setNewItem({...newItem, description: text})}
                placeholder="Nhập mô tả món ăn"
                placeholderTextColor={theme.colors.placeholder}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Giá (VND) *</Text>
              <TextInput
                style={styles.input}
                value={newItem.price}
                onChangeText={text => setNewItem({...newItem, price: text})}
                placeholder="Nhập giá món ăn"
                placeholderTextColor={theme.colors.placeholder}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Danh mục</Text>
              <View style={styles.categoryButtons}>
                {categories.slice(1).map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      newItem.category === category && styles.selectedCategoryButton,
                    ]}
                    onPress={() => setNewItem({...newItem, category})}>
                    <Text
                      style={[
                        styles.categoryButtonText,
                        newItem.category === category && styles.selectedCategoryButtonText,
                      ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={styles.availabilityToggle}
                onPress={() => setNewItem({...newItem, isAvailable: !newItem.isAvailable})}>
                <Icon
                  name={newItem.isAvailable ? 'check-circle' : 'radio-button-unchecked'}
                  size={24}
                  color={newItem.isAvailable ? theme.colors.success : theme.colors.mediumGray}
                />
                <Text style={styles.availabilityLabel}>Có sẵn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness / 2,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  menuList: {
    padding: theme.spacing.lg,
  },
  menuItemCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: theme.roundness / 2,
    marginRight: theme.spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  availabilityButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness / 2,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  itemDescription: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.sm,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  itemCategory: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    backgroundColor: theme.colors.lightGray,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness / 2,
  },
  itemActions: {
    justifyContent: 'space-between',
    paddingLeft: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
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
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.mediumGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  saveText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness / 2,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedCategoryButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: theme.colors.mediumGray,
  },
  selectedCategoryButtonText: {
    color: theme.colors.surface,
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
});

export default MenuManagementScreen;
