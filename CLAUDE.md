# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static website for the Sri Lankan Graduates' Society (SLGS) at the University of Melbourne, hosted on GitHub Pages at the custom domain `www.slgs.com.au` (see `CNAME`). Plain HTML/CSS/vanilla JS — no build step, package manager, linter, or tests. `.nojekyll` disables Jekyll processing, so files are served as-is.

## Content management

Routine content updates (adding events, moving finished events to past, committee handovers, achievements, scholarships, yearly housekeeping) follow the step-by-step instructions in `AGENTS.md`. Read it before making content changes:

@AGENTS.md

## Running locally

The shared header/footer are loaded with `fetch()`, which fails on `file://` URLs, so serve the repo over HTTP:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Architecture

- `index.html` is the main single-page site. Its sections (`#about`, `#offer`, `#events`, `#scholarships`, `#team`, `#join`) are the targets of the primary nav.
- `pages/<name>/index.html` are standalone subpages. Linked from the site: `events`, `scholarships`, `achievements`, `team`. Not linked anywhere (the Contact nav link is commented out in `header.html`): `contact`, `resources`. Subpages reference assets with `../../` relative paths, while `index.html` uses `./`.
- **Shared partials**: pages include `<div data-header>` before `<main>` and `<div data-footer>` **after** `</main>` (inside `<main>` the footer would be double-inset by `.container` and not line up with page content). `assets/js/app.js` fetches `assets/partials/header.html` / `footer.html`, replaces the `{{BASE}}` token with `.` or `../..` (chosen by whether the path contains `/pages/`), and swaps the placeholder via `outerHTML`. Edit the nav and footer in the partials, not in individual pages. A subpage can set `data-header-page="<name>"` to mark the matching `[data-page]` nav link with `aria-current`. New pages must live under `pages/` for the base-path logic to work.
- Keep the partials free of inline `<svg>`: icons (Facebook/Instagram pills, the email button envelope) are CSS `mask` data URIs on `.pill--facebook`, `.pill--instagram` and `.btn--mail` in `styles.css`.
- `assets/js/app.js` is a single IIFE loaded with `defer` on every page. It handles:
  - `.reveal` scroll-in animations (adds class `in`).
  - The shared header/footer loaders, and the mobile nav toggle (`initNavToggle`, bound only after the header partial is injected; below 980px the links collapse into a dropdown).
  - The home page **Recent Events collage**: 4 `.collage-tile` links cross-fade, every 3s, to photos from the JSON list in `<script type="application/json" data-collage-pool>` in `index.html`. Pauses when off-screen, when the tab is hidden, and under `prefers-reduced-motion`. Malformed JSON silently disables it.
  - A slight scroll parallax on the `.atmos` background glow.
  - Legacy code with nothing to act on: the mouse-move hero parallax (`[data-hero]`) and a `[data-mailto-form]` mailto form. No page uses either attribute any more.
  - Known bug: the active-section highlighting of `[data-nav]` links runs before the header partial is injected, so it finds no links and never highlights anything.
- `assets/css/styles.css` is the only stylesheet: a dark theme driven by CSS custom properties in `:root` (Sri Lankan flag-inspired blue/gold/maroon accents, `--nav-h`, `--container`). Breakpoints near the end of the file: `max-width: 980px` (tablet: single-column layouts, collapsed nav) and `max-width: 640px` (phone). `.hide-on-phone` / `.show-on-phone` toggle elements at the phone breakpoint (used for the home page Team section, which shows only a button on phones).
- Images: event photos in `assets/img/events/`, awards in `assets/img/achievements/`, favicons in `assets/img/favicon/`, named `year-event.jpg` and resized (about 800px) before use. Exception: full-width photos (the Who We Are group photo `group_photo_<year>.JPG`) stay high resolution. Every `<img>` carries `width`/`height` matching the file.
- **Closing live painting**: the block above the footer on the home page is the `<unimelb-painting>` custom element (Old Arts clock tower with waving Australian and Sri Lankan flags and live Melbourne-time clocks), drawn in code by `assets/live-painting/unimelb-painting/`. `index.html` loads only `unimelb-painting.js`, which fetches the rest of that folder itself. See `assets/live-painting/README.md` for its settings.

## Branches

`v1` is the main branch; `v2` is the current redesign branch where work happens.

## Open tasks

See `TODO.md`.
