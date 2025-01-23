# OpenAI Realtime API via WebRTC - Function Calling Integration

The most advanced demo in the series, adding OpenAI's function calling capabilities to enable the AI to interact with external services and APIs while maintaining real-time voice and text communication.

The demo uses the free [Open-Meteo](https://open-meteo.com/) weather API to retrieve current weather data..

Key enhancements from previous demos:
- Integration with OpenAI's function calling
- Real-world API interactions for current weather data
- Structured data handling in conversations
- Enhanced AI capabilities through tool access
- Seamless blend of voice, text, and function outputs

NOTE: This demo authenticates API requests using an ephemeral key. The key is obtained through a call to a custom auth server. See [`../auth-server/README.md`](../auth-server/README.md) for details.

## Getting Started

1. Configure the auth server uri in `../server-config.js`
2. Configure your voice preference and other API settings in `src/config.js`
3. Open `index.html` in a web browser or serve it using a local development server

## Usage

1. Click the "Start Session" button to initialize a new chat session
2. Allow microphone access when prompted
3. The AI can now handle complex requests requiring external data
4. Ask the AI to get the current weather in a specified location
5. Ask the AI about the weather in your current location
6. The AI seamlessly incorporates weather data from an external API
7. All previous features (transcripts, history) remain available
8. Click "End Session" to terminate the chat

## Configuration

Edit `src/config.js` to modify:
- API endpoints
- Voice settings
- Server URL
- Default instructions
- Available functions and tools

