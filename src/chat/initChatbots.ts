import { getProjectId } from '../index';
interface ChatbotConfig {
  projectId?: string;             // ID único del cliente
             // URL del servidor Socket.IO
  endpoint?: string;             // API para enviar mensajes (opcional, fallback)
  welcomeMessage?: string;       // Mensaje inicial del bot
  themeColor?: string;           // Color principal del chat
  position?: 'bottom-right' | 'bottom-left'; // Posición del botón
  avatarUrl?: string;            // Avatar del bot
  userAvatarUrl?: string;        // Avatar del usuario
  botName?: string;              // Nombre visible del bot
  placeholder?: string;          // Texto del input
  poweredBy?: string;            // Texto en el footer (opcional)
  autoOpen?: boolean;            // Abrir automáticamente al cargar
  mode?: 'manual' | 'remote';
}

export class initChatbot {
  private config: ChatbotConfig;
  private container!: HTMLElement;
  private chatWindow!: HTMLElement;
  private messagesContainer!: HTMLElement;
  private input!: HTMLInputElement;
  private isOpen = false;
  private socket: any = null;
  private socketIOLoaded = false;

  constructor(config: ChatbotConfig) {
 
    this.config = {
      welcomeMessage: '¡Hola! 👋 ¿En qué puedo ayudarte?',
      themeColor: '#000000ff',
      position: 'bottom-right',
      placeholder: 'Escribe tu mensaje...',
      botName: 'Asistente',
      poweredBy: 'PulseTrack',
      mode:"remote",
      ...config,
    };

    this.init();
  }

  /** Inicializa el widget */
  async init() {
    const projectId = getProjectId(this.config.projectId);
    if (!projectId) throw new Error('Chat: projectId es requerido');
    this.config.projectId = projectId;
  
    if (this.config.mode === 'remote') {
      await this.loadRemoteConfig();
    }
  
    await this.createChatWidget();
    await this.loadSocketIO();
    this.initializeSocket();
    this.bindEvents();
  
   
    if (this.config.autoOpen) {
      this.toggleChat(true);
    }
  }

  private async loadRemoteConfig() {
  try {
    const res = await fetch('http://localhost:3000/chats/current', {
      headers: { 'x-business-id': this.config.projectId! }
    });

    if (!res.ok) throw new Error('Error cargando chat remoto');

    const remote = await res.json();

    console.log('remote',remote)

     this.config = {
      ...this.config,
      ...remote,
    };

    console.log("✅ Chat config remoto aplicado");
  } catch (err) {
    console.warn("⚠️ Chat remoto no disponible. Usando config manual", err);
  }
}


  /** Carga Socket.IO dinámicamente */
  private async loadSocketIO(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar si ya está cargado
      if (typeof (window as any).io !== 'undefined') {
        this.socketIOLoaded = true;
        resolve();
        return;
      }

      // Verificar si ya existe el script
      const existingScript = document.querySelector('script[src*="socket.io"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          this.socketIOLoaded = true;
          resolve();
        });
        return;
      }

      // Crear y cargar el script
      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
      script.async = true;
      
      script.onload = () => {
        this.socketIOLoaded = true;
        console.log('✅ Socket.IO cargado dinámicamente');
        resolve();
      };

      script.onerror = () => {
        console.error('❌ Error cargando Socket.IO');
        this.socketIOLoaded = false;
        reject(new Error('No se pudo cargar Socket.IO'));
      };

      document.head.appendChild(script);
    });
  }

  /** Inicializa la conexión Socket.IO */
  private initializeSocket() {
    if (!this.socketIOLoaded || typeof (window as any).io === 'undefined') {
      console.warn('Socket.IO no está disponible. Usando modo fallback HTTP.');
      return;
    }

    try {
      const io = (window as any).io;
      
      this.socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      // Evento: conexión exitosa
      this.socket.on('connect', () => {
        console.log('✅ Socket conectado:', this.socket.id);
        
        // Unirse a la sala del proyecto
        this.socket.emit('join_project', { 
          projectId: this.config.projectId 
        });
      });

      // Evento: bot está escribiendo
      this.socket.on('bot_typing', () => {
        this.showTypingIndicator();
      });

      // Evento: respuesta del bot
      this.socket.on('bot_reply', (data: any) => {
        this.hideTypingIndicator();
        
        if (data.error) {
          this.addMessage(`❌ ${data.error}`, 'bot');
        } else {
          this.addMessage(data.reply || 'Sin respuesta', 'bot');
        }
      });

      // Evento: mensajes del proyecto (opcional, para ver mensajes de otros)
      this.socket.on('project_message', (data: any) => {
        console.log('📨 Mensaje del proyecto:', data);
      });

      // Evento: desconexión
      this.socket.on('disconnect', (reason: string) => {
        console.warn('⚠️ Socket desconectado:', reason);
        if (reason === 'io server disconnect') {
          this.socket.connect();
        }
      });

      // Evento: error de conexión
      this.socket.on('connect_error', (error: any) => {
        console.error('❌ Error de conexión Socket.IO:', error);
        this.addMessage('⚠️ Error de conexión. Reintentando...', 'bot');
      });

    } catch (error) {
      console.error('Error inicializando socket:', error);
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

    // Si hay socket conectado, usar WebSocket
    if (this.socket && this.socket.connected) {
      this.socket.emit('client_message', {
        projectId: this.config.projectId,
        message: text,
        userId: this.getUserId(),
        timestamp: new Date().toISOString(),
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      });
      return;
    }

    // Fallback: usar HTTP si no hay socket
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

  /** Genera o recupera un ID único del usuario */
  private getUserId(): string {
    let userId = localStorage.getItem('chatbot_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chatbot_user_id', userId);
    }
    return userId;
  }

  /** Muestra indicador de que el bot está escribiendo */
  private showTypingIndicator() {
    const existingIndicator = this.messagesContainer.querySelector('.typing-indicator');
    if (existingIndicator) return;

    const indicator = document.createElement('div');
    indicator.className = 'chat-message bot typing-indicator';
    indicator.innerHTML = '<span>●</span><span>●</span><span>●</span>';
    indicator.style.cssText = 'display: flex; gap: 4px; animation: pulse 1.5s infinite;';
    this.messagesContainer.appendChild(indicator);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /** Oculta el indicador de escritura */
  private hideTypingIndicator() {
    const indicator = this.messagesContainer.querySelector('.typing-indicator');
    if (indicator) indicator.remove();
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

  /** Limpia recursos al destruir el widget */
  destroy() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.container) {
      this.container.remove();
    }
  }
}