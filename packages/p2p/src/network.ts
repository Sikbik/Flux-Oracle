export interface GossipConfig {
  pubsub: 'gossipsub';
  bootstrapPeers: string[];
  topics: {
    observations: string;
    proposals: string;
    signatures: string;
    finals: string;
  };
}

export function createGossipConfig(reporterSetId: string, bootstrapPeers: string[]): GossipConfig {
  return {
    pubsub: 'gossipsub',
    bootstrapPeers,
    topics: {
      observations: `/fpho/${reporterSetId}/obs`,
      proposals: `/fpho/${reporterSetId}/propose`,
      signatures: `/fpho/${reporterSetId}/sig`,
      finals: `/fpho/${reporterSetId}/final`
    }
  };
}
