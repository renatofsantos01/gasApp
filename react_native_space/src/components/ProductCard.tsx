import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { Product } from '../types';
import { formatCurrency } from '../utils/format';
import { theme } from '../theme';

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  onPress?: () => void;
  showStock?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onPress,
  showStock = true,
}) => {
  const handlePress = () => {
    onPress?.();
  };

  return (
    <Card style={styles.card} onPress={handlePress}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: (product as any)?.imageurl || product?.imageUrl || 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081' }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      <Card.Content style={styles.content}>
        <Chip mode="flat" style={styles.categoryChip} textStyle={styles.categoryText}>
          {product?.category ?? ''}
        </Chip>
        <Text variant="titleMedium" style={styles.name} numberOfLines={2}>
          {product?.name ?? ''}
        </Text>
        <Text variant="headlineSmall" style={styles.price}>
          {formatCurrency(product?.price ?? 0)}
        </Text>
        {showStock && (
          <Text
            variant="bodySmall"
            style={[
              styles.stock,
              (product?.stock ?? 0) <= 0 && styles.outOfStock,
            ]}
          >
            {(product?.stock ?? 0) > 0
              ? `${product?.stock} em estoque`
              : 'Fora de estoque'}
          </Text>
        )}
      </Card.Content>
      {onAddToCart && (product?.stock ?? 0) > 0 && (
        <Card.Actions>
          <Button mode="contained" onPress={onAddToCart} style={styles.addButton}>
            Adicionar
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 2,
    backgroundColor: theme.colors.surface,
  },
  imageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    paddingTop: 12,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    backgroundColor: theme.colors.secondary,
  },
  categoryText: {
    color: theme.colors.onSecondary,
    fontSize: 12,
  },
  name: {
    fontWeight: '600',
    marginBottom: 8,
    minHeight: 48,
  },
  price: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stock: {
    color: theme.colors.success,
    fontSize: 12,
  },
  outOfStock: {
    color: theme.colors.error,
  },
  addButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});
