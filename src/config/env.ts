/**
 * Environment Configuration
 * 
 * Centralizes access to environment variables.
 * All API keys and configuration should be accessed through this module.
 */

interface EnvironmentConfig {
  OPENWEATHER_API_KEY: string;
  GEMINI_API_KEY: string;
}

export const ENV: EnvironmentConfig = {
  OPENWEATHER_API_KEY: import.meta.env.VITE_OPENWEATHER_API_KEY || '',
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
};

/**
 * Validates environment configuration and logs warnings for missing keys.
 * Call this in main.tsx during app initialization.
 */
export function validateEnvironment(): void {
  const warnings: string[] = [];

  if (!ENV.OPENWEATHER_API_KEY) {
    warnings.push('⚠️ VITE_OPENWEATHER_API_KEY not set. Weather features will not work.');
  }

  if (!ENV.GEMINI_API_KEY) {
    warnings.push('⚠️ VITE_GEMINI_API_KEY not set. AI Comedy Judge will not work.');
  }

  if (warnings.length > 0) {
    console.warn('Environment Configuration Warnings:');
    warnings.forEach(warning => console.warn(warning));
    console.warn('See README.md for setup instructions.');
  } else {
    console.log('✅ Environment configuration loaded successfully');
  }
}

// Type augmentation for Vite env
declare global {
  interface ImportMetaEnv {
    VITE_OPENWEATHER_API_KEY: string;
    VITE_GEMINI_API_KEY: string;
  }
}

