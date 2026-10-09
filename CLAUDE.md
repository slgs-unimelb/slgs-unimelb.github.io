# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static website for the Sri Lankan Graduates' Society (SLGS) at the University of Melbourne, hosted on GitHub Pages at the custom domain `www.slgs.com.au` (see `CNAME`). Plain HTML/CSS/vanilla JS — no build step, package manager, linter, or tests. `.nojekyll` disables Jekyll processing, so files are served as-is.

## Running locally

The shared header/footer are loaded with `fetch()`, which fails on `file://` URLs, so serve the repo over HTTP:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Architecture

- `index.html` is the main single-page site. Its sections (`#about`, `#offer`, `#events`, `#scholarships`, `#achievements`, `#team`, `#join`) are the targets of the primary nav.
- `pages/<name>/index.html` (events, team, resources, contact) are standalone subpages. They reference assets with `../../` relative paths, while `index.html` uses `./`.
- **Shared partials**: pages include `<div data-header>` / `<div data-footer>` placeholders. `assets/js/app.js` fetches `assets/partials/header.html` / `footer.html`, replaces the `{{BASE}}` token with `.` or `../..` (chosen by whether the path contains `/pages/`), and swaps the placeholder via `outerHTML`. Edit the nav in `header.html`, not in individual pages. A subpage can set `data-header-page="<name>"` to mark the matching `[data-page]` nav link with `aria-current`. New pages must live under `pages/` for the base-path logic to work.
- `assets/js/app.js` (a single IIFE, loaded with `defer` on every page) also handles: `.reveal` scroll-in animations (adds class `in`), active-section highlighting of `[data-nav]` links via IntersectionObserver, hero parallax (`[data-hero]`, `.atmos`), and a `[data-mailto-form]` contact form that builds a `mailto:` link (no backend). Motion effects respect `prefers-reduced-motion`.
- `assets/css/styles.css` is the only stylesheet: a dark theme driven by CSS custom properties in `:root` (Sri Lankan flag-inspired blue/gold/maroon accents, `--nav-h`, `--container`). Responsive breakpoints are at 980px and 640px near the end of the file.

## Branches

`v1` is the main branch; `v2` is the current redesign branch.

## Open TODOs (from `TODO.md`)

Mobile responsiveness, an events page, a past-committee page, and a scroll offset so nav-link jumps aren't hidden under the fixed header.
