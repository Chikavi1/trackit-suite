// // ===============================================
// // 📦 IMPORTS PRINCIPALES
// // ===============================================
// import { initChatbot } from "./initChatbots.js";
// import { initErrors } from "./initErrros.js";
// import { initNps } from "./nps/initNPS.js";
// // import { TrackerManager } from "./TrackerManager";
// // import { SystemTracker } from "./session/SystemTracker.js";
// // import { RRWebTracker } from "./RRWebTracker.js";

// // ===============================================
// // 📤 EXPORTS (para uso modular o global)
// // ===============================================
// export { SystemTracker, initChatbot, initErrors, initNps };

// // ===============================================
// // ⚙️ CONFIG GLOBAL
// // ===============================================
// const DEFAULT_ENDPOINT = "https://trackit-suite-back.onrender.com";

// // ===============================================
// // 🧩 CLASE PRINCIPAL DEL SDK
// // ===============================================
// export class TrackItSuite {
//   // private projectId: string;
//   private publicToken: string;
//   private endpoint: string = DEFAULT_ENDPOINT;

//   public nps: any;
//   public chatbot: any;
//   public errors: any;
//   public tracker: any;

//   constructor({ projectId, publicToken }: { projectId: string; publicToken: string }) {
//     if (!projectId || !publicToken) {
//       throw new Error("❌ TrackItSuite requiere projectId y publicToken");
//     }

//     this.projectId = projectId;
//     this.publicToken = publicToken;

//     this.initializeModules();
//   }

//   private initializeModules() {
//     this.nps = new initNps({
//       projectId: this.projectId,
//       position: "bottom-center",
//     });

//     // 💬 Chatbot
//     this.chatbot = new initChatbot({
//       projectId: this.projectId,
//       themeColor: "#17202F",
//       position: "bottom-right",
//       botName: "Sofía Reyes",
//       poweredBy: "Radi Pets",
//       welcomeMessage: "¡Hola! Soy tu asistente virtual 😊",
//     });

//     this.errors = new initErrors({
//       projectId: this.projectId,
//       environment: "prod",
//       release: "v1.0.0",
//     });

//     // Inicializa el chatbot automáticamente
//     this.chatbot.init();
//   }
// }

// // ===============================================
// // 🌍 Exponer globalmente para el navegador
// // ===============================================
// if (typeof window !== "undefined") {
//   (window as any).TrackItSuite = TrackItSuite;
//   // (window as any).TrackerManager = TrackerManager; 
//   (window as any).initNps = initNps;

//   // ✅ Ahora sí puedes usar TrackerManager
// }
