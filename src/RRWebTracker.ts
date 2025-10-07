// src/RRWebTracker.ts
import { Events } from './interfaces';
import { record } from 'rrweb';

export class RRWebTracker {
  private events: Events;
  private stopFn: () => void = () => {};

  constructor(events: Events) {
    this.events = events;
  }

  async start() {
    const { record } = await import('rrweb');
    this.stopFn = record({
      emit: (e: any) => {
        this.events.session.rrwebEvents.push(e);
      },
    }) || (() => {});
  }

  stop() {
    this.stopFn();
  }

  getEvents() {
    return this.events;
  }
}
