/**
 * OpenAI Realtime API via WebRTC with Audio Visualizer
 * ====================================================
 * 
 * Enhanced JavaScript implementation of OpenAI's Realtime API using WebRTC.
 * This version adds audio visualization for both user and AI audio.
 * 
 * Features:
 * - Bidirectional voice communication with the AI
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

/**
 * RealtimeDemo Class
 * Manages the entire demo with audio visualization.
 */
class RealtimeDemo {
  /**
   * Set state, get DOM elements, and set up event listeners for interaction.
   */
  constructor() {
    // Initialize state
    this.peerConnection = null;
    this.mediaStream = null;
    this.isConnected = false;
    this.dataChannel = null;
    this.hasWelcomed = false;
    this.audioElement = null;
    this.isTalking = true; // Start with mic enabled
    this.micVisualizer = null;
    this.aiVisualizer = null;

    // Get DOM elements
    this.connectionButton = document.getElementById('connection-button');
    this.micButton = document.getElementById('mic-button');
    this.statusDiv = document.getElementById('status');

    // Bind event listeners
    this.connectionButton.addEventListener('click', () => this.toggleConnection());
    this.micButton.addEventListener('click', () => this.toggleMic());
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

    this.peerConnection = null;
    this.mediaStream = null;
    this.audioElement = null;
    this.dataChannel = null;
    this.micVisualizer = null;
    this.aiVisualizer = null;
    this.isConnected = false;
    this.isTalking = true; // Reset to enabled state
    this.micButton.disabled = true;
    this.micButton.textContent = 'Unmute Mic';
    this.connectionButton.textContent = 'Create Session';
    this.updateStatus('Not connected');
  }

  /**
   * Incoming audio setup
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

        // Add `canplay` event listener to ensure audio is ready
        this.audioElement.addEventListener('canplay', () => {
          console.log('Audio is ready to play');
          this.aiVisualizer = aiVisualizer;
          if (this.aiVisualizer.init(this.audioElement, event.streams[0])) {
            console.log('AI Visualizer started successfully');
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
      // Get local audio track for microphone input
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Initialize microphone visualizer
      this.micVisualizer = createVisualizer('micVisualizer');
      if (this.micVisualizer.init(null, this.mediaStream)) {
        console.log('Microphone Visualizer started successfully');
      }

      // Add the microphone track to the peer connection
      const audioTrack = this.mediaStream.getAudioTracks()[0];
      audioTrack.enabled = true; // Start unmuted
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
   * - onmessage: Process incoming messages from the API
   */
  setupDataChannelHandlers() {
    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      this.updateStatus('Connected to Realtime API');

      // On first connection, send a one-time instruction to the API.
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
    };
  }

  /**
   * WebRTC Setup
   * Create and configure the WebRTC peer connection with the API.
   * - Set up basic audio playback for the AI
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

    // Set up data channel handlers
    this.setupDataChannelHandlers();

    try {
      // Get microphone access and set up visualizer
      await this.setupMicrophone();

      // Create a peer connection offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await this.peerConnection.setLocalDescription(offer);

      // Send the offer to the API
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
   * - "Create Connection" state: Get ephemeral key, set up WebRTC, enable mic control.
   * - "Close Connection" state: Clean up and reset all resources.
   */
  async toggleConnection() {
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
  toggleMic() {
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

// Initialize RealtimeDemo when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new RealtimeDemo();
});
