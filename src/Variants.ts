// ===============================================
// VariantsManager.ts - versión moderna sin JSON
// ===============================================

export interface Variation {
  html?: string; // reemplaza innerHTML completo
}

export interface VariationsJSON {
  [editorId: string]: Variation;
}

export class VariantsManager {
  private editableSelectors: string = 'h1,h2,h3,h4,h5,h6,p,button,span,a,div';
  private elements: HTMLElement[] = [];
  private variations: VariationsJSON = {};

  /** Inicializa el manager: asigna IDs y aplica variaciones */
  public init() {
    this.collectElements();
    this.assignEditorIds();
  }

  /** Selecciona todos los elementos editables */
  private collectElements() {
    this.elements = Array.from(document.querySelectorAll<HTMLElement>(this.editableSelectors));
  }

  /** Asigna data-editor-id si no existe */
  private assignEditorIds() {
    this.elements.forEach((el, index) => {
      if (!el.dataset.editorId) {
        el.dataset.editorId = `editor-${index}`;
      }
    });
  }

  /** Aplica una variación dinámica a un elemento específico */
  public applyVariation(editorId: string, variation: Variation) {
    const el = this.elements.find(e => e.dataset.editorId === editorId);
    if (!el) return;

    this.variations[editorId] = variation;

    if (variation.html !== undefined) {
      el.innerHTML = variation.html;
    }
  }

  /** Devuelve todas las variaciones en memoria */
  public getVariations(): VariationsJSON {
    return this.variations;
  }
}

// ===============================================
// Exponer globalmente para uso sin módulo
// ===============================================
if (typeof window !== 'undefined') {
  (window as any).VariantsManager = VariantsManager;
}
