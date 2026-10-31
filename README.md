# @lp-labs/react-highlight

Package version: `1.0.0`.

Literal, multi-term text highlighting for React 18.2 and React 19. Text and
matched strings are React text nodes, not injected HTML. No runtime
dependencies; React is the sole peer. ESM and CommonJS include matching types.

## Install

```sh
npm install @lp-labs/react-highlight react
```

```tsx
import { useState } from "react";
import { Highlight } from "@lp-labs/react-highlight";
import "@lp-labs/react-highlight/styles.css";

const terms = ["React", "a.*"];

export function SearchExample() {
  const [active, setActive] = useState(-1);
  return (
    <Highlight
      text={"React is text, not HTML.\nREACT also matches. a.* is literal."}
      terms={terms}
      activeMatchIndex={active}
      onActiveMatchChange={(index) => setActive(index)}
      showNavigation
    />
  );
}
```

`activeMatchIndex` is controlled. Callbacks propose changes; the component does
not update it itself. Use `-1` for no selection. Changing the text/terms does not
reset your selection; reset it in your application when appropriate. Keep term
arrays stable for memoization. No global state, timers, or document mutation.

## Exports and data

- `Highlight`, type `HighlightProps`.
- `findHighlightMatches(text: string, terms: readonly string[], options?:
  HighlightOptions): HighlightResult`.
- `escapeRegExp(value: string): string`: escape a literal for use in a regex.
- `HIGHLIGHT_LIMITS`: frozen `{ textLength: 1000000, terms: 100,
  termLength: 10000, matches: 100000 }`.
- Types `HighlightOptions`, `HighlightMatch`, `HighlightResult`.

`HighlightMatch` is `{ start: number, end: number, text: string, termIndex:
number }`. Offsets are half-open UTF-16 offsets into the original text; the
original spelling is preserved. `termIndex` refers to the input array.
`HighlightResult` is `{ matches: HighlightMatch[], truncated: boolean }`.
The helper is pure, deterministic, and does not mutate inputs.

Matching is literal, leftmost, non-overlapping. At the same position, the
longest term wins, then the earliest input term. Empty terms are ignored;
duplicates do not produce duplicate matches. Terms cannot match across other
already-selected matches. There is no regex, fuzzy, stemming, word-boundary,
accent-folding, tokenization, or locale-aware search mode.

```tsx
import { findHighlightMatches } from "@lp-labs/react-highlight";

const result = findHighlightMatches("a.* A.*", ["a.*"], {
  caseSensitive: false,
  maxMatches: 1
});
// { matches: [{ start: 0, end: 3, text: "a.*", termIndex: 0 }],
//   truncated: true }
```

## Props

All props are optional except `text` and `terms`.

| Prop | Type | Default / behavior |
| --- | --- | --- |
| `text` | `string` | Required source text |
| `terms` | `readonly string[]` | Required literal tokens |
| `caseSensitive` | `boolean` | `false`; JavaScript non-Unicode regex case folding |
| `maxMatches` | `number` | `10000`; retained matches, integer 1-100000 |
| `activeMatchIndex` | `number` | `-1`; out-of-range values mean no active mark |
| `onActiveMatchChange` | `(index: number, match: HighlightMatch) => void` | Called by Previous/Next and pointer clicks on marks |
| `showNavigation` | `boolean` | `false`; show Previous/Next buttons and count |
| `className`, `matchClassName`, `activeClassName` | `string` | `""`; additive root/mark/active classes |
| `style` | `CSSProperties` | No inline root style |
| `ariaLabel` | `string` | `"Highlighted text"` |
| `renderMatch` | `(match, index, active) => ReactNode` | Original matched text inside a `mark` |

`HighlightOptions` contains `caseSensitive` and `maxMatches` with the same
defaults. Navigation wraps. With no valid active index, Next selects the first
match and Previous the last. Buttons are disabled when no callback or matches
exist. A `+` after the count means more matches exist beyond `maxMatches`.
Truncation never discards source text: remaining text is rendered unhighlighted.

## Customization and accessibility

```tsx
<Highlight
  text="Status: ready"
  terms={["ready"]}
  matchClassName="search-hit"
  activeClassName="current-hit"
  renderMatch={(match) => <strong title="Search match">{match.text}</strong>}
/>
```

Override `--lp-highlight-color` and `--lp-highlight-active` on `.lp-highlight`
or a custom root class. The stylesheet preserves whitespace and wraps long
text. Source content is always escaped by React; a custom renderer is
application code and must not introduce unsafe HTML itself.

Navigation uses native keyboard-operable buttons, an `aria-live="polite"`
count, and `aria-current` on the active mark. Pointer clicks on marks are a
convenience; use navigation for keyboard selection. Selecting a match does not
move browser focus or scroll the page. A callback may scroll an application's
own container if desired. Set theme colors with sufficient contrast.

## Bounds, errors, and performance

Oversized text, too many terms, oversized individual terms, or an invalid
`maxMatches` throw `RangeError` in the helper and during component rendering.
Use an error boundary for untrusted-sized inputs. APIs expect the documented
TypeScript shapes; they are not a general-purpose unknown-data validator.
`maxMatches` is validated even for empty text/terms.

Escaped regex alternatives cannot execute user regex syntax or inject HTML.
Regex cost still depends on text length, number/length of tokens, and shared
prefixes. This is synchronous matching, not a worker or constant-time search.
The component renders all source text and retained marks; it is not
virtualized. Large allowed inputs can still be slow and consume substantial
DOM memory. Budgets are guardrails, not a latency guarantee. UTF-16 matching
does not guarantee grapheme-cluster boundaries or locale-specific case rules.

## Provenance

This package was independently authored for this project,
not copied from another highlighting library. That describes its provenance,
not a legal guarantee or a substitute for your own license review.

## License

[MIT](./LICENSE).

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
