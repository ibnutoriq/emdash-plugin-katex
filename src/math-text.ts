// $$…$$ anywhere, and $…$ within one paragraph: not preceded by a backslash, no blank line
// inside; \$ inside is content.
export const DISPLAY_MATH = /\$\$[\s\S]+?\$\$/g;
export const INLINE_MATH = /(?<!\\)\$(?!\$)((?:\\\$|[^$\n]|\n(?!\s*\n))+?)(?<!\\)\$/g;

/** Every $$…$$ and $…$ segment of a text, delimiters included (display math first). */
export function findMathSegments(text: string): string[] {
  const display = text.match(DISPLAY_MATH) ?? [];
  const inline = text.replace(DISPLAY_MATH, " ").match(INLINE_MATH) ?? [];
  return [...display, ...inline];
}
