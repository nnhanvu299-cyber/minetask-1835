import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.minetask.gamifiedworkflow',
  appName: 'MineTask',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
