import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inspectExample } from './verify-example.mjs';
import { sum } from './fixture/sum.mjs';
const receipt = JSON.parse(readFileSync(new URL('./example/handoff.json', import.meta.url), 'utf8'));
const decision = readFileSync(new URL('./fixture/decision.md', import.meta.url));
test('published example matches its content checksum and selected source', () => {
  assert.equal(inspectExample(receipt, decision).receiptIntegrity, 'matching');
});
test('changed next action is detected', () => {
  assert.throws(() => inspectExample({ ...receipt, nextAction: 'A different next action' }, decision), /Receipt content changed/);
});
test('changed selected decision source is detected', () => {
  assert.throws(() => inspectExample(receipt, Buffer.from('A different decision')), /Selected decision source changed/);
});
test('passing arithmetic examples leave invalid-input behavior unresolved', () => {
  assert.equal(sum(2, 3), 5);
  assert.equal(sum(-1, 1), 0);
  assert.equal(sum('2', 3), '23');
  assert.equal(receipt.status, 'checks_passed');
  assert.match(receipt.nextAction, /invalid input/);
});
