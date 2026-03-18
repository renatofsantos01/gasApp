import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendSms(to: string, message: string): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      // Modo desenvolvimento: exibe o código no console
      this.logger.warn(`[DEV MODE] SMS para ${to}: ${message}`);
      return;
    }

    // Formatar para E.164: remove não-dígitos e adiciona +55 se necessário
    const digits = to.replace(/\D/g, '');
    const formattedTo = digits.startsWith('55') ? `+${digits}` : `+55${digits}`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: formattedTo,
      From: fromPhone,
      Body: message
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Twilio error: ${error}`);
      throw new Error('Falha ao enviar SMS');
    }
  }
}
