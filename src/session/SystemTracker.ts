// src/SystemTracker.ts
import { Events, EventData, RecordedEvent } from './interfaces';

export class SystemTracker {
  private events: Events;
  private startTime: number;
  private maxScroll = 0;
  private lastEvent: string | null = null;
  private pageUrl = window.location.pathname;
 
  private endpoint = 'http://localhost:3000/sessions';
  // private endpoint = 'https://trackit-suite-back.onrender.com/sessions';

  constructor(events: Events) {
    this.events = events;
    this.startTime = Date.now();
    this.initPage();
  }

  private initPage() {
    console.log('inicializador de la session')
    let currentPage = this.events.session.pages.find(p => p.page === this.pageUrl);
    if (!currentPage) {
      currentPage = { page: this.pageUrl, duration: 0, totalClicks: 0, percentageScroll: 0, events: [] };
      this.events.session.pages.push(currentPage);
    }
  }

  recordEvent(type: string, data: EventData = {}) {
    const event: RecordedEvent = { type, data, timestamp: Date.now(), relativeTime: Date.now() - this.startTime };
    const eventString = JSON.stringify(event);
    if (this.lastEvent === eventString) return;
    this.lastEvent = eventString;

    const currentPage = this.events.session.pages.find(p => p.page === this.pageUrl)!;
    currentPage.events.push(event);
    if (type === 'click') currentPage.totalClicks++;

    this.events.session.systemEvents.push({ ...event, page: this.pageUrl });
  }

  initListeners() {
    document.body.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (['BUTTON', 'A'].includes(target.tagName) || target.dataset.track === 'true') {
        this.recordEvent('click', {
          button: e.button,
          x: e.clientX,
          y: e.clientY,
          target: target.tagName,
          text: target.innerText || (target as any).value,
        });
      }
    });

    const inputTimeouts = new WeakMap<Element, number>();
    document.body.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (!['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      const prevTimeout = inputTimeouts.get(target);
      if (prevTimeout) clearTimeout(prevTimeout);

      const timeoutId = window.setTimeout(() => {
        const value = target.value;
        if (value.length > 0) {
          this.recordEvent('input', {
            tag: target.tagName,
            name: target.name || target.id || null,
            value: value.slice(0, 50),
            length: value.length,
          });
        }
      }, 500);

      inputTimeouts.set(target, timeoutId);
    });

    window.addEventListener('scroll', () => {
      const percent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      if (percent > this.maxScroll) this.maxScroll = percent;
      const currentPage = this.events.session.pages.find(p => p.page === this.pageUrl)!;
      currentPage.percentageScroll = this.maxScroll;
    });
  }

async endSession(userId?: string, rrwebEvents: any[] = []) {
  const duration = Date.now() - this.startTime;

  // Actualiza duración de la página
  const currentPage = this.events.session.pages.find(p => p.page === this.pageUrl);
  if (currentPage) currentPage.duration = duration;

  this.events.session.exitUrl = this.pageUrl;

  // Registra evento de fin de sesión
  this.recordEvent('session_end', { duration, maxScroll: this.maxScroll });

  // Prepara payload
  const payload = JSON.stringify({
    user_id: userId,
    user_info: this.events.userInfo,
    business_id: '080fbac4-2aa8-4016-89ee-e339bd3c1c16',
    tracker_events: this.events.session.systemEvents,
    session_record: rrwebEvents,
    duration_ms: duration,
  });

  console.log('📦 Payload:', payload);
  console.log('🌐 Endpoint:', this.endpoint);

  // ✅ Intentar enviar con sendBeacon si es posible
  if (navigator.sendBeacon) {
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon(this.endpoint, blob);
      
      console.log(sent ? '📡 Sesión enviada con sendBeacon' : '⚠️ Falló sendBeacon, intentar fetch');
      
      if (!sent) {
        // FALLBACK 1
        await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          credentials: 'include' // <-- AÑADE ESTO
        }).catch(console.error);
      }
    } catch (err) {
      console.error('❌ Error sendBeacon:', err);
      // FALLBACK 2 (EN CASO DE ERROR)
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        credentials: 'include' // <-- AÑADE ESTO TAMBIÉN
      }).catch(console.error);
    }
  } else {
    // FETCH NORMAL (SIN sendBeacon)
    await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      credentials: 'include' // <-- AÑADE ESTO AQUÍ
    }).catch(console.error);
  }


}

  handleBeforeUnload(userId?: string, rrwebEvents: any[] = []) {
    window.addEventListener('beforeunload', () => {
      this.endSession(userId, rrwebEvents);
    });
  }
}
