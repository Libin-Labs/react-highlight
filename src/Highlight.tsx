import { useId, useMemo, type CSSProperties, type ReactNode } from 'react';
import { findHighlightMatches, type HighlightMatch, type HighlightOptions } from './matches.js';

export interface HighlightProps extends HighlightOptions {
  text: string;
  terms: readonly string[];
  activeMatchIndex?: number;
  onActiveMatchChange?: (index: number, match: HighlightMatch) => void;
  showNavigation?: boolean;
  className?: string;
  style?: CSSProperties;
  matchClassName?: string;
  activeClassName?: string;
  ariaLabel?: string;
  renderMatch?: (match: HighlightMatch, index: number, active: boolean) => ReactNode;
}

export function Highlight({
  text,
  terms,
  caseSensitive = false,
  maxMatches = 10_000,
  activeMatchIndex = -1,
  onActiveMatchChange,
  showNavigation = false,
  className = '',
  style,
  matchClassName = '',
  activeClassName = '',
  ariaLabel = 'Highlighted text',
  renderMatch,
}: HighlightProps): ReactNode {
  const id = useId();
  const result = useMemo(
    () => findHighlightMatches(text, terms, { caseSensitive, maxMatches }),
    [text, terms, caseSensitive, maxMatches],
  );
  const nodes: ReactNode[] = [];
  let position = 0;
  result.matches.forEach((match, index) => {
    if (position < match.start) nodes.push(text.slice(position, match.start));
    const active = index === activeMatchIndex;
    nodes.push(
      <mark
        key={index}
        id={`${id}-${index}`}
        className={`lp-highlight__match ${matchClassName} ${active ? `lp-highlight__active ${activeClassName}` : ''}`}
        aria-current={active ? 'true' : undefined}
        onClick={() => onActiveMatchChange?.(index, match)}
      >
        {renderMatch ? renderMatch(match, index, active) : match.text}
      </mark>,
    );
    position = match.end;
  });
  nodes.push(text.slice(position));
  const move = (direction: number): void => {
    const count = result.matches.length;
    if (!count) return;
    const valid = activeMatchIndex >= 0 && activeMatchIndex < count;
    const next = valid
      ? (activeMatchIndex + direction + count) % count
      : direction > 0
        ? 0
        : count - 1;
    onActiveMatchChange?.(next, result.matches[next]!);
  };
  const current =
    activeMatchIndex >= 0 && activeMatchIndex < result.matches.length ? activeMatchIndex + 1 : 0;
  return (
    <div className={`lp-highlight ${className}`} style={style} aria-label={ariaLabel}>
      {showNavigation && (
        <div className="lp-highlight__navigation" role="group" aria-label="Match navigation">
          <button
            type="button"
            disabled={!onActiveMatchChange || !result.matches.length}
            onClick={() => move(-1)}
          >
            Previous match
          </button>
          <output aria-live="polite">
            {current} / {result.matches.length}
            {result.truncated ? '+' : ''}
          </output>
          <button
            type="button"
            disabled={!onActiveMatchChange || !result.matches.length}
            onClick={() => move(1)}
          >
            Next match
          </button>
        </div>
      )}
      <div className="lp-highlight__text">{nodes}</div>
    </div>
  );
}
