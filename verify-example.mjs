import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const sha256 = value => createHash('sha256').update(value).digest('hex');
// Canonical key order is part of the example format's checksum convention.
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
export function inspectExample(receipt, decisionBytes) {
  const { checksum, ...body } = receipt;
  if (checksum !== sha256(canonical(body))) throw new Error('Receipt content changed');
  const { digest, ...snapshot } = receipt.snapshot;
  if (digest !== sha256(canonical(snapshot))) throw new Error('Snapshot content changed');
  const decision = receipt.snapshot.sources.find(source => source.path === 'decision.md');
  if (!decision || decision.sha256 !== sha256(decisionBytes)) throw new Error('Selected decision source changed');
  return { title: receipt.title, capturedStatus: receipt.status, nextAction: receipt.nextAction,
    receiptIntegrity: 'matching', selectedDecisionSource: 'matching',
    coverage: 'Example checksum and selected decision file only. Repository freshness is not checked by this demonstration script.' };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const receipt = JSON.parse(readFileSync(new URL('./example/handoff.json', import.meta.url), 'utf8'));
  const source = readFileSync(new URL('./fixture/decision.md', import.meta.url));
  console.log(JSON.stringify(inspectExample(receipt, source), null, 2));
}
