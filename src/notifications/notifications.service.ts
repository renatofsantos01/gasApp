import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  async sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: object,
  ): Promise<void> {
    const validTokens = tokens.filter((t) => /^ExponentPushToken\[.+\]$/.test(t));

    if (validTokens.length === 0) {
      this.logger.warn(`[PUSH] Nenhum token válido para: "${title}"`);
      return;
    }

    const messages = validTokens.map((to) => ({
      to,
      title,
      body,
      data: data ?? {},
      sound: 'default',
    }));

    // Expo aceita até 100 mensagens por request
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      try {
        const response = await fetch(this.EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        if (!response.ok) {
          const error = await response.text();
          this.logger.error(`Expo Push error: ${error}`);
        }
      } catch (err) {
        this.logger.error(`Falha ao enviar push notification: ${err}`);
      }
    }
  }
}
