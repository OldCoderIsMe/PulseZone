import test from 'node:test';
import assert from 'node:assert/strict';

function createClassList(initialHidden = false) {
  const names = new Set(initialHidden ? ['hidden'] : []);
  return {
    add: (...values) => values.forEach((name) => names.add(name)),
    remove: (...values) => values.forEach((name) => names.delete(name)),
    toggle: (name, force) => {
      const enabled = force === undefined ? !names.has(name) : Boolean(force);
      if (enabled) names.add(name); else names.delete(name);
      return enabled;
    },
    contains: (name) => names.has(name),
  };
}

function createElement(selector, { value = '', checked = false, hidden = false } = {}) {
  const listeners = new Map();
  return {
    selector,
    value,
    checked,
    textContent: '',
    innerHTML: '',
    classList: createClassList(hidden),
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    dispatch(type) {
      const event = { preventDefault() {} };
      (listeners.get(type) || []).forEach((handler) => handler(event));
    },
    scrollIntoView() {},
  };
}

function createDom() {
  const elements = new Map();
  const methodInputs = ['max', 'hrr', 'lthr'].map((value) => createElement(`method:${value}`, { value, checked: value === 'max' }));
  const sportInputs = ['run', 'ride', 'swim'].map((value) => createElement(`sport:${value}`, { value, checked: value === 'run' }));

  const initial = {
    '#age': { value: '30' },
    '#max-formula': { value: 'tanaka' },
    '#max-hr': { value: '187' },
    '#resting-hr': { value: '58' },
    '#lthr': { value: '168' },
    '#results': { hidden: true },
    '#comparison': { hidden: true },
    '#inputs-hrr': { hidden: true },
    '#inputs-lthr': { hidden: true },
  };

  for (const [selector, options] of Object.entries(initial)) {
    elements.set(selector, createElement(selector, options));
  }

  const select = (selector) => {
    if (!elements.has(selector)) elements.set(selector, createElement(selector));
    return elements.get(selector);
  };

  const document = {
    querySelector(selector) {
      if (selector === 'input[name="method"]:checked') return methodInputs.find((input) => input.checked);
      if (selector === 'input[name="sport"]:checked') return sportInputs.find((input) => input.checked);
      return select(selector);
    },
    querySelectorAll(selector) {
      if (selector === 'input[name="method"]') return methodInputs;
      if (selector === 'input[name="sport"]') return sportInputs;
      return [];
    },
  };

  const checkSport = (index) => {
    sportInputs.forEach((input, position) => { input.checked = position === index; });
    sportInputs[index].dispatch('change');
  };

  const checkMethod = (index) => {
    methodInputs.forEach((input, position) => { input.checked = position === index; });
    methodInputs[index].dispatch('change');
  };

  return { document, select, methodInputs, sportInputs, checkSport, checkMethod };
}

const dom = createDom();
globalThis.document = dom.document;
await import('../app.js');

const count = (html, pattern) => (html.match(pattern) || []).length;

test('result page flow renders single method, comparison, sport switching and validation', () => {
  const form = dom.select('#calculator-form');
  const error = dom.select('#form-error');
  const results = dom.select('#results');
  const comparison = dom.select('#comparison');
  const grid = dom.select('#comparison-grid');
  const title = dom.select('#result-title');
  const zones = dom.select('#zones');

  assert.equal(results.classList.contains('hidden'), true);
  assert.equal(comparison.classList.contains('hidden'), true);

  form.dispatch('submit');
  assert.equal(results.classList.contains('hidden'), false);
  assert.equal(title.textContent, '跑步 · 最大心率法');
  assert.equal(count(zones.innerHTML, /class="zone-row"/g), 5);
  assert.equal(comparison.classList.contains('hidden'), true);

  dom.select('#compare-result-button').dispatch('click');
  assert.equal(comparison.classList.contains('hidden'), false);
  assert.equal(dom.select('#comparison-sport').textContent, '跑步 · 同一组数据 · Z1–Z5 并列对比');
  assert.equal(count(grid.innerHTML, /class="comparison-card"/g), 3);
  assert.equal(count(grid.innerHTML, /class="comparison-zone"/g), 15);
  assert.match(grid.innerHTML, /最大心率法/);
  assert.match(grid.innerHTML, /储备心率法/);
  assert.match(grid.innerHTML, /乳酸阈值法/);
  assert.match(grid.innerHTML, /30 岁/);
  assert.match(grid.innerHTML, /187 bpm/);
  assert.match(grid.innerHTML, /58 bpm/);
  assert.match(grid.innerHTML, /168 bpm/);
  assert.match(grid.innerHTML, /178 bpm/);
  assert.equal(error.textContent, '');

  dom.checkSport(1);
  assert.equal(title.textContent, '骑行 · 最大心率法');
  assert.match(dom.select('#comparison-sport').textContent, /骑行/);
  assert.match(grid.innerHTML, /耐力骑/);
  assert.equal(comparison.classList.contains('hidden'), false);

  dom.checkSport(2);
  assert.equal(title.textContent, '游泳 · 最大心率法');
  assert.match(dom.select('#comparison-sport').textContent, /游泳/);
  assert.match(grid.innerHTML, /冲刺间歇/);
  assert.equal(comparison.classList.contains('hidden'), false);
  assert.match(grid.innerHTML, /94–112/);
  assert.match(grid.innerHTML, /123–135/);
  assert.match(grid.innerHTML, /109–143/);

  dom.select('#lthr').value = '';
  dom.select('#compare-result-button').dispatch('click');
  assert.match(error.textContent, /乳酸阈值心率/);
  assert.match(dom.select('#comparison-sport').textContent, /游泳/);

  dom.select('#lthr').value = '168';
  dom.select('#compare-result-button').dispatch('click');
  assert.equal(error.textContent, '');
  assert.equal(count(grid.innerHTML, /class="comparison-card"/g), 3);

  dom.select('#age').value = '50';
  dom.select('#compare-result-button').dispatch('click');
  assert.equal(title.textContent, '游泳 · 最大心率法');
  assert.match(dom.select('#summary').innerHTML, /173/);
  assert.match(grid.innerHTML, /50 岁/);
  assert.match(grid.innerHTML, /173 bpm/);
  assert.doesNotMatch(grid.innerHTML, /30 岁/);
  dom.select('#age').value = '30';

  dom.select('#reset-button').dispatch('click');
  assert.equal(results.classList.contains('hidden'), true);
  assert.equal(comparison.classList.contains('hidden'), true);

  dom.checkSport(0);
  dom.checkMethod(0);
  dom.select('#age').value = '';
  form.dispatch('submit');
  assert.match(error.textContent, /请输入年龄/);
  assert.equal(results.classList.contains('hidden'), true);

  dom.select('#age').value = '30';
  dom.checkMethod(1);
  form.dispatch('submit');
  assert.equal(results.classList.contains('hidden'), false);
  assert.equal(title.textContent, '跑步 · 储备心率法');
  assert.equal(count(zones.innerHTML, /class="zone-row"/g), 5);
  assert.match(zones.innerHTML, /123–135/);
  assert.equal(comparison.classList.contains('hidden'), true);

  dom.select('#compare-result-button').dispatch('click');
  assert.equal(comparison.classList.contains('hidden'), false);
  assert.equal(count(grid.innerHTML, /class="comparison-card"/g), 3);
});

test('comparison prompts for every field instead of using default data', () => {
  const error = dom.select('#form-error');
  const comparison = dom.select('#comparison');
  const grid = dom.select('#comparison-grid');

  for (const selector of ['#age', '#max-hr', '#resting-hr', '#lthr']) dom.select(selector).value = '';
  comparison.classList.add('hidden');
  const previousGrid = grid.innerHTML;

  dom.select('#compare-result-button').dispatch('click');
  assert.equal(comparison.classList.contains('hidden'), true);
  assert.equal(grid.innerHTML, previousGrid);
  assert.match(error.textContent, /年龄/);
  assert.match(error.textContent, /最大心率/);
  assert.match(error.textContent, /静息心率/);
  assert.match(error.textContent, /乳酸阈值心率/);
  assert.match(error.textContent, /请先填写/);
  for (const panel of ['#inputs-max', '#inputs-hrr', '#inputs-lthr']) {
    assert.equal(dom.select(panel).classList.contains('hidden'), false);
  }

  dom.select('#age').value = '30';
  dom.select('#max-hr').value = '187';
  dom.select('#resting-hr').value = '58';
  dom.select('#compare-result-button').dispatch('click');
  assert.doesNotMatch(error.textContent, /年龄/);
  assert.match(error.textContent, /乳酸阈值心率/);
  assert.equal(comparison.classList.contains('hidden'), true);

  dom.select('#lthr').value = '168';
  dom.select('#compare-result-button').dispatch('click');
  assert.equal(error.textContent, '');
  assert.equal(comparison.classList.contains('hidden'), false);
  assert.equal(count(grid.innerHTML, /class="comparison-card"/g), 3);
});
