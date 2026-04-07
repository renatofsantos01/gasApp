import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Chip, FAB, Searchbar, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClientTabParamList } from '../../navigation/ClientNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { apiService } from '../../services/api';
import { Product } from '../../types';
import { ProductCard } from '../../components/ProductCard';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { theme } from '../../theme';

type ClientHomeScreenProps = {
  navigation: NativeStackNavigationProp<ClientTabParamList, 'ClientHome'>;
};

const CATEGORIES = ['Todos', 'Botijões', 'Água', 'Acessórios', 'Serviços'];

export const ClientHomeScreen: React.FC<ClientHomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { addItem, itemCount } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchQuery]);

  const loadProducts = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await apiService.getProducts();
      setProducts(data ?? []);
      
      // Não mostra erro se conseguiu carregar
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error);
      // Só mostra alert se realmente não conseguiu carregar nada
      if ((products?.length ?? 0) === 0) {
        const message = error?.response?.data?.message ?? 'Erro ao carregar produtos';
        Alert.alert('Erro', message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Remove acentos de uma string
  const removeAccents = (str: string): string => {
    return str?.normalize('NFD')?.replace(/[\u0300-\u036f]/g, '') ?? '';
  };

  const filterProducts = () => {
    let filtered = products ?? [];

    if (selectedCategory !== 'Todos') {
      filtered = filtered?.filter((p) => p?.category === selectedCategory) ?? [];
    }

    if (searchQuery) {
      const query = removeAccents(searchQuery?.toLowerCase() ?? '');
      filtered = filtered?.filter(
        (p) =>
          (removeAccents(p?.name?.toLowerCase() ?? '')?.includes(query) ?? false) ||
          (removeAccents(p?.description?.toLowerCase() ?? '')?.includes(query) ?? false)
      ) ?? [];
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product: Product) => {
    if ((product?.stock ?? 0) <= 0) {
      Alert.alert('Aviso', 'Produto fora de estoque');
      return;
    }
    addItem(product, 1);
    setSnackbarMessage(`${product?.name} adicionado ao carrinho`);
    setSnackbarVisible(true);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <ProductCard product={item} onAddToCart={() => handleAddToCart(item)} />
    </View>
  );

  if (loading) {
    return <Loading message="Carregando produtos..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.greeting}>
          Olá, {user?.name?.split(' ')?.[0] ?? 'Cliente'}!
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          O que você precisa hoje?
        </Text>
      </View>

      <Searchbar
        placeholder="Buscar produtos..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={CATEGORIES}
          renderItem={({ item }) => (
            <Chip
              selected={selectedCategory === item}
              onPress={() => setSelectedCategory(item)}
              style={styles.categoryChip}
              mode={selectedCategory === item ? 'flat' : 'outlined'}
            >
              {item}
            </Chip>
          )}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item?.id ?? ''}
        numColumns={2}
        contentContainerStyle={styles.productList}
        ListEmptyComponent={
          <EmptyState
            icon="cube-outline"
            title="Nenhum produto encontrado"
            message="Tente alterar os filtros ou buscar por outro termo"
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProducts(true)}
            colors={[theme.colors.primary]}
          />
        }
      />

      {itemCount > 0 && (
        <FAB
          icon="cart"
          label={`Ver carrinho (${itemCount})`}
          style={styles.fab}
          onPress={() => navigation.navigate('Cart')}
        />
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        action={{
          label: 'Ver',
          onPress: () => navigation.navigate('Cart'),
        }}
      >
        {snackbarMessage}
      </Snackbar>
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
    paddingBottom: 8,
  },
  greeting: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitle: {
    color: '#757575',
    marginTop: 4,
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 12,
  },
  categoryChip: {
    marginHorizontal: 4,
  },
  productList: {
    paddingBottom: 100,
  },
  productItem: {
    flex: 1,
    maxWidth: '50%',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});
