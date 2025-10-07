declare module 'rrweb' {
  export type EventType = any;
  export interface recordOptions {
    emit: (event: EventType) => void;
  }
  export function record(options: recordOptions): (() => void) | undefined;
}
