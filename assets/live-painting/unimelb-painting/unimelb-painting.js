/*!
 * <unimelb-painting> — a colour ink wash painting of the University of
 * Melbourne's Old Arts clock tower, with two students running past carrying
 * the Australian and Sri Lankan flags. The flags wave and the tower clocks
 * show the time in Melbourne; everything else is still.
 *
 * To use it, copy the whole `unimelb-painting` folder into your site, then:
 *
 *   <script src="unimelb-painting/unimelb-painting.js" defer></script>
 *   <unimelb-painting></unimelb-painting>
 *
 * This is the only file a page needs to load: it fetches the others from the
 * folder it sits in. Size the painting with CSS (the height follows the width):
 *
 *   unimelb-painting { width: 800px }
 *
 * Attributes, both optional:
 *
 *   flag-speed   how briskly the flags wave: 1 is a steady breeze, 0 is frozen
 *   time-zone    what the clocks show, as an IANA zone such as "Asia/Colombo"
 *
 * Where things live:
 *
 *   unimelb-painting.js   this file: the element, its layout, the flags' placing
 *   brush.js              the ink-wash toolkit every part is painted with
 *   campus.js             the background: sky, buildings, clock tower, trees, lawn
 *   runners.js            the two students and what they carry
 *   clock.js              the live clock hands
 *   flags/                the waving flag elements, <au-flag> and <sl-flag>
 */
(() => {
  const SETTINGS = {
    flagSpeed: 1.3,                    // default for the flag-speed attribute
    timeZone: 'Australia/Melbourne',   // default for the time-zone attribute
    vividness: 1.4,   // colour of the background: 1 is muted, higher is richer
    detail: 1.5,      // canvas pixels per painting unit: higher is sharper but slower to paint
    seed: 20261013,   // the brush's run of chance: another number moves every leaf and wobble
  };

  // The painting's own units. Every position in campus.js and runners.js is in
  // these, and the element scales the lot to whatever size the page gives it.
  const SHEET = { width: 1600, height: 1067 };

  const PARTS = ['brush.js', 'campus.js', 'runners.js', 'clock.js'];
  const FLAGS = ['au-flag', 'sl-flag'];

  const TEMPLATE = `
    <style>
      :host { display: block; }
      :host([hidden]) { display: none; }
      /* The sheet keeps the painting's proportions whatever the page does to the
         element, so a stretching flex or grid parent cannot distort it. */
      .sheet {
        position: relative;
        aspect-ratio: ${SHEET.width} / ${SHEET.height};
        overflow: hidden;
        isolation: isolate;
      }
      canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
      .flag { position: absolute; max-width: none; }
      /* Paper grain lies over the paint and the flags alike. */
      .grain { mix-blend-mode: multiply; pointer-events: none; }
    </style>
    <div class="sheet">
      <canvas class="scene"></canvas>
      <canvas class="hands"></canvas>
      <canvas class="grain"></canvas>
    </div>`;

  // ---- Loading the other files ---------------------------------------------

  // Each part adds its function to this object when it loads.
  window.UnimelbPainting = window.UnimelbPainting || {};

  const HERE = new URL('.', document.currentScript?.src || location.href).href;
  const load = (file) => new Promise((loaded, failed) => {
    const script = document.createElement('script');
    script.src = HERE + file;
    script.onload = loaded;
    script.onerror = () => failed(new Error(`<unimelb-painting> could not load ${script.src}`));
    document.head.append(script);
  });
  const ready = Promise.all([
    ...PARTS.map(load),
    // A page that already uses a flag element need not load it twice.
    ...FLAGS.filter((flag) => !customElements.get(flag)).map((flag) => load(`flags/${flag}.js`)),
  ]);

  // ---- The element -----------------------------------------------------------

  class UnimelbPainting extends HTMLElement {
    static get observedAttributes() { return ['flag-speed']; }

    #clock;

    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).innerHTML = TEMPLATE;
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) this.setAttribute('role', 'img');
      if (!this.hasAttribute('aria-label')) {
        this.setAttribute('aria-label', 'Colour ink wash painting of a sandstone clock tower among trees, with two '
          + 'students running across the foreground, each holding a flag aloft. The tower clocks show the current time.');
      }
      ready.then(() => {
        if (!this.isConnected) return;
        if (!this.#clock) this.#paint();
        this.#clock.start();
      }, (problem) => console.error(problem));
    }

    disconnectedCallback() {
      this.#clock?.stop();
    }

    attributeChangedCallback() {
      for (const flag of this.shadowRoot.querySelectorAll('.flag')) flag.setAttribute('speed', this.#flagSpeed);
    }

    get #flagSpeed() {
      return this.getAttribute('flag-speed') ?? SETTINGS.flagSpeed;
    }

    // Paint the picture, once. Only the flags and the clock hands change after this.
    #paint() {
      const { createBrush, paintCampus, paintRunners, createClock } = window.UnimelbPainting;
      const root = this.shadowRoot, scene = root.querySelector('.scene'), grain = root.querySelector('.grain');
      scene.width = SHEET.width * SETTINGS.detail;
      scene.height = SHEET.height * SETTINGS.detail;
      const ctx = scene.getContext('2d');
      ctx.scale(SETTINGS.detail, SETTINGS.detail);
      const brush = createBrush(ctx, { ...SHEET, seed: SETTINGS.seed });

      // Back to front. The order matters twice over: later paint covers earlier,
      // and each step takes the next stretch of the seeded brush's run of chance.
      brush.blank();
      const campus = paintCampus(brush);
      brush.enliven(SETTINGS.vividness);   // the background only: the runners keep their own colours
      const staffs = paintRunners(brush);
      brush.finish();
      brush.grain(grain);

      for (const staff of staffs) {
        const flag = document.createElement(staff.flag);
        flag.className = 'flag';
        flag.setAttribute('speed', this.#flagSpeed);
        this.#fly(flag, staff);
        grain.before(flag);
      }

      let timeZone = this.getAttribute('time-zone') || SETTINGS.timeZone;
      try {
        new Intl.DateTimeFormat('en', { timeZone });
      } catch {
        console.error(`<unimelb-painting> does not know the time zone "${timeZone}"; showing ${SETTINGS.timeZone}`);
        timeZone = SETTINGS.timeZone;
      }
      this.#clock = createClock(root.querySelector('.hands'), {
        faces: campus.clocks, lean: campus.lean, timeZone, sheet: SHEET, detail: SETTINGS.detail,
      });
    }

    // Put a flag element on its staff. The hoist runs back down the staff from
    // `meet`; the cloth trails off to the right and sags by `droop` radians, so
    // the flag is a leaning parallelogram rather than a level rectangle.
    #fly(flag, { meet: [x, y], up: [ux, uy], length, droop }) {
      const width = length / 0.94;   // a flag element is a little wider than its flag
      flag.style.width = `${width / SHEET.width * 100}%`;
      flag.style.left = `${(x + 3 - 0.03 * width) / SHEET.width * 100}%`;
      flag.style.top = `${(y - 0.065 * width) / SHEET.height * 100}%`;
      flag.style.transformOrigin = '3% 10.83%';   // the top of the hoist
      flag.style.transform = `matrix(${Math.cos(droop)}, ${Math.sin(droop)}, ${-ux}, ${-uy}, 0, 0)`;
    }
  }

  if (!customElements.get('unimelb-painting')) customElements.define('unimelb-painting', UnimelbPainting);
})();
