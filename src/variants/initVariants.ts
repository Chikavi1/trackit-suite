import { getProjectId } from '../index';

export interface ABTest {
  id: string;
  identifier: string;        // corresponde al id del elemento en el DOM
  variant_a: string;
  variant_b: string;
  clicks_a: number;
  clicks_b: number;
  conversions_a: number;
  conversions_b: number;
  extra_data: any;
}

export interface TestabConfig {
  projectId?: string;
  mode?: 'manual' | 'remote'; // si remote, traer del backend
}

export class Testab {
  private config: TestabConfig & { projectId?: string };
  private variants: Record<string, string> = {};
  private skeletonClass = 'testab-skeleton';

  constructor(config: TestabConfig = {}) {
    this.config = {
      ...config,
      projectId: getProjectId(config.projectId),
      mode: config.mode ?? 'remote',
    };
    this.init();
  }

  /** Inicializa el manager */
  public async init() {
    if (this.config.mode === 'remote') {
      this.showSkeletons();
      await this.fetchRemoteVariant();
      this.hideSkeletons();
    }
    return this;
  }

  /** Aplica skeleton a todos los elementos con clase testab */
  private showSkeletons() {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.testab'));
    elements.forEach(el => {
      // Guardar contenido original por si quieres revertir
      el.dataset.originalContent = el.innerHTML;

      // Limpiar contenido y poner skeleton
      el.innerHTML = `<div class="${this.skeletonClass}"></div>`;
      el.style.position = 'relative';
    });

    this.injectSkeletonStyles();
  }

  /** Quita skeleton y reemplaza con el contenido real */
  private hideSkeletons() {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(`.${this.skeletonClass}`));
    elements.forEach(skel => {
      const parent = skel.parentElement!;
      parent.style.position = '';
      parent.innerHTML = ''; // se reemplaza en fetchRemoteVariant
    });
  }

  /** Trae la variante remota y la aplica */
  private async fetchRemoteVariant() {
    if (!this.config.projectId) {
      console.warn('Testab: projectId no definido, no se pueden traer variantes remotas');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/ab-tests/current', {
        headers: { 'x-business-id': this.config.projectId }
      });

      if (!res.ok) throw new Error(`Error cargando A/B test: ${res.status}`);
      const data: ABTest = await res.json();

      const variant = Math.random() < 0.5 ? data.variant_a : data.variant_b;
      const el = document.getElementById(data.identifier);

      if (el) {
        // Aplicar fade-in suave
        el.style.opacity = '0';
        el.innerHTML = variant;
        requestAnimationFrame(() => {
          el.style.transition = 'opacity 0.3s ease';
          el.style.opacity = '1';
        });

        this.variants[data.identifier] = variant;
      } else {
        console.warn(`Elemento con id="${data.identifier}" no encontrado en el DOM.`);
      }

      console.log('✅ Variante remota aplicada:', data.identifier);

    } catch (err) {
      console.error('❌ Error aplicando A/B test remoto:', err);
    }
  }

  /** Aplicar manualmente una variante a cualquier id con fade-in */
  public applyVariation(identifier: string, html: string) {
    const el = document.getElementById(identifier);
    if (!el) return;

    el.style.opacity = '0';
    el.innerHTML = html;
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.3s ease';
      el.style.opacity = '1';
    });

    this.variants[identifier] = html;
  }

  /** Retorna las variantes aplicadas */
  public getVariants(): Record<string, string> {
    return this.variants;
  }

  /** Inserta los estilos CSS del skeleton */
  private injectSkeletonStyles() {
    if (document.getElementById('testab-skeleton-style')) return;

    const style = document.createElement('style');
    style.id = 'testab-skeleton-style';
    style.innerHTML = `
      .${this.skeletonClass} {
        width: 100%;
        height: 1em;
        background: linear-gradient(-90deg, #eee 0%, #ddd 50%, #eee 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
      }

      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
  }
}
