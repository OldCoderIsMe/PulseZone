import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  METHODS,
  SPORTS,
  calculate,
  calculateComparison,
  maxHrFromAge,
  missingComparisonFields,
  sportDescriptions,
  validateComparison,
  validateMethod,
} from '../calculations.mjs';

const DEFAULTS = { age: 30, formula: 'tanaka', maxHr: 187, restingHr: 58, lthr: 168 };

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
  const results = calculateComparison(DEFAULTS);
  assert.deepEqual(results.map(({ method }) => method), ['max', 'hrr', 'lthr']);
  assert.ok(results.every(({ ranges }) => ranges.length === 5));
  assert.deepEqual(results[0].ranges[0], [94, 112]);
  assert.deepEqual(results[1].ranges[4], [174, 187]);
  assert.deepEqual(results[2].ranges[4], [168, 178]);
});

test('default inputs produce recomputable Z1-Z5 ranges for every method', () => {
  const [max, hrr, lthr] = calculateComparison(DEFAULTS);
  assert.deepEqual(max.ranges, [[94, 112], [112, 131], [131, 150], [150, 168], [168, 187]]);
  assert.deepEqual(hrr.ranges, [[123, 135], [135, 148], [148, 161], [161, 174], [174, 187]]);
  assert.deepEqual(lthr.ranges, [[109, 143], [143, 151], [151, 160], [160, 168], [168, 178]]);
});

test('comparison cards record each method input basis', () => {
  const [max, hrr, lthr] = calculateComparison(DEFAULTS);
  assert.deepEqual(max.basis.map(({ value }) => value), ['30 岁', 'Tanaka', '187 bpm']);
  assert.deepEqual(hrr.basis.map(({ value }) => value), ['187 bpm', '58 bpm', '129 bpm']);
  assert.equal(lthr.basis[0].value, '168 bpm');
  assert.equal(lthr.basis[2].value, '178 bpm');
  assert.equal(max.method, 'max');
  assert.equal(METHODS.hrr, '储备心率法');
});

test('Fox formula changes only the maximum heart rate comparison card', () => {
  const [max, hrr] = calculateComparison({ ...DEFAULTS, formula: 'fox' });
  assert.deepEqual(max.ranges[4], [171, 190]);
  assert.equal(max.basis[1].value, 'Fox');
  assert.deepEqual(hrr.ranges[4], [174, 187]);
});

test('validateMethod reports empty values with method-specific hints', () => {
  assert.match(validateMethod('max', { age: '' }), /请输入年龄/);
  assert.match(validateMethod('hrr', { maxHr: '', restingHr: '' }), /最大心率和静息心率/);
  assert.match(validateMethod('lthr', { lthr: '   ' }), /乳酸阈值心率/);
  assert.equal(validateMethod('max', { age: '30' }), '');
  assert.equal(validateMethod('hrr', { maxHr: '187', restingHr: '58' }), '');
  assert.equal(validateMethod('lthr', { lthr: '168' }), '');
});

test('validateMethod rejects out-of-range values and inverted heart rates', () => {
  assert.match(validateMethod('max', { age: 12 }), /13–100/);
  assert.match(validateMethod('max', { age: 101 }), /13–100/);
  assert.match(validateMethod('hrr', { maxHr: 99, restingHr: 58 }), /100–240/);
  assert.match(validateMethod('hrr', { maxHr: 187, restingHr: 12 }), /30–120/);
  assert.match(validateMethod('hrr', { maxHr: 120, restingHr: 120 }), /低于最大心率/);
  assert.match(validateMethod('lthr', { lthr: 99 }), /100–230/);
  assert.match(validateMethod('lthr', { lthr: 231 }), /100–230/);
});

test('validateComparison reports every invalid method and passes defaults', () => {
  const issues = validateComparison({ age: '', maxHr: '', restingHr: '', lthr: '' });
  assert.deepEqual(issues.map(({ method }) => method), ['max', 'hrr', 'lthr']);
  assert.ok(issues.every(({ error }) => error.length > 0));
  assert.deepEqual(validateComparison(DEFAULTS), []);
});

test('every sport exposes five distinct zone descriptions', () => {
  for (const sport of ['run', 'ride', 'swim']) {
    assert.equal(SPORTS[sport].descriptions.length, 5);
    assert.equal(sportDescriptions(sport).length, 5);
    assert.equal(SPORTS[sport].descriptions.length, calculateComparison(DEFAULTS)[0].ranges.length);
  }
  assert.notDeepEqual(sportDescriptions('run'), sportDescriptions('ride'));
  assert.notDeepEqual(sportDescriptions('ride'), sportDescriptions('swim'));
});

test('result page exposes the comparison entry and side-by-side container', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="compare-result-button"/);
  assert.match(html, /id="comparison"/);
  assert.match(html, /id="comparison-grid"/);
  assert.match(html, /id="comparison-sport"/);
  assert.match(html, /id="compare-button"/);
});

test('comparison asks for every field and never falls back to defaults', () => {
  assert.deepEqual(missingComparisonFields({}), ['年龄', '最大心率', '静息心率', '乳酸阈值心率']);
  assert.deepEqual(missingComparisonFields({ age: '30', maxHr: '', restingHr: '58', lthr: '168' }), ['最大心率']);
  assert.deepEqual(missingComparisonFields(DEFAULTS), []);

  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of ['age', 'max-hr', 'resting-hr', 'lthr']) {
    assert.doesNotMatch(html, new RegExp(`id="${id}"[^>]*\\svalue=`));
  }
});

test('action buttons share one baseline row', () => {
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.action-row\{[^}]*align-items:stretch/);
  assert.match(css, /\.action-row\{[^}]*margin-top:27px/);
  assert.doesNotMatch(css, /\.primary-button\{margin-top:(?!0)/);
});
