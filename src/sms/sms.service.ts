import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendSms(to: string, message: string): Promise<void> {
    const apiToken = process.env.ZENVIA_API_TOKEN;
    const from = process.env.ZENVIA_FROM || 'DistribuidoraGas';

    if (!apiToken) {
      this.logger.warn(`[DEV MODE] SMS para ${to}: ${message}`);
      return;
    }

    // Formatar para E.164 sem o "+": remove não-dígitos e adiciona 55 se necessário
    const digits = to.replace(/\D/g, '');
    const formattedTo = digits.startsWith('55') ? digits : `55${digits}`;

    const response = await fetch('https://api.zenvia.com/v2/channels/sms/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-TOKEN': apiToken,
      },
      body: JSON.stringify({
        from,
        to: formattedTo,
        contents: [{ type: 'text', text: message }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Zenvia error: ${error}`);
      throw new Error('Falha ao enviar SMS');
    }
  }
}
