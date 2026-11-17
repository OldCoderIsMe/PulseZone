import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, calculateComparison, maxHrFromAge } from '../calculations.mjs';

test('Tanaka formula estimates maximum heart rate', () => assert.equal(Math.round(maxHrFromAge(30)), 187));
test('Fox formula estimates maximum heart rate', () => assert.equal(maxHrFromAge(30, 'fox'), 190));
test('maximum heart rate zones are ascending', () => {
  const zones = calculate({ method: 'max', age: 30 }).ranges;
  assert.equal(zones[0][0], 94);
  assert.equal(zones[4][1], 187);
  assert.ok(zones.every(([low, high]) => low < high));
});
test('heart rate reserve zones include resting heart rate', () => {
  const zones = calculate({ method: 'hrr', maxHr: 187, restingHr: 58 }).ranges;
  assert.equal(zones[0][0], 123);
  assert.equal(zones[4][1], 187);
});
test('lactate threshold zones use threshold percentage', () => {
  const zones = calculate({ method: 'lthr', lthr: 168 }).ranges;
  assert.deepEqual(zones[0], [109, 143]);
  assert.deepEqual(zones[3], [160, 168]);
  assert.deepEqual(zones[4], [168, 178]);
});
test('comparison returns all three methods with five zones each', () => {
  const results = calculateComparison({ age: 30, formula: 'tanaka', maxHr: 187, restingHr: 58, lthr: 168 });
  assert.deepEqual(results.map(({ method }) => method), ['max', 'hrr', 'lthr']);
  assert.ok(results.every(({ ranges }) => ranges.length === 5));
  assert.deepEqual(results[0].ranges[0], [94, 112]);
  assert.deepEqual(results[1].ranges[4], [174, 187]);
  assert.deepEqual(results[2].ranges[4], [168, 178]);
});
