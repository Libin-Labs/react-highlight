import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { escapeRegExp, findHighlightMatches, HIGHLIGHT_LIMITS } from '../dist/esm/index.js';

test('literal punctuation is escaped, never treated as a regular expression', () => {
  const text = 'a.* <b> a.*';
  assert.deepEqual(
    findHighlightMatches(text, ['a.*']).matches.map((m) => m.start),
    [0, 8],
  );
  assert.equal(new RegExp(escapeRegExp('[](){}.*+?^$|\\')).test('[](){}.*+?^$|\\'), true);
});

test('case-insensitive default and sensitive option preserve original spelling', () => {
  assert.deepEqual(
    findHighlightMatches('Cat cat CAT', ['cat']).matches.map((m) => m.text),
    ['Cat', 'cat', 'CAT'],
  );
  assert.equal(
    findHighlightMatches('Cat cat CAT', ['cat'], { caseSensitive: true }).matches.length,
    1,
  );
});

test('longest tie wins and matches do not overlap', () => {
  assert.deepEqual(findHighlightMatches('ababa', ['a', 'aba', 'ab']).matches, [
    { start: 0, end: 3, text: 'aba', termIndex: 1 },
    { start: 4, end: 5, text: 'a', termIndex: 0 },
  ]);
});

test('empty terms ignored and duplicate ties retain first source index', () => {
  assert.deepEqual(findHighlightMatches('one', ['', 'one', 'one']).matches[0], {
    start: 0,
    end: 3,
    text: 'one',
    termIndex: 1,
  });
  assert.deepEqual(findHighlightMatches('abc', ['']), { matches: [], truncated: false });
});

test('match budget reports actual truncation, not merely reaching the cap', () => {
  assert.equal(findHighlightMatches('aa', ['a'], { maxMatches: 2 }).truncated, false);
  assert.deepEqual(findHighlightMatches('aaa', ['a'], { maxMatches: 2 }), {
    matches: [
      { start: 0, end: 1, text: 'a', termIndex: 0 },
      { start: 1, end: 2, text: 'a', termIndex: 0 },
    ],
    truncated: true,
  });
});

test('UTF-16 offsets stay valid around surrogate pairs and case mappings', () => {
  const text = '\ud83d\ude00 CAT \u0130 cat';
  for (const match of findHighlightMatches(text, ['cat', '\u0130']).matches) {
    assert.equal(text.slice(match.start, match.end), match.text);
  }
  assert.equal(findHighlightMatches(text, ['cat']).matches[0].start, 3);
});

test('all caps reject invalid values even for empty inputs', () => {
  for (const maxMatches of [0, -1, 1.5, NaN, Infinity, 100001]) {
    assert.throws(() => findHighlightMatches('', [], { maxMatches }), RangeError);
  }
  assert.throws(() => findHighlightMatches('x'.repeat(1000001), []), RangeError);
  assert.throws(() => findHighlightMatches('', Array(101).fill('a')), RangeError);
  assert.throws(() => findHighlightMatches('', ['x'.repeat(10001)]), RangeError);
  assert.equal(Object.isFrozen(HIGHLIGHT_LIMITS), true);
});

test('helpers do not mutate inputs and are deterministic', () => {
  const terms = Object.freeze(['cat', 'c']);
  assert.deepEqual(findHighlightMatches('cat c', terms), findHighlightMatches('cat c', terms));
});

test('CommonJS exposes the same usable public API', () => {
  const cjs = createRequire(import.meta.url)('../dist/cjs/index.js');
  assert.equal(typeof cjs.Highlight, 'function');
  assert.deepEqual(cjs.findHighlightMatches('a', ['a']), findHighlightMatches('a', ['a']));
});
