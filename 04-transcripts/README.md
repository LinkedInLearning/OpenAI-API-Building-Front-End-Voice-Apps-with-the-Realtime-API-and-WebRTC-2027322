# OpenAI Realtime API via WebRTC - Chat History and Transcripts

Building on the voice and text integration, this demo adds comprehensive chat history management and transcript generation capabilities.

Key enhancements from previous demos:
- Persistent chat history across sessions
- Downloadable conversation transcripts
- Enhanced context management for AI responses
- Improved conversation continuity
- Session state preservation

NOTE: This demo authenticates API requests using an ephemeral key. The key is obtained through a call to a custom auth server. See [`../auth-server/README.md`](../auth-server/README.md) for details.

## Getting Started

1. Configure the auth server uri in `../server-config.js`
2. Configure your voice preference and other API settings in `src/config.js`
3. Open `index.html` in a web browser or serve it using a local development server

## Usage

1. Click the "Start Session" button to initialize a new chat session
2. Allow microphone access when prompted
3. The interface maintains a scrollable history of all interactions
4. Use voice or text input modes as needed
5. Download conversation transcripts at any time
6. Previous context is maintained between sessions
7. Click "End Session" to terminate the chat

## Configuration

Edit `src/config.js` to modify:
- API endpoints
- Voice settings
- Server URL
- Default instructions

