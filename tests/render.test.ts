import katex from "katex";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderMath, renderMathHtml } from "../src/render";

afterEach(() => vi.restoreAllMocks());

describe("renderMath (strict)", () => {
  it("renders display and inline math", () => {
    const display = renderMath("\\frac{a}{b}", true);
    expect(display.ok && display.html).toContain("katex-display");
    const inline = renderMath("x^2", false);
    expect(inline.ok && inline.html).not.toContain("katex-display");
  });
  it("keeps the raw LaTeX in the MathML annotation", () => {
    const r = renderMath("\\frac{a}{b}", false);
    expect(r.ok && r.html).toContain('<annotation encoding="application/x-tex">\\frac{a}{b}</annotation>');
  });
  it("returns KaTeX's parse error without its prefix", () => {
    expect(renderMath("\\fracc", false)).toEqual({ ok: false, message: expect.stringMatching(/^Undefined control sequence: \\fracc/) });
  });
  it("reports anything else as a KaTeX internal error", () => {
    vi.spyOn(katex, "renderToString").mockImplementation(() => { throw new TypeError("boom"); });
    expect(renderMath("x", false)).toEqual({ ok: false, message: "KaTeX internal error: boom" });
  });
  it("keeps \\href inert (trust: false)", () => {
    const r = renderMath("\\href{javascript:alert(1)}{x}", false);
    // KaTeX shows the command as plain (error-coloured) text: no link, no href attribute.
    expect(r.ok ? r.html : "").not.toMatch(/<a[\s>]|href=/);
  });
  it("renders 300 display formulas in under 3 seconds", () => {
    const start = performance.now();
    for (let i = 0; i < 300; i++) renderMath(`\\sum_{k=1}^{${i}} \\frac{k^2}{\\sqrt{k+1}}`, true);
    expect(performance.now() - start).toBeLessThan(3000);
  });
});

describe("renderMathHtml (lenient, for the public site)", () => {
  it("renders parse errors in place instead of throwing", () => {
    expect(renderMathHtml("x^{2", false)).toContain("katex-error");
  });
  it("falls back to the escaped source on an internal error", () => {
    vi.spyOn(katex, "renderToString").mockImplementation(() => { throw new TypeError("boom"); });
    expect(renderMathHtml("a<b", true)).toBe('<code class="emdash-math__source">a&#60;b</code>');
  });
});
