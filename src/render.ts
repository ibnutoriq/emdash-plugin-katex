import katex from "katex";

// The only module that calls KaTeX, so the site, the publish check and the editor preview agree.
const OPTIONS = { strict: "ignore", trust: false } as const;

export type MathCheck = { ok: true; html: string } | { ok: false; message: string };

/** Strict render for the publish check and the editor preview: KaTeX's message instead of red output. */
export function renderMath(latex: string, display: boolean): MathCheck {
  try {
    return { ok: true, html: katex.renderToString(latex, { ...OPTIONS, displayMode: display, throwOnError: true }) };
  } catch (err) {
    if (err instanceof katex.ParseError) {
      const raw = (err as { rawMessage?: string }).rawMessage;
      return { ok: false, message: raw ?? err.message.replace(/^KaTeX parse error:\s*/, "") };
    }
    return { ok: false, message: `KaTeX internal error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Lenient render for the public site: a parse error shows in red in place (KaTeX's own
 * behaviour); any other failure falls back to the escaped source, so a formula never breaks a page.
 */
export function renderMathHtml(latex: string, display: boolean, limits: { maxSize?: number } = {}): string {
  try {
    return katex.renderToString(latex, { ...OPTIONS, ...limits, displayMode: display, throwOnError: false });
  } catch {
    return `<code class="emdash-math__source">${escapeHtml(latex)}</code>`;
  }
}
