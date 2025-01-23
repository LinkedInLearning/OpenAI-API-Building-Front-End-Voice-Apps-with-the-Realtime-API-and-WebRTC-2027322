/**
 * OpenAI Realtime API via WebRTC with Live Transcription
 * ======================================================
 * 
 * Enhanced JavaScript implementation of OpenAI's Realtime API using WebRTC.
 * This version adds live transcription of both user and AI speech alongside
 * text chat and audio visualization.
 * 
 * Features:
 * - Bidirectional voice communication with the AI
 * - Live transcription of user speech using Whisper
 * - Text chat interface for text-only interactions
 * - Audio visualization for both user and AI audio
 * - Interruption handling and turn detection
 * - Status display showing connection state
 * - Comprehensive console logging
 * 
 * NOTE: This demo authenticates API requests using an ephemeral key.
 * The key is obtained through a call to a custom auth server.
 * See `../auth-server/README.md` for details.
 */

import { CONFIG } from './config.js';
import { createVisualizer } from './visualizer.js';
import { getEphemeralKey } from './auth-api.js';
import { ChatUI } from './chat.js';

/**
 * RealtimeDemo Class
 * Manages voice and text interactions with the Realtime API.
 */
class RealtimeDemo {
  constructor() {
    // Initialize state
    this.peerConnection = null;
    this.mediaStream = null;
    this.isConnected = false;
    this.dataChannel = null;
    this.hasWelcomed = false;
    this.audioElement = null;
    this.isTalking = true;
    this.micVisualizer = null;
    this.aiVisualizer = null;
    this.chatUI = null;

    // Get DOM elements
    this.connectionButton = document.getElementById('connection-button');
    this.micButton = document.getElementById('mic-button');
    this.statusDiv = document.getElementById('status');

    // Bind event listeners
    this.connectionButton.addEventListener('click', () => this.toggleSession());
    this.micButton.addEventListener('click', () => this.toggleTalk());

    // Initialize chat UI with message handler
    this.chatUI = new ChatUI((message) => this.handleChatMessage(message));
  }

  /**
   * Update status message displayed to the user
   * 
   * @param {string} message - The status message to display
   */
  updateStatus(message) {
    this.statusDiv.textContent = message;
  }

  /**
   * Cleanup
   * Properly closes all connections and frees resources:
   * - Stops media streams
   * - Closes WebRTC connection
   * - Removes audio elements
   * - Stops visualizers
   * - Resets UI state
   */
  closeConnection() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    if (this.audioElement) {
      this.audioElement.remove();
    }
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    if (this.aiVisualizer) {
      this.aiVisualizer.stop();
    }
    if (this.micVisualizer) {
      this.micVisualizer.stop();
    }
    if (this.chatUI) {
      this.chatUI.clearMessages();
    }

    this.peerConnection = null;
    this.mediaStream = null;
    this.audioElement = null;
    this.dataChannel = null;
    this.micVisualizer = null;
    this.aiVisualizer = null;
    this.isConnected = false;
    this.isTalking = true;
    this.micButton.disabled = true;
    this.micButton.textContent = 'Unmute Mic';
    this.connectionButton.textContent = 'Create Session';
    this.updateStatus('Not connected');
  }

  /**
   * Text Chat Handler
   * Processes text messages and requests text-only responses.
   * Messages sent via text receive text-only responses.
   * 
   * @param {string} message - The message to send to the API
   */
  handleChatMessage(message) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.error('Data channel not ready');
      return;
    }

    // Send the text message
    const messageEvent = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };
    console.log('Sending text-only message:', messageEvent);
    this.dataChannel.send(JSON.stringify(messageEvent));

    // Request a text-only response using the same instructions as voice
    const textResponseEvent = {
      type: 'response.create',
      response: {
        modalities: ['text'], // API returns only text
        instructions: CONFIG.DEFAULTS.DEFAULT_INSTRUCTIONS,
      },
    };
    console.log('Requesting text-only response:', textResponseEvent);
    this.dataChannel.send(JSON.stringify(textResponseEvent));
  }

  /**
   * Incoming Audio Setup
   * Sets up the audio element to play remote audio from the API.
   * Also initializes the AI audio visualizer.
   * 
   * @throws {Error} If audio element setup fails
   */
  async setupIncomingAudio() {
    try {
      // Initialize visualizer
      const aiVisualizer = createVisualizer();

      // Set up audio element
      this.audioElement = document.createElement('audio');
      this.audioElement.autoplay = true;
      document.body.appendChild(this.audioElement);

      // Set up to play remote audio from the API
      this.peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        this.audioElement.srcObject = event.streams[0];
        this.audioElement.addEventListener('canplay', () => {
          console.log('Audio is ready to play');
          this.aiVisualizer = aiVisualizer;
          if (this.aiVisualizer.init(this.audioElement, event.streams[0])) {
            console.log('Visualizer started successfully');
          }
          this.audioElement.play().catch(e => console.error('Error playing audio:', e));
        }, { once: true });
      };
    } catch (error) {
      this.updateStatus('Error setting up incoming audio: ' + error.message);
      throw error;
    }
  }

  /**
   * Microphone Setup
   * Requests microphone access and adds the audio track to the WebRTC connection.
   * Also initializes the microphone visualizer.
   * 
   * @throws {Error} If microphone access is denied or unavailable
   */
  async setupMicrophone() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Initialize visualizer
      this.micVisualizer = createVisualizer('micVisualizer');
      if (this.micVisualizer.init(null, this.mediaStream)) {
        console.log('User Visualizer started successfully');
      }

      const audioTrack = this.mediaStream.getAudioTracks()[0];
      audioTrack.enabled = true;
      this.peerConnection.addTrack(audioTrack, this.mediaStream);
      console.log('Microphone setup complete');
    } catch (error) {
      this.updateStatus('Error accessing microphone: ' + error.message);
      throw error;
    }
  }

  /**
   * WebRTC Event Handlers
   * Monitor the data channel for events:
   * - onopen: Send initial greeting, set instructions for the voice assistant
   * - onclose: Update connection status
   * - onmessage: Process incoming messages from the API, including text responses
   */
  setupDataChannelHandlers() {
    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      this.updateStatus('Connected to Realtime API');

      if (!this.hasWelcomed) {
        console.log('Sending welcome message');
        const welcomeEvent = {
          type: 'response.create',
          response: {
            modalities: ['audio', 'text'],
            instructions: CONFIG.DEFAULTS.WELCOME_INSTRUCTIONS,
            max_output_tokens: CONFIG.API.MAX_OUTPUT_TOKENS,
          },
        };
        this.dataChannel.send(JSON.stringify(welcomeEvent));
        this.hasWelcomed = true;
      }

      // Set instructions for the voice assistant
      const setIntructions = {
        type: "session.update",
        session: {
          instructions: CONFIG.DEFAULTS.DEFAULT_INSTRUCTIONS,
          turn_detection: CONFIG.API.TURN_DETECTION,
          max_response_output_tokens: CONFIG.API.MAX_OUTPUT_TOKENS,
          input_audio_transcription: {
            model: "whisper-1"
          },
        },
      };
      this.dataChannel.send(JSON.stringify(setIntructions));
    };

    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
      this.updateStatus('Disconnected from Realtime API');
    };

    this.dataChannel.onmessage = (event) => {
      const realtimeEvent = JSON.parse(event.data);
      console.log('Received event:', realtimeEvent);

      // Speech started
      if (realtimeEvent.type === "input_audio_buffer.speech_started") {
        this.chatUI.addMessage("Speaking...", 'user');
        this.updateStatus('User speaking');
      }
      // Speech stopped
      else if (realtimeEvent.type === "input_audio_buffer.speech_stopped") {
        this.updateStatus('Speech stopped');
      }
      // Audio buffer committed
      else if (realtimeEvent.type === "input_audio_buffer.committed") {
        this.chatUI.updateLastMessage("Processing speech...", 'user');
        this.updateStatus('Processing speech...');
      }
      // Partial transcription
      else if (realtimeEvent.type === "conversation.item.input_audio_transcription") {
        const partialText = realtimeEvent.transcript ?? realtimeEvent.text ?? "User is speaking...";
        this.chatUI.updateLastMessage(partialText, 'user');
      }
      // Final transcription
      else if (realtimeEvent.type === "conversation.item.input_audio_transcription.completed") {
        if (realtimeEvent.transcript) {
          // Replace the last "in progress" message with the final transcript
          this.chatUI.updateLastMessage(realtimeEvent.transcript, 'user');
          this.updateStatus('Connected');
        }
      }
      // AI response transcript
      else if (realtimeEvent.type === "response.audio_transcript.done") {
        if (realtimeEvent.transcript) {
          this.chatUI.addMessage(realtimeEvent.transcript, 'ai');
        }
      }

      // Display text response
      else if (realtimeEvent.type === "response.done") {
        console.log('Received text response:', realtimeEvent);
        if (realtimeEvent.response?.output) {
          const textResponse = realtimeEvent.response.output[0]?.content[0]?.text;
          if (textResponse) {
            this.chatUI.addMessage(textResponse, 'ai');
          }
        }
      }
    };
  }

  /**
   * WebRTC Setup
   * Create and configure the WebRTC peer connection with the API.
   * - Set up audio playback for the AI with visualization
   * - Create a data channel for control messages
   * - Establish a connection using SDP offer/answer
   * 
   * @param {string} token - The ephemeral API key from getEphemeralKey()
   * @throws {Error} If WebRTC setup fails
   */
  async setupWebRTC(token) {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Set up incoming audio with visualizer
    await this.setupIncomingAudio();

    // Create data channel for control messages
    this.dataChannel = this.peerConnection.createDataChannel("oai-events");
    this.setupDataChannelHandlers();

    try {
      // Get microphone access and set up visualizer
      await this.setupMicrophone();

      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await this.peerConnection.setLocalDescription(offer);

      const response = await fetch(`${CONFIG.API.BASE_URL}?model=${CONFIG.API.MODEL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      });

      if (!response.ok) {
        throw new Error(`Failed to connect: ${response.status} ${response.statusText}`);
      }

      const answer = {
        type: 'answer',
        sdp: await response.text()
      };
      await this.peerConnection.setRemoteDescription(answer);
      console.log('WebRTC connection established');
    } catch (error) {
      this.updateStatus('Error establishing connection: ' + error.message);
      throw error;
    }
  }

  /**
   * The Connection Button
   * - "Create Session" state: Get ephemeral key, set up WebRTC, enable mic control.
   * - "Close Session" state: Clean up and reset all resources.
   */
  async toggleSession() {
    if (!this.isConnected) {
      try {
        this.updateStatus('Connecting...');
        const token = await getEphemeralKey();
        await this.setupWebRTC(token);
        this.isConnected = true;
        this.micButton.disabled = false;
        this.micButton.textContent = 'Mute Mic';
        this.connectionButton.textContent = 'Close Session';
        this.updateStatus('Connected');
      } catch (error) {
        this.updateStatus('Connection failed: ' + error.message);
        console.error('Connection error:', error);
      }
    } else {
      this.closeConnection();
    }
  }

  /**
   * Mute/Unmute Button
   * Enables/disables the microphone input stream
   */
  toggleTalk() {
    if (this.mediaStream) {
      this.isTalking = !this.isTalking;
      const audioTrack = this.mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = this.isTalking;
        this.micButton.textContent = this.isTalking ? 'Mute Mic' : 'Unmute Mic';
        this.updateStatus(this.isTalking ? 'Microphone active' : 'Microphone muted');
      }
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new RealtimeDemo();
});
