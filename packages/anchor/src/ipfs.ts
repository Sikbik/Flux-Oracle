export interface IpfsPublishResult {
  cid: string;
}

export interface IpfsPublisher {
  addJson(payload: unknown): Promise<IpfsPublishResult>;
}

export interface HttpIpfsPublisherOptions {
  endpoint: string;
  pin?: boolean;
  timeoutMs?: number;
}

export class HttpIpfsPublisher implements IpfsPublisher {
  private readonly endpoint: URL;
  private readonly pin: boolean;
  private readonly timeoutMs: number;

  constructor(options: HttpIpfsPublisherOptions) {
    this.endpoint = new URL(options.endpoint);
    this.pin = options.pin ?? true;
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  async addJson(payload: unknown): Promise<IpfsPublishResult> {
    const url = new URL('/api/v0/add', this.endpoint);
    url.searchParams.set('pin', this.pin ? 'true' : 'false');

    const body = new FormData();
    body.set(
      'file',
      new Blob([JSON.stringify(payload)], { type: 'application/json' }),
      'report.json'
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`ipfs add failed with status ${response.status}`);
      }

      const text = await response.text();
      const cid = parseIpfsAddCid(text);
      return { cid };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function buildIpfsMirrorUrl(cid: string, gatewayBaseUrl = 'https://ipfs.io/ipfs'): string {
  const normalizedGateway = gatewayBaseUrl.endsWith('/')
    ? gatewayBaseUrl.slice(0, -1)
    : gatewayBaseUrl;
  return `${normalizedGateway}/${cid}`;
}

function parseIpfsAddCid(responseText: string): string {
  const lines = responseText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const lastLine = lines.at(-1);
  if (!lastLine) {
    throw new Error('ipfs add response was empty');
  }

  const parsed = JSON.parse(lastLine) as { Hash?: unknown };
  if (typeof parsed.Hash !== 'string' || parsed.Hash.length === 0) {
    throw new Error('ipfs add response missing Hash');
  }

  return parsed.Hash;
}
