# Live UniMelb painting

A colour ink wash painting of the University of Melbourne's Old Arts clock tower,
drawn entirely in code. Two students run across the foreground carrying the
Australian and Sri Lankan flags. The flags wave and the tower clocks show the
time in Melbourne; everything else is still.

Plain HTML, CSS and JavaScript. No build step and no dependencies.

Open `index.html` to see it.

## Adding it to a website

1. Copy the whole `unimelb-painting` folder into your site.
2. Add these two lines to the page, with the path to wherever you put the folder:

```html
<script src="unimelb-painting/unimelb-painting.js" defer></script>

<unimelb-painting></unimelb-painting>
```

That one script loads the rest of the folder itself.

Size the painting with CSS. The height follows the width:

```css
unimelb-painting { width: 800px; }
```

Two optional attributes:

| Attribute    | What it does                                             | Default               |
| ------------ | -------------------------------------------------------- | --------------------- |
| `flag-speed` | How briskly the flags wave. `1` is a steady breeze, `0` is frozen. | `1.3`       |
| `time-zone`  | What the clocks show, as an IANA zone such as `Asia/Colombo`.      | `Australia/Melbourne` |

```html
<unimelb-painting flag-speed="1" time-zone="Asia/Colombo"></unimelb-painting>
```

## Where things live

```
index.html                  a demo page, and an example of embedding
unimelb-painting/
  unimelb-painting.js       the <unimelb-painting> element: layout, settings, placing the flags
  brush.js                  the ink-wash toolkit every part is painted with
  campus.js                 the background: sky, buildings, clock tower, trees, lawn
  runners.js                the two students and what they carry
  clock.js                  the live clock hands
  flags/
    au-flag.js              <au-flag>, the waving Australian flag
    sl-flag.js              <sl-flag>, the waving Sri Lankan flag
```

## Changing things

| To change                                             | Edit                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| Background vividness, sharpness, default speed or zone | `SETTINGS` at the top of `unimelb-painting.js`               |
| A runner's clothes, skin, hair, pose or position      | `RUNNERS` at the top of `runners.js`                         |
| Which flag a runner carries, its size or its sag      | `flag`, `flagLength` and `flagDroop` in `RUNNERS`            |
| A part of the scenery                                 | its function in `campus.js` (`sky`, `tower`, `oak`, ...)     |
| The clock hands' look                                 | `clock.js`                                                   |
| How a flag waves or shines                            | `WAVES` and the shader in its file in `flags/`               |

All positions are in the painting's own units, on a sheet 1600 wide and 1067
high. The element scales the whole sheet to whatever size the page gives it.

### One thing to know before editing the scenery

The painting is made with a seeded brush: every wobble and scattered leaf comes
from one fixed sequence of random numbers, which is why it looks the same on
every visit. Each part of the picture uses up the next stretch of that sequence.
So if you add, remove or reorder a part, everything painted after it shifts a
little: the trees will have their leaves in different places, for instance.
Changing a colour or a position does not do this. To reshuffle everything on
purpose, change `seed` in `SETTINGS`.

## Notes

- The flags need WebGL. Without it they are shown flat and still.
- Visitors who have asked their system to reduce motion see the flags held
  still. The clocks still tell the time.
- The flags pause while the painting is scrolled out of view.
- The flag artwork is public domain, from Wikimedia Commons.
