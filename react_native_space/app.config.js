const IS_DEV = process.env.APP_ENV === 'development';

// Identidade do cliente (white-label)
const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'TechGás';
const APP_SLUG = process.env.EXPO_PUBLIC_APP_SLUG || 'techgas-app';
const BUNDLE_ID = process.env.APP_BUNDLE_ID || 'br.com.techgas.demo';
const VERSION = process.env.APP_VERSION || '1.0.0';
const BUILD_NUMBER = process.env.APP_BUILD_NUMBER || '1';
const VERSION_CODE = parseInt(process.env.APP_VERSION_CODE || '1', 10);
const TENANT_SUBDOMAIN = process.env.EXPO_PUBLIC_TENANT_SUBDOMAIN || 'demo';
const ADMIN_URL = process.env.EXPO_PUBLIC_ADMIN_URL || 'https://gasapp-production-9773.up.railway.app';
const PRIVACY_POLICY_URL = `${ADMIN_URL}/privacidade/${TENANT_SUBDOMAIN}`;

export default {
  expo: {
    name: IS_DEV ? `${APP_NAME} (dev)` : APP_NAME,
    slug: APP_SLUG,
    version: VERSION,
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
      supportsTablet: false,
      bundleIdentifier: BUNDLE_ID,
      buildNumber: BUILD_NUMBER,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          'Precisamos da sua localização para atribuir pedidos próximos a você.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: BUNDLE_ID,
      versionCode: VERSION_CODE,
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-secure-store',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Precisamos da sua localização para atribuir pedidos próximos a você.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#FF5722',
          sounds: [],
        },
      ],
    ],
    extra: {
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '',
      },
      privacyPolicyUrl: PRIVACY_POLICY_URL,
    },
  },
};
