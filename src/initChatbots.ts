interface ChatbotConfig {
  projectId: string;             // ID único del cliente
  endpoint?: string;             // API para enviar mensajes (opcional)
  welcomeMessage?: string;       // Mensaje inicial del bot
  themeColor?: string;           // Color principal del chat
  position?: 'bottom-right' | 'bottom-left'; // Posición del botón
  avatarUrl?: string;            // Avatar del bot
  userAvatarUrl?: string;        // Avatar del usuario
  botName?: string;              // Nombre visible del bot
  placeholder?: string;          // Texto del input
  poweredBy?: string;            // Texto en el footer (opcional)
  autoOpen?: boolean;            // Abrir automáticamente al cargar
}

export class initChatbot {
  private config: ChatbotConfig;
  private container!: HTMLElement;
  private chatWindow!: HTMLElement;
  private messagesContainer!: HTMLElement;
  private input!: HTMLInputElement;
  private isOpen = false;

  constructor(config: ChatbotConfig) {
    if (!config.projectId) throw new Error('initChatbot: projectId es requerido');

    this.config = {
      welcomeMessage: '¡Hola! 👋 ¿En qué puedo ayudarte?',
      themeColor: '#2563eb',
      position: 'bottom-right',
      placeholder: 'Escribe tu mensaje...',
      botName: 'Asistente',
      ...config,
    };

    this.createChatWidget();
    this.bindEvents();

    if (this.config.autoOpen) {
      this.toggleChat(true);
    }
  }

  /** 🧩 Crea el contenedor del chatbot */
  private createChatWidget() {
    this.container = document.createElement('div');
    this.container.id = 'nps-chatbot';
    this.container.innerHTML = `
      <style>
        #nps-chatbot {
          position: fixed;
          ${this.config.position === 'bottom-right' ? 'right: 24px;' : 'left: 24px;'}
          bottom: 24px;
          font-family: 'Inter', sans-serif;
          z-index: 9999;
        }
        .chat-toggle {
          background: ${this.config.themeColor};
          color: white;
          border-radius: 50%;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .chat-window {
          display: none;
          flex-direction: column;
          position: absolute;
          bottom: 70px;
          ${this.config.position === 'bottom-right' ? 'right: 0;' : 'left: 0;'}
          width: 320px;
          max-height: 450px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          overflow: hidden;
        }
        .chat-header {
          background: ${this.config.themeColor};
          color: white;
          padding: 10px 16px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          font-size: 14px;
          background: #f9fafb;
        }
        .chat-message {
          margin-bottom: 8px;
          line-height: 1.4;
        }
        .chat-message.bot {
          text-align: left;
        }
        .chat-message.user {
          text-align: right;
        }
        .chat-input {
          display: flex;
          border-top: 1px solid #e5e7eb;
        }
        .chat-input input {
          flex: 1;
          border: none;
          padding: 10px;
          outline: none;
        }
        .chat-input button {
          background: ${this.config.themeColor};
          color: white;
          border: none;
          padding: 10px 14px;
          cursor: pointer;
        }
        .chat-footer {
          font-size: 10px;
          text-align: center;
          color: #9ca3af;
          padding: 4px 0;
        }
      </style>

      <div class="chat-toggle">💬</div>
      <div class="chat-window">
        <div class="chat-header">
          ${this.config.avatarUrl ? `<img src="${this.config.avatarUrl}" style="width:28px;height:28px;border-radius:50%;">` : ''}
          <span>${this.config.botName}</span>
        </div>
        <div class="chat-messages"></div>
        <div class="chat-input">
          <input type="text" placeholder="${this.config.placeholder}" />
          <button>➤</button>
        </div>
        ${this.config.poweredBy ? `<div class="chat-footer">Powered by ${this.config.poweredBy}</div>` : ''}
      </div>
    `;
    document.body.appendChild(this.container);

    this.chatWindow = this.container.querySelector('.chat-window')!;
    this.messagesContainer = this.container.querySelector('.chat-messages')!;
    this.input = this.container.querySelector('.chat-input input')!;

    // Mensaje inicial
    this.addMessage(this.config.welcomeMessage!, 'bot');
  }

  /** ⚙️ Asocia eventos de UI */
  private bindEvents() {
    const toggleBtn = this.container.querySelector('.chat-toggle')!;
    const sendBtn = this.container.querySelector('.chat-input button')!;

    toggleBtn.addEventListener('click', () => this.toggleChat());
    sendBtn.addEventListener('click', () => this.handleUserMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleUserMessage();
    });
  }

  /** 💬 Envía mensaje del usuario y obtiene respuesta */
  private async handleUserMessage() {
    const text = this.input.value.trim();
    if (!text) return;

    this.addMessage(text, 'user');
    this.input.value = '';

    if (!this.config.endpoint) {
      this.addMessage('🤖 Estoy procesando tu mensaje...', 'bot');
      setTimeout(() => this.addMessage('Esta es una respuesta simulada (modo local).', 'bot'), 1000);
      return;
    }

    try {
      const res = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: this.config.projectId,
          message: text,
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      this.addMessage(data.reply || 'No entendí tu mensaje 🤔', 'bot');
    } catch {
      this.addMessage('❌ Error al conectar con el servidor', 'bot');
    }
  }

  /** 🪄 Agrega mensajes al chat */
  private addMessage(text: string, sender: 'bot' | 'user') {
    const message = document.createElement('div');
    message.className = `chat-message ${sender}`;
    message.textContent = text;
    this.messagesContainer.appendChild(message);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /** 🪟 Abre o cierra el chat */
  private toggleChat(force?: boolean) {
    this.isOpen = force ?? !this.isOpen;
    this.chatWindow.style.display = this.isOpen ? 'flex' : 'none';
  }
}
