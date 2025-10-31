export interface SurveyConfig {
  projectId: string;                 // ID único del proyecto/cliente
  question: string;                  // Pregunta principal
  options?: string[];                // Opciones de respuesta
  themeColor?: string;               // Color principal
  position?: 'modal' | 'bottom' | 'right'; // Tipo de UI
  autoShow?: boolean;                // Mostrar automáticamente
  delay?: number;                    // Delay antes de mostrar (ms)
  buttonText?: string;               // Texto del botón flotante (para right)
  poweredBy?: string;                // Footer opcional
}

export class initSurvey {
  private config: SurveyConfig;
  private container!: HTMLElement;
  private isOpen = false;

  constructor(config: SurveyConfig) {
    if (!config.projectId) throw new Error('initSurvey: projectId es requerido');
    if (!config.question) throw new Error('initSurvey: question es requerido');

    this.config = {
      options: ['1','2','3','4','5'],
      themeColor: '#f59e0b',
      position: 'modal',
      autoShow: true,
      delay: 1000,
      buttonText: 'Feedback',
      poweredBy: 'PulseTrack',
      ...config
    };
  }

  /** Inicializa la encuesta */
  async init() {
    await this.createSurvey();
    if (this.config.autoShow) {
      setTimeout(() => this.toggleSurvey(true), this.config.delay);
    }
  }

  /** Crea el HTML de la encuesta según posición */
  private createSurvey() {
    this.container = document.createElement('div');
    this.container.id = 'survey-container';

    switch(this.config.position) {
      case 'modal':
        this.container.innerHTML = this.getModalHtml();
        break;
      case 'bottom':
        this.container.innerHTML = this.getBottomHtml();
        break;
      case 'right':
        this.container.innerHTML = this.getRightButtonHtml();
        break;
    }

    document.body.appendChild(this.container);

    if (this.config.position !== 'right') {
      this.bindSurveyEvents();
    } else {
      const btn = this.container.querySelector('#survey-toggle-btn') as HTMLElement;
      btn.addEventListener('click', () => this.toggleSurvey());
    }
  }

  /** Toggle de mostrar/ocultar encuesta */
  private toggleSurvey(force?: boolean) {
    this.isOpen = force ?? !this.isOpen;
    const surveyEl = this.container.querySelector('.survey-box') as HTMLElement;
    if (surveyEl) surveyEl.style.display = this.isOpen ? 'flex' : 'none';
  }

  /** Bind de botones de opción */
  private bindSurveyEvents() {
    const options = this.container.querySelectorAll('.survey-option');
    options.forEach((opt) => {
      opt.addEventListener('click', () => {
        const value = (opt as HTMLElement).dataset.value;
        console.log('Survey answer:', value);
        this.toggleSurvey(false);
      });
    });

    // Cerrar modal
    const closeBtn = this.container.querySelector('.survey-close') as HTMLElement;
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggleSurvey(false));
    }
  }

  /** HTML para modal centrado */
  private getModalHtml() {
    const optionsHtml = this.config.options!.map(opt =>
      `<button class="survey-option bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded" data-value="${opt}">${opt}</button>`
    ).join('');
    return `
      <div class="survey-box fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center hidden z-[9999]">
        <div class="bg-white rounded-xl shadow-xl p-6 flex flex-col gap-4 w-80">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold text-lg">${this.config.question}</h3>
            <button class="survey-close text-gray-500 hover:text-gray-800">&times;</button>
          </div>
          <div class="flex flex-wrap gap-2">${optionsHtml}</div>
          <p class="text-xs text-gray-400 mt-2">Powered by ${this.config.poweredBy}</p>
        </div>
      </div>
    `;
  }

  /** HTML para barra inferior */
  private getBottomHtml() {
    const optionsHtml = this.config.options!.map(opt =>
      `<button class="survey-option bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 px-3 py-1 rounded" data-value="${opt}">${opt}</button>`
    ).join('');
    return `
      <div class="survey-box fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-xl p-4 flex flex-col gap-2 hidden z-[9999]">
        <div class="font-semibold text-gray-800">${this.config.question}</div>
        <div class="flex gap-2 flex-wrap">${optionsHtml}</div>
        <p class="text-xs text-gray-400 mt-1">Powered by ${this.config.poweredBy}</p>
      </div>
    `;
  }

  /** HTML para botón lateral derecho */
  /** HTML templates separados */
    private getRightButtonHtml() {
      const optionsHtml = this.config.options!.map(opt =>
        `<button class="survey-option bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded" data-value="${opt}">${opt}</button>`
      ).join('');
    
      return `
        <div class="fixed -right-8 top-1/2 transform -translate-y-1/2 z-[9999] flex flex-col items-end">
          <!-- Botón girado -->
          <button id="survey-toggle-btn" 
            class="bg-[${this.config.themeColor}] text-white px-4 py-2 rounded shadow-lg hover:bg-opacity-90 transition transform -rotate-90 origin-center">
            ${this.config.buttonText}
          </button>
    
          <!-- Encuesta oculta -->
          <div class="survey-box hidden flex-col mt-2 bg-white rounded-xl shadow-xl p-4 w-64 ml-62">
            <div class="font-semibold mb-2">${this.config.question}</div>
            <div class="flex gap-2 flex-wrap">
              ${optionsHtml}
            </div>
            <p class="text-xs text-gray-400 mt-2">Powered by ${this.config.poweredBy}</p>
          </div>
        </div>
      `;
    }
    

  
}
