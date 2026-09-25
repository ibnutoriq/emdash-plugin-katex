import { readMathBlock } from "./block";

/** Markdown for a Math block ("$$latex$$" or "$latex$"), or null when it is empty. For .md / llms.txt output. */
export function mathBlockToMarkdown(node: { latex?: unknown; display?: unknown }): string | null {
  const block = readMathBlock(node);
  if (!block) return null;
  return block.display ? `$$${block.latex}$$` : `$${block.latex}$`;
}
