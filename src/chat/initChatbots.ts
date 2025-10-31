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
      poweredBy: 'PulseTrack',
      ...config,
    };
  }

  /** Inicializa el widget */
  async init() {
    await this.createChatWidget();
    this.bindEvents();

    // Auto open
    if (this.config.autoOpen) {
      this.toggleChat(true);
    }
  }

  /** Crea e inserta el widget */
  private async createChatWidget() {
    const html = await fetch('/chat-widget.html').then(res => res.text());

    this.container = document.createElement('div');
    this.container.id = 'nps-chatbot';
    this.container.innerHTML = html;
    document.body.appendChild(this.container);

    // Referencias
    this.chatWindow = this.container.querySelector('.chat-window')!;
    this.messagesContainer = this.container.querySelector('.chat-messages')!;
    this.input = this.container.querySelector('#chat-input')!;

    // Aplicar configuraciones visuales
    this.applyCustomization();

    // Mensaje inicial
    this.addMessage(this.config.welcomeMessage!, 'bot');
  }

  /** Aplica la personalización del config */
  private applyCustomization() {
    const toggle = this.container.querySelector('.chat-toggle') as HTMLElement;
    const header = this.container.querySelector('.chat-header') as HTMLElement;
    const avatar = this.container.querySelector('#bot-avatar') as HTMLImageElement;
    const name = this.container.querySelector('#bot-name')!;
    const footer = this.container.querySelector('.chat-footer')!;
    const input = this.container.querySelector('#chat-input') as HTMLInputElement;

    // Color del tema
    const color = this.config.themeColor!;
    toggle.style.backgroundColor = color;
    header.style.backgroundColor = color;
    const sendBtn = this.container.querySelector('.chat-input button') as HTMLButtonElement;
    sendBtn.style.backgroundColor = color;

    // Posición
    if (this.config.position === 'bottom-left') {
      this.container.style.right = 'auto';
      this.container.style.left = '1.5rem';
    }

    // Avatar del bot
    if (this.config.avatarUrl) {
      avatar.src = this.config.avatarUrl;
      avatar.style.display = 'block';
    }

    // Nombre
    name.textContent = this.config.botName || 'Asistente';

    // Placeholder
    input.placeholder = this.config.placeholder || 'Escribe un mensaje...';

    // Footer
    footer.innerHTML = `
      Powered by <a href="https://www.pulsetrack.me/" target="_blank" class="text-blue-500 font-semibold hover:underline">
        ${this.config.poweredBy}
      </a>
    `;
  }

  /** Enlaza los eventos del chat */
  private bindEvents() {
    const toggleBtn = this.container.querySelector('.chat-toggle')!;
    const sendBtn = this.container.querySelector('.chat-input button')!;

    toggleBtn.addEventListener('click', () => this.toggleChat());
    sendBtn.addEventListener('click', () => this.handleUserMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleUserMessage();
    });
  }

  /** Maneja los mensajes del usuario */
  private async handleUserMessage() {
    const text = this.input.value.trim();
    if (!text) return;

    this.addMessage(text, 'user');
    this.input.value = '';

    if (!this.config.endpoint) {
      this.addMessage('🤖 Estoy procesando tu mensaje...', 'bot');
      setTimeout(() => this.addMessage('Esta es una respuesta simulada (modo local).', 'bot'), 1500);
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

  /** Agrega mensajes al chat */
  private addMessage(text: string, sender: 'bot' | 'user') {
    const message = document.createElement('div');
    message.className = `chat-message ${sender}`;
    message.textContent = text;

    // Aplica avatar si se configuró
    if (sender === 'user' && this.config.userAvatarUrl) {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.justifyContent = 'flex-end';
      wrapper.style.alignItems = 'flex-end';
      wrapper.style.gap = '4px';

      const avatar = document.createElement('img');
      avatar.src = this.config.userAvatarUrl;
      avatar.style.width = '24px';
      avatar.style.height = '24px';
      avatar.style.borderRadius = '50%';
      avatar.style.objectFit = 'cover';

      wrapper.appendChild(message);
      wrapper.appendChild(avatar);
      this.messagesContainer.appendChild(wrapper);
    } else {
      this.messagesContainer.appendChild(message);
    }

    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /** Abre o cierra el chat */
  private toggleChat(force?: boolean) {
    this.isOpen = force ?? !this.isOpen;
    this.chatWindow.style.display = this.isOpen ? 'flex' : 'none';
  }
}
