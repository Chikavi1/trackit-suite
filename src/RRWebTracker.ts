// import { Events } from './interfaces';
// import { record } from 'rrweb'; // ✅ Import normal, TSUP lo bundlea

// export class RRWebTracker {
//   private events: Events;
//   private stopFn: () => void = () => {};

//   constructor(events: Events) {
//     this.events = events;
//   }

//   start() {
//     this.stopFn = record({
//       emit: (e: any) => {
//         this.events.session.rrwebEvents.push(e);
//       },
//     });
//   }

//   stop() {
//     this.stopFn();
//   }

//   getEvents() {
//     return this.events;
//   }
// }


// src/RRWebTracker.ts
// src/RRWebTracker.ts
// src/RRWebTracker.ts
import * as rrweb from 'rrweb';
import { Events } from './interfaces';

export type RRWebEvent = rrweb.EventType;

export interface RRWebTrackerOptions {
  events?: Events;                   
  onEvent?: (event: RRWebEvent) => void;
}

export class RRWebTracker {
  private eventsArray: RRWebEvent[] = [];
  private stopFn: (() => void) | null = null;
  private recording = false;

  constructor(private options?: RRWebTrackerOptions) {}

  start() {
    if (this.recording) return;

    this.stopFn = rrweb.record({
      emit: (event: RRWebEvent) => {
        this.eventsArray.push(event);

        if (this.options?.events) {
          this.options.events.session.rrwebEvents.push(event);
        }

        if (this.options?.onEvent) {
          this.options.onEvent(event);
        }
      },
    }) || (() => {}); // ✅ Aquí aseguramos que siempre sea una función

    this.recording = true;
    console.log('✅ RRWebTracker: grabación iniciada');
  }

  stop() {
    this.stopFn?.(); // Llamamos la función
    this.stopFn = null;
    this.recording = false;
    console.log('🛑 RRWebTracker: grabación detenida');
  }

  getEvents(): RRWebEvent[] {
    return this.eventsArray;
  }

  clear() {
    this.eventsArray = [];
    console.log('🧹 RRWebTracker: eventos limpiados');
  }
}
