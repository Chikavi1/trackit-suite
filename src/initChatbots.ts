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
  }

  /** Inicializa el widget (async) */
  async init() {
    await this.createChatWidget();
    this.bindEvents();

    if (this.config.autoOpen) {
      this.toggleChat(true);
    }
  }

  private async createChatWidget() {
    const html = await fetch('/chat-widget.html').then(res => res.text());

    this.container = document.createElement('div');
    this.container.id = 'nps-chatbot';
    this.container.innerHTML = html;
    document.body.appendChild(this.container);

    // Guardar referencias de elementos importantes
    this.chatWindow = this.container.querySelector('.chat-window')!;
    this.messagesContainer = this.container.querySelector('.chat-messages')!;
    this.input = this.container.querySelector('#chat-input')!;

    // Personalizar
    const toggle = this.container.querySelector('.chat-toggle') as HTMLElement;
    const header = this.container.querySelector('.chat-header') as HTMLElement;
    // toggle.style.background = this.config.themeColor;
    // header.style.background = this.config.themeColor;

    const avatar = this.container.querySelector('#bot-avatar') as HTMLImageElement;
    const name = this.container.querySelector('#bot-name')!;
    if (this.config.avatarUrl) {
      avatar.src = this.config.avatarUrl;
      avatar.style.display = 'block';
    }
    // name.textContent = this.config.botName;

    this.addMessage(this.config.welcomeMessage!, 'bot');
  }

  private bindEvents() {
    const toggleBtn = this.container.querySelector('.chat-toggle')!;
    const sendBtn = this.container.querySelector('.chat-input button')!;

    toggleBtn.addEventListener('click', () => this.toggleChat());
    sendBtn.addEventListener('click', () => this.handleUserMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleUserMessage();
    });
  }

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

  private addMessage(text: string, sender: 'bot' | 'user') {
    const message = document.createElement('div');
    message.className = `chat-message ${sender}`;
    message.textContent = text;
    this.messagesContainer.appendChild(message);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  private toggleChat(force?: boolean) {
    this.isOpen = force ?? !this.isOpen;
    this.chatWindow.style.display = this.isOpen ? 'flex' : 'none';
  }
}
