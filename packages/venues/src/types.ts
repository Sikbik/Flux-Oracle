export type TickSide = 'buy' | 'sell' | 'unknown';

export interface NormalizedTick {
  ts: number;
  venue: string;
  pair: string;
  price: string;
  size?: string;
  side?: TickSide;
}

export interface VenueAdapter {
  readonly venueId: string;
  readonly symbolMap: Readonly<Record<string, string>>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(pair: string): Promise<void>;
}

export interface NormalizationInput {
  pair: string;
  venue: string;
  ts: string | number | Date;
  price: string | number;
  size?: string | number;
  side?: string | null;
}
