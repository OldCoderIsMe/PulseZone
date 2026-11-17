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

export const SPORTS = {
  run: { label: '跑步', descriptions: ['恢复与热身', '有氧基础', '节奏训练', '乳酸阈值', '高强度间歇'] },
  ride: { label: '骑行', descriptions: ['恢复骑', '耐力骑', '节奏骑', '阈值骑', '高强度间歇'] },
  swim: { label: '游泳', descriptions: ['技术与恢复', '有氧耐力', '持续节奏', '阈值组', '冲刺间歇'] },
};

export const ZONE_LABELS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];
export const MAX_RANGES = [[0.5, 0.6], [0.6, 0.7], [0.7, 0.8], [0.8, 0.9], [0.9, 1]];
export const HRR_RANGES = MAX_RANGES;
export const LTHR_RANGES = [[0.65, 0.85], [0.85, 0.9], [0.9, 0.95], [0.95, 1], [1, 1.06]];

export const LIMITS = {
  age: [13, 100],
  maxHr: [100, 240],
  restingHr: [30, 120],
  lthr: [100, 230],
};

export function round(value) {
  return Math.round(value);
}

export function toNumber(value) {
  if (value === null || value === undefined) return NaN;
  if (typeof value === 'string' && value.trim() === '') return NaN;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

export function maxHrFromAge(age, formula = 'tanaka') {
  return formula === 'fox' ? 220 - age : 208 - 0.7 * age;
}

export function sportDescriptions(sport) {
  return (SPORTS[sport] || SPORTS.run).descriptions;
}

export function methodLabel(method) {
  return METHODS[method] || method;
}

function rangesFor(method) {
  return method === 'lthr' ? LTHR_RANGES : method === 'hrr' ? HRR_RANGES : MAX_RANGES;
}

function inRange(value, key) {
  const [min, max] = LIMITS[key];
  return value >= min && value <= max;
}

export function validateMethod(method, values = {}) {
  if (method === 'max') {
    const age = toNumber(values.age);
    if (Number.isNaN(age)) return '请输入年龄后再计算最大心率法区间。';
    if (!inRange(age, 'age')) return '请输入 13–100 岁之间的年龄。';
    return '';
  }
  if (method === 'hrr') {
    const maxHr = toNumber(values.maxHr);
    const restingHr = toNumber(values.restingHr);
    if (Number.isNaN(maxHr) || Number.isNaN(restingHr)) return '请输入最大心率和静息心率后再计算储备心率法区间。';
    if (!inRange(maxHr, 'maxHr')) return '最大心率需在 100–240 bpm 之间。';
    if (!inRange(restingHr, 'restingHr')) return '静息心率需在 30–120 bpm 之间。';
    if (restingHr >= maxHr) return '静息心率必须低于最大心率。';
    return '';
  }
  if (method === 'lthr') {
    const lthr = toNumber(values.lthr);
    if (Number.isNaN(lthr)) return '请输入乳酸阈值心率后再计算乳酸阈值法区间。';
    if (!inRange(lthr, 'lthr')) return '乳酸阈值心率需在 100–230 bpm 之间。';
    return '';
  }
  return '未知的计算方法。';
}

export function validateComparison(values = {}) {
  return ['max', 'hrr', 'lthr']
    .map((method) => ({ method, error: validateMethod(method, values) }))
    .filter(({ error }) => error);
}

function basisFor(method, values, maxHrBase, base) {
  if (method === 'max') {
    return [
      { label: '年龄', value: `${round(values.age)} 岁` },
      { label: '估算公式', value: values.formula === 'fox' ? 'Fox' : 'Tanaka' },
      { label: '估算最大心率', value: `${round(maxHrBase)} bpm` },
    ];
  }
  if (method === 'hrr') {
    return [
      { label: '最大心率', value: `${round(values.maxHr)} bpm` },
      { label: '静息心率', value: `${round(values.restingHr)} bpm` },
      { label: '心率储备', value: `${round(base)} bpm` },
    ];
  }
  return [
    { label: '乳酸阈值心率', value: `${round(values.lthr)} bpm` },
    { label: '区间基准', value: 'LTHR 百分比' },
    { label: 'Z5 上限', value: `${round(base * LTHR_RANGES[4][1])} bpm` },
  ];
}

export function calculate({ method, age, formula = 'tanaka', maxHr, restingHr, lthr }) {
  age = toNumber(age);
  maxHr = toNumber(maxHr);
  restingHr = toNumber(restingHr);
  lthr = toNumber(lthr);

  let base;
  let summary;
  let maxHrBase = maxHr;

  if (method === 'max') {
    maxHrBase = maxHrFromAge(age, formula);
    base = maxHrBase;
    summary = [
      { label: '估算最大心率', value: round(maxHrBase), unit: 'bpm' },
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

  const values = { age, formula, maxHr, restingHr, lthr };
  const basis = basisFor(method, values, maxHrBase, base);

  return { method, summary, ranges, basis, base, maxHr: maxHrBase };
}

export function calculateComparison({ age, formula = 'tanaka', maxHr, restingHr, lthr }) {
  return ['max', 'hrr', 'lthr'].map((method) => calculate({ method, age, formula, maxHr, restingHr, lthr }));
}
