const SPORT = {
  run: { label: '跑步', descriptions: ['恢复与热身', '有氧基础', '节奏训练', '乳酸阈值', '高强度间歇'] },
  ride: { label: '骑行', descriptions: ['恢复骑', '耐力骑', '节奏骑', '阈值骑', '高强度间歇'] },
  swim: { label: '游泳', descriptions: ['技术与恢复', '有氧耐力', '持续节奏', '阈值组', '冲刺间歇'] },
};
import { METHODS, METHOD_BASIS, calculate, calculateComparison } from './calculations.mjs';
const ZONE_COLORS = ['#b6d4ff', '#8bc7a8', '#d7f34a', '#ffb13b', '#ff5a36'];
const $ = (selector) => document.querySelector(selector);

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
  $('#zones').innerHTML = result.ranges.map((range, index) => zoneMarkup(range, index, sportData)).join('');
  $('#comparison').classList.add('hidden');
  $('#results').classList.remove('hidden');
  $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function zoneMarkup(range, index, sportData) {
  const width = Math.max(10, Math.min(100, ((range[1] - range[0]) / 220) * 260));
  return `<div class="zone-row"><div class="zone-name" style="color:${ZONE_COLORS[index]}">Z${index + 1}<small>${index === 0 ? 'EASY' : index === 4 ? 'HARD' : 'BUILD'}</small></div><div><div class="zone-bar"><div class="zone-fill" style="--zone-color:${ZONE_COLORS[index]};--width:${width}%"></div></div><div class="zone-desc">${sportData.descriptions[index]}</div></div><div class="zone-values">${range[0]}–${range[1]}<small>bpm</small></div></div>`;
}

function renderComparison(results, sport) {
  const sportData = SPORT[sport];
  $('#comparison-grid').innerHTML = results.map((result) => `<article class="comparison-card"><div class="comparison-card-head"><div><span class="comparison-index">0${result.method === 'max' ? 1 : result.method === 'hrr' ? 2 : 3}</span><h3>${METHODS[result.method]}</h3></div><p>${METHOD_BASIS[result.method]}</p></div><div class="comparison-zones">${result.ranges.map((range, index) => `<div class="comparison-zone"><span style="color:${ZONE_COLORS[index]}">Z${index + 1}</span><strong>${range[0]}–${range[1]}</strong><small>${sportData.descriptions[index]}</small></div>`).join('')}</div></article>`).join('');
  $('#comparison').classList.remove('hidden');
}

function currentMethod() { return document.querySelector('input[name="method"]:checked').value; }
function switchInputs(method) { ['max','hrr','lthr'].forEach((name) => $(`#inputs-${name}`).classList.toggle('hidden', name !== method)); const help = { max:'使用年龄估算最大心率。推荐使用 Tanaka 公式：208 − 0.7 × 年龄。', hrr:'储备心率法会同时参考最大心率和静息心率，让训练区间更贴近你的实际状态。', lthr:'输入经过测试的乳酸阈值心率。没有测试数据时，可用 30 分钟全力测试的平均心率近似。' }; $('#method-help').textContent = help[method]; }

document.querySelectorAll('input[name="method"]').forEach((input) => input.addEventListener('change', () => switchInputs(currentMethod())));
document.querySelector('#calculator-form').addEventListener('submit', (event) => { event.preventDefault(); const method = currentMethod(); const error = validate(method); if (error) { $('#form-error').textContent = error; return; } const sport = document.querySelector('input[name="sport"]:checked').value; const result = calculate({ method, age: Number($('#age').value), formula: $('#max-formula').value, maxHr: Number($('#max-hr').value), restingHr: Number($('#resting-hr').value), lthr: Number($('#lthr').value) }); render(result, sport, method); });

$('#compare-button').addEventListener('click', () => {
  const sport = document.querySelector('input[name="sport"]:checked').value;
  const values = { age: Number($('#age').value), formula: $('#max-formula').value, maxHr: Number($('#max-hr').value), restingHr: Number($('#resting-hr').value), lthr: Number($('#lthr').value) };
  if (values.age < 13 || values.age > 100 || values.maxHr < 100 || values.maxHr > 240 || values.restingHr < 30 || values.restingHr >= values.maxHr || values.lthr < 100 || values.lthr > 230) {
    $('#form-error').textContent = '请先补全合理的年龄、最大心率、静息心率和乳酸阈值心率，再进行三种方法对比。';
    return;
  }
  renderComparison(calculateComparison(values), sport);
  $('#comparison').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#reset-button').addEventListener('click', () => { $('#results').classList.add('hidden'); $('#calculator-form').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
