import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.test' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createElement: h, act, useState } = await import('react');
const { createRoot } = await import('react-dom/client');
const { Highlight } = await import('../dist/esm/index.js');

function mount(t, element) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(element));
  t.after(() => {
    act(() => root.unmount());
    host.remove();
  });
  return { host, render: (node) => act(() => root.render(node)) };
}

test('renders markup-like source as text without injection', (t) => {
  const { host } = mount(t, h(Highlight, { text: '<img src=x onerror="bad">', terms: ['img'] }));
  assert.equal(host.querySelector('img'), null);
  assert.equal(host.querySelector('mark').textContent, 'img');
  assert.equal(host.querySelector('.lp-highlight__text').textContent, '<img src=x onerror="bad">');
});

test('controlled navigation wraps and updates active semantics', (t) => {
  const events = [];
  function Demo() {
    const [active, setActive] = useState(-1);
    return h(Highlight, {
      text: 'a a',
      terms: ['a'],
      showNavigation: true,
      activeMatchIndex: active,
      onActiveMatchChange: (index, match) => {
        events.push([index, match.start]);
        setActive(index);
      },
    });
  }
  const { host } = mount(t, h(Demo));
  const buttons = host.querySelectorAll('button');
  act(() => buttons[0].click());
  assert.equal(host.querySelector('[aria-current="true"]').textContent, 'a');
  assert.equal(host.querySelector('output').textContent, '2 / 2');
  act(() => buttons[1].click());
  assert.equal(host.querySelector('output').textContent, '1 / 2');
  act(() => host.querySelectorAll('mark')[1].click());
  assert.deepEqual(events, [
    [1, 2],
    [0, 0],
    [1, 2],
  ]);
});

test('without parent updates callbacks do not change controlled active index', (t) => {
  let called = -1;
  const { host, render } = mount(
    t,
    h(Highlight, {
      text: 'a a',
      terms: ['a'],
      showNavigation: true,
      activeMatchIndex: 0,
      onActiveMatchChange: (index) => {
        called = index;
      },
    }),
  );
  act(() => host.querySelectorAll('button')[1].click());
  assert.equal(called, 1);
  assert.equal(host.querySelector('output').textContent, '1 / 2');
  render(h(Highlight, { text: 'b', terms: ['a'], showNavigation: true }));
  assert.equal(host.querySelectorAll('button')[0].disabled, true);
  assert.equal(host.querySelector('output').textContent, '0 / 0');
});

test('custom render, classes, limits and changed props remain usable', (t) => {
  const { host, render } = mount(
    t,
    h(Highlight, {
      text: 'aa',
      terms: ['a'],
      maxMatches: 1,
      activeMatchIndex: 0,
      showNavigation: true,
      matchClassName: 'custom',
      activeClassName: 'selected',
      renderMatch: (match, index, active) => h('strong', null, `${match.text}:${index}:${active}`),
    }),
  );
  assert.equal(host.querySelector('mark.custom.selected strong').textContent, 'a:0:true');
  assert.equal(host.querySelector('output').textContent, '1 / 1+');
  render(h(Highlight, { text: 'new', terms: ['new'] }));
  assert.equal(host.querySelector('mark').textContent, 'new');
});
