export const METHODS = {
  max: '最大心率法',
  hrr: '储备心率法',
  lthr: '乳酸阈值法',
};

export const METHOD_BASIS = {
  max: 'HRmax · 年龄估算',
  hrr: 'HRR · 最大心率 − 静息心率',
  lthr: 'LTHR · 乳酸阈值测试值',
};

export const ZONE_LABELS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];
export const MAX_RANGES = [[0.5, 0.6], [0.6, 0.7], [0.7, 0.8], [0.8, 0.9], [0.9, 1]];
export const HRR_RANGES = MAX_RANGES;
export const LTHR_RANGES = [[0.65, 0.85], [0.85, 0.9], [0.9, 0.95], [0.95, 1], [1, 1.06]];

export function round(value) {
  return Math.round(value);
}

export function maxHrFromAge(age, formula = 'tanaka') {
  return formula === 'fox' ? 220 - age : 208 - 0.7 * age;
}

function rangesFor(method) {
  return method === 'lthr' ? LTHR_RANGES : method === 'hrr' ? HRR_RANGES : MAX_RANGES;
}

export function calculate({ method, age, formula = 'tanaka', maxHr, restingHr, lthr }) {
  let base;
  let summary;
  if (method === 'max') {
    maxHr = maxHrFromAge(age, formula);
    base = maxHr;
    summary = [
      { label: '估算最大心率', value: round(maxHr), unit: 'bpm' },
      { label: '计算依据', value: formula === 'fox' ? 'Fox' : 'Tanaka', unit: '' },
      { label: '训练基准', value: 'HRmax', unit: '' },
    ];
  } else if (method === 'hrr') {
    base = maxHr - restingHr;
    summary = [
      { label: '心率储备', value: round(base), unit: 'bpm' },
      { label: '最大心率', value: round(maxHr), unit: 'bpm' },
      { label: '静息心率', value: round(restingHr), unit: 'bpm' },
    ];
  } else {
    base = lthr;
    summary = [
      { label: '乳酸阈值心率', value: round(lthr), unit: 'bpm' },
      { label: '训练基准', value: 'LTHR', unit: '' },
      { label: '适用方式', value: '测试值', unit: '' },
    ];
  }

  const ranges = rangesFor(method).map((range) => method === 'hrr'
    ? [round(restingHr + base * range[0]), round(restingHr + base * range[1])]
    : [round(base * range[0]), round(base * range[1])]);

  return { method, summary, ranges, base, maxHr };
}

export function calculateComparison({ age, formula = 'tanaka', maxHr, restingHr, lthr }) {
  return ['max', 'hrr', 'lthr'].map((method) => calculate({ method, age, formula, maxHr, restingHr, lthr }));
}
