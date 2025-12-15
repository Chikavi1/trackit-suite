// src/SystemTracker.ts
import { BotDetectionResult, BotDetector } from '../botDetector/initDetect';
import { Events, EventData, RecordedEvent } from './interfaces';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
 export class SystemTracker {
  private events: Events;
  private startTime: number;
  private maxScroll = 0;
  private lastEvent: string | null = null;
  private pageUrl = window.location.pathname;
 
  private endpoint = 'http://localhost:3000/sessions';
  // private endpoint = 'https://trackit-suite-back.onrender.com/sessions';
  private fingerprint: string | null = null;

  private botDetector!: BotDetector;
  private botInfo: BotDetectionResult | null = null;

  constructor(events: Events) {
    this.events = events;
    this.startTime = Date.now();
    this.initPage();
    this.initFingerprint();
      
    this.initBotDetection();
  }

   private async initBotDetection() {
      this.botDetector = new BotDetector();
      this.botInfo = await this.botDetector.detect();
      console.log('🔍 Bot detection result:', this.botInfo);
    }
  
    // Método sincrónico para HTML (retorna false si aún no está listo)
    public isBot(): boolean {
      return this.botInfo?.isBot || false;
    }
  
    // Método asíncrono que garantiza que la detección esté lista
    public async isBotAsync(): Promise<boolean> {
      if (!this.botInfo) {
        this.botInfo = await this.botDetector.detect();
      }
      return this.botInfo.isBot;
    }

  private async initFingerprint() {
   try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      console.log('result',result)
      this.fingerprint = result.visitorId;
      console.log("🆔 Fingerprint generado:", this.fingerprint);
    } catch (error) {
      console.error("❌ Error generando fingerprint:", error);
      this.fingerprint = null;
    }
  }

  private async detectIncognito(): Promise<boolean> {
    // Intenta múltiples métodos de detección
    const tests: Array<() => Promise<boolean>> = [
      // 1. Prueba de localStorage
      async () => {
        try {
          const testKey = 'test_' + Math.random().toString(36).slice(2);
          localStorage.setItem(testKey, 'test');
          localStorage.removeItem(testKey);
          return false; // No está en modo incógnito
        } catch (e) {
          return true; // Error al acceder a localStorage → probablemente incógnito
        }
      },
      
      // 2. Prueba de sessionStorage
      async () => {
        try {
          const testKey = 'test_' + Math.random().toString(36).slice(2);
          sessionStorage.setItem(testKey, 'test');
          sessionStorage.removeItem(testKey);
          return false;
        } catch (e) {
          return true;
        }
      },
      
      // 3. Prueba de quota de almacenamiento
      async () => {
        if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
          return false; // No soportado
        }
        
        try {
          const { quota } = await navigator.storage.estimate();
          // En modo incógnito, la cuota suele ser mucho menor
          return (quota || 0) < 120000000; // Menos de 120MB sugiere modo incógnito
        } catch (e) {
          return false; // No se pudo determinar
        }
      },
      
      // 4. Prueba de IndexedDB
      async () => {
        try {
          // Abrir una base de datos de prueba
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open('test-db');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('IndexedDB error'));
          });
          
          if (db) {
            db.close();
            // Eliminar la base de datos de prueba
            await new Promise<void>((resolve, reject) => {
              const deleteRequest = indexedDB.deleteDatabase('test-db');
              deleteRequest.onsuccess = () => resolve();
              deleteRequest.onerror = () => reject();
            });
            return false; // No está en modo incógnito
          }
        } catch (e) {
          // Error al acceder a IndexedDB → probablemente incógnito
          return true;
        }
        return false;
      }
    ];
    
    // Ejecutar todas las pruebas
    const results = await Promise.all(tests.map(test => test().catch(() => false)));
    
    // Si alguna prueba indica modo incógnito, considerar que está en modo incógnito
    return results.some(result => result === true);
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
      fingerprint: this.fingerprint,
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
