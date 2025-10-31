interface NpsConfig {
  projectId: string;
  question?: string;
  themeColor?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left';
  autoShow?: boolean;
  delay?: number;
}

export class initNps {
  private config: NpsConfig;
  private container!: HTMLDivElement;
  private hasVoted = false;

  constructor(config: NpsConfig) {
    this.config = {
      question: config.question || '¿Qué tan probable es que recomiendes este servicio?',
      themeColor: config.themeColor || '#2563eb',
      position: config.position || 'bottom-right',
      autoShow: config.autoShow ?? false,
      delay: config.delay ?? 2000,
      ...config
    };

    if (!this.config.projectId) {
      throw new Error('initNps: <projectId son requeridos');
    }

    if (this.config.autoShow) {
      setTimeout(() => this.renderWidget(), this.config.delay);
    }
  }

  private renderWidget() {
    if (document.getElementById('nps-widget')) return;
    this.container = document.createElement('div');
    this.container.id = 'nps-widget';
    this.container.innerHTML = this.getStep1Template();
    this.applyStyles();
    document.body.appendChild(this.container);

    this.attachStep1Listeners();
  }

  /** Paso 1: Calificación rápida */
  private getStep1Template(): string {
    return `
      <div class="nps-card">
        <button class="nps-close">×</button>
        <h3 class="nps-question">${this.config.question}</h3>
        <div class="nps-options">
          ${Array.from({ length: 10 }, (_, i) => `<button class="nps-btn" data-score="${i + 1}">${i + 1}</button>`).join('')}
        </div>
        <p class="nps-footer">1 = Nada probable, 10 = Muy probable</p>
         <p class="nps-footer">Powered by <a href="https://www.pulsetrack.me/" style="font-weight:bold;" target="_blank">PulseTrack</a></p>
      </div>
    `;
  }

  private attachStep1Listeners() {
    const buttons = this.container.querySelectorAll('.nps-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', e => {
        const score = parseInt((e.target as HTMLElement).dataset.score!);
        this.renderStep2(score);
      });
    });

    const close = this.container.querySelector('.nps-close');
    close?.addEventListener('click', () => this.close());
  }

  /** Paso 2: Seguimiento según score */
  private renderStep2(score: number) {
    let title = '';
    let placeholder = '';
    let askContact = false;

    if (score <= 6) {
      title = 'Lamentamos no haber cumplido tus expectativas. 😞<br>¿Podrías contarnos qué podríamos mejorar?';
      placeholder = 'Tu sugerencia...';
      askContact = true;
    } else if (score <= 8) {
      title = 'Gracias por tu opinión. 🙏<br>¿Qué mejorarías para que tu experiencia fuera excelente?';
      placeholder = 'Tu comentario...';
      askContact = true;
    } else {
      title = '¡Nos alegra mucho que nos recomiendes! ❤️<br>¿Podrías dejarnos tu correo para enviarte beneficios exclusivos o programas de referidos?';
      placeholder = 'Tu mensaje...';
      askContact = true;
    }

    this.container.innerHTML = `
      <div class="nps-card">
        <button class="nps-close">×</button>
        <h3 class="nps-question">${title}</h3>

         ${askContact ? `
          <input type="email" autocomplete="true" class="nps-input" placeholder="Tu correo (opcional)" />
        ` : ''}

       <textarea rows="2" class="nps-text" placeholder="${placeholder}" style="resize:none;"></textarea>

       

        <button class="nps-submit">Enviar</button>
      </div>
    `;

    this.applyStyles();
    const submit = this.container.querySelector('.nps-submit');
    const close = this.container.querySelector('.nps-close');

    submit?.addEventListener('click', () => {
      const text = (this.container.querySelector('.nps-text') as HTMLTextAreaElement)?.value || '';
      const name = (this.container.querySelector('.nps-input[type="text"]') as HTMLInputElement)?.value || '';
      const email = (this.container.querySelector('.nps-input[type="email"]') as HTMLInputElement)?.value || '';
      this.submit(score, text, name, email);
    });

    close?.addEventListener('click', () => this.close());
  }

  /** Estilos */
  private applyStyles() {
    const style = document.getElementById('nps-style') || document.createElement('style');
    style.id = 'nps-style';
    style.textContent = `
      #nps-widget {
        position: fixed;
        ${this.getPosition()};
        z-index: 9999;
        font-family: system-ui, sans-serif;
      }
      .nps-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        width: 300px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        position: relative;
        animation: fadeIn 0.3s ease-out;
      }
      .nps-close {
        position: absolute;
        top: 6px;
        right: 8px;
        border: none;
        background: transparent;
        font-size: 18px;
        cursor: pointer;
      }
      .nps-question {
        font-weight: 600;
        margin-bottom: 12px;
        color: #616366ff;
        font-size: 15px;
      }
      .nps-options {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 4px;
      }
      .nps-btn {
        flex: 1;
        min-width: 25px;
        padding: 6px 0;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
      }
      .nps-btn:hover {
        background: ${this.config.themeColor};
        color: white;
        border-color: ${this.config.themeColor};
      }
      .nps-footer {
        font-size: 12px;
        color: #6b7280;
        margin-top: 10px;
        text-align: center;
      }
      .powered{
        font-size: 5px;
        color: #6b7280;
        margin-top: 2px;
        text-align: center;
      }
      .nps-text, .nps-input {
        width: 100%;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 8px;
        margin-bottom: 8px;
        font-size: 14px;
      }
      .nps-submit {
        background: ${this.config.themeColor};
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 0;
        width: 100%;
        cursor: pointer;
        font-weight: 600;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  private getPosition() {
    switch (this.config.position) {
      case 'bottom-left': return 'bottom: 20px; left: 20px;';
      case 'bottom-center': return 'bottom: 20px; left: 50%; transform: translateX(-50%);';
      case 'top-right': return 'top: 20px; right: 20px;';
      case 'top-left': return 'top: 20px; left: 20px;';
      default: return 'bottom: 20px; right: 20px;';
    }
  }

  /** Enviar respuesta */
  private async submit(score: number, feedback: string, name?: string, email?: string) {
    if (this.hasVoted) return;
    this.hasVoted = true;

    try {
      await fetch('https://trackit-suite-back.onrender.com/nps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: this.config.projectId,
          score,
          feedback,
          name,
          email,
          session_id: this.getSessionId(),
          user_id: this.getUserId(),
          url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      this.container.innerHTML = `<div class="nps-card"><p>¡Gracias por tu opinión! 🙌</p></div>`;
      setTimeout(() => this.close(), 2500);
    } catch (err) {
      console.error('Error enviando NPS:', err);
    }
  }

  private getSessionId() {
    return sessionStorage.getItem('sessionId') || crypto.randomUUID();
  }

  private getUserId() {
    return localStorage.getItem('userId') || null;
  }

  private close() {
    this.container.remove();
  }

  public open() {
    this.renderWidget();
  }

  public addUser(user: string){
    console.log('se agrega usuario');
  }
}
