# OpenAI Realtime API via WebRTC - Basic Implementation

A foundational vanilla JavaScript implementation demonstrating the core concepts of the OpenAI Realtime API through WebRTC, enabling basic voice-to-voice chat capabilities.

This demo serves as the starting point for exploring realtime AI interactions:
- Basic WebRTC setup and connection handling
- Simple voice input/output through the computer microphone
- Core integration with OpenAI's Realtime API
- Minimal interface for testing voice interactions

NOTE: This demo authenticates API requests using an ephemeral key. The key is obtained through a call to a custom auth server. See [`../auth-server/README.md`](../auth-server/README.md) for details.

## Getting Started

1. Configure your voice preference, instructions, and ephemeral token server URI in `app.js`
2. Open `index.html` in a web browser or serve it using a local development server

## Usage

1. Click the "Start Session" button to initialize a new chat session
2. Allow microphone access when prompted
3. Use the "Mute/Unmute" button to toggle your microphone on/off
4. The AI responds using the configured voice and instructions
5. Click "End Session" to terminate the chat

## Configuration

Edit `src/config.js` to modify:
- AI model and voice settings
- API endpoints
- Server URL
- Default instructions 