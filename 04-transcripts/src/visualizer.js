/**
 * AudioVisualizer class handles the creation and management of an audio waveform visualization
 * using the Web Audio API and Canvas API.
 */
class AudioVisualizer {
  constructor(canvasId = 'aiVisualizer') {
    // Initialize class properties
    this.audioContext = null;      // Web Audio API context
    this.analyser = null;          // Audio analyzer node
    this.animationId = null;       // Request animation frame ID
    this.canvas = null;            // Canvas element
    this.canvasCtx = null;         // Canvas 2D context
    this.canvasId = canvasId;      // Canvas element ID
    this.sourceType = null;        // Type of audio source ('ai' or 'mic')

    // Bind methods to preserve 'this' context
    this.draw = this.draw.bind(this);
    this.animate = this.animate.bind(this);
  }

  /**
   * Initialize the audio visualizer
   * @param {Object} config - Configuration object
   * @param {string} config.sourceType - Type of audio source ('ai' or 'mic')
   * @param {HTMLAudioElement} [config.audioElement] - The audio element to visualize (required for 'ai' source)
   * @param {MediaStream} [config.stream] - The media stream to visualize (required for 'mic' source)
   * @returns {boolean} - Success status of initialization
   */
  init(audioElement, stream) {
    try {

      // Get and setup canvas
      this.canvas = document.getElementById(this.canvasId);
      if (!this.canvas) {
        console.error(`Canvas with ID "${this.canvasId}" not found`);
        return false;
      }

      // Match canvas size to display size for proper rendering
      this.canvas.width = this.canvas.offsetWidth;
      this.canvas.height = this.canvas.offsetHeight;
      this.canvasCtx = this.canvas.getContext('2d');

      // Initialize Web Audio API context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();

      // Configure analyser node for visualization
      this.configureAnalyser();

      // Setup audio sources
      this.setupAudioSources(audioElement, stream);

      // Start visualization
      this.draw();
      return true;
    } catch (error) {
      console.error('Failed to initialize visualizer:', error);
      return false;
    }
  }

  /**
   * Configure the audio analyser node settings
   */
  configureAnalyser() {
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.85;
  }

  /**
   * Setup audio input sources
   */
  setupAudioSources(audioElement, stream) {
    // Create and connect audio element source if provided
    if (audioElement) {
      const elementSource = this.audioContext.createMediaElementSource(audioElement);
      elementSource.connect(this.analyser);
      elementSource.connect(this.audioContext.destination);

      // Ensure context resumes when audio plays
      audioElement.addEventListener('play', () => {
        this.audioContext.resume();
      });
    }

    // If stream is provided, connect it as well
    if (stream) {
      const streamSource = this.audioContext.createMediaStreamSource(stream);
      streamSource.connect(this.analyser);
    }

    // Resume audio context (needed due to autoplay restrictions)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Initialize the drawing loop
   */
  draw() {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.animate(dataArray, bufferLength);
  }

  /**
   * Animation loop for drawing the waveform
   */
  animate(dataArray, bufferLength) {
    // Schedule next frame
    this.animationId = requestAnimationFrame(() => this.animate(dataArray, bufferLength));

    // Get current audio data
    this.analyser.getByteTimeDomainData(dataArray);

    // Clear canvas with white background
    this.canvasCtx.fillStyle = 'rgb(255, 255, 255)';
    this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Setup line style
    this.canvasCtx.strokeStyle = this.canvasId === 'aiVisualizer' ? '#6495ED' : '#8FBC8F';  // Different colors for AI vs Mic
    this.canvasCtx.lineWidth = 3;
    this.canvasCtx.beginPath();

    // Calculate width for each data point
    const sliceWidth = this.canvas.width / bufferLength;
    let x = 0;

    // Draw waveform
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;  // Normalize to [-1, 1] range

      // Create tapering effect with enhanced center peak
      const progress = i / bufferLength;
      const amplitude = Math.pow(Math.sin(progress * Math.PI), 0.7);
      const y = ((v - 1) * amplitude * this.canvas.height / 2) + this.canvas.height / 2;

      // Draw line segments
      if (i === 0) {
        this.canvasCtx.moveTo(x, y);
      } else {
        // Use quadratic curves for smoother lines
        const prevX = x - sliceWidth;
        const prevY = this.calculatePreviousY(dataArray[i - 1], i - 1, bufferLength);
        const cpX = x - sliceWidth / 2;
        const cpY = (y + prevY) / 2;
        this.canvasCtx.quadraticCurveTo(cpX, cpY, x, y);
      }

      x += sliceWidth;
    }

    // Add and reset shadow effect
    this.canvasCtx.shadowColor = this.canvasId === 'aiVisualizer' ? 'rgba(74, 144, 226, 0.2)' : 'rgba(0, 128, 0, 0.2)';
    this.canvasCtx.shadowBlur = 5;
    this.canvasCtx.stroke();
    this.canvasCtx.shadowBlur = 0;
  }

  /**
   * Calculate Y coordinate for previous point (helper for smooth curves)
   */
  calculatePreviousY(prevData, index, bufferLength) {
    const v = prevData / 128.0;
    const progress = index / bufferLength;
    const amplitude = Math.pow(Math.sin(progress * Math.PI), 0.7);
    return ((v - 1) * amplitude * this.canvas.height / 2) + this.canvas.height / 2;
  }

  /**
   * Stop visualization and cleanup resources
   */
  stop() {
    // Cancel animation frame if running
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Clear canvas
    if (this.canvas && this.canvasCtx) {
      this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

export const createVisualizer = (canvasId) => new AudioVisualizer(canvasId);