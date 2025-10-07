// src/index.ts

import { initChatbot } from "./initChatbots.js";
import { initNps } from "./initNPS.js";
import { initErrors } from "./initErrros.js";

// export { TrackerManager } from './TrackerManager';
// export { RRWebTracker } from './RRWebTracker';
// export { SystemTracker } from './SystemTracker';
// export type { TrackerConfig, Events } from './interfaces';

// import { Tests } from './test';
// new Tests();

const tracker = new initErrors({
    projectId: 'demo-123',
    endpoint: 'https://jsonplaceholder.typicode.com/posts', // endpoint falso para pruebas
    environment: 'dev',
    release: 'v1.0.0'
  });

const nps = new initNps({
    projectId: 'demo-123',
    endpoint: 'https://jsonplaceholder.typicode.com/posts', // fake API para probar
    themeColor: '#16a34a',
    position: 'bottom-left',
    autoShow: true,
    delay: 1000
  });

 
const bot = new initChatbot({
  projectId: 'demo123',
  welcomeMessage: '¡Hola! Soy tu asistente virtual 😊',
  themeColor: '#17202F',
  position: 'bottom-right',
  botName: 'Sofia Reyes',
  poweredBy: 'Radi Pets',
  autoOpen: false
});


// export { VariantsManager } from './Variants';

// export { FherNotification, NotificationType } from "./Notifications";

 

// usar 
// npm link
// npm run build -- -- watch