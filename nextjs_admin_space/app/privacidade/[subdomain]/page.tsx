const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gasapp-production-9773.up.railway.app';

interface TenantPublic {
  id: string;
  appName: string;
  companyName: string;
  primaryColor: string;
  subdomain: string;
}

async function getTenant(subdomain: string): Promise<TenantPublic | null> {
  try {
    const res = await fetch(`${API_URL}/tenant/subdomain/${subdomain}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PrivacidadePage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenant(subdomain);

  const companyName = tenant?.companyName || 'TechGás';
  const primaryColor = tenant?.primaryColor || '#FF5722';
  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Política de Privacidade — {companyName}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                 color: #1a1a1a; background: #f9f9f9; }
          .container { max-width: 760px; margin: 0 auto; padding: 40px 24px 80px; }
          header { border-bottom: 3px solid ${primaryColor}; padding-bottom: 24px; margin-bottom: 32px; }
          header h1 { font-size: 1.6rem; font-weight: 700; color: ${primaryColor}; }
          header p { color: #666; margin-top: 6px; font-size: 0.9rem; }
          h2 { font-size: 1.1rem; font-weight: 600; color: ${primaryColor};
               margin: 32px 0 10px; }
          p, li { line-height: 1.7; color: #333; font-size: 0.95rem; }
          ul { padding-left: 20px; }
          li { margin-bottom: 6px; }
          footer { margin-top: 48px; font-size: 0.82rem; color: #999; text-align: center; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <header>
            <h1>Política de Privacidade</h1>
            <p>{companyName} &mdash; Vigente a partir de {today}</p>
          </header>

          <p>
            A <strong>{companyName}</strong> (&quot;nós&quot;, &quot;nosso&quot;) está comprometida com a
            proteção dos seus dados pessoais. Esta Política de Privacidade descreve como coletamos,
            usamos e protegemos as informações fornecidas ao utilizar nosso aplicativo de entrega de gás.
          </p>

          <h2>1. Dados que Coletamos</h2>
          <ul>
            <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone e senha.</li>
            <li><strong>Endereços de entrega:</strong> rua, número, complemento, bairro, cidade e CEP.</li>
            <li>
              <strong>Localização (apenas entregadores):</strong> localização em primeiro plano enquanto
              o aplicativo estiver aberto e o entregador estiver ativo, para atribuição de pedidos próximos.
            </li>
            <li><strong>Histórico de pedidos:</strong> produtos, valores e status dos pedidos realizados.</li>
            <li><strong>Token de notificação:</strong> para envio de atualizações sobre seus pedidos.</li>
          </ul>

          <h2>2. Como Usamos seus Dados</h2>
          <ul>
            <li>Processar e entregar seus pedidos de gás.</li>
            <li>Enviar notificações sobre o status do pedido.</li>
            <li>Melhorar a experiência do aplicativo.</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>

          <h2>3. Compartilhamento de Dados</h2>
          <p>
            Não vendemos seus dados pessoais. Podemos compartilhá-los apenas com prestadores de serviço
            essenciais à operação (ex.: serviço de envio de e-mails e notificações push), sempre sob
            acordos de confidencialidade e limitados ao mínimo necessário.
          </p>

          <h2>4. Armazenamento e Segurança</h2>
          <p>
            Seus dados são armazenados em servidores seguros com criptografia em trânsito (HTTPS/TLS).
            Senhas são armazenadas utilizando hash criptográfico (bcrypt) e nunca em texto puro.
            Tokens de autenticação são guardados de forma segura no dispositivo.
          </p>

          <h2>5. Seus Direitos (LGPD)</h2>
          <p>
            Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem o direito de:
          </p>
          <ul>
            <li>Confirmar a existência de tratamento dos seus dados;</li>
            <li>Acessar, corrigir ou atualizar seus dados;</li>
            <li>Solicitar a exclusão dos seus dados;</li>
            <li>Revogar o consentimento a qualquer momento;</li>
            <li>Solicitar a portabilidade dos seus dados.</li>
          </ul>
          <p>Para exercer seus direitos, entre em contato pelo e-mail informado no cadastro da distribuidora.</p>

          <h2>6. Retenção de Dados</h2>
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa ou pelo período necessário para cumprir
            obrigações legais. Após a exclusão da conta, os dados são removidos em até 30 dias,
            salvo obrigação legal de retenção.
          </p>

          <h2>7. Cookies e Armazenamento Local</h2>
          <p>
            O aplicativo utiliza armazenamento seguro no dispositivo exclusivamente para manter sua
            sessão autenticada. Não utilizamos cookies de rastreamento ou publicidade.
          </p>

          <h2>8. Alterações nesta Política</h2>
          <p>
            Reservamo-nos o direito de atualizar esta política. Mudanças relevantes serão comunicadas
            pelo aplicativo ou por e-mail. O uso contínuo do serviço após a notificação implica
            aceitação das novas condições.
          </p>

          <h2>9. Contato</h2>
          <p>
            Dúvidas sobre privacidade? Entre em contato com a <strong>{companyName}</strong> pelo
            aplicativo ou pelos canais de atendimento informados no momento do cadastro.
          </p>

          <footer>
            &copy; {new Date().getFullYear()} {companyName}. Todos os direitos reservados.
          </footer>
        </div>
      </body>
    </html>
  );
}
