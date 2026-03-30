# Clientes White-Label

Cada pasta dentro de `clients/` representa uma distribuidora.

## Estrutura por cliente

```
clients/
└── nome-cliente/
    ├── client.env          # Variáveis de configuração
    └── assets/
        ├── icon.png              # 1024x1024px
        ├── adaptive-icon.png     # 1024x1024px (Android)
        ├── splash-icon.png       # 200x200px (centralizado em fundo branco)
        └── notification-icon.png # 96x96px (fundo transparente, branco)
```

## Como gerar build para um cliente

```bash
# Android (APK para teste interno)
yarn build:client alemao android preview

# Android (AAB para Google Play)
yarn build:client alemao android production

# iOS (para App Store)
yarn build:client alemao ios production
```

## Como adicionar novo cliente

1. Criar pasta `clients/nome-cliente/`
2. Copiar e editar `clients/demo/client.env` com os dados do cliente
3. Adicionar os assets personalizados em `clients/nome-cliente/assets/`
4. Rodar o build

## Variáveis do client.env

| Variável | Descrição | Exemplo |
|---|---|---|
| `EXPO_PUBLIC_APP_NAME` | Nome do app na loja | `Tele dos Alemão` |
| `EXPO_PUBLIC_APP_SLUG` | Slug único no EAS | `techgas-alemao` |
| `APP_BUNDLE_ID` | Bundle ID único | `br.com.techgas.alemao` |
| `APP_VERSION` | Versão visível | `1.0.0` |
| `APP_BUILD_NUMBER` | Build iOS | `1` |
| `APP_VERSION_CODE` | Build Android | `1` |
| `EXPO_PUBLIC_TENANT_SUBDOMAIN` | Subdomain no backend | `alemao` |
| `EXPO_PUBLIC_API_URL` | URL do backend | `https://gasapp-production-9773.up.railway.app` |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | ID do projeto EAS | `bf284fc2-...` |
