// ===============================================
// 📦 IMPORTS PRINCIPALES
// ===============================================
import { initChatbot } from "./initChatbots.js";
import { initErrors } from "./initErrros.js";
import { initNps } from "./initNPS.js";
import { TrackerManager } from "./TrackerManager";
import { SystemTracker } from "./SystemTracker";
import { RRWebTracker } from "./RRWebTracker.js";

// ===============================================
// 📤 EXPORTS (para uso modular o global)
// ===============================================
export { SystemTracker, initChatbot, initErrors, initNps, TrackerManager };

// ===============================================
// ⚙️ CONFIG GLOBAL
// ===============================================
const DEFAULT_ENDPOINT = "https://trackit-suite-back.onrender.com";

// ===============================================
// 🧩 CLASE PRINCIPAL DEL SDK
// ===============================================
export class TrackItSuite {
  private projectId: string;
  private publicToken: string;
  private endpoint: string = DEFAULT_ENDPOINT;

  public nps: any;
  public chatbot: any;
  public errors: any;
  public tracker: any;

  constructor({ projectId, publicToken }: { projectId: string; publicToken: string }) {
    if (!projectId || !publicToken) {
      throw new Error("❌ TrackItSuite requiere projectId y publicToken");
    }

    this.projectId = projectId;
    this.publicToken = publicToken;

    this.initializeModules();
  }

  private initializeModules() {
    // 🟢 NPS
    this.nps = new initNps({
      projectId: this.projectId,
      endpoint: `${this.endpoint}/nps`,
      position: "bottom-center",
      autoShow: true,
      delay: 1000,
    });

    // 💬 Chatbot
    this.chatbot = new initChatbot({
      projectId: this.projectId,
      themeColor: "#17202F",
      position: "bottom-right",
      botName: "Sofía Reyes",
      poweredBy: "Radi Pets",
      welcomeMessage: "¡Hola! Soy tu asistente virtual 😊",
      autoOpen: false,
    });

    // 🔴 Error Tracker
    this.errors = new initErrors({
      projectId: this.projectId,
      endpoint: `${this.endpoint}/errors`,
      environment: "prod",
      release: "v1.0.0",
    });

    // Inicializa el chatbot automáticamente
    this.chatbot.init();
  }
}

// ===============================================
// 🌍 Exponer globalmente para el navegador
// ===============================================
if (typeof window !== "undefined") {
  (window as any).TrackItSuite = TrackItSuite;
  (window as any).TrackerManager = TrackerManager; 
  (window as any).initNps = initNps;

  // ✅ Ahora sí puedes usar TrackerManager
}
