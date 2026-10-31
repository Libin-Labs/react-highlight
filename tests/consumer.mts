import {
  Highlight,
  findHighlightMatches,
  escapeRegExp,
  HIGHLIGHT_LIMITS,
  type HighlightProps,
  type HighlightMatch,
  type HighlightOptions,
  type HighlightResult,
} from '@lp-labs/react-highlight';

const options: HighlightOptions = { caseSensitive: true, maxMatches: 5 };
const result: HighlightResult = findHighlightMatches('value', ['value'], options);
const match: HighlightMatch | undefined = result.matches[0];
const props: HighlightProps = {
  text: 'value',
  terms: ['value'],
  onActiveMatchChange: (index, item) => {
    void index;
    void item.start;
  },
};
void [Highlight, props, match, escapeRegExp('*'), HIGHLIGHT_LIMITS];
