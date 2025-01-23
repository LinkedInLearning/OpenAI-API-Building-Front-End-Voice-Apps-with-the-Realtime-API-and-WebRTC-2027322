# OpenAI Realtime API via WebRTC - Audio Visualization

Building on the basic implementation, this demo adds rich audio visualization capabilities using the Web Audio API, providing real-time visual feedback for both user input and AI output.

Key enhancements from the basic demo:
- Audio visualization for both user and AI audio streams
- Enhanced audio processing pipeline using Web Audio API
- Real-time waveform displays for input/output monitoring
- Improved user experience with visual feedback

NOTE: This demo authenticates API requests using an ephemeral key. The key is obtained through a call to a custom auth server. See [`../auth-server/README.md`](../auth-server/README.md) for details.

## Getting Started

1. Configure the auth server uri in `../server-config.js`
2. Configure your voice preference and other API settings in `src/config.js`
3. Open `index.html` in a web browser or serve it using a local development server

## Usage

1. Click the "Start Session" button to initialize a new chat session
2. Allow microphone access when prompted
3. Use the "Mute/Unmute" button to toggle your microphone on/off
4. Watch the audio visualizers respond to both your input and the AI's output
5. Click "End Session" to terminate the chat

## Configuration

Edit `src/config.js` to modify:
- AI model and voice settings
- API endpoints
- Server URL
- Default instructions

## Audio Visualization

The demo implements two distinct visualizers powered by the Web Audio API:
- `micVisualizer`: Real-time visualization of user's microphone input
- `aiVisualizer`: Dynamic display of AI's audio output

See MDN Web Docs: [Visualizations with Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API) for implementation details.

