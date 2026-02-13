import { EventEmitter } from 'node:events';

import type { NormalizedTick, VenueAdapter } from './types.js';

export abstract class BaseVenueAdapter extends EventEmitter implements VenueAdapter {
  abstract readonly venueId: string;
  abstract readonly symbolMap: Readonly<Record<string, string>>;

  abstract connect(): Promise<void>;

  abstract disconnect(): Promise<void>;

  abstract subscribe(pair: string): Promise<void>;

  protected emitTick(tick: NormalizedTick): void {
    this.emit('tick', tick);
  }
}
