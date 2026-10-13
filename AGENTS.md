# AGENTS.md — Managing the SLGS website

Step-by-step instructions for keeping the Sri Lankan Graduates' Society (SLGS) website up to date. Written for committee members and AI coding agents alike. For the technical architecture (shared header/footer, scripts, stylesheet), see `CLAUDE.md`.

The site is plain HTML, CSS and JavaScript with no build step. You edit the files directly, check them in a browser, and commit.

---

## 1. Before you start

### Preview the site locally

The header and footer are loaded with `fetch()`, which does not work when you open a file straight from Finder. Always preview through a local web server:

```sh
python3 -m http.server 8000      # then open http://localhost:8000
```

VS Code's **Live Server** extension also works. If something looks stale (old favicon, old footer, old styles), hard-refresh with **Cmd+Shift+R**.

### Where things live

| What | File |
|---|---|
| Home page (all sections) | `index.html` |
| Events page | `pages/events/index.html` |
| Team page (current + past committees) | `pages/team/index.html` |
| Scholarships page | `pages/scholarships/index.html` |
| Achievements page | `pages/achievements/index.html` |
| Navigation bar (every page) | `assets/partials/header.html` |
| Footer (every page) | `assets/partials/footer.html` |
| All styles | `assets/css/styles.css` |
| Event photos | `assets/img/events/` |
| Award photos | `assets/img/achievements/` |
| Open tasks | `TODO.md` |

### Paths depend on the page

- In `index.html`, paths start with `./` — for example `./assets/img/events/2026-agm.jpg`.
- In anything under `pages/`, paths start with `../../` — for example `../../assets/img/events/2026-agm.jpg`.

Copying a card between the home page and a subpage means changing this prefix.

---

## 2. House style

Keep new content consistent with what is already on the site.

- **Headings are in title case**: "How to Contribute", "Our Vision". Short words (a, an, the, and, or, to, in, of, on, at, by, for, with) stay lower case unless they are the first or last word. Acronyms stay as they are (SLGS, UMSU, GSA, AGM).
- **Section buttons** in a section heading use the glowing style and end with an arrow:
  ```html
  <a class="btn ring btn--primary" href="./pages/events/">See All Events →</a>
  ```
- **Event and award cards have no tags or date badges.** Dates were removed because they were inaccurate (see `TODO.md`). Do not add `badge` elements to cards unless that task is being done properly across the whole site.
- **Facebook and Instagram buttons** always use the icon classes:
  ```html
  <a class="pill pill--social pill--facebook" href="https://www.facebook.com/slgsmelb/" target="_blank" rel="noreferrer">Facebook</a>
  <a class="pill pill--social pill--instagram" href="https://www.instagram.com/slgs.unimelb/" target="_blank" rel="noreferrer">Instagram</a>
  ```
  Do not paste inline `<svg>` icons into HTML — the icons are drawn in CSS so the shared footer stays plain HTML.
- **Spell names exactly as the person spells them.** If unsure, check with the committee rather than guessing.
- **Write `&amp;` for `&`** inside HTML text, e.g. `Vesak &amp; Poson`.

---

## 3. Images

### Naming

Use `year-event.jpg`, lower case, words joined with hyphens:

```
assets/img/events/2026-cricket-fiesta.jpg
assets/img/achievements/2026-umsu-best-club-event.jpg
```

### Size

Cards show photos only about 370px wide, so large camera files make the site slow without looking any better. Resize before adding them — about **800px on the longest side** is plenty. On macOS:

```sh
sips -Z 800 -s formatOptions 80 ~/Downloads/original.jpg --out assets/img/events/2026-event-name.jpg
```

Then read the final size, which you need for the `width` and `height` attributes:

```sh
sips -g pixelWidth -g pixelHeight assets/img/events/2026-event-name.jpg
```

Posters (images with lots of text, like the AGM poster) can be kept at about 1080px so the text stays readable when opened full size.

### Choosing a photo

- Close-ups and medium shots work best; wide group shots look busy at card size.
- Avoid photos with text banners or watermarks across them.
- Only use photos SLGS has the right to use (our own photos or our own Facebook/Instagram posts). Do not take photos of people from elsewhere on the internet.

### Every `<img>` needs

- `width` and `height` matching the real file size (stops the page jumping while it loads).
- A short, specific `alt` text describing the photo, e.g. `alt="Games on South Lawn at Summer Fest 2026"`.
- `loading="lazy"` — except for the very first card in the Upcoming section, which should load straight away.

---

## 4. Events

Events appear in three places, and all three must be kept in step:

1. **Events page** (`pages/events/index.html`) — an **Upcoming** section, then one section per year (newest year first), each with event cards (newest event first).
2. **Home page → Events** (`index.html`, `<section id="events">`) — one featured upcoming event card on the left, and the **Recent Events** photo collage on the right.
3. **Home page → Recent Events collage pool** — a list of photos the collage shuffles through.

### 4.1 Event card markup

Events page version (note `../../`):

```html
<article class="card event-card reveal">
  <img
    class="event-card-img"
    loading="lazy"
    src="../../assets/img/events/2026-event-name.jpg"
    width="800"
    height="533"
    alt="Short description of the photo" />
  <div class="card-pad event">
    <h3>Event Name 2026</h3>
    <p>One or two sentences describing the event.</p>
    <a class="event-link" href="https://www.facebook.com/slgsmelb/posts/..." target="_blank" rel="noreferrer">View on Facebook →</a>
  </div>
</article>
```

Optional extras:

- **Poster image** (text at the top that must not be cropped): use `class="event-card-img event-card-img--poster"`.
- **Show the whole image uncropped** (used for the home page featured card): use `class="event-card-img event-card-img--full"`.
- **Highlight the card** with the animated colour border: add `ring` → `class="card ring event-card reveal"`. Use it only for the upcoming/featured event.
- **No Facebook post yet** (e.g. an announcement with only a poster): link to the poster instead:
  ```html
  <a class="event-link" href="../../assets/img/events/2026-event-name.jpg" target="_blank" rel="noreferrer">View full poster →</a>
  ```

### 4.2 Add a new upcoming event

1. Add the poster or photo to `assets/img/events/` (see section 3).
2. **Events page — Upcoming section** (`<section id="upcoming">`):
   - Add the card inside `<div class="grid cols-3">`, soonest event first. Give it `ring`, and leave `loading="lazy"` off the first card.
   - Update the count: `<span class="mini">1 event</span>` (use "event" for one, "events" for more).
   - If the section currently shows a "no upcoming events" box (see 4.5), replace that box with the grid and card.
3. **Home page — featured card** (`index.html`, first `<article>` inside `<section id="events">`): replace it with the new event. Use `./` paths, the `event-card-img--full` (or `--poster`) class, and keep the **Upcoming** label:
   ```html
   <div class="event-top">
     <h3>Event Name 2026</h3>
     <span class="badge">Upcoming</span>
   </div>
   ```
   This label is the one badge on the site; it marks status, not a date.
4. Preview both pages, then commit.

### 4.3 When an event is over (move from Upcoming to past)

Do this once the event has happened — ideally when the recap post and photos are up on Facebook.

1. **Pick a recap photo** from the event (not the poster), resize it, and save it as `assets/img/events/<year>-<event-name>.jpg`. It can replace the poster file or sit next to it.
2. **Events page:**
   1. Cut the card out of the **Upcoming** section.
   2. Paste it as the **first** card in that year's section (e.g. `<section id="y2026">`).
   3. Remove `ring` from the card, add `loading="lazy"` to its image, and switch it to the recap photo (update `src`, `width`, `height`, `alt`; drop `event-card-img--poster` if it is no longer a poster).
   4. Change the description to past tense, and point the link at the recap post (`View on Facebook →`).
   5. Update both counts: the Upcoming `<span class="mini">` and the year section's `<span class="mini">5 events</span>`.
   6. If Upcoming is now empty, follow 4.5.
3. **Home page — featured card:** replace it with the next upcoming event (4.2 step 3), or, if there is none, follow 4.5.
4. **Home page — Recent Events collage:** add the new recap photo (4.4).
5. Preview, then commit.

### 4.4 Recent Events collage (home page)

The collage shows **4 photos** and shuffles in others every few seconds. It has two parts inside `<aside class="feature reveal recent-events">` in `index.html`:

- **The 4 starting tiles** — `<a class="collage-tile">` elements. Order matters for shape: tiles 1 and 4 are wide slots, tiles 2 and 3 are narrow (portrait) slots.
  ```html
  <a class="collage-tile" href="./pages/events/#y2026">
    <img loading="lazy" src="./assets/img/events/2026-event-name.jpg" alt="Short description" />
  </a>
  ```
- **The shuffle pool** — the JSON list in `<script type="application/json" data-collage-pool>`. Every photo the collage may show, including the 4 starting ones:
  ```json
  {
    "src": "./assets/img/events/2026-event-name.jpg",
    "href": "./pages/events/#y2026",
    "alt": "Short description"
  },
  ```

To add a new event's photo:

1. Add an entry at the **top** of the pool. Mind the commas: every entry except the last ends with `},`. A missing or extra comma stops the shuffle silently.
2. Optionally swap it into one of the 4 starting tiles so it shows first.
3. `href` must point to the event's year section (`#y2026`, `#y2025`, ...).
4. Use real photos, not text-heavy posters.

To remove a photo, delete its pool entry and make sure it is not one of the 4 starting tiles.

### 4.5 When there is no upcoming event

**Events page:** replace the Upcoming section's grid with a message box, and set the count to `0 events` (or remove the count):

```html
<div class="feature ring reveal">
  <h3>No Upcoming Events Yet</h3>
  <p>No upcoming events have been announced yet. Follow our socials to hear about the next one first.</p>
</div>
```

Keep the `<section id="upcoming">` itself so the "Upcoming" jump button still works.

**Home page:** the featured slot should not be left empty. Either:

- feature the most recent past event instead (drop the **Upcoming** label, use its recap photo), or
- use a short "Stay tuned" card with the social buttons from section 2.

Also update the line under the Events heading if it promises "what's coming up next".

### 4.6 Start a new year on the Events page

When the first event of a new year (e.g. 2027) moves out of Upcoming:

1. Copy an existing year section and change every `2026` to `2027`:
   ```html
   <section id="y2027" class="section section--tight" aria-labelledby="y2027-title">
     <div class="section-head reveal">
       <h2 id="y2027-title">2027</h2>
       <span class="mini">1 event</span>
     </div>

     <div class="grid cols-3">
       <!-- event cards, newest first -->
     </div>
   </section>
   ```
2. Place it directly **after** the Upcoming section and **before** the 2026 section.
3. Add a jump button at the top of the page, in `<nav class="pills reveal" aria-label="Jump to section">`, after "Upcoming":
   ```html
   <a class="pill" href="#y2027">2027</a>
   ```

### 4.7 Event checklist

- [ ] Image resized, named `year-event.jpg`, `width`/`height`/`alt` correct
- [ ] Events page: card in the right section, newest first, counts updated
- [ ] Home page: featured card is a genuinely upcoming event (or 4.5 applied)
- [ ] Home page: collage pool updated, JSON commas correct
- [ ] Previewed on desktop and phone width

---

## 5. Committees

Committees appear in three places:

1. **Team page — current committee** (`pages/team/index.html`, first section, heading `Committee YYYY/YY`).
2. **Team page — Past Committees** (`<section id="past-committees">`): one collapsible panel per year, names only.
3. **Home page → Team** (`index.html`, `<section id="team">`): the current committee as cards, and the line "Meet our committee for YYYY/YY." On phones the cards are hidden and a "Meet the Committee →" button is shown instead — this is automatic.

### 5.1 Member card markup

Team page (one line per member):

```html
<div class="feature reveal"><div class="person"><span class="avatar" aria-hidden="true"></span><div><strong>Full Name</strong><span>Role</span></div></div></div>
```

Home page (same content, spread over three lines):

```html
<div class="feature reveal">
  <div class="person"><span class="avatar" aria-hidden="true"></span><div><strong>Full Name</strong><span>Role</span></div></div>
</div>
```

List members in this order: Co-Presidents, Vice President, Secretary, Assistant Secretary, Treasurer, Media & Communication Officers, Event Organisers, Committee Members, Staff Advisor. Write `&amp;` for `&` in roles.

### 5.2 Hand over to a new committee

Example: the 2027/28 committee takes over from 2026/27.

**Step 1 — Archive the outgoing committee on the Team page.**

Add a new panel at the **top** of `<div class="committee-list">`, built from the outgoing committee's cards. Group members by role, using plural role names where there is more than one person:

```html
<details class="committee reveal" open>
  <summary>
    <span class="committee-year">Committee 2026/27</span>
    <span class="committee-count">13 members</span>
  </summary>
  <div class="committee-roles">
    <div class="committee-role">
      <h4>Co-Presidents</h4>
      <ul>
        <li>First Person</li>
        <li>Second Person</li>
      </ul>
    </div>
    <div class="committee-role">
      <h4>Vice President</h4>
      <ul>
        <li>Person</li>
      </ul>
    </div>
    <!-- ...one committee-role block per role... -->
  </div>
</details>
```

- `committee-count` is the total number of people listed in the panel.
- Only the newest panel has `open`. **Remove `open` from the panel that previously had it**, so only one year starts expanded.

**Step 2 — Replace the current committee on the Team page.**

1. Change the heading: `<h2>Committee 2027/28</h2>`.
2. Replace every card inside the first `<div class="grid cols-3" aria-label="Committee members">` with the new members (5.1).

**Step 3 — Replace the committee on the Home page.**

1. Change the line under the Team heading: `Meet our committee for 2027/28.`
2. Replace **all** cards inside `<div class="grid cols-3 hide-on-phone" aria-label="Committee members">`. Make sure no old cards are left behind — count the `<strong>` names afterwards; it should equal the new committee size.

**Step 4 — Check other year references.**

```sh
grep -rn "2026/27" --include='*.html' .
```

Every remaining match should be inside the Past Committees panel only.

**Step 5 — Preview** the home page Team section and the Team page (open and close the panels), on desktop and phone width, then commit.

### 5.3 Committee photos (not yet in use)

Cards currently use a placeholder tile instead of photos. Photos will be added once the whole committee has supplied one. Keep originals in `assets/img/committee/`, named like `firstname_lastname.jpg`. Only use photos members have sent in themselves.

---

## 6. Achievements

Awards live on `pages/achievements/index.html`, newest first. The **newest** card has `ring`; when adding a new award, move `ring` from the previous card to the new one.

1. Save the award image as `assets/img/achievements/<year>-<awarding-body>-<award>.jpg` (square images work best; about 800×800).
2. Add a card at the top of the grid:
   ```html
   <article class="card ring event-card reveal">
     <img
       class="event-card-img achievement-img"
       src="../../assets/img/achievements/2027-umsu-best-club.jpg"
       width="800"
       height="800"
       alt="Short description of the image" />
     <div class="card-pad event">
       <div>
         <h3>Award Name</h3>
         <p class="achievement-source">Awarding Body and Event, Year</p>
       </div>
       <p>One or two sentences on what was recognised.</p>
       <a class="event-link" href="https://www.facebook.com/slgsmelb/posts/..." target="_blank" rel="noreferrer">View on Facebook →</a>
     </div>
   </article>
   ```
3. Add `loading="lazy"` to the card that used to be first, and remove its `ring`.

---

## 7. Scholarships

- **Home page** (`<section id="scholarships">`): the Objective box shows three figures (number of scholarships, value, duration) in `stat-tile` blocks. Update these if the program changes.
- **Scholarships page** (`pages/scholarships/index.html`):
  - Program details and the two program-cycle steps.
  - **Awardee quotes**: each year has a `<h3 class="year-title">2022–2023</h3>` heading followed by a `grid cols-3` of `<figure class="feature quote">` cards. Add a new year **above** the existing ones. Quote recipients **word for word** — do not correct their grammar.
  - Contributions are by **email only** (`slgsunimelb@gmail.com`). Do not publish bank details on the site.

---

## 8. Yearly housekeeping

At the start of each academic year:

- [ ] Hand over the committee (section 5).
- [ ] Update the copyright year in `assets/partials/footer.html`: `© 2026 Sri Lankan Graduates' Society`.
- [ ] Check the home page text for anything tied to a specific year.
- [ ] Review `TODO.md`.

---

## 9. Navigation, footer and new pages

- **Navigation links** are only in `assets/partials/header.html`. Use `{{BASE}}` at the start of every path; it is filled in automatically for each page.
- **Footer links** are only in `assets/partials/footer.html`, also with `{{BASE}}`.
- **New page:**
  1. Copy an existing page folder, e.g. `pages/achievements/` → `pages/new-page/`. Pages must live under `pages/` for the shared header and footer to load.
  2. Update the `<title>`, `<meta name="description">` and the content inside `<main>`.
  3. Keep `<div data-header data-header-page="new-page"></div>` before `<main>`, and `<div data-footer></div>` **after** `</main>`, not inside it — otherwise the footer will not line up with the page content.
  4. Link to it from the footer (and the header if it should be in the main menu). To highlight it in the menu while on that page, give the header link `data-page="new-page"`.

---

## 10. Check, then commit

Before committing:

- [ ] Previewed every changed page through a local server (section 1).
- [ ] Checked a phone-width view (narrow the browser window, or use the browser's device toolbar).
- [ ] No broken images (all `src` paths exist; `../../` on subpages, `./` on the home page).
- [ ] Opened the browser console (Cmd+Option+I → Console) and checked for red errors, especially after editing the collage JSON.

Commit on the working branch (currently `v2`) with a message that says what changed, for example:

```sh
git add index.html pages/events/index.html assets/img/events/2026-agm-recap.jpg
git commit -m "Move AGM 2026 to past events and add recap photo"
```

Do not commit stray files such as `.DS_Store` or unused original photos.
