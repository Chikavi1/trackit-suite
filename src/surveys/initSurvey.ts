import { getProjectId } from '../index';

export interface SurveyConfig {
  projectId?: string;
  question: string;
  options?: string[];
  themeColor?: string;
  position?: 'modal' | 'bottom' | 'right';
  autoShow?: boolean;
  delay?: number;
  buttonText?: string;
  poweredBy?: string;
  mode?: 'manual' | 'remote';

}

export class initSurvey {
  private config: SurveyConfig;
  private container!: HTMLElement;
  private isOpen = false;

  constructor(config: SurveyConfig) {
 
    this.config = {
      options: ['1', '2', '3', '4', '5'],
      themeColor: '#f59e0b',
      position: 'modal',
      autoShow: true,
      delay: 1000,
      buttonText: 'Feedback',
      poweredBy: 'PulseTrack',
      ...config
    };

    this.init();
  }

  async init() {
    const projectId = getProjectId(this.config.projectId);
    if (!projectId) throw new Error('initSurvey: projectId es requerido.');

    this.config.projectId = projectId;
      if (this.config.mode === 'remote') {
      await this.loadRemoteConfig();
    }
    this.render();
    this.bindCommonEvents();

    if (this.config.autoShow) {
      setTimeout(() => this.open(), this.config.delay);
    }
  }

  private async loadRemoteConfig() {
  try {
    const res = await fetch('http://localhost:3000/forms/current', {
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

  /** Render principal */
  private render() {
    this.container = document.createElement('div');
    this.container.id = 'survey-container';

    if (this.config.position === 'right') {
      this.container.innerHTML = this.getRightTemplate();
    } else if (this.config.position === 'bottom') {
      this.container.innerHTML = this.getBottomHtml();
    } else {
      this.container.innerHTML = this.getModalHtml();
    }

    document.body.appendChild(this.container);
  }

  /** Eventos para opciones + cerrar */
  private bindCommonEvents() {
    document.body.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target?.closest('.survey-option')) {
        const value = target.dataset.value;
        this.send(value!);
        this.close();
      }

      if (target.classList.contains('survey-close') || target.id === 'survey-modal-overlay') {
        this.close();
      }
    });

    const toggleBtn = document.getElementById('survey-toggle-btn');
    if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggle());
  }

  /** --- Métodos UI --- */
  private toggle() {
    this.isOpen ? this.close() : this.open();
  }

  private open() {
    this.isOpen = true;
    const modal = document.getElementById('survey-modal-overlay');
    const box = document.getElementById('survey-box');
    
    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
    
    setTimeout(() => {
      box?.classList.remove('opacity-0', 'scale-90');
      box?.classList.add('opacity-100', 'scale-100');
    }, 10);
  }

  private close() {
    this.isOpen = false;
    const box = document.getElementById('survey-box');
    const modal = document.getElementById('survey-modal-overlay');

    box?.classList.remove('opacity-100', 'scale-100');
    box?.classList.add('opacity-0', 'scale-90');
    
    setTimeout(() => {
      modal?.classList.remove('flex');
      modal?.classList.add('hidden');
    }, 200);
  }

  /** --- LAYOUTS --- */
  private getModalHtml() {
    return `
      <div id="survey-modal-overlay" class="fixed inset-0 bg-black bg-opacity-40 z-[9998] hidden items-center justify-center p-4">
        <div id="survey-box" class="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all duration-200 opacity-0 scale-90">
          <button class="survey-close absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-light leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            &times;
          </button>
          
          <h3 class="text-lg font-semibold text-gray-800 mb-4 pr-6">${this.config.question}</h3>
          
          <div class="flex gap-2 justify-center flex-wrap mb-4">
            ${this.getOptionsHtml()}
          </div>
          
          <p class="text-xs text-gray-400 text-center mt-4">Powered by ${this.config.poweredBy}</p>
        </div>
      </div>
      ${this.getStyles()}
    `;
  }

  private getBottomHtml() {
    return `
      <div id="survey-modal-overlay" class="fixed inset-0 bg-black bg-opacity-40 z-[9998] hidden flex items-end justify-center">
        <div id="survey-box" class="relative bg-white rounded-t-2xl w-full max-w-md p-6 shadow-2xl transform transition-all duration-200 opacity-0 translate-y-full" style="transform: translateY(100%)">
          <button class="survey-close absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-light leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            &times;
          </button>
          
          <h3 class="text-lg font-semibold text-gray-800 mb-4 pr-6">${this.config.question}</h3>
          
          <div class="flex gap-2 justify-center flex-wrap mb-4">
            ${this.getOptionsHtml()}
          </div>
          
          <p class="text-xs text-gray-400 text-center mt-4">Powered by ${this.config.poweredBy}</p>
        </div>
      </div>
      ${this.getStyles()}
    `;
  }

  private getRightTemplate() {
    return `
      <button id="survey-toggle-btn" class="fixed top-1/2 right-0 -translate-y-1/2 -mt-10 translate-x-[45px] rotate-[-90deg] px-6 py-2.5 rounded-lg text-white font-semibold shadow-lg hover:opacity-90 transition-opacity z-[9999] origin-center" style="background:${this.config.themeColor}">
        ${this.config.buttonText}
      </button>

      <div id="survey-modal-overlay" class="fixed inset-0 bg-black bg-opacity-40 z-[9998] hidden items-center justify-center p-4">
        <div id="survey-box" class="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all duration-200 opacity-0 scale-90">
          <button class="survey-close absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-light leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            &times;
          </button>
          
          <h3 class="text-lg font-semibold text-gray-800 mb-4 pr-6">${this.config.question}</h3>
          
          <div class="flex gap-2 justify-center flex-wrap mb-4">
            ${this.getOptionsHtml()}
          </div>
          
          <p class="text-xs text-gray-400 text-center mt-4">Powered by ${this.config.poweredBy}</p>
        </div>
      </div>
      ${this.getStyles()}
    `;
  }

  private getOptionsHtml() {
    return this.config.options!.map(opt =>
      `<button class="survey-option px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors cursor-pointer border border-gray-200 hover:border-gray-300" data-value="${opt}">${opt}</button>`
    ).join('');
  }

  /** --- ESTILOS ADICIONALES --- */
  private getStyles() {
    return `
      <style>
        /* Estilos adicionales solo para animaciones específicas del bottom */
        #survey-modal-overlay.show-bottom #survey-box {
          transform: translateY(0) !important;
          opacity: 1 !important;
        }
        
        /* Asegurar que el overlay esté por encima de todo */
        #survey-modal-overlay {
          pointer-events: auto;
        }
        
        /* Prevenir scroll cuando el modal está abierto */
        body.survey-open {
          overflow: hidden;
        }
      </style>
    `;
  }

  /** --- ENVÍO DE DATOS --- */
  private async send(value: string) {
    try {
      await fetch('http://localhost:3000/nps/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': this.config.projectId!
        },
        body: JSON.stringify({
          score: value,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        })
      });
      console.log('✅ Survey enviado:', value);
    } catch (err) {
      console.warn('❌ Error enviando encuesta', err);
    }
  }
}