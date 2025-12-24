import { getProjectId } from '../index';
import html2canvas from 'html2canvas';

export interface FeedbackConfig {
  projectId?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  themeColor?: string;
  buttonText?: string;
  buttonIcon?: string;
  autoOpen?: boolean;
}

type FeedbackType = 'bug' | 'improvement' | '';

export class FeedbackWidget {
  private config: Required<Omit<FeedbackConfig, 'projectId'>> & { projectId: string };
  private container!: HTMLElement;
  private feedbackWindow!: HTMLElement;
  private isOpen = false;
  private currentScreenshot: string = '';
  private feedbackType: FeedbackType = '';

  constructor(config: FeedbackConfig = {}) {
    const projectId = getProjectId(config.projectId);
    if (!projectId) {
      throw new Error('Feedback: projectId is required');
    }
    
    this.config = {
      position: 'bottom-right',
      themeColor: '#4f46e5',
      buttonText: 'Feedbacks',
      buttonIcon: '💬',
      autoOpen: false,
      ...config,
      projectId, // This is now guaranteed to be a string
    };

    if (!this.config.projectId) {
      console.warn('Feedback: projectId is required for feedback submission');
      return;
    }

    this.init();
  }

  private init() {
    this.createButton();
    this.createFeedbackWindow();
    this.addStyles();

    if (this.config.autoOpen) {
      this.toggleFeedbackWindow();
    }
  }

  private createButton() {
    const button = document.createElement('button');
    button.className = `fixed z-50 flex items-center justify-center px-6 py-3 rounded-full transition-all duration-300
      bg-[${this.config.themeColor}] text-white shadow-lg hover:shadow-xl
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${this.config.themeColor}]
      ${this.getPositionClasses()}`;
    
    // Estilos para el botón tipo chip
    button.style.fontFamily = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    button.style.transform = 'translateY(0)';
    button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    button.style.fontSize = '1rem';
    button.style.fontWeight = '600';
    button.style.letterSpacing = '0.025em';
    button.style.boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.08)';
    button.style.margin = '0 0 32px 0';
    
    // Añadir efecto hover
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
    });
    
    // Contenido del botón
    button.textContent = 'Feedback';
    
    button.addEventListener('click', () => this.toggleFeedbackWindow());
    
    this.container = button;
    document.body.appendChild(this.container);
  }

  private createFeedbackWindow() {
    const windowElement = document.createElement('div');
    windowElement.className = `fixed z-50 w-full max-w-md bg-white rounded-t-xl shadow-2xl transition-all duration-300 transform ${
      this.isOpen ? 'translate-y-0' : 'translate-y-full'
    } ${this.getPositionClasses()} border border-gray-200 overflow-hidden`;
    
    // Estilos mejorados para la ventana
    windowElement.style.borderRadius = '12px 12px 0 0';
    windowElement.style.maxHeight = '90vh';
    windowElement.style.overflowY = 'auto';
    windowElement.style.scrollbarWidth = 'thin';
    windowElement.style.scrollbarColor = `${this.config.themeColor} transparent`;
    
    windowElement.innerHTML = `
      <div class="p-6">
        <!-- Encabezado con gradiente -->
        <div class="relative mb-6">
          <div class="absolute inset-0  rounded-t-lg opacity-10"></div>
          <div class="relative flex justify-between items-center">
            <div>
              <h3 class="text-xl font-bold text-gray-900">Enviar feedback</h3>
              <p class="text-sm text-gray-500 mt-1">Ayúdanos a mejorar tu experiencia</p>
            </div>
            <button class="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors" id="close-feedback">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Success Message (initially hidden) -->
        <div id="success-message" class="hidden flex flex-col items-center justify-center p-8 text-center">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="mb-2 text-xl font-bold text-gray-900">¡Gracias por tu reporte!</h3>
          <p class="text-gray-600">Tu retroalimentación es muy valiosa para nosotros.</p>
          <button class="mt-6 rounded-md px-4 py-2 text-sm font-medium text-${this.config.themeColor} hover:bg-${this.config.themeColor}/10 transition-colors" id="close-after-submit">
            Cerrar
          </button>
        </div>
        
        <div class="mb-4">
          <p class="text-sm font-medium text-gray-700 mb-2">Tipo de feedback</p>
          <div class="grid grid-cols-2 gap-2">
            <button 
              id="feedback-bug" 
              class="flex items-center justify-center gap-2 px-4 py-2 rounded-md border ${
                this.feedbackType === 'bug' 
                  ? 'border-red-500 bg-red-50 text-red-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              } transition-colors"
            >
              <span>🐞</span>
              <span>Reportar error</span>
            </button>
            <button 
              id="feedback-improvement" 
              class="flex items-center justify-center gap-2 px-4 py-2 rounded-md border ${
                this.feedbackType === 'improvement' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              } transition-colors"
            >
              <span>💡</span>
              <span>Sugerencia</span>
            </button>
          </div>
        </div>
        
        <div class="mb-4" id="feedback-form">
          <label for="feedback-description" class="block text-sm font-medium text-gray-700 mb-1">
            Describe el ${this.feedbackType === 'bug' ? 'error' : 'mejora'}
          </label>
          <div class="relative">
            <textarea 
              id="feedback-description" 
              rows="3" 
              class="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${this.config.themeColor} focus:border-${this.config.themeColor} text-sm leading-6 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 resize-none"
              placeholder="Escribe tu mensaje aquí..."
              style="box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 1px 3px 0 rgba(0,0,0,0.1);"
            ></textarea>
            <div class="absolute right-2 bottom-2 flex items-center space-x-1">
              <button type="button" class="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>
          
          <div class="mt-2 flex items-center justify-between">
            <button 
              id="screenshot-btn" 
              class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${this.config.themeColor}"
            >
              <svg class="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Capturar pantalla
            </button>
            
            <div id="screenshot-preview" class="hidden">
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500">Captura lista</span>
                <button id="remove-screenshot" class="text-red-500 hover:text-red-700">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div id="screenshot-container" class="mt-2 hidden">
            <div class="  rounded-md p-2">
              <img id="screenshot-img" src="" alt="Captura de pantalla" class="max-h-12" />
            </div>
          </div>
        </div>
        
        <div class="mt-8 pt-4 border-t border-gray-100">
          <button 
            id="submit-feedback" 
            class="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02]"
            style="min-height: 48px;"
            disabled
          >
            <span id="submit-text" class="font-semibold">Enviar feedback</span>
            <span id="submit-spinner" class="hidden ml-3">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          </button>
          <p class="mt-3 text-center text-xs text-gray-500">
            Tu feedback nos ayuda a mejorar nuestro servicio
          </p>
        </div>
      </div>
    `;
    
    // Add event listeners
    windowElement.querySelector('#close-feedback')?.addEventListener('click', () => this.toggleFeedbackWindow());
    windowElement.querySelector('#feedback-bug')?.addEventListener('click', () => this.setFeedbackType('bug'));
    windowElement.querySelector('#feedback-improvement')?.addEventListener('click', () => this.setFeedbackType('improvement'));
    windowElement.querySelector('#screenshot-btn')?.addEventListener('click', () => this.captureScreenshot());
    windowElement.querySelector('#remove-screenshot')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeScreenshot();
    });
    windowElement.querySelector('#submit-feedback')?.addEventListener('click', () => this.submitFeedback());
    
    // Disable form by default
    this.toggleForm(false);
    
    this.feedbackWindow = windowElement;
    document.body.appendChild(this.feedbackWindow);
  }

  private getPositionClasses(): string {
    switch (this.config.position) {
      case 'bottom-left':
        return 'left-4 bottom-0';
      case 'bottom-center':
        return 'left-1/2 transform -translate-x-1/2 bottom-0';
      case 'bottom-right':
      default:
        return 'right-4 bottom-0';
    }
  }

  private toggleFeedbackWindow() {
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      this.feedbackWindow.classList.remove('translate-y-full');
      this.container.classList.add('opacity-0', 'invisible');
    } else {
      this.feedbackWindow.classList.add('translate-y-full');
      this.container.classList.remove('opacity-0', 'invisible');
    }
  }

  private setFeedbackType(type: FeedbackType) {
    this.feedbackType = type;
    this.toggleForm(true);
    
    // Update UI
    document.querySelectorAll('#feedback-bug, #feedback-improvement').forEach(btn => {
      btn.classList.remove('border-red-500', 'bg-red-50', 'text-red-700', 'border-blue-500', 'bg-blue-50', 'text-blue-700');
      btn.classList.add('border-gray-300', 'hover:bg-gray-50');
    });
    
    const selectedBtn = document.querySelector(`#feedback-${type}`);
    if (selectedBtn) {
      const isBug = type === 'bug';
      selectedBtn.classList.remove('border-gray-300', 'hover:bg-gray-50');
      selectedBtn.classList.add(
        isBug ? 'border-red-500' : 'border-blue-500',
        isBug ? 'bg-red-50' : 'bg-blue-50',
        isBug ? 'text-red-700' : 'text-blue-700'
      );
    }
    
    // Update description label
    const label = document.querySelector('label[for="feedback-description"]');
    if (label) {
      label.textContent = `Describe el ${type === 'bug' ? 'error' : 'mejora'}`;
    }
  }

  private toggleForm(enable: boolean) {
    const form = document.getElementById('feedback-form');
    const submitBtn = document.getElementById('submit-feedback') as HTMLButtonElement;
    
    if (form && submitBtn) {
      form.style.display = enable ? 'block' : 'none';
      submitBtn.disabled = !enable;
    }
  }

  private async captureScreenshot() {
    try {
      // Hide the feedback window temporarily
      this.feedbackWindow.style.visibility = 'hidden';
      
      // Capture the visible viewport
      const canvas = await html2canvas(document.body, {
        scale: 1,
        useCORS: true,
        logging: false,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        x: 0,
        y: 0,
      });
      
      this.currentScreenshot = canvas.toDataURL('image/png');
      
      // Show the screenshot preview
      const previewImg = document.getElementById('screenshot-img') as HTMLImageElement;
      const previewContainer = document.getElementById('screenshot-container');
      const previewBadge = document.getElementById('screenshot-preview');
      
      if (previewImg && previewContainer && previewBadge) {
        previewImg.src = this.currentScreenshot;
        previewContainer.classList.remove('hidden');
        previewBadge.classList.remove('hidden');
      }
      
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      alert('No se pudo capturar la pantalla. Por favor, inténtalo de nuevo.');
    } finally {
      // Show the feedback window again
      this.feedbackWindow.style.visibility = 'visible';
    }
  }

  private removeScreenshot() {
    this.currentScreenshot = '';
    
    const previewContainer = document.getElementById('screenshot-container');
    const previewBadge = document.getElementById('screenshot-preview');
    
    if (previewContainer && previewBadge) {
      previewContainer.classList.add('hidden');
      previewBadge.classList.add('hidden');
    }
  }

  private async submitFeedback() {
    const description = (document.getElementById('feedback-description') as HTMLTextAreaElement)?.value.trim();
    
    if (!description) {
      alert('Por favor, describe tu feedback');
      return;
    }
    
    const submitBtn = document.getElementById('submit-feedback') as HTMLButtonElement;
    const submitText = document.getElementById('submit-text');
    const submitSpinner = document.getElementById('submit-spinner');
    const form = document.getElementById('feedback-form');
    const successMessage = document.getElementById('success-message');
    
    if (submitBtn && submitText && submitSpinner && form && successMessage) {
      // Disable form and show loading state
      submitBtn.disabled = true;
      submitText.textContent = 'Enviando...';
      submitSpinner.classList.remove('hidden');
      
      try {
        // Prepare the feedback data
        const feedbackData: {
          type: FeedbackType;
          description: string;
          screenshot?: string;
          url: string;
          userAgent: string;
          timestamp: string;
          projectId: string;
        } = {
          type: this.feedbackType,
          description,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          projectId: this.config.projectId,
        };
        
        // Only add screenshot if it exists
        if (this.currentScreenshot) {
          feedbackData.screenshot = this.currentScreenshot;
        }
        
        // Log the feedback data (in a real app, you would send this to your backend)
        console.log('Submitting feedback:', {
          ...feedbackData,
          screenshot: feedbackData.screenshot ? '[screenshot data]' : 'none' as string | undefined
        });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Hide all form elements and show success message
        const formContainer = this.feedbackWindow.querySelector('.p-6') as HTMLElement;
        const formElements = Array.from(formContainer.children) as HTMLElement[];
        
        // Hide all elements except the success message
        formElements.forEach(el => {
          if (el.id !== 'success-message') {
            el.style.display = 'none';
          }
        });
        
        // Show success message with animation
        successMessage.classList.remove('hidden');
        successMessage.style.animation = 'fadeIn 0.3s ease-out';
        
        // Add close button event listener
        const closeButton = document.getElementById('close-after-submit');
        
        const closeHandler = () => {
          this.toggleFeedbackWindow();
          // Reset form after animation completes
          setTimeout(() => {
            this.resetForm();
            // Show all form elements again
            formElements.forEach(el => {
              el.style.display = '';
            });
            successMessage.classList.add('hidden');
          }, 300);
        };
        
        if (closeButton) {
          // Remove any existing event listeners to prevent duplicates
          closeButton.replaceWith(closeButton.cloneNode(true));
          document.getElementById('close-after-submit')?.addEventListener('click', closeHandler);
        }
        
        // Auto-close after 2 seconds
        setTimeout(closeHandler, 2000);
        
      } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Hubo un error al enviar tu feedback. Por favor, inténtalo de nuevo.');
      } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitText.textContent = 'Enviar feedback';
        submitSpinner.classList.add('hidden');
      }
    }
  }

  private resetForm() {
    // Reset form fields
    const textarea = document.getElementById('feedback-description') as HTMLTextAreaElement;
    const successMessage = document.getElementById('success-message');
    const form = document.getElementById('feedback-form');
    const submitBtn = document.getElementById('submit-feedback') as HTMLButtonElement;
    const submitText = document.getElementById('submit-text');
    const submitSpinner = document.getElementById('submit-spinner');
    
    if (textarea) textarea.value = '';
    if (successMessage) successMessage.classList.add('hidden');
    if (form) form.style.display = '';
    
    // Reset submit button
    if (submitBtn && submitText && submitSpinner) {
      submitBtn.disabled = false;
      submitText.textContent = 'Enviar feedback';
      submitSpinner.classList.add('hidden');
    }
    
    // Reset feedback type
    this.feedbackType = '';
    this.toggleForm(false);
    
    // Remove screenshot
    this.removeScreenshot();
    this.currentScreenshot = '';
    
    // Reset button styles
    document.querySelectorAll('#feedback-bug, #feedback-improvement').forEach(btn => {
      btn.classList.remove('border-red-500', 'bg-red-50', 'text-red-700', 'border-blue-500', 'bg-blue-50', 'text-blue-700');
      btn.classList.add('border-gray-300', 'hover:bg-gray-50');
    });
  }

  private addStyles() {
    // Add Tailwind CSS if not already present
    if (!document.getElementById('tailwind-css')) {
      const link = document.createElement('link');
      link.id = 'tailwind-css';
      link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
      link.rel = 'stylesheet';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
    
    // Add custom styles
    const style = document.createElement('style');
    style.textContent = `
      .feedback-window {
        box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06);
        transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      #screenshot-container img {
        max-width: 100%;
        height: auto;
      }
      
      /* Custom scrollbar for textarea */
      textarea {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e0 transparent;
      }
      
      textarea::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      
      textarea::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 3px;
      }
      
      textarea::-webkit-scrollbar-thumb {
        background: #cbd5e0;
        border-radius: 3px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      
      textarea::-webkit-scrollbar-thumb:hover {
        background: #a0aec0;
      }
      
      textarea:focus {
        box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
      }
    `;
    document.head.appendChild(style);
  }
}

export const initFeedback = (config: FeedbackConfig = {}) => {
  return new FeedbackWidget(config);
};
