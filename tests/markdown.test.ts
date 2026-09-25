import { describe, expect, it } from "vitest";
import { mathBlockToMarkdown } from "../src/markdown";

describe("mathBlockToMarkdown", () => {
  it("wraps display math in $$ and inline math in $", () => {
    expect(mathBlockToMarkdown({ latex: "\\frac{a}{b}", display: true })).toBe("$$\\frac{a}{b}$$");
    expect(mathBlockToMarkdown({ latex: "x_1", display: false })).toBe("$x_1$");
    expect(mathBlockToMarkdown({ latex: "x" })).toBe("$$x$$");
  });
  it("returns null for an empty block", () => {
    expect(mathBlockToMarkdown({ latex: " " })).toBeNull();
  });
  it("keeps the LaTeX unchanged apart from trimming", () => {
    expect(mathBlockToMarkdown({ latex: " a\n+ b ", display: true })).toBe("$$a\n+ b$$");
  });
});
