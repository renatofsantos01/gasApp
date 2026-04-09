import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Searchbar,
  Chip,
  FAB,
  Portal,
  Modal,
  TextInput,
  Menu,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { theme } from '../../theme';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl?: string;
  stock: number;
}

const CATEGORIES = ['Botijões', 'Água', 'Acessórios', 'Serviços'];

export const AdminProductsScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [menuVisible, setMenuVisible] = useState<{[key: string]: boolean}>({});
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Botijões',
    description: '',
    price: '',
    imageUrl: '',
    stock: '',
  });
  const [uploading, setUploading] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response?.data ?? []);
      setFilteredProducts(response?.data ?? []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const filterProducts = () => {
    let filtered = products ?? [];

    if (selectedCategory) {
      filtered = filtered?.filter((p) => p?.category === selectedCategory) ?? [];
    }

    if (searchQuery) {
      const query = searchQuery?.toLowerCase() ?? '';
      filtered = filtered?.filter(
        (p) =>
          (p?.name?.toLowerCase()?.includes(query) ?? false) ||
          (p?.description?.toLowerCase()?.includes(query) ?? false)
      ) ?? [];
    }

    setFilteredProducts(filtered);
  };

  React.useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, products]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Botijões',
      description: '',
      price: '',
      imageUrl: '',
      stock: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product?.name ?? '',
      category: product?.category ?? 'Botijões',
      description: product?.description ?? '',
      price: product?.price?.toString() ?? '',
      imageUrl: product?.imageUrl ?? '',
      stock: product?.stock?.toString() ?? '',
    });
    setModalVisible(true);
    closeMenu(product?.id ?? '');
  };

  const handleSaveProduct = async () => {
    // Validação básica
    if (!formData?.name?.trim()) {
      Alert.alert('Erro', 'Nome do produto é obrigatório');
      return;
    }
    if (!formData?.description?.trim()) {
      Alert.alert('Erro', 'Descrição do produto é obrigatória');
      return;
    }
    if (!formData?.price || parseFloat(formData?.price) <= 0) {
      Alert.alert('Erro', 'Preço deve ser maior que zero');
      return;
    }
    if (!formData?.stock || parseInt(formData?.stock, 10) < 0) {
      Alert.alert('Erro', 'Estoque deve ser maior ou igual a zero');
      return;
    }

    try {
      const productData = {
        name: formData?.name?.trim() ?? '',
        category: formData?.category ?? 'Botijões',
        description: formData?.description?.trim() ?? '',
        price: parseFloat(formData?.price ?? '0'),
        imageUrl: formData?.imageUrl?.trim() || undefined,
        stock: parseInt(formData?.stock ?? '0', 10),
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct?.id}`, productData);
        Alert.alert('Sucesso', 'Produto atualizado com sucesso!');
      } else {
        await api.post('/products', productData);
        Alert.alert('Sucesso', 'Produto criado com sucesso!');
      }

      setModalVisible(false);
      loadProducts();
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      const message = error?.response?.data?.message ?? 'Erro ao salvar produto. Verifique os dados e tente novamente.';
      Alert.alert('Erro', message);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria de fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        await handleUploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Erro ao escolher imagem:', error);
      Alert.alert('Erro', 'Não foi possível escolher a imagem');
    }
  };

  const handleUploadImage = async (asset: any) => {
    try {
      setUploading(true);

      // 1. Get presigned URL from backend
      const fileName = asset.uri.split('/').pop() || 'image.jpg';
      
      // Detect content type from file extension
      let contentType = 'image/jpeg';
      if (fileName.toLowerCase().endsWith('.png')) {
        contentType = 'image/png';
      } else if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (fileName.toLowerCase().endsWith('.webp')) {
        contentType = 'image/webp';
      }

      console.log('Upload iniciado:', { fileName, contentType });

      const presignedResponse = await api.post('/upload/presigned', {
        fileName,
        contentType,
      });

      console.log('Presigned URL recebida:', presignedResponse.data);

      const { uploadUrl, publicUrl } = presignedResponse.data;

      if (!uploadUrl || !publicUrl) {
        throw new Error('URL de upload inválida');
      }

      // 2. Upload file to S3
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      console.log('Blob criado, tamanho:', blob.size, 'tipo:', blob.type);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': contentType,
        },
      });

      console.log('Upload response:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        ok: uploadResponse.ok,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text().catch(() => 'Erro desconhecido');
        console.error('Erro no upload S3:', errorText);
        throw new Error(`Falha no upload: ${uploadResponse.status} - ${errorText}`);
      }

      // 3. Update form with public URL
      setFormData({ ...formData, imageUrl: publicUrl });
      Alert.alert('Sucesso', 'Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      const message = error?.message ?? 'Não foi possível fazer upload da imagem';
      Alert.alert('Erro', message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await api.delete(`/products/${productId}`);
      loadProducts();
      closeMenu(productId);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    }
  };

  const openMenu = (productId: string) => {
    setMenuVisible({ ...menuVisible, [productId]: true });
  };

  const closeMenu = (productId: string) => {
    setMenuVisible({ ...menuVisible, [productId]: false });
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <Card style={styles.productCard}>
      <Card.Content>
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text variant="titleMedium" style={styles.productName}>
              {item?.name ?? 'Produto'}
            </Text>
            <Chip style={styles.categoryChip}>{item?.category ?? ''}</Chip>
          </View>
          <Menu
            visible={menuVisible?.[item?.id ?? ''] ?? false}
            onDismiss={() => closeMenu(item?.id ?? '')}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => openMenu(item?.id ?? '')}
              />
            }
          >
            <Menu.Item
              leadingIcon="pencil"
              onPress={() => openEditModal(item)}
              title="Editar"
            />
            <Menu.Item
              leadingIcon="delete"
              onPress={() => handleDeleteProduct(item?.id ?? '')}
              title="Excluir"
            />
          </Menu>
        </View>
        <Text variant="bodyMedium" style={styles.description}>
          {item?.description ?? ''}
        </Text>
        <View style={styles.productDetails}>
          <Text variant="titleMedium" style={styles.price}>
            R$ {(item?.price ?? 0).toFixed(2)}
          </Text>
          <Text variant="bodySmall" style={styles.stock}>
            Estoque: {item?.stock ?? 0}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar produtos..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        <Chip
          selected={!selectedCategory}
          onPress={() => setSelectedCategory(null)}
          style={styles.categoryChipFilter}
        >
          Todos
        </Chip>
        {CATEGORIES?.map((category) => (
          <Chip
            key={category}
            selected={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
            style={styles.categoryChipFilter}
          >
            {category}
          </Chip>
        )) ?? []}
      </ScrollView>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item?.id ?? ''}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="titleMedium">Nenhum produto encontrado</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddModal}
        label="Novo Produto"
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          dismissable={false}
          contentContainerStyle={styles.modal}
        >
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 20 }}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </Text>

            <TextInput
              label="Nome do Produto"
              value={formData?.name ?? ''}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
              mode="outlined"

            />

            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <TextInput
                  label="Categoria"
                  value={formData?.category ?? ''}
                  style={styles.input}
                  mode="outlined"
                  editable={false}
    
                  right={<TextInput.Icon icon="chevron-down" onPress={() => setCategoryMenuVisible(true)} />}
                  onPressIn={() => setCategoryMenuVisible(true)}
                />
              }
            >
              {CATEGORIES.map((cat) => (
                <Menu.Item
                  key={cat}
                  title={cat}
                  onPress={() => {
                    setFormData({ ...formData, category: cat });
                    setCategoryMenuVisible(false);
                  }}
                />
              ))}
            </Menu>

            <TextInput
              label="Descrição"
              value={formData?.description ?? ''}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}

            />

            <TextInput
              label="Preço (R$)"
              value={formData?.price ?? ''}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="decimal-pad"

            />

            <View style={styles.imageSection}>
              <Text variant="labelLarge" style={styles.imageLabel}>
                Imagem do Produto
              </Text>
              {formData?.imageUrl ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: formData.imageUrl }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <IconButton
                    icon="close-circle"
                    size={24}
                    onPress={() => setFormData({ ...formData, imageUrl: '' })}
                    style={styles.removeImageButton}
                  />
                </View>
              ) : (
                <Button
                  mode="outlined"
                  onPress={handlePickImage}
                  icon="image-plus"
                  loading={uploading}
                  disabled={uploading}
                  style={styles.imageButton}
                >
                  {uploading ? 'Enviando...' : 'Escolher Imagem'}
                </Button>
              )}
            </View>

            <TextInput
              label="Estoque"
              value={formData?.stock ?? ''}
              onChangeText={(text) => setFormData({ ...formData, stock: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="number-pad"

            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveProduct}
                style={styles.modalButton}
              >
                Salvar
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 16,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryChipFilter: {
    marginRight: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  productCard: {
    marginBottom: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  description: {
    color: '#666',
    marginBottom: 12,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  stock: {
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: Platform.OS === 'web' ? 16 : 80,
    backgroundColor: theme.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
    flexShrink: 1,
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    marginLeft: 8,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
    marginVertical: 8,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: '50%',
    marginRight: -108,
    backgroundColor: 'white',
  },
  imageButton: {
    marginVertical: 8,
  },
});
