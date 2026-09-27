import { DISPLAY_MATH, INLINE_MATH } from "./math-text";
import { escapeHtml, renderMathHtml } from "./render";

export interface RenderMathTextOptions {
  /**
   * Applied to each run of plain text after it is HTML-escaped (never to math), e.g. to
   * turn URLs into links. Must return safe HTML.
   */
  formatText?: (escapedHtml: string) => string;
  /**
   * Largest size, in em, any element may take (KaTeX `maxSize`). Visitor text is untrusted,
   * so the default of 10 keeps \rule or sized delimiters from covering the page.
   */
  maxSize?: number;
}

// Display math first, so "$$…$$" is not read as two empty inline formulas.
const MATH = new RegExp(`${DISPLAY_MATH.source}|${INLINE_MATH.source}`, "g");

/**
 * Plain text with $…$ and $$…$$ (comments, excerpts, any user text) to HTML: the text is
 * escaped, the math rendered with KaTeX on the server, the same way as Math blocks. \$ is a
 * literal dollar sign. A formula KaTeX cannot parse shows in red in place. Element sizes are
 * capped (maxSize), since the text usually comes from visitors.
 */
export function renderMathText(text: string, options: RenderMathTextOptions = {}): string {
  const format = options.formatText ?? ((s: string) => s);
  const limits = { maxSize: options.maxSize ?? 10 };
  const plain = (s: string) => (s ? format(escapeHtml(s.replace(/\\\$/g, "$"))) : "");
  let html = "";
  let last = 0;
  for (const m of text.matchAll(MATH)) {
    const display = m[0].startsWith("$$");
    const latex = display ? m[0].slice(2, -2) : m[1]!;
    html += plain(text.slice(last, m.index)) + renderMathHtml(latex, display, limits);
    last = m.index! + m[0].length;
  }
  return html + plain(text.slice(last));
}
