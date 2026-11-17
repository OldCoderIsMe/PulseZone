import {
  METHODS,
  METHOD_BASIS,
  SPORTS,
  calculate,
  calculateComparison,
  sportDescriptions,
  validateComparison,
  validateMethod,
} from './calculations.mjs';

const ZONE_COLORS = ['#b6d4ff', '#8bc7a8', '#d7f34a', '#ffb13b', '#ff5a36'];
const ZONE_TAGS = ['EASY', 'BUILD', 'BUILD', 'BUILD', 'HARD'];
const $ = (selector) => document.querySelector(selector);

const state = { result: null, method: null, sport: 'run', comparison: null };

function currentMethod() {
  return document.querySelector('input[name="method"]:checked').value;
}

function currentSport() {
  return document.querySelector('input[name="sport"]:checked').value;
}

function sportLabel(sport) {
  return (SPORTS[sport] || SPORTS.run).label;
}

function formValues() {
  return {
    age: $('#age').value,
    formula: $('#max-formula').value,
    maxHr: $('#max-hr').value,
    restingHr: $('#resting-hr').value,
    lthr: $('#lthr').value,
  };
}

function numericValues(values) {
  return { ...values, age: Number(values.age), maxHr: Number(values.maxHr), restingHr: Number(values.restingHr), lthr: Number(values.lthr) };
}

function showError(message) {
  $('#form-error').textContent = message;
}

function clearError() {
  $('#form-error').textContent = '';
}

function hideComparison() {
  state.comparison = null;
  $('#comparison').classList.add('hidden');
}

function zoneMarkup(range, index, descriptions) {
  const width = Math.max(10, Math.min(100, ((range[1] - range[0]) / 220) * 260));
  return `<div class="zone-row"><div class="zone-name" style="color:${ZONE_COLORS[index]}">Z${index + 1}<small>${ZONE_TAGS[index]}</small></div><div><div class="zone-bar"><div class="zone-fill" style="--zone-color:${ZONE_COLORS[index]};--width:${width}%"></div></div><div class="zone-desc">${descriptions[index]}</div></div><div class="zone-values">${range[0]}–${range[1]}<small>bpm</small></div></div>`;
}

function render(result, sport, method, { scroll = true, keepComparison = false } = {}) {
  const descriptions = sportDescriptions(sport);
  $('#result-title').textContent = `${sportLabel(sport)} · ${METHODS[method]}`;
  $('#summary').innerHTML = result.summary.map((item) => `<div class="summary-card"><small>${item.label}</small><strong>${item.value} <em>${item.unit}</em></strong></div>`).join('');
  $('#zones').innerHTML = result.ranges.map((range, index) => zoneMarkup(range, index, descriptions)).join('');
  if (!keepComparison) hideComparison();
  $('#results').classList.remove('hidden');
  if (scroll) $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function comparisonBasisMarkup(result) {
  return `<dl class="comparison-basis">${result.basis.map((item) => `<div><dt>${item.label}</dt><dd>${item.value}</dd></div>`).join('')}</dl>`;
}

function renderComparison(results, sport, { scroll = false } = {}) {
  const descriptions = sportDescriptions(sport);
  $('#comparison-sport').textContent = `${sportLabel(sport)} · 同一组数据 · Z1–Z5 并列对比`;
  $('#comparison-grid').innerHTML = results.map((result, index) => `<article class="comparison-card" aria-label="${METHODS[result.method]}训练区间"><div class="comparison-card-head"><div><span class="comparison-index">0${index + 1}</span><h3>${METHODS[result.method]}</h3></div><p>${METHOD_BASIS[result.method]}</p></div>${comparisonBasisMarkup(result)}<div class="comparison-zones">${result.ranges.map((range, zoneIndex) => `<div class="comparison-zone"><span style="color:${ZONE_COLORS[zoneIndex]}">Z${zoneIndex + 1}</span><strong>${range[0]}–${range[1]}</strong><small>${descriptions[zoneIndex]}</small></div>`).join('')}</div></article>`).join('');
  $('#comparison').classList.remove('hidden');
  if (scroll) $('#comparison').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function switchInputs(method) {
  ['max', 'hrr', 'lthr'].forEach((name) => $(`#inputs-${name}`).classList.toggle('hidden', name !== method));
  const help = {
    max: '使用年龄估算最大心率。推荐使用 Tanaka 公式：208 − 0.7 × 年龄。',
    hrr: '储备心率法会同时参考最大心率和静息心率，让训练区间更贴近你的实际状态。',
    lthr: '输入经过测试的乳酸阈值心率。没有测试数据时，可用 30 分钟全力测试的平均心率近似。',
  };
  $('#method-help').textContent = help[method];
}

function syncComparisonSport() {
  if (!state.comparison) return;
  state.sport = currentSport();
  renderComparison(calculateComparison(state.comparison), state.sport);
}

function runComparison({ scroll = true } = {}) {
  const values = formValues();
  const issues = validateComparison(values);
  if (issues.length) {
    showError(`对比前请先补全数据：${issues.map(({ method, error }) => `${METHODS[method]}：${error}`).join(' ')}`);
    $('#calculator-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  clearError();
  const numbers = numericValues(values);
  state.comparison = numbers;
  state.sport = currentSport();
  if (!state.result) {
    state.method = currentMethod();
    state.result = calculate({ method: state.method, ...numbers });
  }
  render(state.result, state.sport, state.method, { keepComparison: true, scroll: false });
  renderComparison(calculateComparison(numbers), state.sport, { scroll });
}

document.querySelectorAll('input[name="method"]').forEach((input) => {
  input.addEventListener('change', () => switchInputs(currentMethod()));
});

document.querySelectorAll('input[name="sport"]').forEach((input) => {
  input.addEventListener('change', () => {
    state.sport = currentSport();
    if (state.result) render(state.result, state.sport, state.method, { scroll: false, keepComparison: Boolean(state.comparison) });
    syncComparisonSport();
  });
});

document.querySelector('#calculator-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const method = currentMethod();
  const values = formValues();
  const error = validateMethod(method, values);
  if (error) {
    showError(error);
    return;
  }

  clearError();
  const numbers = numericValues(values);
  state.result = calculate({ method, ...numbers });
  state.method = method;
  state.sport = currentSport();
  render(state.result, state.sport, method, { keepComparison: Boolean(state.comparison), scroll: true });

  if (state.comparison) {
    if (validateComparison(values).length) {
      hideComparison();
    } else {
      state.comparison = numbers;
      renderComparison(calculateComparison(numbers), state.sport);
    }
  }
});

$('#compare-button').addEventListener('click', () => runComparison());
$('#compare-result-button').addEventListener('click', () => runComparison());

$('#reset-button').addEventListener('click', () => {
  state.result = null;
  state.method = null;
  hideComparison();
  clearError();
  $('#results').classList.add('hidden');
  $('#calculator-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
