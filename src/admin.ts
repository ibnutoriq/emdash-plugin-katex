// Admin entry (experimental): shows the rendered formula inside each Math block card.
//
// EmDash 0.39 renders every plugin block as a generic card and has no API for a custom node
// view, so this module decorates the cards from the outside. It reads the block from
// ProseMirror's node view (pmViewDesc) rather than from the card's text and only appends its own
// element. If EmDash's editor internals change, the preview disappears and the card falls back
// to EmDash's default; the document is never modified.
import "katex/dist/katex.min.css";
import { readMathBlock } from "./block";
import { renderMath } from "./render";

const PREVIEW = "data-emdash-math-preview";

type PmNode = { attrs?: { blockType?: unknown; data?: { latex?: unknown; display?: unknown } } };
type PmElement = HTMLElement & { pmViewDesc?: { node?: PmNode } };
type EditorElement = HTMLElement & { editor?: { on(event: "transaction", fn: () => void): void } };

function blockOf(card: HTMLElement): PmNode | undefined {
  for (let el: PmElement | null = card; el; el = el.parentElement) {
    if (el.pmViewDesc) return el.pmViewDesc.node;
  }
  return undefined;
}

function decorate(card: HTMLElement): void {
  const node = blockOf(card);
  if (node?.attrs?.blockType !== "math") return;
  const data = node.attrs.data ?? {};
  const key = JSON.stringify([data.latex, data.display]);
  const body = card.querySelector<HTMLElement>(":scope > div > div.rounded-lg") ?? card;
  let box = body.querySelector<HTMLElement>(`:scope > [${PREVIEW}]`);
  if (box?.getAttribute(PREVIEW) === key) return;
  if (!box) {
    box = document.createElement("div");
    box.contentEditable = "false";
    box.style.cssText = "padding:0 1rem 0.75rem;overflow-x:auto;";
    body.append(box);
  }
  box.setAttribute(PREVIEW, key);
  const block = readMathBlock(data);
  box.style.textAlign = block?.display === false ? "left" : "center";
  if (!block) {
    box.replaceChildren();
    return;
  }
  const r = renderMath(block.latex, block.display);
  if (r.ok) box.innerHTML = r.html;
  else {
    const error = document.createElement("div");
    error.style.cssText = "color:#e5484d;font-size:0.75rem;text-align:left;";
    error.textContent = `KaTeX: ${r.message}`;
    box.replaceChildren(error);
  }
}

const watched = new WeakSet<Element>();
let queued = false;

/** Decorates every Math card on the page; safe to call repeatedly. */
export function scan(): void {
  queued = false;
  for (const editor of document.querySelectorAll<EditorElement>(".ProseMirror")) {
    // Toggling "display" changes the block's data without changing the card's DOM, so editor
    // transactions trigger a rescan as well.
    if (!watched.has(editor) && editor.editor) {
      watched.add(editor);
      editor.editor.on("transaction", schedule);
    }
  }
  for (const card of document.querySelectorAll<HTMLElement>(".plugin-block")) {
    try {
      decorate(card);
    } catch {
      // One card with unexpected internals must not stop the others.
    }
  }
}

function schedule(): void {
  if (queued) return;
  queued = true;
  // setTimeout rather than requestAnimationFrame: rAF is paused in hidden tabs.
  setTimeout(scan, 16);
}

if (typeof document !== "undefined") {
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  schedule();
}
