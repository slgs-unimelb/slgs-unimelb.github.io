/*
 * The ink-wash toolkit: a seeded hand, a few shape helpers, and the brushes that
 * every part of the painting is made with.
 *
 *   const brush = UnimelbPainting.createBrush(ctx, { width, height, seed });
 *
 * Nothing in this file knows what is being painted. Sizes are in painting units:
 * the picture is `width` by `height` of them, and the caller scales the canvas.
 */
(() => {
  const PAPER = '#f5f0e4', INK = '#2b2622', SOFT_INK = '#6b5d50';

  window.UnimelbPainting.createBrush = (ctx, { width, height, seed }) => {
    ctx.lineCap = ctx.lineJoin = 'round';

    // ---- A repeatable hand -------------------------------------------------
    // Every wobble and scatter comes from this seeded generator, so the same
    // seed always gives the same painting, stroke for stroke.

    function rand() {
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    const between = (low, high) => low + (high - low) * rand();
    const pick = (list) => list[Math.floor(rand() * list.length)];
    const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());

    // ---- Shapes ------------------------------------------------------------

    function pts(...numbers) {
      const points = [];
      for (let i = 0; i < numbers.length; i += 2) points.push([numbers[i], numbers[i + 1]]);
      return points;
    }
    const box = (x1, y1, x2, y2) => pts(x1, y1, x2, y1, x2, y2, x1, y2);

    function oval(cx, cy, rx, ry, sides = 14) {
      const points = [];
      for (let i = 0; i < sides; i++) {
        const angle = i / sides * 2 * Math.PI;
        points.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
      }
      return points;
    }

    // Break every edge in two and nudge the new point, a few times over: straight
    // outlines turn into the wandering edge of wet paint.
    function roughen(points, rounds, spread) {
      let shape = points;
      for (let round = 0; round < rounds; round++) {
        const next = [];
        for (let i = 0; i < shape.length; i++) {
          const [ax, ay] = shape[i], [bx, by] = shape[(i + 1) % shape.length];
          const reach = Math.hypot(bx - ax, by - ay) * spread;
          next.push(shape[i], [(ax + bx) / 2 + gauss() * reach, (ay + by) / 2 + gauss() * reach]);
        }
        shape = next;
      }
      return shape;
    }

    // Round off a closed outline by cutting its corners.
    function soften(points, rounds = 2) {
      let shape = points;
      for (let round = 0; round < rounds; round++) {
        const next = [];
        for (let i = 0; i < shape.length; i++) {
          const [ax, ay] = shape[i], [bx, by] = shape[(i + 1) % shape.length];
          next.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
        }
        shape = next;
      }
      return shape;
    }

    function trace(points) {
      ctx.beginPath();
      points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
    }

    // A colour that fades in from nothing along a line, for a wash that should
    // deepen across a shape rather than cover it evenly.
    function fade(x1, y1, x2, y2, color) {
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, color);
      return gradient;
    }

    // ---- Brushes -----------------------------------------------------------

    // A wash of diluted colour: many faint layers, each with its own ragged edge,
    // so the middle is even and the rim feathers out. `pool` darkens the rim the
    // way pigment gathers where a wash dries.
    function wash(points, color, { strength = 0.6, spread = 0.1, layers = 12, pool = 0.3 } = {}) {
      const base = roughen(points, 3, spread);
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = ctx.strokeStyle = color;
      ctx.globalAlpha = 1 - Math.pow(1 - strength, 1 / layers);
      for (let i = 0; i < layers; i++) {
        trace(roughen(base, 2, spread));
        ctx.fill();
      }
      if (pool) {
        ctx.globalAlpha = pool * strength;
        ctx.lineWidth = 1.1;
        trace(base);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Bare paper, kept clear of whatever was painted before.
    function reserve(points, spread = 0.008) {
      ctx.fillStyle = PAPER;
      trace(roughen(points, 2, spread));
      ctx.fill();
    }

    // An opaque, softly modelled shape: cleared to paper so it stands in front of
    // what is behind it, washed with colour, then shaded on the side away from
    // the sun, which is on the right.
    function solid(shape, color) {
      const outline = soften(shape);
      const xs = outline.map(([x]) => x), ys = outline.map(([, y]) => y);
      reserve(outline, 0.003);
      wash(outline, color, { strength: 0.9, spread: 0.008, layers: 8, pool: 0.35 });
      wash(outline, fade(Math.max(...xs), Math.min(...ys), Math.min(...xs), Math.max(...ys), '#564a66'),
        { strength: 0.28, spread: 0.008, layers: 6, pool: 0 });
    }

    // An ink line drawn by hand: it drifts off true, swells and thins with
    // pressure, and with `dry` above zero the brush skips.
    function ink(points, { width: stroke = 1.5, color = INK, wobble = 1, dry = 0 } = {}) {
      ctx.save();
      ctx.strokeStyle = color;
      let drift = 0, press = 1;
      for (let i = 0; i < points.length - 1; i++) {
        const [ax, ay] = points[i], [bx, by] = points[i + 1];
        const length = Math.hypot(bx - ax, by - ay) || 1;
        const steps = Math.max(1, Math.round(length / 5));
        const nx = (ay - by) / length, ny = (bx - ax) / length;
        let px = ax + nx * drift, py = ay + ny * drift;
        for (let step = 1; step <= steps; step++) {
          drift = drift * 0.85 + gauss() * 0.35 * wobble;
          press = Math.min(1.5, Math.max(0.45, press + gauss() * 0.12));
          const x = ax + (bx - ax) * step / steps + nx * drift;
          const y = ay + (by - ay) * step / steps + ny * drift;
          if (rand() >= dry) {
            ctx.lineWidth = stroke * press;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
          px = x;
          py = y;
        }
      }
      ctx.restore();
    }

    // One touch of a loaded brush: a small, lopsided, round-cornered mark.
    function dab(x, y, rx, ry, color, alpha, mode = 'multiply') {
      const sides = 8, turn = rand() * 2 * Math.PI, ring = [];
      for (let i = 0; i < sides; i++) {
        const angle = turn + i / sides * 2 * Math.PI, reach = between(0.6, 1.2);
        ring.push([x + Math.cos(angle) * rx * reach, y + Math.sin(angle) * ry * reach]);
      }
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      ctx.save();
      ctx.globalCompositeOperation = mode;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(...mid(ring[sides - 1], ring[0]));
      for (let i = 0; i < sides; i++) {
        ctx.quadraticCurveTo(...ring[i], ...mid(ring[i], ring[(i + 1) % sides]));
      }
      ctx.fill();
      ctx.restore();
    }

    // Many dabs scattered through a cluster of ovals, for leaves. `colorAt` picks
    // the paint for a spot, or returns nothing to leave it bare.
    function foliage(ovals, count, [small, large], alpha, colorAt) {
      for (let i = 0; i < count; i++) {
        const [cx, cy, rx, ry] = pick(ovals);
        const angle = rand() * 2 * Math.PI, reach = Math.sqrt(rand());
        const x = cx + Math.cos(angle) * rx * reach, y = cy + Math.sin(angle) * ry * reach;
        const color = colorAt(x, y);
        if (!color) continue;
        // Each touch is a ragged clump of smaller marks rather than one round spot.
        const size = between(small, large);
        for (let mark = 0; mark < 4; mark++) {
          const part = size * between(0.3, 0.75);
          dab(x + gauss() * size * 0.55, y + gauss() * size * 0.4, part, part * between(0.5, 0.9),
            color, alpha * between(0.5, 1.1));
        }
      }
    }

    // Loose, broken arcs of ink around the outside of each oval: the scalloped
    // outline a brush gives a mass of leaves.
    function scallops(ovals, color, each = 12) {
      ovals.forEach(([cx, cy, rx, ry]) => {
        for (let i = 0; i < each; i++) {
          const start = rand() * 2 * Math.PI, sweep = between(0.1, 0.22), bulge = between(0.03, 0.08);
          const arc = [];
          for (let step = 0; step <= 6; step++) {
            const reach = 1 + bulge * Math.sin(step / 6 * Math.PI), turn = start + sweep * step / 6;
            arc.push([cx + Math.cos(turn) * rx * reach, cy + Math.sin(turn) * ry * reach]);
          }
          ink(arc, { width: between(0.7, 1.2), color, wobble: 0.4, dry: 0.2 });
        }
      });
    }

    // ---- The sheet ---------------------------------------------------------

    // A clean sheet to start on.
    function blank() {
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, width, height);
    }

    // Lift the colour of everything painted so far. Greys stay grey; the purer a
    // colour already is, the further it moves. 1 leaves the painting as it is.
    function enliven(amount) {
      const image = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height), data = image.data;
      for (let i = 0; i < data.length; i += 4) {
        const grey = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        for (let channel = 0; channel < 3; channel++) {
          data[i + channel] = grey + (data[i + channel] - grey) * amount;
        }
      }
      ctx.putImageData(image, 0, 0);
    }

    // The last touches: flecks from the brush, then a torn, uneven edge. The
    // sheet beyond that edge is cut away, so the page shows through the margin.
    function finish() {
      for (let i = 0; i < 70; i++) {
        dab(between(40, width - 40), between(40, height - 40), between(0.6, 2.2), between(0.6, 2.2),
          pick([INK, '#8a6233', '#4f7436', '#7d848c']), between(0.25, 0.6));
      }
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      for (let i = 0; i < 6; i++) {
        const inset = 20 + i * 3;
        // The outermost pass clears the margin outright; the rest feather the edge.
        ctx.globalAlpha = i ? 0.45 : 1;
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        roughen(box(inset, inset, width - inset, height - inset), 6, 0.012)
          .forEach(([x, y], n) => (n ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fill('evenodd');
      }
      ctx.restore();
    }

    // Paper grain, drawn on a canvas of its own that is laid over the painting
    // and multiplied into it: a fine speckle, and fibres in the sheet. It is
    // trimmed to the painting's own edge, so the cut-away margin stays clear.
    function grain(canvas) {
      canvas.width = width;
      canvas.height = height;
      const paper = canvas.getContext('2d');
      const speckle = paper.createImageData(width, height);
      for (let i = 0; i < speckle.data.length; i += 4) {
        const tone = 236 + rand() * 19;
        speckle.data[i] = tone;
        speckle.data[i + 1] = tone - 1;
        speckle.data[i + 2] = tone - 4;
        speckle.data[i + 3] = 255;
      }
      paper.putImageData(speckle, 0, 0);
      paper.strokeStyle = 'rgb(120 100 70 / 0.07)';
      for (let i = 0; i < 900; i++) {
        const x = rand() * width, y = rand() * height, angle = rand() * Math.PI, length = between(6, 26);
        paper.lineWidth = between(0.4, 1);
        paper.beginPath();
        paper.moveTo(x, y);
        paper.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        paper.stroke();
      }
      paper.globalCompositeOperation = 'destination-in';
      paper.drawImage(ctx.canvas, 0, 0, width, height);
    }

    return {
      PAPER, INK, SOFT_INK, ctx, width, height,
      rand, between, pick, gauss,
      pts, box, oval, roughen, soften, trace, fade,
      wash, reserve, solid, ink, dab, foliage, scallops,
      blank, enliven, finish, grain,
    };
  };
})();
