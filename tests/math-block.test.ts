import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import MathBlock from "../src/astro/MathBlock.astro";

const render = async (node: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(MathBlock, { props: { node: { _type: "math", _key: "k", ...node } } });

describe("MathBlock.astro", () => {
  it("server-renders display math with MathML and the raw LaTeX", async () => {
    const html = await render({ latex: "\\frac{a}{b}", display: true });
    expect(html).toContain('<div class="emdash-math emdash-math--display">');
    expect(html).toContain("katex-display");
    expect(html).toContain('<annotation encoding="application/x-tex">\\frac{a}{b}</annotation>');
  });
  it("renders inline math in a paragraph", async () => {
    const html = await render({ latex: "x^2", display: false });
    expect(html).toContain('<p class="emdash-math emdash-math--inline">');
    expect(html).not.toContain("katex-display");
  });
  it("renders nothing for an empty block", async () => {
    expect((await render({ latex: "  " })).trim()).toBe("");
  });
  it("shows a parse error in place", async () => {
    expect(await render({ latex: "x^{2", display: true })).toContain("katex-error");
  });
  it("never lets saved LaTeX inject markup", async () => {
    const html = await render({ latex: "</annotation><script>alert(1)</script>", display: true });
    expect(html).not.toContain("<script>");
  });
});
