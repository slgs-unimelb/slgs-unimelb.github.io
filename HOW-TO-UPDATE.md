# How to Update the SLGS Website

A practical guide for SLGS committee members and developers who keep the website up to date.

Most updates are done by giving an AI coding agent (Claude Code, or another agent that reads `AGENTS.md`) a short prompt plus the content. The agent edits the files; you check the result and publish it. You do not need to write HTML yourself.

- **This guide**: what to prepare, which prompt to use, and how to check and publish.
- **`AGENTS.md`**: the detailed step-by-step rules the agent follows. Read it if you want to make changes by hand.

---

## 1. One-time setup

1. **Get the code.** Clone the repository and switch to the working branch:
   ```sh
   git clone https://github.com/slgs-unimelb/slgs-unimelb.github.io.git
   cd slgs-unimelb.github.io
   git checkout v2
   ```
2. **Install an agent.** For example [Claude Code](https://claude.com/claude-code). Start it from inside the project folder so it picks up `CLAUDE.md` and `AGENTS.md`:
   ```sh
   claude
   ```
3. **Preview the site locally** (needed to check every change):
   ```sh
   python3 -m http.server 8000
   ```
   Then open <http://localhost:8000>. VS Code's Live Server extension also works. If something looks out of date, hard-refresh with **Cmd+Shift+R** (Windows: **Ctrl+Shift+R**).

---

## 2. The update workflow

Every update follows the same five steps:

1. **Prepare the content** — usually a Facebook post (section 3).
2. **Give the agent a prompt** — copy one from section 4 and fill in the blanks.
3. **Check the result** in your browser, on both a desktop and a phone-width window (section 5).
4. **Ask for fixes** if anything is wrong, in plain words: *"The photo is cropped too much, use a different one"*.
5. **Commit and publish** (section 6).

Always start from the latest version of the branch:

```sh
git checkout v2
git pull
```

---

## 3. Events start on Facebook

The SLGS Facebook page is the source of truth for events. Post the event there first, then bring it to the website. This keeps the text, date and photos in one place and gives each website card a "View on Facebook" link.

### 3.1 Post the event on Facebook

- **Announcement (before the event):** the poster, date, time, venue and registration link.
- **Recap (after the event):** a thank-you message and a few good photos. Put your best photo **first** — the agent uses the first photo for the website card.

The post must be **public** (posted by the SLGS Page, visible to everyone), otherwise it cannot be embedded or read.

### 3.2 Get the embed code

On a computer (the option is not available in the mobile app):

1. Open the post on the SLGS Facebook page.
2. Click the **⋯** menu at the top right of the post.
3. Choose **Embed**.
4. Click **Copy code**.

You will get something like:

```html
<iframe src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fslgsmelb%2Fposts%2Fpfbid0...&show_text=true&width=500" width="500" height="702" ...></iframe>
```

Paste the **whole** code into the prompt. If **Embed** is missing, copy the post's link instead (click the post's date/time, then copy the address from the browser) — the agent can work from that too.

### 3.3 If the agent cannot read the post

Facebook sometimes blocks automated access. If the agent reports it could not read the post, give it the content directly instead:

- Paste the post text into the prompt.
- Save the photo you want into `assets/img/events/` and mention its file name.

---

## 4. Prompts

Copy the prompt, replace everything in `[square brackets]`, and paste it into the agent. Each prompt tells the agent which part of `AGENTS.md` to follow, so the result stays consistent with the rest of the site.

### 4.1 Add an upcoming event

```text
Add a new upcoming event to the website, following AGENTS.md section 4.2.

Facebook embed code:
[paste the full <iframe ...> code here]

Event details (fill in anything not in the post):
- Event name: [e.g. Sri Lankan New Year Festival 2027]
- Date and time: [e.g. Saturday 17 April 2027, from 10.00 a.m.]
- Venue: [e.g. South Lawn, University of Melbourne]

Read the post, save its poster or main image to assets/img/events/ using the
year-event.jpg naming (resized as described in AGENTS.md), and write a short
1–2 sentence description from the post text. Add the card to the Upcoming
section of the events page and make it the featured card in the home page
Events section with the "Upcoming" label. Do not add date or tag badges.
Show me screenshots of both pages at desktop and phone width, and do not commit.
```

### 4.2 An event is over: move it to past events

```text
The event "[event name]" has finished. Move it from upcoming to past events,
following AGENTS.md section 4.3.

Facebook embed code for the recap post:
[paste the full <iframe ...> code here]

Use the first photo from the recap post as the card image (not the poster),
saved to assets/img/events/ with the year-event.jpg naming. Rewrite the
description in the past tense from the recap post, and point "View on
Facebook" at the recap post. Move the card to the top of its year section on
the events page and update the event counts. On the home page, replace the
featured card with the next upcoming event, or follow AGENTS.md 4.5 if there is
none. Add the recap photo to the Recent Events collage pool.
Show me screenshots and do not commit.
```

If there is **no recap post yet**, use this shorter version and add the photo later with prompt 4.3:

```text
The event "[event name]" has finished but there is no recap post yet. Move it
from Upcoming to past events following AGENTS.md section 4.3, keep the current
poster for now, and change its description to the past tense. On the home page,
change its label from "Upcoming" to "Recent Event". Do not commit.
```

### 4.3 Update an event's photo or details

```text
Update the event card for "[event name]" following AGENTS.md section 4.
[Choose what applies:]
- Use this photo instead: assets/img/events/[file name].jpg
- Use the first photo from this Facebook post: [paste embed code]
- Change the description to: "[new text]"
- Point "View on Facebook" at: [post link]
Update the same event everywhere it appears (events page, home page, collage pool).
Resize the photo and set its width and height as described in AGENTS.md.
Show me screenshots and do not commit.
```

### 4.4 Handover to a new committee

```text
The new committee for [YYYY/YY] has been elected. Follow AGENTS.md section 5.2
to make it the current committee and move the [previous YYYY/YY] committee into
Past Committees.

New committee (role, then full name, exactly as spelled):
[Co-President — Full Name]
[Co-President — Full Name]
[Vice President — Full Name]
[Secretary — Full Name]
[Assistant Secretary — Full Name]
[Treasurer — Full Name]
[Media & Communication Officer — Full Name]
[Event Organiser — Full Name]
[Committee Member — Full Name]
[Staff Advisor — Full Name]

Update both the team page and the home page Team section, and make sure no
old cards are left behind. Point out any names whose spelling looks unusual or
differs from earlier years instead of changing them. Show me screenshots and
do not commit.
```

### 4.5 Add an award or achievement

```text
Add a new achievement to the achievements page, following AGENTS.md section 6.

Facebook embed code:
[paste the full <iframe ...> code here]

Award: [e.g. Best Club Event, Over 50 Participants]
Awarded by: [e.g. UMSU Clubs & Societies Awards Night 2027]

Use the award poster or photo from the post, saved to assets/img/achievements/
with the year-body-award.jpg naming. Put it first and move the highlight
border to it. Show me screenshots and do not commit.
```

### 4.6 Update the scholarship program

```text
Update the scholarship information following AGENTS.md section 7.
[Choose what applies:]
- The program now offers [number] scholarships worth [amount].
- Add these awardees for [YYYY–YYYY], quoted word for word:
  "[quote]" — [Full Name], [Faculty], [University]
Update the figures in the home page Objective box and the scholarships page.
Do not add bank details. Show me screenshots and do not commit.
```

### 4.7 Start-of-year housekeeping

```text
Do the yearly housekeeping in AGENTS.md section 8 for [YYYY]: update the
footer copyright year, find any text on the site tied to last year, and list
anything in TODO.md that is now done. Show me what you would change before
editing.
```

### 4.8 Anything else

```text
[Describe the change in plain words, e.g. "Add a link to our LinkedIn page in
the footer next to Facebook and Instagram".]

Follow the house style in AGENTS.md and CLAUDE.md, keep the existing look and
colours, and check it on desktop and phone width. Show me screenshots and do
not commit.
```

### Prompt tips

- **One change per prompt.** Small, focused requests are easier to check.
- **Always ask for screenshots** and say **"do not commit"**, so you review before anything is saved to the history.
- **Names, quotes and figures must be exact.** Paste them; do not let the agent guess.
- **Only use photos SLGS owns** — our own photos or our own Facebook/Instagram posts. Never ask the agent to find photos of people on the internet.
- If a result is wrong, say what is wrong rather than starting over.

---

## 5. Check before publishing

Open the changed pages and check:

- [ ] Text, names and spellings are correct.
- [ ] Photos show (no broken-image icons) and are not awkwardly cropped.
- [ ] It looks right on a **phone-width** window (narrow the browser, or use the device toolbar: Cmd+Option+I → the phone icon).
- [ ] The home page **Recent Events** photos still shuffle after a few seconds.
- [ ] Links work — especially "View on Facebook" and "View full poster".

---

## 6. Commit and publish

Once you are happy, ask the agent:

```text
Commit these changes with a clear message.
```

or do it yourself:

```sh
git add -A
git status          # check only the files you meant to change are listed
git commit -m "Add Sri Lankan New Year Festival 2027 to upcoming events"
git push
```

Pushing updates the hosted website on GitHub Pages once the branch is published (this can take a few minutes). Until the dev-branch and automated-checks tasks in `TODO.md` are done, **nothing stops a broken change from going live** — so the checks in section 5 are important.

Things not to commit:

- Large original photos you did not use (resize them first; see `AGENTS.md` section 3).
- `.DS_Store` files or other system files.

---

## 7. Regular maintenance

| When | What | Prompt |
|---|---|---|
| Before each event | Add it as upcoming | 4.1 |
| After each event | Move it to past events with a recap photo | 4.2 |
| New award | Add it to achievements | 4.5 |
| AGM / new committee | Committee handover | 4.4 |
| Program changes or new awardees | Scholarships update | 4.6 |
| Start of each year | Yearly housekeeping | 4.7 |
| Any time | Review `TODO.md` for open tasks | — |

---

## 8. Getting help

- **Something looks broken after an update:** ask the agent *"The [page/section] looks broken since the last change. Compare it with the previous commit and fix it."* You can also undo the last commit's changes with `git revert HEAD`, then push.
- **Contact:** the SLGS committee at [slgsunimelb@gmail.com](mailto:slgsunimelb@gmail.com).
