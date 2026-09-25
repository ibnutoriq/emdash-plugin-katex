import { describe, expect, it } from "vitest";
import { readMathBlock } from "../src/block";

describe("readMathBlock", () => {
  it("reads display math, the default when display is missing", () => {
    expect(readMathBlock({ latex: "\\frac{a}{b}", display: true })).toEqual({ latex: "\\frac{a}{b}", display: true });
    expect(readMathBlock({ latex: "x" })).toEqual({ latex: "x", display: true });
  });
  it("reads inline math", () => {
    expect(readMathBlock({ latex: "x^2", display: false })).toEqual({ latex: "x^2", display: false });
  });
  it("returns null when there is nothing to render", () => {
    expect(readMathBlock({ latex: "   \n " })).toBeNull();
    expect(readMathBlock({ display: true })).toBeNull();
    expect(readMathBlock({ latex: 42 })).toBeNull();
  });
  it("keeps multi-line LaTeX and trims the ends", () => {
    expect(readMathBlock({ latex: "\n\\begin{aligned}\na&=b\\\\\n&=c\n\\end{aligned}\n" })?.latex)
      .toBe("\\begin{aligned}\na&=b\\\\\n&=c\n\\end{aligned}");
  });
  it("drops a stray trailing backslash but keeps a trailing line break", () => {
    expect(readMathBlock({ latex: "\\end{aligned}\\" })?.latex).toBe("\\end{aligned}");
    expect(readMathBlock({ latex: "x \\ " })?.latex).toBe("x");
    expect(readMathBlock({ latex: "a\\\\" })?.latex).toBe("a\\\\");
    expect(readMathBlock({ latex: "\\" })).toBeNull();
  });
});
