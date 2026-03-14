import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  DataTable,
  ActivityIndicator,
  Menu,
  TouchableRipple,
} from 'react-native-paper';
import { api } from '../../services/api';
import { theme } from '../../theme';

interface ReportData {
  orderStats?: {
    total: number;
    byStatus: { status: string; count: number }[];
  };
  revenueStats?: {
    total: number;
    byPaymentMethod: { paymentMethod: string; total: number }[];
  };
  topProducts?: {
    productName: string;
    quantity: number;
    revenue: number;
  }[];
}

const STATUS_COLORS: { [key: string]: string } = {
  Pendente: '#FFA726',
  'Em Preparo': '#42A5F5',
  'Saiu para Entrega': '#AB47BC',
  Entregue: '#66BB6A',
  Cancelado: '#EF5350',
};

const MONTHS = [
  { label: 'Janeiro', value: '01' },
  { label: 'Fevereiro', value: '02' },
  { label: 'Março', value: '03' },
  { label: 'Abril', value: '04' },
  { label: 'Maio', value: '05' },
  { label: 'Junho', value: '06' },
  { label: 'Julho', value: '07' },
  { label: 'Agosto', value: '08' },
  { label: 'Setembro', value: '09' },
  { label: 'Outubro', value: '10' },
  { label: 'Novembro', value: '11' },
  { label: 'Dezembro', value: '12' },
];

const YEARS = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { label: year.toString(), value: year.toString() };
});

export const AdminReportsScreen: React.FC = () => {
  const [startMonth, setStartMonth] = useState('01');
  const [startYear, setStartYear] = useState(new Date().getFullYear().toString());
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}`);
  const [endYear, setEndYear] = useState(new Date().getFullYear().toString());
  
  const [startMonthMenuVisible, setStartMonthMenuVisible] = useState(false);
  const [startYearMenuVisible, setStartYearMenuVisible] = useState(false);
  const [endMonthMenuVisible, setEndMonthMenuVisible] = useState(false);
  const [endYearMenuVisible, setEndYearMenuVisible] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const getMonthLabel = (value: string) => {
    return MONTHS.find(m => m.value === value)?.label ?? value;
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      
      // Construir datas no formato AAAA-MM-DD (primeiro e último dia do mês)
      const apiStartDate = `${startYear}-${startMonth}-01`;
      const lastDay = new Date(parseInt(endYear), parseInt(endMonth), 0).getDate();
      const apiEndDate = `${endYear}-${endMonth}-${lastDay}`;
      
      // Make three separate API calls
      const [ordersResponse, revenueResponse, topProductsResponse] = await Promise.all([
        api.get('/reports/orders', { params: { startDate: apiStartDate, endDate: apiEndDate } }),
        api.get('/reports/revenue', { params: { startDate: apiStartDate, endDate: apiEndDate } }),
        api.get('/reports/top-products', { params: { startDate: apiStartDate, endDate: apiEndDate, limit: 10 } }),
      ]);

      // Combine the responses
      setReportData({
        orderStats: ordersResponse?.data ?? null,
        revenueStats: revenueResponse?.data ?? null,
        topProducts: topProductsResponse?.data ?? null,
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Gerar Relatório
          </Text>
          
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Período Inicial
          </Text>
          
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text variant="labelMedium" style={styles.fieldLabel}>Mês</Text>
              <Menu
                visible={startMonthMenuVisible}
                onDismiss={() => setStartMonthMenuVisible(false)}
                anchor={
                  <TouchableRipple
                    onPress={() => setStartMonthMenuVisible(true)}
                    style={styles.dropdownButton}
                  >
                    <Text variant="bodyLarge">{getMonthLabel(startMonth)}</Text>
                  </TouchableRipple>
                }
              >
                {MONTHS.map((month) => (
                  <Menu.Item
                    key={month.value}
                    onPress={() => {
                      setStartMonth(month.value);
                      setStartMonthMenuVisible(false);
                    }}
                    title={month.label}
                  />
                ))}
              </Menu>
            </View>
            
            <View style={styles.dateField}>
              <Text variant="labelMedium" style={styles.fieldLabel}>Ano</Text>
              <Menu
                visible={startYearMenuVisible}
                onDismiss={() => setStartYearMenuVisible(false)}
                anchor={
                  <TouchableRipple
                    onPress={() => setStartYearMenuVisible(true)}
                    style={styles.dropdownButton}
                  >
                    <Text variant="bodyLarge">{startYear}</Text>
                  </TouchableRipple>
                }
              >
                {YEARS.map((year) => (
                  <Menu.Item
                    key={year.value}
                    onPress={() => {
                      setStartYear(year.value);
                      setStartYearMenuVisible(false);
                    }}
                    title={year.label}
                  />
                ))}
              </Menu>
            </View>
          </View>

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Período Final
          </Text>
          
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text variant="labelMedium" style={styles.fieldLabel}>Mês</Text>
              <Menu
                visible={endMonthMenuVisible}
                onDismiss={() => setEndMonthMenuVisible(false)}
                anchor={
                  <TouchableRipple
                    onPress={() => setEndMonthMenuVisible(true)}
                    style={styles.dropdownButton}
                  >
                    <Text variant="bodyLarge">{getMonthLabel(endMonth)}</Text>
                  </TouchableRipple>
                }
              >
                {MONTHS.map((month) => (
                  <Menu.Item
                    key={month.value}
                    onPress={() => {
                      setEndMonth(month.value);
                      setEndMonthMenuVisible(false);
                    }}
                    title={month.label}
                  />
                ))}
              </Menu>
            </View>
            
            <View style={styles.dateField}>
              <Text variant="labelMedium" style={styles.fieldLabel}>Ano</Text>
              <Menu
                visible={endYearMenuVisible}
                onDismiss={() => setEndYearMenuVisible(false)}
                anchor={
                  <TouchableRipple
                    onPress={() => setEndYearMenuVisible(true)}
                    style={styles.dropdownButton}
                  >
                    <Text variant="bodyLarge">{endYear}</Text>
                  </TouchableRipple>
                }
              >
                {YEARS.map((year) => (
                  <Menu.Item
                    key={year.value}
                    onPress={() => {
                      setEndYear(year.value);
                      setEndYearMenuVisible(false);
                    }}
                    title={year.label}
                  />
                ))}
              </Menu>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleGenerateReport}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Gerar Relatório
          </Button>
        </Card.Content>
      </Card>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {reportData && (
        <>
          {/* Relatório de Pedidos */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Relatório de Pedidos
              </Text>

              <View style={styles.statCard}>
                <Text variant="headlineMedium" style={styles.statValue}>
                  {reportData?.orderStats?.total ?? 0}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Total de Pedidos
                </Text>
              </View>

              <Text variant="titleMedium" style={styles.subtitle}>
                Pedidos por Status
              </Text>

              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Status</DataTable.Title>
                  <DataTable.Title numeric>Quantidade</DataTable.Title>
                </DataTable.Header>

                {reportData?.orderStats?.byStatus?.map((stat, index) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell>
                      <View style={styles.statusCell}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: STATUS_COLORS?.[stat?.status ?? ''] ?? '#999' },
                          ]}
                        />
                        <Text>{stat?.status ?? ''}</Text>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>{stat?.count ?? 0}</DataTable.Cell>
                  </DataTable.Row>
                )) ?? []}
              </DataTable>
            </Card.Content>
          </Card>

          {/* Relatório de Faturamento */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Relatório de Faturamento
              </Text>

              <View style={styles.statCard}>
                <Text variant="headlineMedium" style={styles.statValue}>
                  R$ {(reportData?.revenueStats?.total ?? 0).toFixed(2)}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Faturamento Total
                </Text>
              </View>

              <Text variant="titleMedium" style={styles.subtitle}>
                Faturamento por Forma de Pagamento
              </Text>

              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Forma de Pagamento</DataTable.Title>
                  <DataTable.Title numeric>Valor</DataTable.Title>
                </DataTable.Header>

                {reportData?.revenueStats?.byPaymentMethod?.map((stat, index) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell>{stat?.paymentMethod ?? ''}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      R$ {(stat?.total ?? 0).toFixed(2)}
                    </DataTable.Cell>
                  </DataTable.Row>
                )) ?? []}
              </DataTable>
            </Card.Content>
          </Card>

          {/* Produtos Mais Vendidos */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Produtos Mais Vendidos
              </Text>

              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Produto</DataTable.Title>
                  <DataTable.Title numeric>Qtd</DataTable.Title>
                  <DataTable.Title numeric>Receita</DataTable.Title>
                </DataTable.Header>

                {reportData?.topProducts?.map((product, index) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell>{product?.productName ?? ''}</DataTable.Cell>
                    <DataTable.Cell numeric>{product?.quantity ?? 0}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      R$ {(product?.revenue ?? 0).toFixed(2)}
                    </DataTable.Cell>
                  </DataTable.Row>
                )) ?? []}
              </DataTable>

              {(!reportData?.topProducts || reportData?.topProducts?.length === 0) && (
                <Text style={styles.noData}>Nenhum produto vendido no período</Text>
              )}
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
  },
  sectionLabel: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: theme.colors.primary,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  dateField: {
    flex: 1,
  },
  fieldLabel: {
    marginBottom: 4,
    color: '#666',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: theme.colors.primaryContainer,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
  },
  subtitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  statusCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 16,
  },
});
