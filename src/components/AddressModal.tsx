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

interface Address {
  id: number;
  label: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  latitude?: number;
  longitude?: number;
  userAddress?: {
    id: number;
    isDefault?: boolean;
  };
}

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (address: Address | null) => void;
  selectedAddress: Address | null;
  userId: number;
}

const AddressModal: React.FC<AddressModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedAddress,
  userId,
}) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadAddresses();
    }
  }, [visible, userId]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await api.getUserAddresses(userId);
      // Transform data to get addresses with userAddress info
      const transformedAddresses = (data as any[]).map((ua: any) => ({
        ...ua.address,
        userAddress: {
          id: ua.id,
          isDefault: ua.isDefault,
        },
      }));
      setAddresses(transformedAddresses);
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (address: Address) => {
    onSelect(address);
  };

  const handleConfirm = () => {
    onClose();
  };

  const getFullAddress = (address: Address) => {
    return `${address.street}, ${address.ward}, ${address.district}, ${address.province}`;
  };

  const renderAddress = ({ item }: { item: Address }) => {
    const isSelected = selectedAddress?.id === item.id;
    const isDefault = item.userAddress?.isDefault;

    return (
      <TouchableOpacity
        style={[styles.addressCard, isSelected && styles.selectedAddressCard]}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.addressContent}>
          <View style={styles.addressHeader}>
            <View style={styles.addressInfo}>
              <Icon name="location-on" size={20} color={theme.colors.primary} />
              <Text style={styles.addressText}>{getFullAddress(item)}</Text>
            </View>
            {isSelected && (
              <Icon
                name="check-circle"
                size={24}
                color={theme.colors.primary}
              />
            )}
          </View>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Mặc định</Text>
            </View>
          )}
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
            <Text style={styles.title}>Chọn địa chỉ giao hàng</Text>
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
              data={addresses}
              renderItem={renderAddress}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Không có địa chỉ nào</Text>
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
  addressCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedAddressCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.lightOrange,
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.xs,
  },
  addressInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  defaultBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness / 2,
    marginTop: theme.spacing.xs,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.surface,
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

export default AddressModal;
