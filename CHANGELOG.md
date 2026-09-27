# Changelog

## 0.2.0

- `renderMathText(text, { formatText })`: renders `$…$` and `$$…$$` in plain text (comments,
  excerpts, any user-supplied text) on the server. The text is HTML-escaped, `\$` is a literal
  dollar sign, and formulas use the same KaTeX options as Math blocks (`trust: false`).
- `MathText` Astro component (`emdash-plugin-katex/astro`) wrapping it.

## 0.1.0

- Math block (LaTeX + display toggle) rendered with KaTeX 0.18.9 on the server.
- Publish and schedule check for formulas KaTeX cannot parse (`validate`, `validateInlineText`).
- Experimental rendered preview in the editor's Math cards (`editorPreview`).
- `mathBlockToMarkdown` helper for Markdown / LLM output.
- Supports EmDash `^0.39.1`.
