import { CONFIG } from './config.js';

/**
 * Get ephemeral API key from auth server
 */
export async function getEphemeralKey() {
  try {
    const response = await fetch(`${CONFIG.API.SERVER_URL}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: CONFIG.API.MODEL,
        voice: CONFIG.API.VOICE
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get session key');
    }

    const data = await response.json();
    return data.client_secret.value;
  } catch (error) {
    console.error('Error getting session key:', error);
    throw error;
  }
} 