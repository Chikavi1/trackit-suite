import { TrackerConfig, Events } from './interfaces';
import { RRWebTracker } from './RRWebTracker';
import { SystemTracker } from './SystemTracker';

export class TrackerManager {
  public events!: any;
  private systemTracker: SystemTracker | null = null;
  private rrwebTracker: RRWebTracker | null = null;
  private userId: string;
  private excludePaths: (string | RegExp)[];

  constructor(config: TrackerConfig = {}) {
    this.userId = config.userId || 'anonymous';
    this.excludePaths = config.excludePaths || [];

    const currentPath = window.location.pathname;
    if (this.isExcluded(currentPath)) {
      console.warn(`Tracking deshabilitado para la ruta: ${currentPath}`);
      return;
    }

    // ===============================================
    // Inicializa estructura de eventos
    // ===============================================
    this.events = {
      leadId: 'lead_' + Date.now(),
      userInfo: {
        browser: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        screen: { width: window.innerWidth, height: window.innerHeight },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      session: {
        sessionId: 'sess_' + Date.now(),
        entryUrl: currentPath,
        exitUrl: currentPath,
        pages: [],
        rrwebEvents: [],
        systemEvents: [],
      },
      createdAt: new Date().toISOString(),
    };

    // ===============================================
    // Inicializa RRWebTracker primero
    // ===============================================
    this.rrwebTracker = new RRWebTracker({
      events: this.events,
      onEvent: (event) => {
        // console.log('Evento grabado RRWeb:', event)
      },
    });
    this.startRecording();

    // ===============================================
    // Inicializa SystemTracker
    // ===============================================
    this.systemTracker = new SystemTracker(this.events);
    this.startSession();

    // ===============================================
    // Captura evento de cierre de página
    // ===============================================
    this.systemTracker.handleBeforeUnload(this.userId, this.events.session.rrwebEvents);
  }

  private isExcluded(path: string): boolean {
    return this.excludePaths.some((pattern) => {
      if (pattern instanceof RegExp) return pattern.test(path);
      if (pattern.includes(':')) {
        const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
        return regex.test(path);
      }
      return path === pattern;
    });
  }

  startSession() {
    this.systemTracker?.initListeners();
  }

  async endSession() {
    if (!this.systemTracker) return;

    let rrwebEvents: any[] = [];
    if (this.rrwebTracker) {
      this.rrwebTracker.stop();
      rrwebEvents = this.events.session.rrwebEvents;
    }

    await this.systemTracker.endSession(this.userId, rrwebEvents);
  }

  startRecording() {
    this.rrwebTracker?.start();
  }

  async stopRecording() {
    await this.endSession();
  }

  getSessionJSON() {
    return this.events;
  }
}
