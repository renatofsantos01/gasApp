import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { theme } from '../../theme';

export const EditProfileScreen: React.FC<any> = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiService.updateProfile({ name, phone });
      await refreshUser();
      Alert.alert('Sucesso', 'Perfil atualizado');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <TextInput label="Nome" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
        <TextInput label="Telefone" value={phone} onChangeText={setPhone} mode="outlined" style={styles.input} />
        <Button mode="contained" onPress={handleSave} loading={loading} style={styles.button}>Salvar</Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16 },
  input: { marginBottom: 16 },
  button: { marginTop: 8 },
});
