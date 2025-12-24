// src/SystemTracker.ts
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { BotDetector, BotDetectionResult } from '../botDetector/initDetect';
import { Events, EventData, RecordedEvent, TrackedError } from './interfaces';

const PT_USER_KEY = 'pt_external_user_id';

interface SystemTrackerOptions {
  businessId?: string;
  userId?: string;
}


export class SystemTracker {
  // =====================
  // Configuración
  // =====================
  private readonly endpoint = 'http://localhost:3001/sessions';
  // private readonly endpoint = 'https://trackit-suite-back.onrender.com/sessions';

  // =====================
  // Estado base
  // =====================
  private readonly events: Events;
  private startTime: number;
private pageUrl = window.location.pathname;

  private maxScroll = 0;
  private errors: TrackedError[] = [];
  private lastEvent: string | null = null;
  private fingerprint: string | null = null;

  private readonly options: SystemTrackerOptions;

  // =====================
  // Bot detection
  // =====================
  private botDetector!: BotDetector;
  private botInfo: BotDetectionResult | null = null;

  private sessionStartTime: number;
  private pageStartTime: number;

  // =====================
  // Constructor
  // =====================
 constructor(options: SystemTrackerOptions = {}) {
    const storedUserId = this.getStoredUserId();
    this.options = {
      ...options,
      userId: options.userId ?? storedUserId ?? undefined,
    };
    
    this.sessionStartTime = Date.now();
    this.pageStartTime = this.sessionStartTime;
    this.startTime = this.pageStartTime; 
    
    this.events = this.createInitialEvents();

    this.initPage();
    this.initErrorsEvents();
    this.initNavigationListener();
     
    // Lanzamos todo async dentro de un IIFE
    (async () => {
        await this.initFingerprint(); // esperar fingerprint
        await this.initBotDetection(); // detectar bots
        console.log('✅ Bot detectado:', this.botInfo?.isBot);
        //  await this.checkBotAndSend();        // enviar al endpoint
        // if (this.isBot()) this.handleBotView(); // bloquear si es bot
    })();
}

  // =====================
  // Inicializadores
  // =====================
  private createInitialEvents(): Events {
  return {
    leadId: `lead_${Date.now()}`,
    createdAt: new Date().toISOString(),
    errors: [],
    userInfo: {
      browser: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      deviceType: /Mobi|Android/i.test(navigator.userAgent)
        ? 'mobile'
        : 'desktop',
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      fingerprint: null, // <-- inicializamos
      isBot: null,       // <-- inicializamos
    },
    session: {
      sessionId: `sess_${Date.now()}`,
      entryUrl: this.pageUrl,
      exitUrl: this.pageUrl,
      pages: [],
      rrwebEvents: [],
      systemEvents: [],
    },
  };
}

  private initPage(): void {
    const exists = this.events.session.pages.find(
      p => p.page === this.pageUrl
    );

    if (!exists) {
      this.events.session.pages.push({
        page: this.pageUrl,
        duration: 0,
        totalClicks: 0,
        percentageScroll: 0,
        events: [],
      });
    }
  }

  private initNavigationListener(): void {
  if ((window as any).__ptHistoryPatched) return;
  (window as any).__ptHistoryPatched = true;

  const handleNavigation = () => {
    const newUrl = window.location.pathname;
    if (newUrl === this.pageUrl) return;
    this.handlePageChange(newUrl);
  };

  window.addEventListener('popstate', handleNavigation);

  const pushState = history.pushState;
  const replaceState = history.replaceState;

  history.pushState = (...args) => {
    pushState.apply(history, args);
    handleNavigation();
  };

  history.replaceState = (...args) => {
    replaceState.apply(history, args);
    handleNavigation();
  };
}


private handlePageChange(newPage: string): void {
  const now = Date.now();

  // Record the exit from current page
  const currentPage = this.getCurrentPage();
  if (currentPage) {
    currentPage.duration = now - this.pageStartTime;
    this.recordEvent('page_exit', {
      page: this.pageUrl,
      duration: currentPage.duration,
      maxScroll: this.maxScroll,
    });
  }

  // Reset tracking variables
  this.maxScroll = 0;
  this.lastEvent = null;

  // Store the old page before updating
  const oldPage = this.pageUrl;
  
  // Update page URL and timestamps
  this.pageUrl = newPage;
  this.pageStartTime = now;
  this.startTime = now;

  // Initialize the new page
  this.initPage();

  // Update session's exit URL
  this.events.session.exitUrl = newPage;

  // Record the new page view
  this.recordEvent('page_view', {
    page: newPage,
    previousPage: oldPage
  });
}




  private async initFingerprint(): Promise<void> {
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    this.fingerprint = result.visitorId;

    // Guardamos directamente en userInfo
    this.events.userInfo.fingerprint = this.fingerprint;
  } catch (error) {
    console.error('❌ Fingerprint error:', error);
    this.fingerprint = null;
    this.events.userInfo.fingerprint = null;
  }
}


  private async initBotDetection(): Promise<void> {
    this.botDetector = new BotDetector();
    this.botInfo = await this.botDetector.detect();
  
    // Guardamos directamente en userInfo
    this.events.userInfo.isBot = this.botInfo?.isBot ?? false;
  }

  private updateUserInfo(): void {
    this.events.userInfo.fingerprint = this.fingerprint;
    this.events.userInfo.isBot = this.botInfo?.isBot ?? false;
  }

    // =====================
    // Identity storage
    // =====================
    private getStoredUserId(): string | null {
      return localStorage.getItem(PT_USER_KEY);
    }
    
    private setStoredUserId(userId: string): void {
      localStorage.setItem(PT_USER_KEY, userId);
    }
    
    private clearStoredUserId(): void {
      localStorage.removeItem(PT_USER_KEY);
    }
    
   
  // =====================
  // Bot helpers
  // =====================
  public isBot(): boolean {
    return this.botInfo?.isBot ?? false;
  }

  public async isBotAsync(): Promise<boolean> {
    if (!this.botInfo) {
      this.botInfo = await this.botDetector.detect();
    }
    return this.botInfo.isBot;
  }


 
  
  // =====================
  // Tracking
  // =====================
  public recordEvent(type: string, data: EventData = {}): void {
  const now = Date.now();
  const currentPage = this.pageUrl;

  const event: RecordedEvent = {
    type,
    data,
    timestamp: now,
    relativeTime: now - this.sessionStartTime,
    page: currentPage // Add page URL directly to the event
  };

  const hash = JSON.stringify(event);
  if (this.lastEvent === hash) return;
  this.lastEvent = hash;

  const page = this.getCurrentPage();
  page.events.push({
    ...event,
    page: currentPage // Ensure page is included in page events too
  });

  if (type === 'click') page.totalClicks++;

  this.events.session.systemEvents.push(event);
}

  private getCurrentPage() {
    return this.events.session.pages.find(
      p => p.page === this.pageUrl
    )!;
  }

  // =====================
  // DOM listeners
  // =====================
  public initListeners(): void {
    this.initClickListener();
    this.initInputListener();
    this.initScrollListener();
   
  }

  private initClickListener(): void {
    document.body.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (
        ['BUTTON', 'A'].includes(target.tagName) ||
        target.dataset.track === 'true'
      ) {
        this.recordEvent('click', {
          button: e.button,
          x: e.clientX,
          y: e.clientY,
          target: target.tagName,
          text: target.innerText || (target as any).value,
        });
      }
    });
  }

  private initInputListener(): void {
    const inputTimeouts = new WeakMap<Element, number>();

    document.body.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (!['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      const prevTimeout = inputTimeouts.get(target);
      if (prevTimeout) clearTimeout(prevTimeout);

      const timeoutId = window.setTimeout(() => {
        if (!target.value) return;

        this.recordEvent('input', {
          tag: target.tagName,
          name: target.name || target.id || null,
          value: target.value.slice(0, 50),
          length: target.value.length,
        });
      }, 500);

      inputTimeouts.set(target, timeoutId);
    });
  }

  private initScrollListener(): void {
    window.addEventListener('scroll', () => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (scrollHeight <= 0) return;

      const percent = Math.round(
        (window.scrollY / scrollHeight) * 100
      );

      if (percent > this.maxScroll) {
        this.maxScroll = percent;
        this.getCurrentPage().percentageScroll = percent;
      }
    });
  }

  // =====================
  // Session end
  // =====================
  public async endSession(
    userId?: string,
    rrwebEvents: any[] = []
  ): Promise<void> {
    const now = Date.now();
    const sessionDuration = now - this.sessionStartTime;
  
    this.updateUserInfo();
  
    const page = this.getCurrentPage();
    page.duration = now - this.pageStartTime;
  
    this.events.session.exitUrl = this.pageUrl;
  
    this.lastEvent = null;
  
    this.recordEvent('session_end', {
      duration: sessionDuration,
      maxScroll: this.maxScroll,
    });
  
    const totalClicks = this.events.session.systemEvents.filter(e => e.type === 'click').length;
    const totalInputs = this.events.session.systemEvents.filter(e => e.type === 'input').length;
    const totalPagesVisited = new Set(this.events.session.systemEvents
      .filter(e => e.type === 'navigation')
      .map(e => e.data?.url || '')).size + 1;  

    const payload = JSON.stringify({
      errors: this.getErrors(),
      user_id: userId ?? this.options.userId,
      business_id: this.options.businessId,
      user_info: this.events.userInfo,
      fingerprint: this.fingerprint,
      tracker_events: this.events.session.systemEvents,
      session_record: rrwebEvents,
      duration_ms: sessionDuration,
      entry_page: this.events.session.entryUrl,
      exit_page: this.pageUrl,
      total_clicks: totalClicks,
      total_inputs: totalInputs,
      total_pages_visited: totalPagesVisited,
    });

    console.log('payload', payload);
  
    this.sendPayload(payload);
  }


  private async sendPayload(payload: string): Promise<void> {
    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([payload], {
          type: 'application/json',
        });
        if (navigator.sendBeacon(this.endpoint, blob)) return;
      } catch (err) {
        console.error('❌ sendBeacon error:', err);
      }
    }

    await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      credentials: 'include',
    }).catch(console.error);
  }

  private async sendBotStatus() {

    const isBot = this.botInfo?.isBot ?? false;

    console.log('envio los datos', isBot);

    const payload = JSON.stringify({
        user_id: this.options.userId,
        business_id: this.options.businessId,
        isBot,
        user_info: this.events.userInfo,
        timestamp: Date.now(),
    });

    try {
        if (navigator.sendBeacon) {
            navigator.sendBeacon(this.endpoint, new Blob([payload], { type: 'application/json' }));
        } else {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                credentials: 'include',
            });
        }
    } catch (err) {
        console.error('❌ Error enviando bot status:', err);
    }

    // // Si es bot, bloqueamos visualización
    // if (isBot) this.handleBotView(true);
}

  

  // =====================
  // Lifecycle
  // =====================
  public handleBeforeUnload(
    userId?: string,
    rrwebEvents: any[] = []
  ): void {
    window.addEventListener('beforeunload', () => {
      this.endSession(userId, rrwebEvents);
    });
  }


  // =====================
  // Errores
  // =====================
  private getErrors(): TrackedError[] {
  return this.errors;
}


  private initErrorsEvents(): void {
    const trackError = (trackedError: TrackedError, type: string) => {
      const hash = this.generateErrorHash(trackedError);

      const existing = this.errors.find(err => err.hash === hash);
      if (existing) {
        existing.count = (existing.count || 1) + 1;
        existing.lastOccurred = Date.now();
      } else {
        trackedError.hash = hash;
        trackedError.count = 1;
        trackedError.lastOccurred = Date.now();

        this.errors.push(trackedError);
        this.events.errors.push(trackedError);
        this.recordEvent(type, trackedError);
      }
    };

    // JS runtime errors
    window.addEventListener('error', (e: ErrorEvent) => {
      const trackedError: TrackedError = {
        message: e.message,
        source: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack,
        timestamp: Date.now(),
        page: this.pageUrl,
        hash: '',
        lastOccurred: Date.now(),
      };
      trackError(trackedError, 'error');
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
      const trackedError: TrackedError = {
        message: String(e.reason),
        stack: e.reason?.stack,
        timestamp: Date.now(),
        page: this.pageUrl,
        hash: '',
        lastOccurred: Date.now(),
      };
      trackError(trackedError, 'unhandled_rejection');
    });

    // Intercept console.error
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const trackedError: TrackedError = {
        message: args.map(a => String(a)).join(' '),
        timestamp: Date.now(),
        page: this.pageUrl,
        hash: '',
        lastOccurred: Date.now(),
      };
      trackError(trackedError, 'console_error');

      originalConsoleError.apply(console, args);
    };
  }


  private generateErrorHash(err: TrackedError): string {
    const str = `${err.message}|${err.stack ?? ''}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // 32-bit int
    }
    return hash.toString();
  }

  
  private showBotBlockMessage(): void {
    document.body.innerHTML = '';
  
    const message = document.createElement('div');
    message.textContent = '🚫 Página protegida por PulseTrack – Acceso solo para humanos';
    Object.assign(message.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#f56565',
      color: 'white',
      padding: '20px',
      fontSize: '18px',
      borderRadius: '8px',
      textAlign: 'center',
      zIndex: '9999',
    });
  
    document.body.appendChild(message);
    document.body.style.pointerEvents = 'none';
  }
  
  private handleBotView(): void {
  if (!this.botInfo?.isBot) return;

  document.body.innerHTML = '';

  const message = document.createElement('div');
  message.textContent = '🚫 Página protegida por PulseTrack – Acceso solo para humanos';

  Object.assign(message.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#f56565',
    color: 'white',
    padding: '20px',
    fontSize: '18px',
    borderRadius: '8px',
    textAlign: 'center',
    zIndex: '9999',
  });

  document.body.appendChild(message);
  document.body.style.pointerEvents = 'none';
}
  // =====================
  // Debug
  // =====================
  public getEvents(): Events {
    const totalClicks = this.events.session.systemEvents.filter(e => e.type === 'click').length;
    const totalInputs = this.events.session.systemEvents.filter(e => e.type === 'input').length;
    const totalPagesVisited = new Set([
      this.events.session.entryUrl,
      ...this.events.session.systemEvents
        .filter(e => e.type === 'navigation')
        .map(e => e.data?.url || '')
    ]).size;

    return {
      ...this.events,
      total_clicks: totalClicks,
      total_inputs: totalInputs,
      total_pages_visited: totalPagesVisited,
      session: {
        ...this.events.session,
        entry_page: this.events.session.entryUrl,
        exit_page: this.pageUrl,
        total_clicks: totalClicks,
        total_inputs: totalInputs,
        total_pages_visited: totalPagesVisited,
      }
    }
 
  }
}
