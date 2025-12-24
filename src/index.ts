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
import { SystemTracker } from './session/SystemTracker';
import { ClientIdentity } from './ClientIdentity';
import { Feedback } from './feedback';

export const PulseTrack = {
  init,
  ClientIdentity,
  Session,
  NPS,
  survey,
  chat,
  Announcement,
  Testab,
  SystemTracker,
  Feedback
};

if (typeof window !== 'undefined') {
  (window as any).PulseTrack = PulseTrack;
}
