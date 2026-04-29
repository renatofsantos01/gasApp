import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private get credentials() {
    return {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      serviceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
    };
  }

  private formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
  }

  private authHeader(accountSid: string, authToken: string): string {
    return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;
  }

  async sendVerification(to: string): Promise<void> {
    const { accountSid, authToken, serviceSid } = this.credentials;

    if (!accountSid || !authToken || !serviceSid) {
      this.logger.warn(`[DEV MODE] Código de verificação enviado para ${to}`);
      return;
    }

    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: this.authHeader(accountSid, authToken),
        },
        body: new URLSearchParams({ To: this.formatPhone(to), Channel: 'sms' }).toString(),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Twilio Verify error: ${error}`);
      throw new Error('Falha ao enviar código de verificação');
    }
  }

  async checkVerification(to: string, code: string): Promise<boolean> {
    const { accountSid, authToken, serviceSid } = this.credentials;

    if (!accountSid || !authToken || !serviceSid) {
      this.logger.warn(`[DEV MODE] Verificação de código para ${to}: ${code}`);
      return true;
    }

    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationChecks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: this.authHeader(accountSid, authToken),
        },
        body: new URLSearchParams({ To: this.formatPhone(to), Code: code }).toString(),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Twilio Verify check error: ${error}`);
      throw new Error('Falha ao verificar código');
    }

    const data = await response.json() as { status: string };
    return data.status === 'approved';
  }
}
