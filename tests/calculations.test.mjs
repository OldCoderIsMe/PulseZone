import test from 'node:test';
import assert from 'node:assert/strict';

const maxHrFromAge = (age, formula = 'tanaka') => formula === 'fox' ? 220 - age : 208 - 0.7 * age;
const ranges = {
  max: [[.5,.6],[.6,.7],[.7,.8],[.8,.9],[.9,1]],
  hrr: [[.5,.6],[.6,.7],[.7,.8],[.8,.9],[.9,1]],
  lthr: [[.65,.85],[.85,.9],[.9,.95],[.95,1],[1,1.06]],
};
const round = (value) => Math.round(value);
const calculate = ({method, age, maxHr, restingHr, lthr, formula='tanaka'}) => {
  if (method === 'max') { maxHr = maxHrFromAge(age, formula); return ranges.max.map(([a,b]) => [round(maxHr*a),round(maxHr*b)]); }
  if (method === 'hrr') { const reserve=maxHr-restingHr; return ranges.hrr.map(([a,b]) => [round(restingHr+reserve*a),round(restingHr+reserve*b)]); }
  return ranges.lthr.map(([a,b]) => [round(lthr*a),round(lthr*b)]);
};

test('Tanaka formula estimates maximum heart rate', () => assert.equal(round(maxHrFromAge(30)), 187));
test('Fox formula estimates maximum heart rate', () => assert.equal(maxHrFromAge(30, 'fox'), 190));
test('maximum heart rate zones are ascending', () => { const zones=calculate({method:'max',age:30}); assert.equal(zones[0][0],94); assert.equal(zones[4][1],187); assert.ok(zones.every(([low,high])=>low<high)); });
test('heart rate reserve zones include resting heart rate', () => { const zones=calculate({method:'hrr',maxHr:187,restingHr:58}); assert.equal(zones[0][0],123); assert.equal(zones[4][1],187); });
test('lactate threshold zones use threshold percentage', () => { const zones=calculate({method:'lthr',lthr:168}); assert.deepEqual(zones[0],[109,143]); assert.deepEqual(zones[3],[160,168]); assert.deepEqual(zones[4],[168,178]); });
