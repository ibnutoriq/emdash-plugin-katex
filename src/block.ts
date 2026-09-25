/** A saved Math block's LaTeX and display mode. */
export interface MathBlockValue {
  latex: string;
  display: boolean;
}

/**
 * Reads a saved Math block ({ _type: "math", latex, display }). Returns null when there is
 * nothing to render. A missing `display` means display (block) math. A stray trailing
 * backslash is dropped: it is never valid LaTeX and is easy to leave behind when copying.
 */
export function readMathBlock(node: { latex?: unknown; display?: unknown }): MathBlockValue | null {
  let latex = typeof node.latex === "string" ? node.latex.trim() : "";
  if ((latex.match(/\\+$/)?.[0].length ?? 0) % 2 === 1) latex = latex.slice(0, -1).trimEnd();
  if (!latex) return null;
  return { latex, display: node.display !== false };
}
