import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '../theme/theme';

interface RestaurantCardProps {
  restaurant: {
    id: string;
    name: string;
    rating: number;
    deliveryTime: string;
    deliveryFee: number;
    image: string;
    categories: string[];
    distance: string;
  };
  onPress?: () => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onPress,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <ImageBackground
        source={{uri: restaurant.image}}
        style={styles.image}
        imageStyle={styles.imageStyle}>
        <View style={styles.overlay}>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color={theme.colors.accent} />
            <Text style={styles.ratingText}>{restaurant.rating}</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {restaurant.name}
        </Text>

        <View style={styles.categoriesContainer}>
          {restaurant.categories.slice(0, 2).map((category, index) => (
            <View key={index} style={styles.categoryChip}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          ))}
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Icon name="schedule" size={16} color={theme.colors.mediumGray} />
            <Text style={styles.detailText}>{restaurant.deliveryTime}</Text>
          </View>

          <View style={styles.detailItem}>
            <Icon name="local-shipping" size={16} color={theme.colors.mediumGray} />
            <Text style={styles.detailText}>
              {restaurant.deliveryFee === 0
                ? 'Miễn phí'
                : formatPrice(restaurant.deliveryFee)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Icon name="place" size={16} color={theme.colors.mediumGray} />
            <Text style={styles.detailText}>{restaurant.distance}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  image: {
    height: 150,
    width: '100%',
  },
  imageStyle: {
    borderTopLeftRadius: theme.roundness,
    borderTopRightRadius: theme.roundness,
  },
  overlay: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness / 2,
  },
  ratingText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: theme.spacing.xs,
  },
  content: {
    padding: theme.spacing.md,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  categoryChip: {
    backgroundColor: theme.colors.lightOrange,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness / 2,
    marginRight: theme.spacing.sm,
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginLeft: theme.spacing.xs,
  },
});

export default RestaurantCard;
