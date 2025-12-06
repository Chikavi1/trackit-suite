// src/global.d.ts
import { NPS } from './nps';
import { Session } from './session';
import { chat } from './chat';
import { survey } from './surveys';
import { Announcement } from './announcement';

declare global {
  interface Window {
    PulseTrack: {
      NPS: typeof NPS;
      Session: typeof Session;
      chat: typeof chat;
      survey: typeof survey;
      Announcement: typeof Announcement;
    };
  }
}
