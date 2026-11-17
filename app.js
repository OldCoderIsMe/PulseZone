const SPORT = {
  run: { label: '跑步', descriptions: ['恢复与热身', '有氧基础', '节奏训练', '乳酸阈值', '高强度间歇'] },
  ride: { label: '骑行', descriptions: ['恢复骑', '耐力骑', '节奏骑', '阈值骑', '高强度间歇'] },
  swim: { label: '游泳', descriptions: ['技术与恢复', '有氧耐力', '持续节奏', '阈值组', '冲刺间歇'] },
};
const METHODS = { max: '最大心率法', hrr: '储备心率法', lthr: '乳酸阈值法' };
const ZONE_COLORS = ['#b6d4ff', '#8bc7a8', '#d7f34a', '#ffb13b', '#ff5a36'];
const MAX_RANGES = [[.50,.60],[.60,.70],[.70,.80],[.80,.90],[.90,1.00]];
const HRR_RANGES = [[.50,.60],[.60,.70],[.70,.80],[.80,.90],[.90,1.00]];
const LTHR_RANGES = [[.65,.85],[.85,.90],[.90,.95],[.95,1.00],[1.00,1.06]];
const $ = (selector) => document.querySelector(selector);

function round(value) { return Math.round(value); }
function maxHrFromAge(age, formula) { return formula === 'fox' ? 220 - age : 208 - 0.7 * age; }
function rangesFor(method) { return method === 'lthr' ? LTHR_RANGES : method === 'hrr' ? HRR_RANGES : MAX_RANGES; }
function zoneRange(base, range) { return [round(base * range[0]), round(base * range[1])]; }
function calculate({ method, age, formula, maxHr, restingHr, lthr }) {
  let base;
  let summary;
  if (method === 'max') {
    maxHr = maxHrFromAge(age, formula);
    base = maxHr;
    summary = [{ label: '估算最大心率', value: round(maxHr), unit: 'bpm' }, { label: '计算依据', value: formula === 'fox' ? 'Fox' : 'Tanaka', unit: '' }, { label: '训练基准', value: 'HRmax', unit: '' }];
  } else if (method === 'hrr') {
    base = maxHr - restingHr;
    summary = [{ label: '心率储备', value: round(base), unit: 'bpm' }, { label: '最大心率', value: round(maxHr), unit: 'bpm' }, { label: '静息心率', value: round(restingHr), unit: 'bpm' }];
  } else {
    base = lthr;
    summary = [{ label: '乳酸阈值心率', value: round(lthr), unit: 'bpm' }, { label: '训练基准', value: 'LTHR', unit: '' }, { label: '适用方式', value: '测试值', unit: '' }];
  }
  const ranges = rangesFor(method).map((range) => method === 'hrr' ? [round(restingHr + base * range[0]), round(restingHr + base * range[1])] : zoneRange(base, range));
  return { summary, ranges, base, maxHr };
}
function validate(method) {
  const error = $('#form-error'); error.textContent = '';
  if (method === 'max') { const age = Number($('#age').value); if (!Number.isFinite(age) || age < 13 || age > 100) return '请输入 13–100 岁之间的年龄。'; }
  if (method === 'hrr') { const max = Number($('#max-hr').value); const rest = Number($('#resting-hr').value); if (max < 100 || max > 240 || rest < 30 || rest > 120 || rest >= max) return '请检查最大心率和静息心率，确保数值合理。'; }
  if (method === 'lthr') { const lthr = Number($('#lthr').value); if (lthr < 100 || lthr > 230) return '请输入 100–230 bpm 之间的乳酸阈值心率。'; }
  return '';
}
function render(result, sport, method) {
  const sportData = SPORT[sport];
  $('#result-title').textContent = `${sportData.label} · ${METHODS[method]}`;
  $('#summary').innerHTML = result.summary.map((item) => `<div class="summary-card"><small>${item.label}</small><strong>${item.value} <em>${item.unit}</em></strong></div>`).join('');
  $('#zones').innerHTML = result.ranges.map((range, index) => { const width = Math.max(10, Math.min(100, ((range[1] - range[0]) / (result.maxHr || result.base)) * 260)); return `<div class="zone-row"><div class="zone-name" style="color:${ZONE_COLORS[index]}">Z${index + 1}<small>${index === 0 ? 'EASY' : index === 4 ? 'HARD' : 'BUILD'}</small></div><div><div class="zone-bar"><div class="zone-fill" style="--zone-color:${ZONE_COLORS[index]};--width:${width}%"></div></div><div class="zone-desc">${sportData.descriptions[index]}</div></div><div class="zone-values">${range[0]}–${range[1]}<small>bpm</small></div></div>`; }).join('');
  $('#results').classList.remove('hidden');
  $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function currentMethod() { return document.querySelector('input[name="method"]:checked').value; }
function switchInputs(method) { ['max','hrr','lthr'].forEach((name) => $(`#inputs-${name}`).classList.toggle('hidden', name !== method)); const help = { max:'使用年龄估算最大心率。推荐使用 Tanaka 公式：208 − 0.7 × 年龄。', hrr:'储备心率法会同时参考最大心率和静息心率，让训练区间更贴近你的实际状态。', lthr:'输入经过测试的乳酸阈值心率。没有测试数据时，可用 30 分钟全力测试的平均心率近似。' }; $('#method-help').textContent = help[method]; }

document.querySelectorAll('input[name="method"]').forEach((input) => input.addEventListener('change', () => switchInputs(currentMethod())));
document.querySelector('#calculator-form').addEventListener('submit', (event) => { event.preventDefault(); const method = currentMethod(); const error = validate(method); if (error) { $('#form-error').textContent = error; return; } const sport = document.querySelector('input[name="sport"]:checked').value; const result = calculate({ method, age: Number($('#age').value), formula: $('#max-formula').value, maxHr: Number($('#max-hr').value), restingHr: Number($('#resting-hr').value), lthr: Number($('#lthr').value) }); render(result, sport, method); });
$('#reset-button').addEventListener('click', () => { $('#results').classList.add('hidden'); $('#calculator-form').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
