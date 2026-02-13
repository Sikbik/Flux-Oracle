import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  computeReporterSetId,
  electLeader,
  type ProposeMessage,
  type SigMessage
} from '../packages/p2p/src/index.js';
import {
  buildSimulationRegistry,
  DEFAULT_SIM_REPORTER_KEYS,
  QuorumCoordinator,
  simulateQuorumRound
} from '../packages/reporter/src/index.js';

const sharedDir = path.resolve(process.env.FPHO_SIM_SHARED_DIR ?? './data/quorum-sim');
const hourTs = Number(process.env.FPHO_SIM_HOUR_TS ?? '1707346800');
const reportHash = process.env.FPHO_SIM_REPORT_HASH ?? 'f'.repeat(64);
const timeoutMs = Number(process.env.FPHO_SIM_TIMEOUT_MS ?? '180000');

const reporterId = process.env.FPHO_REPORTER_ID;

if (reporterId) {
  await runWorkerMode({
    reporterId,
    sharedDir,
    hourTs,
    reportHash,
    timeoutMs
  });
} else {
  rmSync(sharedDir, { recursive: true, force: true });
  mkdirSync(sharedDir, { recursive: true });

  const result = await simulateQuorumRound({
    hourTs,
    reportHash
  });

  const outputPath = path.join(sharedDir, 'final.local.json');
  writeFileSync(outputPath, `${JSON.stringify(result.finalMessage, null, 2)}\n`);

  console.log('FINAL reached');
  console.log(`reporter_set_id=${result.reporterSetId}`);
  console.log(`leader=${result.leaderId}`);
  console.log(`signers=${Object.keys(result.finalMessage.signatures).length}`);
  console.log(`output=${outputPath}`);
}

interface WorkerModeOptions {
  reporterId: string;
  sharedDir: string;
  hourTs: number;
  reportHash: string;
  timeoutMs: number;
}

async function runWorkerMode(options: WorkerModeOptions): Promise<void> {
  mkdirSync(options.sharedDir, { recursive: true });

  const privateKeys = resolvePrivateKeys();
  const registry = await buildSimulationRegistry(privateKeys, 2);
  const reporterIds = registry.reporters.map((entry) => entry.id);
  const reporterSetId = computeReporterSetId(registry);
  const leaderId = electLeader(reporterIds, reporterSetId, options.hourTs);

  const privateKey = privateKeys[options.reporterId];
  if (!privateKey) {
    throw new Error(`missing private key for ${options.reporterId}`);
  }

  const coordinator = new QuorumCoordinator({
    registry,
    reporterId: options.reporterId,
    privateKeyHex: privateKey
  });

  const proposal = {
    type: 'PROPOSE',
    reporterSetId,
    hourTs: options.hourTs,
    reporterId: leaderId,
    nonce: `proposal:${options.hourTs}`,
    sentAt: Math.floor(Date.now() / 1000),
    leaderId,
    reportHash: options.reportHash
  } satisfies ProposeMessage;

  const localSignature = await coordinator.signIfProposalMatches(proposal, options.reportHash);
  if (!localSignature) {
    throw new Error('failed to sign proposal');
  }

  writeSignatureFile(options.sharedDir, options.reporterId, localSignature.signature);

  if (options.reporterId !== leaderId) {
    console.log(`[${options.reporterId}] signature published; waiting for leader ${leaderId}`);
    await waitForFile(path.join(options.sharedDir, 'final.json'), options.timeoutMs);
    console.log(`[${options.reporterId}] FINAL observed`);
    return;
  }

  console.log(`[${options.reporterId}] acting as leader`);

  for (const id of reporterIds) {
    const signature = await waitForSignature(options.sharedDir, id, options.timeoutMs);

    await coordinator.collectSignature({
      type: 'SIG',
      reporterSetId,
      hourTs: options.hourTs,
      reporterId: id,
      nonce: `sig:${options.hourTs}:${id}`,
      sentAt: Math.floor(Date.now() / 1000),
      reportHash: options.reportHash,
      signature
    } satisfies SigMessage);
  }

  const finalMessage = coordinator.buildFinalMessage({
    reporterSetId,
    hourTs: options.hourTs,
    reportHash: options.reportHash,
    reporterId: options.reporterId,
    nonce: `final:${options.hourTs}`,
    sentAt: Math.floor(Date.now() / 1000)
  });

  if (!finalMessage) {
    throw new Error('quorum not reached');
  }

  writeFileSync(
    path.join(options.sharedDir, 'final.json'),
    `${JSON.stringify(finalMessage, null, 2)}\n`
  );
  console.log('FINAL reached');
}

function resolvePrivateKeys(): Record<string, string> {
  return {
    'reporter-1':
      process.env.FPHO_REPORTER_1_PRIVATE_KEY ?? DEFAULT_SIM_REPORTER_KEYS['reporter-1'],
    'reporter-2':
      process.env.FPHO_REPORTER_2_PRIVATE_KEY ?? DEFAULT_SIM_REPORTER_KEYS['reporter-2'],
    'reporter-3': process.env.FPHO_REPORTER_3_PRIVATE_KEY ?? DEFAULT_SIM_REPORTER_KEYS['reporter-3']
  };
}

function writeSignatureFile(sharedDir: string, id: string, signature: string): void {
  writeFileSync(path.join(sharedDir, `${id}.sig`), signature);
}

async function waitForSignature(sharedDir: string, id: string, timeoutMs: number): Promise<string> {
  const file = path.join(sharedDir, `${id}.sig`);
  await waitForFile(file, timeoutMs);
  return readFileSync(file, 'utf8').trim();
}

async function waitForFile(filePath: string, timeoutMs: number): Promise<void> {
  const started = Date.now();

  while (!existsSync(filePath)) {
    if (Date.now() - started > timeoutMs) {
      throw new Error(`timeout waiting for ${filePath}`);
    }

    await delay(200);
  }
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
