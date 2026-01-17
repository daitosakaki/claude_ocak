export { default as appConfig } from './app.config';
export { default as servicesConfig } from './services.config';

// Config types
export interface AppConfig {
  port: number;
  nodeEnv: string;
  cors: {
    origins: string[];
  };
  rateLimit: {
    ip: {
      unauthenticated: number;
      authenticated: number;
      windowMs: number;
    };
    user: {
      limit: number;
      windowMs: number;
    };
    endpoints: Record<string, { limit: number; windowMs: number }>;
  };
}

export interface ServiceConfig {
  name: string;
  url: string;
  timeout: number;
}

export interface ServicesConfig {
  auth: ServiceConfig;
  user: ServiceConfig;
  post: ServiceConfig;
  feed: ServiceConfig;
  interaction: ServiceConfig;
  media: ServiceConfig;
  message: ServiceConfig;
  notification: ServiceConfig;
  listing: ServiceConfig;
  dating: ServiceConfig;
  admin: ServiceConfig;
}
