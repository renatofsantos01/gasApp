import { ExpoConfig, ConfigContext } from 'expo/config';

// Mapeamento de subdomain → configurações de cada distribuidora
// Adicione uma nova entrada aqui ao criar uma nova distribuidora
const TENANT_CONFIGS: Record<string, { name: string; slug: string; bundleId: string }> = {
  demo: {
    name: 'Demo Gás',
    slug: 'demo-gas-app',
    bundleId: 'com.demogas.app',
  },
  // Exemplo de como adicionar uma nova distribuidora:
  // abc: {
  //   name: 'ABC Gás',
  //   slug: 'abc-gas-app',
  //   bundleId: 'com.abcgas.app',
  // },
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const subdomain = process.env.EXPO_PUBLIC_TENANT_SUBDOMAIN || 'demo';
  const tenant = TENANT_CONFIGS[subdomain] ?? TENANT_CONFIGS['demo'];

  return {
    ...config,
    name: tenant.name,
    slug: tenant.slug,
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: tenant.bundleId,
      buildNumber: '1',
      infoPlist: { ITSAppUsesNonExemptEncryption: false },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: tenant.bundleId,
      versionCode: 1,
    },
    web: { favicon: './assets/favicon.png' },
    plugins: [
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#FF5722',
          sounds: [],
        },
      ],
    ],
    extra: {
      eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? 'bf284fc2-a493-4ebf-acb0-de1ab1c203dc' },
    },
    updates: {
      // preencher após executar: eas update:configure
      // url: 'https://u.expo.dev/<EAS_PROJECT_ID>',
    },
    runtimeVersion: { policy: 'sdkVersion' },
  };
};
