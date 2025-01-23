/**
 * Chat functionality module
 * Handles chat UI interactions and auto-scrolling
 */

class ChatUI {
  constructor(onMessageSend) {
    this.messagesContainer = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.sendButton = document.querySelector('.send-button');
    this.onMessageSend = onMessageSend;
    this.micButton = document.getElementById('mic-button');
    this.lastMessageElement = null;

    // Bind event listeners
    this.sendButton.addEventListener('click', () => this.handleSend());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSend();
      }
    });

    // Add focus handler to mute mic when chat input is focused
    this.chatInput.addEventListener('focus', () => {
      if (this.micButton && !this.micButton.disabled) {
        // Simulate mic button click to mute if currently unmuted
        if (this.micButton.textContent === 'Mute Mic') {
          this.micButton.click();
        }
      }
    });

    // Initial scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Handle send button click or enter key
   */
  handleSend() {
    const message = this.chatInput.value.trim();
    if (message) {
      // Clear input
      this.chatInput.value = '';

      // Add message to UI
      this.addMessage(message, 'user');

      // Emit message to parent
      if (this.onMessageSend) {
        this.onMessageSend(message);
      }
    }
  }

  /**
   * Add a new message to the chat
   * @param {string} content - The message content
   * @param {string} sender - Either 'user' or 'ai'
   */
  addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(contentDiv);
    this.messagesContainer.appendChild(messageDiv);

    // Track last message element
    this.lastMessageElement = messageDiv;

    this.scrollToBottom();
  }

  /**
   * Update the last message in the chat
   * @param {string} content - The new message content
   * @param {string} sender - Either 'user' or 'ai'
   */
  updateLastMessage(content, sender) {
    if (this.lastMessageElement && this.lastMessageElement.classList.contains(`${sender}-message`)) {
      const contentDiv = this.lastMessageElement.querySelector('.message-content');
      if (contentDiv) {
        contentDiv.textContent = content;
        this.scrollToBottom();
      }
    } else {
      this.addMessage(content, sender);
    }
  }

  /**
   * Clear all messages from the chat
   */
  clearMessages() {
    while (this.messagesContainer.firstChild) {
      this.messagesContainer.removeChild(this.messagesContainer.firstChild);
    }
    this.lastMessageElement = null;
  }

  /**
   * Scroll chat to the bottom
   */
  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}

export { ChatUI }; 