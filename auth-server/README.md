# Realtime API Session Server

A basic Express server providing ephemeral session keys for the OpenAI Realtime API.
Use this server to avoid exposing your OpenAI API key in client-side code.
See OpenAI's [Realtime API with WebRTC](https://platform.openai.com/docs/guides/realtime-webrtc#creating-an-ephemeral-token) guide and [API Reference](https://platform.openai.com/docs/api-reference/realtime-sessions) for more information.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the serverroot directory with your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
PORT=3000
```

3. Start the server:
```bash
node server.js
```

## API Endpoints

### POST /session

Creates a new session and returns a Session Object.

**Request Body:**
```json
{
  "model": "gpt-4o-realtime-preview-2024-12-17",
  "voice": "verse" // Options: 'alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'.
}
```

**Response:**
The ephemeral key is fou
```json
{
  "id": "sess_001",
  "object": "realtime.session",
  "model": "gpt-4o-realtime-preview-2024-12-17",
  "modalities": ["audio", "text"],
  "instructions": "You are a friendly assistant.",
  "voice": "alloy",
  "input_audio_format": "pcm16",
  "output_audio_format": "pcm16",
  "input_audio_transcription": {
      "model": "whisper-1"
  },
  "turn_detection": null,
  "tools": [],
  "tool_choice": "none",
  "temperature": 0.7,
  "max_response_output_tokens": 200,
  "client_secret": {
    "value": "ek_abc123", 
    "expires_at": 1234567890
  }
}
```

The ephemeral key is the `value` in the `client_secret` object. 
Ephemeral keys expire one minute after being issued.

## Security Notes

- Never expose your OpenAI API key in client-side code
- The server uses CORS to allow requests from any origin in development
- In production, configure CORS to only accept requests from your trusted domains 