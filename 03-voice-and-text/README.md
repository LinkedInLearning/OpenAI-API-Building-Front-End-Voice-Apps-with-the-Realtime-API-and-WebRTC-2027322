# OpenAI Realtime API via WebRTC - Voice and Text Integration

Expanding on the audio visualization demo, this implementation adds text-based interactions and real-time transcription, creating a multi-modal interface for AI communication.

Key enhancements from previous demos:
- Real-time voice transcription for user input
- Text-based chat interface alongside voice
- Dual input modes (voice/text) with seamless switching
- Text display of AI responses with voice output
- Mid-sentence interruption handling

NOTE: This demo authenticates API requests using an ephemeral key. The key is obtained through a call to a custom auth server. See [`../auth-server/README.md`](../auth-server/README.md) for details.

## Getting Started

1. Configure the auth server uri in `../server-config.js`
2. Configure your voice preference and other API settings in `src/config.js`
3. Open `index.html` in a web browser or serve it using a local development server

## Usage

1. Click the "Start Session" button to initialize a new chat session
2. Allow microphone access when prompted
3. The interface displays both voice input and AI responses as text
4. Use voice input or switch to text mode with the "Mute" button
5. Send text prompts through the input field when in text mode
6. Interrupt the AI mid-response to get updated replies
7. Click "End Session" to terminate the chat

## Configuration

Edit `src/config.js` to modify:
- API endpoints
- Voice settings
- Server URL
- Default instructions

