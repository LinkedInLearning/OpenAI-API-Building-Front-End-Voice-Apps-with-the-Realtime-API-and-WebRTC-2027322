/**
 * OpenAI Realtime API via WebRTC
 * ==============================
 *
 * Bare-bones JavaScript implementation of OpenAI's Realtime API using WebRTC.
 *
 * This example shows a how to establish a bidirectional audio connection where:
 * - The user talks to the AI through the computer microphone
 * - The AI responds in the selected voice using the specified model
 * - The user can interrupt the AI mid-sentence and the AI updates its response
 *
 * Other features:
 * - Sends an initial prompt triggering a voice greeting on successful connection.
 * - A status display shows the current state of the connection.
 * - Comprehensive console logging of events for observability and debugging.
 *
 *
 * NOTE: This demo authenticates API requests using an ephemeral key.
 * The key is obtained through a call to a custom auth server.
 * See `../auth-server/README.md` for details.
 *
 * Relevant links:
 * - https://platform.openai.com/docs/guides/realtime-webrtc
 * - https://platform.openai.com/docs/api-reference/realtime
 * - https://webrtc.org/
 * - https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/
 *
 */

// URL to the auth server
const SERVER_URL = "localhost:3000";
// OpenAI realtime model
const MODEL = "gpt-4o-realtime-preview-2024-12-17";
// Voice model
const VOICE = "verse"; // Options: alloy, ash, ballad, coral, echo, sage, shimmer, verse.
// Welcome instructions
const DEFAULT_WELCOME_INSTRUCTIONS =
  "Greet the user and ask them what you can assist them with. Talk quickly and succinctly.";
// Default instructions
const DEFAULT_INSTRUCTIONS =
  "You love ducks, and so does the user. Always frame your responses in terms of ducks!";
// Turn detection
const TURN_DETECTION = {
  type: "server_vad", // Only current option
  threshold: 0.5, // 0-1, Default: 0.5
  prefix_padding_ms: 400, // Default: 300
  silence_duration_ms: 700, // Default: 500
  create_response: true, // Default: true. False creates no response.
};
// Max output tokens
const MAX_OUTPUT_TOKENS = 200;

/**
 * RealtimeDemo Class
 * Manages the entire demo.
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

    // Get DOM elements
    this.connectionButton = document.getElementById("connection-button");
    this.micButton = document.getElementById("mic-button");
    this.statusDiv = document.getElementById("status");

    // Bind event listeners
    this.connectionButton.addEventListener("click", () =>
      this.toggleConnection()
    );
    this.micButton.addEventListener("click", () => this.toggleMic());
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
      this.mediaStream.getTracks().forEach((track) => track.stop());
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

    this.peerConnection = null;
    this.mediaStream = null;
    this.audioElement = null;
    this.dataChannel = null;
    this.isConnected = false;
    this.isTalking = true; // Reset to enabled state
    this.micButton.disabled = true;
    this.micButton.textContent = "Unmute Mic";
    this.connectionButton.textContent = "Create Connection";
    this.updateStatus("Not connected");
  }

  /**
   * Incoming audio setup
   * Sets up the audio element to play remote audio from the API.
   *
   * @throws {Error} If audio element setup fails
   */
  async setupIncomingAudio() {
    try {
      // Set up audio element first
      // Note: This is a hacky way to get audio playback working.
      // Creating invisible auto-playing audio DOM elements is not accessible.
      this.audioElement = document.createElement("audio");
      this.audioElement.autoplay = true;
      document.body.appendChild(this.audioElement);

      // Set up to play remote audio from the API
      this.peerConnection.ontrack = (event) => {
        console.log("Received remote track:", event.track.kind);
        this.audioElement.srcObject = event.streams[0];

        // Add `canplay` event listener to ensure audio is ready
        this.audioElement.addEventListener(
          "canplay",
          () => {
            console.log("Audio is ready to play");
            this.audioElement
              .play()
              .catch((e) => console.error("Error playing audio:", e));
          },
          { once: true }
        );
      };
    } catch (error) {
      this.updateStatus("Error setting up incoming audio: " + error.message);
      throw error;
    }
  }

  /**
   * Microphone Setup
   * Requests microphone access and adds the audio track to the WebRTC connection.
   * NOTE: This triggers a permission dialog in the browser on first use.
   *
   * @throws {Error} If microphone access is denied or unavailable
   */
  async setupMicrophone() {
    try {
      // Get local audio track for microphone input
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Add the microphone track to the peer connection
      const audioTrack = this.mediaStream.getAudioTracks()[0];
      audioTrack.enabled = true; // Start unmuted
      this.peerConnection.addTrack(audioTrack, this.mediaStream);
      console.log("Microphone setup complete");
    } catch (error) {
      this.updateStatus("Error accessing microphone: " + error.message);
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
      console.log("Data channel opened");
      this.updateStatus("Connected to Realtime API");

      // On first connection, send a one-time instruction to the API.
      // The Realtime API responds to text prompts with audio.
      // Make the API issue a voice greeting when a connection is established.
      if (!this.hasWelcomed) {
        console.log("Sending welcome message");
        const welcomeEvent = {
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            // Text prompt to the API
            instructions: DEFAULT_WELCOME_INSTRUCTIONS,
            max_output_tokens: MAX_OUTPUT_TOKENS,
          },
        };
        this.dataChannel.send(JSON.stringify(welcomeEvent));
        this.hasWelcomed = true;
      }

      // Set instructions for the voice assistant
      // This becomes the default instructions for the voice assistant.
      // You can override this by sending a new `session.update` event.
      // @link https://platform.openai.com/docs/api-reference/realtime-client-events/session
      const setIntructions = {
        type: "session.update",
        session: {
          instructions: DEFAULT_INSTRUCTIONS,
          turn_detection: TURN_DETECTION, // Set to 'false' to turn off VAD
          max_response_output_tokens: MAX_OUTPUT_TOKENS,
        },
      };
      this.dataChannel.send(JSON.stringify(setIntructions));
    };

    this.dataChannel.onclose = () => {
      console.log("Data channel closed");
      this.updateStatus("Disconnected from Realtime API");
    };

    this.dataChannel.onmessage = (event) => {
      const realtimeEvent = JSON.parse(event.data);
      console.log("Received event:", realtimeEvent);
    };
  }

  /**
   * Authentication
   * Request an ephemeral API key from the custom auth server.
   * This approach ensures the OpenAI API key is not exposed to the client.
   *
   * The MODEL and VOICE are defined by the auth server through this request.
   *
   * @returns {Promise<string>} The ephemeral API key for OpenAI authentication
   * @throws {Error} If the server request fails
   */
  async getEphemeralKey() {
    try {
      const response = await fetch(`${SERVER_URL}/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          voice: VOICE,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get session key");
      }

      const data = await response.json();
      return data.client_secret.value;
    } catch (error) {
      console.error("Error getting session key:", error);
      throw error;
    }
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
    // Step 1: Create peer connection
    this.peerConnection = new RTCPeerConnection({
      // Use Google's STUN server for NAT traversal
      // @link https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Step 2: Set up incoming audio
    await this.setupIncomingAudio();

    // Step 3: Create data channel for control messages
    this.dataChannel = this.peerConnection.createDataChannel("oai-events");

    // Step 4: Set up data channel handlers
    this.setupDataChannelHandlers();

    try {
      // Step 5: Get microphone access from the browser
      await this.setupMicrophone();

      // Step 6: Create a peer connection offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await this.peerConnection.setLocalDescription(offer);

      // Step 7: Send the offer to the API
      const response = await fetch(
        `https://api.openai.com/v1/realtime?model=${MODEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      // Step 8: Check the response from the API
      if (!response.ok) {
        throw new Error(
          `Failed to connect: ${response.status} ${response.statusText}`
        );
      }

      // Step 9: Parse the SDP answer from the API
      // This is when we know the API has accepted the offer and a connection is established.
      const answer = {
        type: "answer",
        sdp: await response.text(),
      };
      await this.peerConnection.setRemoteDescription(answer);
      console.log("WebRTC connection established");
    } catch (error) {
      this.updateStatus("Error establishing connection: " + error.message);
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
        this.updateStatus("Connecting...");

        // Get the ephemeral key from the auth server
        const token = await this.getEphemeralKey();

        // Set up WebRTC connection
        await this.setupWebRTC(token);

        // Enable mic control
        this.isConnected = true;
        this.micButton.disabled = false;
        this.micButton.textContent = "Mute Mic"; // Start with mic enabled
        this.connectionButton.textContent = "Close Connection";
        this.updateStatus("Connected");
      } catch (error) {
        this.updateStatus("Connection failed: " + error.message);
        console.error("Connection error:", error);
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
        this.micButton.textContent = this.isTalking ? "Mute Mic" : "Unmute Mic";
        this.updateStatus(
          this.isTalking ? "Microphone active" : "Microphone muted"
        );
      }
    }
  }
}

// Initialize RealtimeDemo when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new RealtimeDemo();
});
