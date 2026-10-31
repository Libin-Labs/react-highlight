export interface HighlightOptions {
  caseSensitive?: boolean;
  maxMatches?: number;
}

export interface HighlightMatch {
  start: number;
  end: number;
  text: string;
  termIndex: number;
}

export interface HighlightResult {
  matches: HighlightMatch[];
  truncated: boolean;
}

export const HIGHLIGHT_LIMITS = Object.freeze({
  textLength: 1_000_000,
  terms: 100,
  termLength: 10_000,
  matches: 100_000,
});

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Literal, leftmost, non-overlapping matches; longest term wins ties. */
export function findHighlightMatches(
  text: string,
  terms: readonly string[],
  options: HighlightOptions = {},
): HighlightResult {
  const maxMatches = options.maxMatches ?? 10_000;
  if (!Number.isInteger(maxMatches) || maxMatches < 1 || maxMatches > HIGHLIGHT_LIMITS.matches) {
    throw new RangeError('maxMatches must be an integer from 1 to 100000');
  }
  if (
    text.length > HIGHLIGHT_LIMITS.textLength ||
    terms.length > HIGHLIGHT_LIMITS.terms ||
    terms.some((term) => term.length > HIGHLIGHT_LIMITS.termLength)
  ) {
    throw new RangeError('Highlight input exceeds HIGHLIGHT_LIMITS');
  }
  const ordered = terms
    .map((term, termIndex) => ({ term, termIndex }))
    .filter(({ term }) => term.length > 0)
    .sort((a, b) => b.term.length - a.term.length || a.termIndex - b.termIndex);
  if (ordered.length === 0) return { matches: [], truncated: false };
  const pattern = new RegExp(
    ordered.map(({ term }) => `(${escapeRegExp(term)})`).join('|'),
    options.caseSensitive ? 'g' : 'gi',
  );
  const matches: HighlightMatch[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (matches.length === maxMatches) return { matches, truncated: true };
    const group = match.slice(1).findIndex((value) => value !== undefined);
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      termIndex: ordered[group]!.termIndex,
    });
  }
  return { matches, truncated: false };
}
