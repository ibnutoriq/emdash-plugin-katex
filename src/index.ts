import type { PluginDescriptor, PortableTextBlockConfig } from "emdash";
import { definePlugin } from "emdash";

export { readMathBlock, type MathBlockValue } from "./block";
export { mathBlockToMarkdown } from "./markdown";

const ID = "plugin-katex";
const VERSION = "0.1.0";
const PACKAGE = "emdash-plugin-katex";

export interface KatexPluginOptions {
  /** "publish" (default) rejects publishing or scheduling an entry whose formulas KaTeX cannot parse; "off" disables the check. */
  validate?: "publish" | "off";
  /** Also check $…$ and $$…$$ inside text blocks. Only useful on sites that render math in text themselves. Default false. */
  validateInlineText?: boolean;
  /** Render formulas inside the editor's Math block cards (experimental). Default true. */
  editorPreview?: boolean;
}

/** Descriptor for astro.config.mjs: emdash({ plugins: [katexPlugin()] }). */
export function katexPlugin(options: KatexPluginOptions = {}): PluginDescriptor<KatexPluginOptions> {
  return {
    id: ID,
    version: VERSION,
    format: "native",
    entrypoint: PACKAGE,
    componentsEntry: `${PACKAGE}/astro`,
    ...(options.editorPreview === false ? {} : { adminEntry: `${PACKAGE}/admin` }),
    options,
  };
}

export const MATH_BLOCK: PortableTextBlockConfig = {
  type: "math",
  label: "Math",
  icon: "code",
  category: "Text",
  description: "Insert a LaTeX formula (rendered with KaTeX)",
  fields: [
    { type: "text_input", action_id: "latex", label: "LaTeX", multiline: true, placeholder: "\\frac{a}{b} = \\sqrt{x^2 + 1}" },
    { type: "toggle", action_id: "display", label: "Display as a centered block", initial_value: true },
  ],
};

/** Runtime: the Math block in the editor's slash menu. */
export function createPlugin(_options: KatexPluginOptions = {}) {
  return definePlugin({
    id: ID,
    version: VERSION,
    admin: { portableTextBlocks: [MATH_BLOCK] },
  });
}

export default createPlugin;
