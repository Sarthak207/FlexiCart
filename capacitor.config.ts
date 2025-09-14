import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.371983681de14963bfa7ee272b56a806',
  appName: 'smart-bag-pilot',
  webDir: 'dist',
  server: {
    url: 'https://37198368-1de1-4963-bfa7-ee272b56a806.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  }
};

export default config;