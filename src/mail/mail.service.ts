import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordReset(to: string, code: string, appName: string): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      this.logger.warn(`[DEV MODE] E-mail de reset para ${to} | Código: ${code}`);
      return;
    }

    const fromEmail = process.env.MAIL_FROM || 'noreply@distribuidoragas.app';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #FF5722;">${appName}</h2>
        <h3>Redefinição de senha</h3>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>Use o código abaixo para criar uma nova senha. Ele é válido por <strong>15 minutos</strong>.</p>
        <div style="background: #F5F5F5; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #FF5722;">${code}</span>
        </div>
        <p style="color: #757575; font-size: 13px;">
          Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma.
        </p>
      </div>
    `;

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail },
        subject: `${appName} — Código para redefinir sua senha`,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`SendGrid error: ${error}`);
      throw new Error('Falha ao enviar e-mail');
    }
  }
}
