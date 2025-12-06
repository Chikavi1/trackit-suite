export const config: { projectId?: string } = {};

export function init(options: { projectId: string }) {
  config.projectId = options.projectId;
}

export function getProjectId(provided?: string) {
  if (!provided && !config.projectId) {
    throw new Error("PulseTrack: projectId es requerido. Llama a PulseTrack.init({ projectId }) primero.");
  }
  return provided || config.projectId;
}

// importar módulos
import { NPS } from './nps';
import { Session } from './session';
import { chat } from './chat';
import { survey } from './surveys';
import { Announcement } from './announcement';
import { Testab } from './variants'

export { NPS, Session, chat, survey, Announcement, Testab };

// expose in window
if (typeof window !== 'undefined') {
  (window as any).PulseTrack = { NPS, Session, chat, survey, Announcement,Testab, init };
}
