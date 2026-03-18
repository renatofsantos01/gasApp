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
  const outOfStock = (product?.stock ?? 0) <= 0;

  return (
    <Card style={[styles.card, outOfStock && styles.cardDisabled]} onPress={outOfStock ? undefined : onPress}>
      <View style={styles.imageContainer}>
        {product?.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.imageFallbackText}>📦</Text>
          </View>
        )}
        {outOfStock && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>ESGOTADO</Text>
          </View>
        )}
      </View>
      <Card.Content style={[styles.content, outOfStock && styles.contentDisabled]}>
        <Chip mode="flat" style={styles.categoryChip} textStyle={styles.categoryText}>
          {product?.category ?? ''}
        </Chip>
        <Text variant="titleMedium" style={styles.name} numberOfLines={2}>
          {product?.name ?? ''}
        </Text>
        <Text variant="headlineSmall" style={[styles.price, outOfStock && styles.priceDisabled]}>
          {formatCurrency(product?.price ?? 0)}
        </Text>
        {showStock && !outOfStock && (
          <Text variant="bodySmall" style={styles.stock}>
            {product?.stock} em estoque
          </Text>
        )}
      </Card.Content>
      {onAddToCart && !outOfStock && (
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
  imageFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFallbackText: {
    fontSize: 48,
  },
  soldOutOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 2,
    backgroundColor: 'rgba(211,47,47,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardDisabled: {
    opacity: 0.7,
  },
  content: {
    paddingTop: 12,
  },
  contentDisabled: {
    opacity: 0.6,
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
  priceDisabled: {
    color: '#9E9E9E',
  },
  stock: {
    color: '#4CAF50',
    fontSize: 12,
  },
  addButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});
