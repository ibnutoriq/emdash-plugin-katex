import { describe, expect, it } from "vitest";
import { createPlugin, katexPlugin, mathBlockToMarkdown } from "../src/index";

describe("katexPlugin (descriptor)", () => {
  it("describes a native plugin with Astro components and the admin entry", () => {
    expect(katexPlugin()).toEqual({
      id: "plugin-katex",
      version: "0.1.0",
      format: "native",
      entrypoint: "emdash-plugin-katex",
      componentsEntry: "emdash-plugin-katex/astro",
      adminEntry: "emdash-plugin-katex/admin",
      options: {},
    });
  });
  it("leaves the admin entry out when editorPreview is false", () => {
    const d = katexPlugin({ editorPreview: false });
    expect(d).not.toHaveProperty("adminEntry");
    expect(d.options).toEqual({ editorPreview: false });
  });
  it("re-exports the markdown helper", () => {
    expect(mathBlockToMarkdown({ latex: "x", display: false })).toBe("$x$");
  });
});

describe("createPlugin (runtime)", () => {
  it("adds the Math block to the editor", () => {
    const [block] = createPlugin().admin.portableTextBlocks ?? [];
    expect(block).toMatchObject({
      type: "math",
      label: "Math",
      icon: "code",
      category: "Text",
      description: "Insert a LaTeX formula (rendered with KaTeX)",
    });
    expect(block?.fields).toEqual([
      { type: "text_input", action_id: "latex", label: "LaTeX", multiline: true, placeholder: "\\frac{a}{b} = \\sqrt{x^2 + 1}" },
      { type: "toggle", action_id: "display", label: "Display as a centered block", initial_value: true },
    ]);
  });
});
