export interface Variation {
  text?: string;
  color?: string;
  background?: string;
  font?: string;
  fontSize?: string;
}

export interface VariationsJSON {
  [editorId: string]: Variation;
}

export class VariantsManager {
  private editableSelectors: string = 'h1,h2,h3,h4,h5,h6,p,button,span,a';
  private elements: HTMLElement[] = [];
  private variations: VariationsJSON = {};

  constructor(private variationsUrl: string) {}

  /** Inicializa el manager: asigna IDs y aplica variaciones */
  public async init() {
    this.collectElements();
    this.assignEditorIds();
    await this.loadVariations();
    this.applyVariations();
  }

  /** 1️⃣ Selecciona todos los elementos editables */
  private collectElements() {
    this.elements = Array.from(document.querySelectorAll<HTMLElement>(this.editableSelectors));
  }

  /** 2️⃣ Asigna data-editor-id si no existe */
  private assignEditorIds() {
    this.elements.forEach((el, index) => {
      if (!el.dataset.editorId) {
        el.dataset.editorId = `editor-${index}`;
      }
    });
  }

  /** 3️⃣ Descarga las variaciones desde tu servidor */
  private async loadVariations() {
    try {
      const response = await fetch(this.variationsUrl);
      this.variations = await response.json();
    } catch (err) {
      console.error('Error cargando variaciones:', err);
    }
  }

  /** 4️⃣ Aplica las variaciones a los elementos correspondientes */
  private applyVariations() {
    this.elements.forEach(el => {
      const id = el.dataset.editorId!;
      const varData = this.variations[id];
      if (!varData) return;

      if (varData.text) el.textContent = varData.text;
      if (varData.color) el.style.color = varData.color;
      if (varData.background) el.style.backgroundColor = varData.background;
      if (varData.font) el.style.fontFamily = varData.font;
      if (varData.fontSize) el.style.fontSize = varData.fontSize;
    });
  }

  /** 5️⃣ Permite actualizar variaciones dinámicamente en memoria y aplicar al DOM */
  public applyVariation(editorId: string, variation: Variation) {
    const el = this.elements.find(e => e.dataset.editorId === editorId);
    if (!el) return;

    this.variations[editorId] = variation;

    if (variation.text) el.textContent = variation.text;
    if (variation.color) el.style.color = variation.color;
    if (variation.background) el.style.backgroundColor = variation.background;
    if (variation.font) el.style.fontFamily = variation.font;
    if (variation.fontSize) el.style.fontSize = variation.fontSize;
  }

  /** 6️⃣ Devuelve el JSON completo actualizado */
  public getVariations(): VariationsJSON {
    return this.variations;
  }
}
