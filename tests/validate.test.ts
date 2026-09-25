import katex from "katex";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findMathErrors, publishRejection } from "../src/validate";

afterEach(() => vi.restoreAllMocks());

const text = (key: string, t: string) => ({
  _type: "block", _key: key, style: "normal", markDefs: [],
  children: [{ _type: "span", _key: `${key}s`, text: t, marks: [] }],
});
const math = (key: string, latex: string, display = true) => ({ _type: "math", _key: key, latex, display });
const inline = { inlineText: true };

describe("findMathErrors", () => {
  it("accepts valid math blocks and valid $…$ in text", () => {
    expect(findMathErrors({ content: [
      math("a", "\\frac{a}{b} = \\sqrt{x^2+1}"),
      math("b", "\\begin{aligned}\na&=b\\\\\n&=c\n\\end{aligned}"),
      text("c", "So $x^2 + 1$ and $$\\int_0^1 x\\,dx$$ hold."),
    ] }, inline)).toEqual([]);
  });
  it("reports a broken math block with its position and KaTeX's message", () => {
    const [e, ...rest] = findMathErrors({ content: [text("a", "hi"), math("b", "\\fracc{a}{b}")] });
    expect(rest).toEqual([]);
    expect(e).toMatchObject({ field: "content", block: 2, latex: "\\fracc{a}{b}" });
    expect(e?.message).toMatch(/^Undefined control sequence/);
  });
  it("ignores $…$ in text unless inlineText is on", () => {
    const content = [text("a", "Value $x^{2$ here.")];
    expect(findMathErrors({ content })).toEqual([]);
    expect(findMathErrors({ content }, inline)).toMatchObject([{ block: 1, latex: "x^{2" }]);
  });
  it("joins the spans of one block but skips inline code", () => {
    const block = { ...text("a", ""), children: [
      { _type: "span", _key: "1", text: "Run ", marks: [] },
      { _type: "span", _key: "2", text: "echo $HOME && ls $PWD", marks: ["code"] },
      { _type: "span", _key: "3", text: " then $\\frac{1}", marks: [] },
      { _type: "span", _key: "4", text: "{2}$ and $\\fracc$.", marks: ["strong"] },
    ] };
    expect(findMathErrors({ content: [block] }, inline).map((e) => e.latex)).toEqual(["\\fracc"]);
  });
  it("ignores escaped dollars, a lone currency dollar and empty blocks", () => {
    expect(findMathErrors({ content: [
      text("a", "Price \\$5 and $\\$600 + \\$264$."),
      text("b", "Only $5 today."),
      math("c", "   "),
    ] }, inline)).toEqual([]);
  });
  it("skips fields that are not Portable Text", () => {
    expect(findMathErrors({ title: "$\\fracc$", content: [text("a", "ok")], excerpt: null }, inline)).toEqual([]);
  });
  it("reports KaTeX internal errors instead of throwing", () => {
    vi.spyOn(katex, "renderToString").mockImplementation(() => { throw new TypeError("boom"); });
    expect(findMathErrors({ content: [math("a", "x")] })).toMatchObject([{ message: "KaTeX internal error: boom" }]);
  });
});

describe("publishRejection", () => {
  it("is undefined when every formula renders", () => {
    expect(publishRejection({ data: { content: [math("a", "x")] } })).toBeUndefined();
  });
  it("cancels with a readable reason listing the broken formulas", () => {
    const d = publishRejection({ data: { content: [math("a", "\\fracc{a}{b}"), text("b", "ok $x^{2$")] } }, inline);
    expect(d?.cancel).toBe(true);
    expect(d?.reason).toMatch(/^Cannot publish: 2 formulas have errors\. /);
    expect(d?.reason).toContain("Block 1 \\fracc{a}{b}: Undefined control sequence");
    expect(d?.reason).toContain("Block 2 x^{2:");
  });
  it("keeps the reason within EmDash's 500-character limit", () => {
    const content = Array.from({ length: 12 }, (_, i) => math(`m${i}`, "f(x) = \\frac{x^2 + 2x + 1}{\\sqrt{x^2+1}"));
    const reason = publishRejection({ data: { content } })?.reason ?? "";
    expect([...reason].length).toBeLessThanOrEqual(500);
    expect(reason).toMatch(/^Cannot publish: 12 formulas have errors\. Block 1 /);
    expect(reason).toMatch(/\(and \d+ more\)$/);
  });
  it("fits a single very long KaTeX message", () => {
    const reason = publishRejection({ data: { content: [math("a", `\\${"x".repeat(900)}`)] } })?.reason ?? "";
    expect([...reason].length).toBeLessThanOrEqual(500);
    expect(reason).toMatch(/^Cannot publish: 1 formula has an error\. Block 1 /);
  });
});
