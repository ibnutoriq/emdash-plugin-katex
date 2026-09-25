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

describe("createPlugin validation hooks", () => {
  const event = (content: unknown[]) => ({ content: { data: { content } }, collection: "posts", origin: { source: "api" as const } });
  const broken = [{ _type: "math", _key: "m", latex: "\\fracc", display: true }];

  it("checks publishing and scheduling by default", async () => {
    const plugin = createPlugin();
    expect(plugin.capabilities).toContain("hooks.content-policy:register");
    const publish = plugin.hooks["content:beforePublish"];
    expect(plugin.hooks["content:beforeSchedule"]?.handler).toBe(publish?.handler);
    expect(await publish?.handler(event(broken), {} as never)).toMatchObject({ cancel: true });
    expect(await publish?.handler(event([{ _type: "math", _key: "m", latex: "x", display: true }]), {} as never)).toBeUndefined();
  });
  it("registers nothing when validate is off", () => {
    const plugin = createPlugin({ validate: "off" });
    expect(plugin.hooks["content:beforePublish"]).toBeUndefined();
    expect(plugin.capabilities).not.toContain("hooks.content-policy:register");
  });
  it("passes validateInlineText to the check", async () => {
    const withText = [{ _type: "block", _key: "b", style: "normal", markDefs: [], children: [{ _type: "span", _key: "s", text: "$\\fracc$", marks: [] }] }];
    expect(await createPlugin().hooks["content:beforePublish"]?.handler(event(withText), {} as never)).toBeUndefined();
    expect(await createPlugin({ validateInlineText: true }).hooks["content:beforePublish"]?.handler(event(withText), {} as never)).toMatchObject({ cancel: true });
  });
});
