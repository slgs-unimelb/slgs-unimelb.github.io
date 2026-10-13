/*
 * The live hands of the tower clocks.
 *
 *   const clock = UnimelbPainting.createClock(canvas, { faces, lean, timeZone, sheet, detail });
 *   clock.start();
 *   clock.stop();
 *
 * The hands are drawn on a small canvas of their own, laid over the painted
 * clock faces, so the painting underneath is never redrawn. The seconds hand
 * ticks once a second; the hour and minute hands creep round with it.
 *
 *   faces     centre and radii of each painted face: [cx, cy, rx, ry]
 *   lean      tilts a point the way the tower wall is tilted (from campus.js)
 *   timeZone  an IANA zone name, such as 'Australia/Melbourne'
 *   sheet     the size of the whole painting: { width, height }
 *   detail    canvas pixels per painting unit
 */
(() => {
  const INK = '#2b2622';
  const SECONDS_INK = '#b3322a';   // vermilion, so the thin seconds hand shows against the others
  const ROOM = 18;                 // space kept around the faces, in painting units

  window.UnimelbPainting.createClock = (canvas, { faces, lean, timeZone, sheet, detail }) => {
    // Size the canvas to just cover the faces, and set it over them.
    const left = Math.min(...faces.map(([cx, , rx]) => cx - rx)) - ROOM;
    const right = Math.max(...faces.map(([cx, , rx]) => cx + rx)) + ROOM;
    const top = Math.min(...faces.map(([, cy, , ry]) => cy - ry)) - ROOM;
    const bottom = Math.max(...faces.map(([, cy, , ry]) => cy + ry)) + ROOM;
    canvas.width = (right - left) * detail;
    canvas.height = (bottom - top) * detail;
    Object.assign(canvas.style, {
      left: `${left / sheet.width * 100}%`,
      top: `${top / sheet.height * 100}%`,
      width: `${(right - left) / sheet.width * 100}%`,
      height: `${(bottom - top) / sheet.height * 100}%`,
    });
    const dial = canvas.getContext('2d');
    dial.lineCap = 'round';

    const clockTime = new Intl.DateTimeFormat('en-AU', {
      timeZone, hourCycle: 'h23', hour: 'numeric', minute: 'numeric', second: 'numeric',
    });

    function show() {
      const now = Object.fromEntries(clockTime.formatToParts(new Date()).map(({ type, value }) => [type, Number(value)]));
      const minutes = now.minute + now.second / 60, hours = now.hour % 12 + minutes / 60;
      dial.setTransform(detail, 0, 0, detail, -left * detail, -top * detail);
      dial.clearRect(left, top, right - left, bottom - top);
      faces.forEach(([cx, cy, rx, ry]) => {
        // A hand turns clockwise from twelve, and leans with the wall like the face does.
        const hand = (turns, reach, width, color = INK, tail = 0.12) => {
          const angle = turns * 2 * Math.PI;
          dial.lineWidth = width;
          dial.strokeStyle = color;
          dial.beginPath();
          dial.moveTo(...lean([cx - Math.sin(angle) * rx * tail, cy + Math.cos(angle) * ry * tail]));
          dial.lineTo(...lean([cx + Math.sin(angle) * rx * reach, cy - Math.cos(angle) * ry * reach]));
          dial.stroke();
        };
        hand(hours / 12, 0.5, 2.4);
        hand(minutes / 60, 0.76, 1.5);
        hand(now.second / 60, 0.84, 0.8, SECONDS_INK, 0.24);
        dial.fillStyle = INK;
        dial.beginPath();
        dial.arc(...lean([cx, cy]), 1.8, 0, 2 * Math.PI);
        dial.fill();
      });
    }

    let timer = 0;
    // Tick on the second itself, not a second after whenever the clock happened to start.
    function tick() {
      show();
      timer = setTimeout(tick, 1000 - Date.now() % 1000);
    }

    return {
      start() {
        clearTimeout(timer);
        tick();
      },
      stop() {
        clearTimeout(timer);
      },
    };
  };
})();
