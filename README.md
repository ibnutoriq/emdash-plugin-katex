# emdash-plugin-katex

Math (LaTeX) blocks for [EmDash CMS](https://emdashcms.com), rendered with [KaTeX](https://katex.org) on the server.

- **Math block** in the editor's `/` menu: type LaTeX, choose display (centered) or inline.
- **Server-rendered**: formulas arrive as finished HTML + MathML. No client JavaScript, no CDN, no flash of raw LaTeX. The raw LaTeX stays in the MathML `<annotation>` for search engines and LLMs.
- **Publish check**: publishing or scheduling an entry with a formula KaTeX cannot parse is rejected with a readable message. Drafts always save.
- **Editor preview** (experimental): Math block cards show the rendered formula, or KaTeX's error.

## Install

```sh
npm install emdash-plugin-katex
```

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { katexPlugin } from "emdash-plugin-katex";

export default defineConfig({
  integrations: [
    emdash({
      // …database, storage…
      plugins: [katexPlugin()],
    }),
  ],
});
```

Redeploy the site. Requires EmDash `^0.39.1`.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `validate` | `"publish"` | `"publish"` rejects publishing or scheduling when a formula does not parse. `"off"` disables the check. |
| `validateInlineText` | `false` | Also check `$…$` and `$$…$$` inside paragraphs (inline code is skipped). Turn it on only if your site renders math in text itself. |
| `editorPreview` | `true` | Rendered formulas in the editor's Math cards. `false` does not load the admin module at all. |

## Stored content

A Math block is saved as Portable Text:

```json
{ "_type": "math", "_key": "…", "latex": "\\frac{a}{b}", "display": true }
```

A missing `display` means display math.

## Markdown / LLM output

If your site publishes Markdown (for example `.md` pages or `llms.txt`), serialise Math blocks with:

```js
import { mathBlockToMarkdown } from "emdash-plugin-katex";

mathBlockToMarkdown(block); // "$$\\frac{a}{b}$$", "$x$", or null for an empty block
```

## Math in plain text (comments, excerpts)

Text that is not Portable Text, such as a comment body, can carry `$…$` and `$$…$$` too.
`renderMathText` escapes the text and renders the formulas on the server with the same KaTeX
options as Math blocks. User input cannot inject markup: the text is escaped, and KaTeX runs with
`trust: false`, so `\href`, `\htmlId` and similar show as red source text.

```ts
import { renderMathText } from "emdash-plugin-katex";

const html = renderMathText(comment.body, {
  // Optional: runs on each run of already-escaped text, never on math.
  formatText: (escaped) => escaped.replace(/\n/g, "<br>"),
});
```

In Astro templates there is a component for it:

```astro
---
import { MathText } from "emdash-plugin-katex/astro";
---
<MathText text={comment.body} />
```

`\$` is a literal dollar sign. A formula KaTeX cannot parse shows in red in place.

## Styling

Blocks render inside `.emdash-math.emdash-math--display` (a `<div>`) or `.emdash-math.emdash-math--inline` (a `<p>`). KaTeX's CSS and fonts are bundled by your site's build; fonts load only when a formula needs them.

## Trust and permissions

This is a **native** EmDash plugin: it runs in your site's process (as all plugins that add Portable Text blocks must), so install it only if you trust it. It declares one capability, `hooks.content-policy:register`, for the publish check (none with `validate: "off"`). KaTeX runs with `trust: false`, so `\href`, `\url` and HTML extensions stay inert.

## Experimental editor preview

EmDash does not yet offer an API for custom plugin block views. The preview decorates the editor's Math cards from the outside, reading each block from the editor's node view. If a future EmDash release changes the editor's internals, the preview disappears and the card falls back to EmDash's default; your content is never modified. Set `editorPreview: false` to turn it off.

## Performance

Rendering is fast: hundreds of formulas take well under a second, and cached pages are not re-rendered. KaTeX runs on the server, so on adapters that bundle dependencies it adds to the server bundle (on one Cloudflare Workers site it added about 115 KiB gzip to the Worker upload); the Node adapter loads it from `node_modules` at runtime.

## Limitations

- Math inside a sentence (`$…$` in a paragraph) is not rendered by this plugin; EmDash plugins can add block types but not inline text rendering.
- The EmDash plugin registry lists sandboxed plugins only, so this plugin is distributed through npm.

## License

MIT
