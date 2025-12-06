import { getProjectId } from '../index';
export interface AnnouncementConfig {
  projectId?: string;
  mode?: 'manual' | 'remote'; // 👈 Nuevo
  message?: string;
  linkUrl?: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  themeColor?: string;
  autoShow?: boolean;
  duration?: number;
  dismissible?: boolean;
  position?: 'top';
}

export class Announcement {
  private config: AnnouncementConfig & { projectId?: string };;
  private container!: HTMLDivElement;
  private isVisible = false;

  constructor(config: AnnouncementConfig) { 
     this.config = {
      type: 'info',
      themeColor: '#3b82f6',
      autoShow: true,
      duration: 0,
      dismissible: true,
      position: 'top',
      mode: config.mode ?? (config.message ? 'manual' : 'remote'),
      ...config,
      projectId: getProjectId(config.projectId),
    };

    this.init();
  }

  /** Inicializa el anuncio */
  async init() {
    if (this.config.mode === 'remote') {
      await this.fetchRemoteAnnouncement();
    }

    if (!this.config.message) {
      console.warn("Announcement: no hay mensaje para mostrar");
      return;
    }

    this.setupDOM();
  }

   private setupDOM() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.createAnnouncement());
    } else {
      this.createAnnouncement();
    }

    if (this.config.autoShow) {
      setTimeout(() => this.show(), 100);
    }
  }

  /** 🔥 Nuevo: trae anuncio remoto */
  private async fetchRemoteAnnouncement() {
  try {
    const headers: Record<string, string> = {};

    if (this.config.projectId) {
      headers["x-business-id"] = this.config.projectId;
    }

    const res = await fetch(`http://localhost:3000/announcements/current`, {
      headers,
    });

    if (!res.ok) return;

    const data = await res.json();

    this.config.message = data.message;
    this.config.linkUrl = data.linkUrl;
    this.config.type = data.type;
    this.config.themeColor = data.color;

  } catch (err) {
    console.error("Error cargando anuncio remoto:", err);
  }
}

  /** Crear el HTML del anuncio */
  private createAnnouncement() {
    // Si ya existe, no crear otra vez
    if (document.getElementById('announcement-container')) {
      this.container = document.getElementById('announcement-container') as HTMLDivElement;
      return;
    }

    this.container = document.createElement('div');
    this.container.id = 'announcement-container';
    this.container.className = 'announcement-bar';
    this.container.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      padding: 12px 24px;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background-color: ${this.getTypeColor()};
      color: white;
      font-family: sans-serif;
      font-size: 16px;
      transition: transform 0.3s ease, opacity 0.3s ease;
      transform: translateY(-100%);
      opacity: 0;
    `;

    this.container.innerHTML = `
      <span>${this.config.message}</span>
      ${this.config.linkUrl ? `<a href="${this.config.linkUrl}" target="_blank" style="color:white; text-decoration: underline; margin-left: 8px;">Más info</a>` : ''}
      ${this.config.dismissible ? `<button class="announcement-close" style="margin-left:auto; background:none; border:none; color:white; font-size:20px; cursor:pointer;">&times;</button>` : ''}
    `;

    document.body.prepend(this.container);

    if (this.config.dismissible) {
      const closeBtn = this.container.querySelector('.announcement-close') as HTMLButtonElement;
      if (closeBtn) closeBtn.addEventListener('click', () => this.hide());
    }
  }

  /** Mostrar anuncio */
  show() {
    if (!this.container) this.createAnnouncement();

    this.isVisible = true;
    this.container.style.transform = 'translateY(0)';
    this.container.style.opacity = '1';

    if (this.config.duration && this.config.duration > 0) {
      setTimeout(() => this.hide(), this.config.duration);
    }
  }

  /** Ocultar anuncio */
  hide() {
    this.isVisible = false;
    this.container.style.transform = 'translateY(-100%)';
    this.container.style.opacity = '0';
  }

  /** Color según tipo */
  private getTypeColor() {
    switch (this.config.type) {
      case 'success': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return this.config.themeColor || '#3b82f6';
    }
  }
}
