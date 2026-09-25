// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";

type Data = { latex?: string; display?: boolean };

/** Builds what EmDash's editor renders for a plugin block: a node view with pmViewDesc and the card inside. */
function card(blockType: string, data: Data): HTMLElement {
  const view = document.createElement("div") as HTMLElement & { pmViewDesc?: unknown };
  view.pmViewDesc = { node: { attrs: { blockType, data } } };
  view.innerHTML = '<div class="plugin-block"><div class="relative group"><div></div><div class="rounded-lg border"><div class="flex">Math</div></div></div></div>';
  return view;
}
const preview = (el: HTMLElement) => el.querySelector<HTMLElement>("[data-emdash-math-preview]");

describe("editor card preview", () => {
  let listeners: (() => void)[];
  beforeEach(() => {
    listeners = [];
    document.body.innerHTML = "";
    const editor = document.createElement("div") as HTMLElement & { editor?: unknown };
    editor.className = "ProseMirror";
    editor.editor = { on: (_: string, fn: () => void) => listeners.push(fn) };
    document.body.append(editor);
  });

  it("renders the formula inside Math cards and leaves other blocks alone", async () => {
    const { scan } = await import("../src/admin");
    const pm = document.querySelector(".ProseMirror")!;
    const good = card("math", { latex: "\\frac{a}{b}", display: true });
    const broken = card("math", { latex: "\\fracc", display: true });
    const other = card("youtube", { latex: "x" });
    pm.append(good, broken, other);
    scan();
    expect(preview(good)?.querySelector(".katex-display")).not.toBeNull();
    expect(preview(broken)?.textContent).toMatch(/^KaTeX: Undefined control sequence/);
    expect(preview(other)).toBeNull();
  });

  it("switches mode when only the display toggle changes (editor transaction)", async () => {
    const { scan } = await import("../src/admin");
    const pm = document.querySelector(".ProseMirror")!;
    const data: Data = { latex: "x^2", display: true };
    const c = card("math", data);
    pm.append(c);
    scan();
    expect(preview(c)?.querySelector(".katex-display")).not.toBeNull();
    data.display = false;
    expect(listeners.length).toBeGreaterThan(0);
    listeners.forEach((fn) => fn());
    await new Promise((r) => setTimeout(r, 50));
    expect(preview(c)?.querySelector(".katex-display")).toBeNull();
    expect(preview(c)?.style.textAlign).toBe("left");
  });

  it("keeps decorating other cards when one card fails", async () => {
    const { scan } = await import("../src/admin");
    const pm = document.querySelector(".ProseMirror")!;
    const bad = card("math", { latex: "x" });
    Object.defineProperty(bad, "pmViewDesc", { get() { throw new Error("internals changed"); } });
    const good = card("math", { latex: "y" });
    pm.append(bad, good);
    scan();
    expect(preview(good)?.querySelector(".katex")).not.toBeNull();
  });
});
