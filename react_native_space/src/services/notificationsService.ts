import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

// Exibe notificação mesmo com o app em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Push tokens reais só funcionam em builds standalone ou dev client, não no Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

class NotificationsService {
  async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    if (isExpoGo) {
      console.log('[Push] Expo Go detectado — registro de push token ignorado');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Permissão negada');
      return null;
    }

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF5722',
        });
      } catch (error) {
        console.warn('[Push] Erro ao criar canal Android:', error);
      }
    }

    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    if (!projectId) {
      console.warn('[Push] EXPO_PUBLIC_EAS_PROJECT_ID não configurado');
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      return tokenData.data;
    } catch (error) {
      console.warn('[Push] Não foi possível obter token de push:', error);
      return null;
    }
  }
}

export const notificationsService = new NotificationsService();
