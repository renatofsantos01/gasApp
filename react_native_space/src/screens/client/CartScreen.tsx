import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Alert } from 'react-native';
import { Text, Button, IconButton, Divider, Banner } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ClientTabParamList } from '../../navigation/ClientNavigator';
import { useCart } from '../../contexts/CartContext';
import { apiService } from '../../services/api';
import { CartItem } from '../../types';
import { formatCurrency } from '../../utils/format';
import { EmptyState } from '../../components/EmptyState';
import { theme } from '../../theme';

type CartScreenProps = {
  navigation: NativeStackNavigationProp<ClientTabParamList, 'Cart'>;
};

export const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const { items, total, updateQuantity, removeItem } = useCart();
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [outOfStockIds, setOutOfStockIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    React.useCallback(() => {
      checkStock();
    }, [items])
  );

  const checkStock = async () => {
    if (items.length === 0) return;
    try {
      const products = await apiService.getProducts();
      const map: Record<string, number> = {};
      products.forEach((p) => { map[p.id] = p.stock; });
      setStockMap(map);

      const outIds = new Set<string>();
      items.forEach((item) => {
        const available = map[item.product.id] ?? 0;
        if (available === 0) outIds.add(item.product.id);
      });
      setOutOfStockIds(outIds);
    } catch {
      // silently ignore — user will see error at checkout
    }
  };

  const hasOutOfStock = outOfStockIds.size > 0;

  const handleCheckout = () => {
    if ((items?.length ?? 0) === 0) {
      Alert.alert('Aviso', 'Adicione produtos ao carrinho antes de finalizar o pedido');
      return;
    }
    navigation.navigate('Checkout');
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const subtotal = (item?.product?.price ?? 0) * (item?.quantity ?? 0);
    const isOutOfStock = outOfStockIds.has(item?.product?.id ?? '');
    const availableStock = stockMap[item?.product?.id ?? ''] ?? item?.product?.stock ?? 0;

    return (
      <View style={[styles.cartItem, isOutOfStock && styles.cartItemDisabled]}>
        {item?.product?.imageUrl ? (
          <Image
            source={{ uri: item.product.imageUrl }}
            style={[styles.productImage, isOutOfStock && styles.imageDisabled]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.productImage, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>📦</Text>
          </View>
        )}
        <View style={styles.productInfo}>
          <Text variant="titleMedium" numberOfLines={2} style={[styles.productName, isOutOfStock && styles.textDisabled]}>
            {item?.product?.name ?? ''}
          </Text>
          {isOutOfStock ? (
            <Text variant="bodySmall" style={styles.outOfStockLabel}>⚠ Esgotado — remova para continuar</Text>
          ) : (
            <Text variant="bodyMedium" style={styles.productPrice}>
              {formatCurrency(item?.product?.price ?? 0)}
            </Text>
          )}
          {!isOutOfStock && (
            <View style={styles.quantityContainer}>
              <IconButton
                icon="minus"
                size={20}
                onPress={() => updateQuantity(item?.product?.id ?? '', (item?.quantity ?? 0) - 1)}
              />
              <Text variant="titleMedium" style={styles.quantity}>
                {item?.quantity ?? 0}
              </Text>
              <IconButton
                icon="plus"
                size={20}
                onPress={() => updateQuantity(item?.product?.id ?? '', (item?.quantity ?? 0) + 1)}
                disabled={(item?.quantity ?? 0) >= availableStock}
              />
            </View>
          )}
        </View>
        <View style={styles.itemActions}>
          <Text variant="titleMedium" style={styles.subtotal}>
            {formatCurrency(subtotal)}
          </Text>
          <IconButton
            icon="delete"
            size={20}
            iconColor={theme.colors.error}
            onPress={() => {
              Alert.alert(
                'Remover item',
                `Deseja remover ${item?.product?.name} do carrinho?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Remover', onPress: () => removeItem(item?.product?.id ?? ''), style: 'destructive' },
                ]
              );
            }}
          />
        </View>
      </View>
    );
  };

  if ((items?.length ?? 0) === 0) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <EmptyState
          icon="cart-outline"
          title="Carrinho vazio"
          message="Adicione produtos para continuar"
        />
        <View style={styles.emptyActions}>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            contentStyle={styles.buttonContent}
          >
            Ver Produtos
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {hasOutOfStock && (
        <Banner
          visible
          icon="alert-circle"
          actions={[
            {
              label: 'Remover esgotados',
              onPress: () => {
                outOfStockIds.forEach((id) => removeItem(id));
                setOutOfStockIds(new Set());
              },
            },
          ]}
        >
          Alguns produtos estão esgotados. Remova-os para continuar.
        </Banner>
      )}

      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item?.product?.id ?? ''}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
      />

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text variant="titleLarge">Total:</Text>
          <Text variant="headlineMedium" style={styles.totalAmount}>
            {formatCurrency(total ?? 0)}
          </Text>
        </View>
        <Button
          mode="contained"
          onPress={handleCheckout}
          contentStyle={styles.buttonContent}
          style={styles.checkoutButton}
          disabled={hasOutOfStock}
        >
          Finalizar Pedido
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.continueButton}
        >
          Continuar Comprando
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.surface,
  },
  cartItemDisabled: {
    backgroundColor: '#FAFAFA',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  imageDisabled: {
    opacity: 0.4,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  textDisabled: {
    color: '#9E9E9E',
  },
  outOfStockLabel: {
    color: '#E53935',
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    color: '#757575',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    marginHorizontal: 8,
    minWidth: 30,
    textAlign: 'center',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  subtotal: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  divider: {
    marginHorizontal: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalAmount: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  checkoutButton: {
    marginBottom: 8,
  },
  continueButton: {
    marginBottom: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  emptyActions: {
    padding: 24,
  },
});
