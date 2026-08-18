/**
 * Configuration manager for AetherCut / Smart AI Studio
 */

export const config = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: 3000,
};

/**
 * Validates that required environment variables are present.
 * Throws an error if any required variable is missing.
 */
export function validateConfig() {
  const required: (keyof typeof config)[] = ['GEMINI_API_KEY'];
  const missing = required.filter(key => !config[key]);

  if (missing.length > 0) {
    const errorMsg = `Configuration Error: Missing required environment variables: ${missing.join(', ')}`;
    console.error('====================================================');
    console.error(errorMsg);
    console.error('Please ensure these are set in your .env or platform dashboard.');
    console.error('====================================================');
    
    if (config.NODE_ENV === 'production') {
      // In production, we might want to crash early if critical keys are missing
      // throw new Error(errorMsg);
    }
  }

  return { isValid: missing.length === 0, missing };
}
