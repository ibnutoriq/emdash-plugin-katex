import { describe, expect, it } from "vitest";
import { renderMathText } from "../src/render-text";

describe("renderMathText", () => {
  it("renders inline and display math in place and keeps the text around it", () => {
    const html = renderMathText("Jadi $x^2$ dan $$\\frac{a}{b}$$ selesai.");
    expect(html.startsWith("Jadi ")).toBe(true);
    expect(html).toContain('<annotation encoding="application/x-tex">x^2</annotation>');
    expect(html).toContain("katex-display");
    expect(html.endsWith(" selesai.")).toBe(true);
  });

  it("escapes HTML in the text", () => {
    const html = renderMathText('<script>alert(1)</script> & "x"');
    expect(html).toBe("&#60;script&#62;alert(1)&#60;/script&#62; &#38; &#34;x&#34;");
  });

  it("does not let LaTeX run commands or inject markup", () => {
    // trust: false: \href and \htmlId show in red as source text; the only "javascript:" left
    // is the escaped LaTeX in the MathML annotation.
    const html = renderMathText("$\\href{javascript:alert(1)}{x}$ $\\htmlId{a}{b}$");
    expect(html).not.toMatch(/<a[\s>]/);
    expect(html).not.toContain("href=");
    expect(html).not.toContain('id="a"');
  });

  it("treats \\$ as a literal dollar sign", () => {
    expect(renderMathText("harga \\$5 dan \\$7")).toBe("harga $5 dan $7");
  });

  it("leaves an unclosed $ as text", () => {
    expect(renderMathText("Rp 5$ saja")).toBe("Rp 5$ saja");
  });

  it("shows a formula KaTeX cannot parse in place instead of throwing", () => {
    expect(renderMathText("coba $\\frac{1}$ ya")).toContain("katex-error");
    // Unknown commands render in red rather than as a parse error.
    expect(renderMathText("coba $\\fracc{1}$ ya")).toContain("#cc0000");
  });

  it("caps sizes so a visitor cannot draw a page-sized box", () => {
    // The source text stays in the MathML annotation; the rendered box is capped.
    const html = renderMathText("$\\rule{5000em}{5000em}$");
    expect(html).not.toMatch(/(width|height)[:=]"?5000em/);
    expect(html).toMatch(/width:10em/);
  });

  it("lets the caller change the size cap", () => {
    expect(renderMathText("$\\rule{30em}{1em}$", { maxSize: 40 })).toContain("30em");
  });

  it("passes plain text through formatText, never the math", () => {
    const html = renderMathText("a $x$ b", { formatText: (t) => `[${t}]` });
    expect(html.startsWith("[a ]")).toBe(true);
    expect(html.endsWith("[ b]")).toBe(true);
    expect(html).not.toContain("[x]");
  });
});
