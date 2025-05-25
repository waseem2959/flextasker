// src/config/index.ts
interface Config {
  apiUrl: string;
  socketUrl: string;
  uploadUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

export const config: Config = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000',
  uploadUrl: import.meta.env.VITE_UPLOAD_URL ?? 'http://localhost:3000/uploads',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Validate configuration at startup
if (!config.apiUrl || !config.socketUrl) {
  throw new Error('Missing required environment variables');
}