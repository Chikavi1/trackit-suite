

interface NpsConfig {
  projectId: string;        // ID único de cliente o proyecto
  endpoint: string;         // Tu API donde se envían los resultados
  question?: string;        // Texto de la pregunta
  themeColor?: string;      // Color principal del widget
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoShow?: boolean;       // Si se muestra automáticamente
  delay?: number;           // Retraso en milisegundos para autoShow
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
      autoShow: config.autoShow ?? true,
      delay: config.delay ?? 2000,
      ...config
    };

    if (!this.config.projectId || !this.config.endpoint) {
      throw new Error('initNps: projectId y endpoint son requeridos');
    }

    if (this.config.autoShow) {
      setTimeout(() => this.renderWidget(), this.config.delay);
    }
  }

  /** 🧱 Renderiza el widget en la página */
  private renderWidget() {
    if (document.getElementById('nps-widget')) return;

    this.container = document.createElement('div');
    this.container.id = 'nps-widget';
    this.container.innerHTML = this.getTemplate();
    this.applyStyles();

    document.body.appendChild(this.container);

    // Listeners para puntajes
    const buttons = this.container.querySelectorAll('.nps-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', e => {
        const score = parseInt((e.target as HTMLElement).dataset.score!);
        this.submit(score);
      });
    });

    // Cerrar
    const close = this.container.querySelector('.nps-close');
    close?.addEventListener('click', () => this.close());
  }

  /** 🎨 HTML base del widget */
  private getTemplate(): string {
    return `
      <div class="nps-card">
        <button class="nps-close">×</button>
        <h3 class="nps-question">${this.config.question}</h3>
        <div class="nps-options">
          ${Array.from({ length: 10 }, (_, i) => `<button class="nps-btn" data-score="${i + 1}">${i + 1}</button>`).join('')}
        </div>
        <p class="nps-footer">1 = Nada probable, 10 = Muy probable</p>
      </div>
    `;
  }

  /** 🧠 Aplica estilos directamente (sin CSS externo) */
  private applyStyles() {
    const style = document.createElement('style');
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
        width: 280px;
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
        color: #111827;
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

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  /** 📍 Posición del widget */
  private getPosition() {
    switch (this.config.position) {
      case 'bottom-left':
        return 'bottom: 20px; left: 20px;';
      case 'top-right':
        return 'top: 20px; right: 20px;';
      case 'top-left':
        return 'top: 20px; left: 20px;';
      default:
        return 'bottom: 20px; right: 20px;';
    }
  }

  /** 📬 Enviar respuesta al servidor */
  private async submit(score: number) {
    if (this.hasVoted) return;
    this.hasVoted = true;

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: this.config.projectId,
          score,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      this.container.innerHTML = `<div class="nps-card"><p>¡Gracias por tu opinión! 🙌</p></div>`;
      setTimeout(() => this.close(), 2000);
    } catch (err) {
      console.error('Error enviando NPS:', err);
    }
  }

  /** ❌ Cerrar el widget */
  private close() {
    this.container.remove();
  }

  /** 💡 Permite mostrarlo manualmente */
  public show() {
    this.renderWidget();
  }
}
