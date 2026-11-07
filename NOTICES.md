# Notices

This file describes what is in this repository. It is not a legal clearance, a license grant from a third party, or a warranty that every line was written here.

## Code

The app, landing pages, tests and build scripts are plain JavaScript and CSS in this repository. `package.json` has no runtime dependencies. No third-party source file, SPDX header or bundled library was found to retain. Playwright is used only as a local tool for `test/e2e.js` and `scripts/render-images.js`; it is not shipped in the Pages output.

Whether any short passage was copied from elsewhere cannot be shown from the files alone. There was no prior NOTICE file to keep.

## Fonts

No font files (`.woff`, `.woff2`, `.ttf`, `.otf`) are in the tree, and the CSS does not load a font host. The stacks name typefaces the visitor may already have:

- `system-ui`, `-apple-system`, `Segoe UI`, `Roboto`, `Noto Sans KR`, `Noto Sans JP`, `Noto Sans SC`, `sans-serif`
- `Georgia`, `Times New Roman`, `Nanum Myeongjo`, `Batang`, `serif`
- `ui-monospace`, `Menlo`, `monospace`

Naming them does not distribute them.

## Images

- `icon.svg` is an SVG in this repository (a rounded square, a page mark and a check). No third-party mark is embedded.
- `icon-512.png`, `icon-512-maskable.png` and `og.png` are screenshots produced by `scripts/render-images.js` from `icon.svg`, `design/maskable.html` and `design/og.html`. They are not stock photographs.
- Feature icons on the landing pages and the mark in the app header are inline SVG path data in `scripts/build-site.js` and `app/app.js`.

`design/og.html` is the source for the social image. If `og.png` is older than that HTML, regenerate it with `scripts/render-images.js` before treating the PNG text as current.

## Services named in the code

Cloudflare Pages is the host in the deploy workflow. Lemon Squeezy is the license API the Pages function can call. Anthropic is the optional AI host. None of those products’ code is vendored here. The privacy note states what is sent.
