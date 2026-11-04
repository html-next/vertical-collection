// ember-raf-scheduler ships no types
declare module 'ember-raf-scheduler' {
  export class Token {
    constructor(parent?: Token | null);
    get cancelled(): boolean;
    cancel(): void;
  }

  export type QueueName = 'sync' | 'layout' | 'measure' | 'affect';

  export class Scheduler {
    schedule(
      queueName: QueueName,
      cb: () => void,
      parent?: Token | null,
    ): Token;
    forget(token?: Token | null): void;
  }

  export const scheduler: Scheduler;
  export default scheduler;
}

declare module '@glimmer/env' {
  export const DEBUG: boolean;
}
