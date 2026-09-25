import { readMathBlock } from "./block";
import { findMathSegments } from "./math-text";
import { renderMath } from "./render";

export interface MathError {
  /** Portable Text field of the entry, e.g. "content". */
  field: string;
  /** 1-based position of the block within the field. */
  block: number;
  /** The LaTeX KaTeX received, trimmed. */
  latex: string;
  /** KaTeX's message. */
  message: string;
}

export interface ValidateOptions {
  /** Also check $…$ and $$…$$ inside text blocks. */
  inlineText?: boolean;
}

type Node = { _type?: unknown; children?: unknown };
type Span = { _type?: unknown; text?: unknown; marks?: unknown };

const isPortableText = (value: unknown): value is Node[] =>
  Array.isArray(value) && value.length > 0 && value.every((n) => n && typeof n === "object" && "_type" in n);

/** Text of a block split at inline code, which math auto-render skips. */
function textRuns(children: Span[]): string[] {
  const runs = [""];
  for (const c of children) {
    if (c?._type !== "span" || typeof c.text !== "string") continue;
    if (Array.isArray(c.marks) && c.marks.includes("code")) runs.push("");
    else runs[runs.length - 1] += c.text;
  }
  return runs;
}

function formulasOf(node: Node, inlineText: boolean): { latex: string; display: boolean }[] {
  if (node._type === "math") {
    const block = readMathBlock(node as { latex?: unknown; display?: unknown });
    return block ? [block] : [];
  }
  if (inlineText && node._type === "block" && Array.isArray(node.children)) {
    return textRuns(node.children as Span[]).flatMap(findMathSegments).map((s) => {
      const display = s.startsWith("$$");
      return { latex: display ? s.slice(2, -2) : s.slice(1, -1), display };
    });
  }
  return [];
}

/** Formulas in an entry's Portable Text fields that KaTeX cannot render. */
export function findMathErrors(data: Record<string, unknown>, opts: ValidateOptions = {}): MathError[] {
  const errors: MathError[] = [];
  for (const [field, value] of Object.entries(data)) {
    if (!isPortableText(value)) continue;
    value.forEach((node, i) => {
      for (const f of formulasOf(node, opts.inlineText === true)) {
        const r = renderMath(f.latex, f.display);
        if (!r.ok) errors.push({ field, block: i + 1, latex: f.latex.trim(), message: r.message });
      }
    });
  }
  return errors;
}

const MAX_LISTED = 5;
// EmDash rejects a policy reason longer than 500 code points and shows a generic error instead.
const MAX_REASON = 500;
const clip = (s: string, max: number) => {
  const chars = [...s];
  return chars.length > max ? `${chars.slice(0, max - 1).join("")}…` : s;
};

/** content:beforePublish / beforeSchedule decision: cancel with a readable reason when a formula is broken. */
export function publishRejection(content: Record<string, unknown>, opts: ValidateOptions = {}): { cancel: true; reason: string } | undefined {
  const data = content.data && typeof content.data === "object" ? (content.data as Record<string, unknown>) : {};
  const errors = findMathErrors(data, opts);
  if (errors.length === 0) return undefined;
  const entries = errors.map((e) => {
    const where = e.field === "content" ? `Block ${e.block}` : `${e.field} block ${e.block}`;
    return `${where} ${clip(e.latex, 40)}: ${clip(e.message, 120)}`;
  });
  const count = errors.length === 1 ? "1 formula has an error" : `${errors.length} formulas have errors`;
  const build = (n: number) =>
    `Cannot publish: ${count}. ${entries.slice(0, n).join(" · ")}${errors.length > n ? ` (and ${errors.length - n} more)` : ""}`;
  let n = Math.min(MAX_LISTED, entries.length);
  while (n > 1 && [...build(n)].length > MAX_REASON) n--;
  return { cancel: true, reason: clip(build(n), MAX_REASON) };
}
