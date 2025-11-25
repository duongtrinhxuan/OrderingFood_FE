import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../theme/theme";
import { api } from "../services/api";
import CreateAddressModal from "./CreateAddressModal";
import UpdateAddressModal from "./UpdateAddressModal";

interface ManageAddressModalProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
}

type UserAddress = {
  id: number;
  userId: number;
  addressId: number;
  isActive: boolean;
  address: {
    id: number;
    label: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
    isActive: boolean;
  };
};

const ManageAddressModal: React.FC<ManageAddressModalProps> = ({
  visible,
  onClose,
  userId,
}) => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(
    null
  );

  const fetchAddresses = useCallback(async () => {
    if (!userId) return;

    try {
      if (!refreshing) {
        setLoading(true);
      }
      const data = await api.getUserAddresses(userId);
      setAddresses(data as UserAddress[]);
    } catch (error: any) {
      console.error("Error fetching addresses:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách địa chỉ.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, refreshing]);

  useEffect(() => {
    if (visible) {
      fetchAddresses();
    }
  }, [visible, fetchAddresses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAddresses();
  }, [fetchAddresses]);

  const handleCreateSuccess = () => {
    fetchAddresses();
    setShowCreateModal(false);
  };

  const handleUpdateSuccess = () => {
    fetchAddresses();
    setShowUpdateModal(false);
    setSelectedAddress(null);
  };

  const handleEdit = (userAddress: UserAddress) => {
    setSelectedAddress(userAddress);
    setShowUpdateModal(true);
  };

  const handleDelete = (userAddress: UserAddress) => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa địa chỉ này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteUserAddress(userAddress.id);
            Alert.alert("Thành công", "Địa chỉ đã được xóa.");
            fetchAddresses();
          } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể xóa địa chỉ.");
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (userAddress: UserAddress) => {
    try {
      // First, set all other addresses of this user to isDefault = false
      const otherAddresses = addresses.filter(
        (addr) => addr.id !== userAddress.id && addr.address.isDefault
      );

      for (const addr of otherAddresses) {
        await api.updateAddress(addr.addressId, { isDefault: false });
      }

      // Then set this address to isDefault = true
      await api.updateAddress(userAddress.addressId, { isDefault: true });

      Alert.alert("Thành công", "Địa chỉ mặc định đã được cập nhật.");
      fetchAddresses();
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể cập nhật địa chỉ mặc định."
      );
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Địa chỉ giao hàng</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : (
              <ScrollView
                style={styles.scrollView}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
              >
                {addresses.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Icon
                      name="location-off"
                      size={64}
                      color={theme.colors.mediumGray}
                    />
                    <Text style={styles.emptyText}>
                      Bạn chưa có địa chỉ giao hàng
                    </Text>
                    <TouchableOpacity
                      style={styles.createButton}
                      onPress={() => setShowCreateModal(true)}
                    >
                      <Icon name="add" size={24} color={theme.colors.surface} />
                      <Text style={styles.createButtonText}>
                        Tạo mới địa chỉ giao hàng
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.createButton}
                      onPress={() => setShowCreateModal(true)}
                    >
                      <Icon name="add" size={24} color={theme.colors.surface} />
                      <Text style={styles.createButtonText}>
                        Tạo mới địa chỉ giao hàng
                      </Text>
                    </TouchableOpacity>

                    {addresses.map((userAddress) => (
                      <View
                        key={userAddress.id}
                        style={[
                          styles.addressCard,
                          userAddress.address.isDefault &&
                            styles.defaultAddressCard,
                        ]}
                      >
                        <View style={styles.addressHeader}>
                          <View style={styles.addressInfo}>
                            <Text style={styles.addressLabel}>
                              {userAddress.address.label}
                              {userAddress.address.isDefault && (
                                <Text style={styles.defaultBadge}>
                                  {" "}
                                  (Mặc định)
                                </Text>
                              )}
                            </Text>
                            <Text style={styles.addressText}>
                              {userAddress.address.street},{" "}
                              {userAddress.address.ward},{" "}
                              {userAddress.address.district},{" "}
                              {userAddress.address.province}
                            </Text>
                          </View>
                          <View style={styles.addressActions}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleEdit(userAddress)}
                            >
                              <Icon
                                name="edit"
                                size={20}
                                color={theme.colors.primary}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleDelete(userAddress)}
                            >
                              <Icon
                                name="delete"
                                size={20}
                                color={theme.colors.error}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                        {!userAddress.address.isDefault && (
                          <TouchableOpacity
                            style={styles.setDefaultButton}
                            onPress={() => handleSetDefault(userAddress)}
                          >
                            <Text style={styles.setDefaultButtonText}>
                              Đặt làm mặc định
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <CreateAddressModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        userId={userId}
        existingAddresses={addresses}
      />

      {selectedAddress && (
        <UpdateAddressModal
          visible={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedAddress(null);
          }}
          onSuccess={handleUpdateSuccess}
          address={selectedAddress.address}
          userId={userId}
          existingAddresses={addresses.filter(
            (addr) => addr.id !== selectedAddress.id
          )}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.roundness * 2,
    borderTopRightRadius: theme.roundness * 2,
    maxHeight: "90%",
    paddingBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  scrollView: {
    paddingHorizontal: theme.spacing.lg,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    textAlign: "center",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  createButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  addressCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  defaultAddressCard: {
    backgroundColor: theme.colors.lightOrange,
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  addressInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  defaultBadge: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.mediumGray,
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.xs,
  },
  setDefaultButton: {
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    alignSelf: "flex-start",
    borderRadius: theme.roundness / 2,
    backgroundColor: theme.colors.primary,
  },
  setDefaultButtonText: {
    color: theme.colors.surface,
    fontSize: 12,
    fontWeight: "600",
  },
});

export default ManageAddressModal;
