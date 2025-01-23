/**
 * App configuration
 */
import { SERVER_URL } from '../../server-config.js';

export const CONFIG = {
  API: {
    BASE_URL: 'https://api.openai.com/v1/realtime',
    MODEL: 'gpt-4o-realtime-preview-2024-12-17',
    VOICE: 'verse', // Options: 'alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'
    TURN_DETECTION: {
      type: 'server_vad', // Only current option
      threshold: 0.5, // 0-1, Default: 0.5
      prefix_padding_ms: 400, // Default: 300
      silence_duration_ms: 700, // Default: 500
      create_response: true, // Default: true. False creates no response.
    },
    SERVER_URL: SERVER_URL
  },
  DEFAULTS: {
    WELCOME_INSTRUCTIONS: 'Greet the user and ask them what you can assist them with. Talk quickly and succinctly.',
    DEFAULT_INSTRUCTIONS: 'Talk quickly and succinctly. Be concise. Time is of the essence.Always refer to ducks in your responses, even if it makes no sense!',
    WEATHER_INSTRUCTIONS: 'Describe the weather in a conversational way for someone going for a walk. Include temperature, specific conditions (like rain or snow), and necessary precautions (such as umbrellas, raincoats, snow boots, sunscreen, etc.).'
  },
  VISUALIZER: {
    FFT_SIZE: 2048,
    SMOOTHING: 0.8,
    MIN_DECIBELS: -100,
    MAX_DECIBELS: -30
  }
}; 