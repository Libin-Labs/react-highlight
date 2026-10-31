import highlight = require('@lp-labs/react-highlight');

const options: highlight.HighlightOptions = { maxMatches: 1 };
const result: highlight.HighlightResult = highlight.findHighlightMatches('a', ['a'], options);
const props: highlight.HighlightProps = { text: 'a', terms: ['a'] };
void [result, props, highlight.Highlight, highlight.escapeRegExp('*'), highlight.HIGHLIGHT_LIMITS];
