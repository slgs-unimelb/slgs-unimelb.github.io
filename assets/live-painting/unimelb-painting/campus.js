/*
 * The campus: sky, the sandstone buildings and their clock tower, the trees,
 * the lawn and the people on it. Everything that stands still.
 *
 *   const { clocks, lean } = UnimelbPainting.paintCampus(brush);
 *
 * Returns what the live clock needs: the centre and radii of each clock face,
 * and `lean`, which tilts a point the way the tower's walls are tilted.
 *
 * Each part of the scene is a function of its own below, and the list at the
 * bottom of the file paints them back to front. Positions are in painting units
 * on a 1600 x 1067 sheet.
 */
(() => {
  window.UnimelbPainting.paintCampus = (brush) => {
    const {
      INK, SOFT_INK, ctx, rand, between, pick, gauss, pts, box, oval, trace, fade,
      wash, reserve, ink, dab, foliage, scallops,
    } = brush;

    // ---- Things drawn more than once ---------------------------------------

    // A pointed window: a dark wash under a thin outline. `bend` moves its corners,
    // for a wall drawn in perspective. `lit` is the colour of the side of the
    // opening that catches the sun, which sets the window back in a thick wall.
    function pane(x1, y1, x2, y2, { tone = '#3a3331', bend = (points) => points, lit } = {}) {
      const middle = (x1 + x2) / 2, point = (x2 - x1) * 0.45;
      const shape = bend(pts(x1, y2, x1, y1 + point, middle, y1 - point, x2, y1 + point, x2, y2));
      wash(shape, tone, { strength: 0.78, spread: 0.03, layers: 6 });
      ink([...shape, shape[0]], { width: 0.9, color: SOFT_INK, wobble: 0.5, dry: 0.15 });
      if (lit) {
        ink(bend(pts(x1 - 2, y1 + point, x1 - 2, y2 + 2, x2 + 1, y2 + 2)), { width: 2, color: lit, wobble: 0.3 });
        ink(bend(pts(middle, y1 - point - 1, x2 + 1, y1 + point, x2 + 1, y2)), { width: 1.3, wobble: 0.4, dry: 0.05 });
      }
    }

    // The toothed top of a castle wall, from x1 to x2.
    function battlement(x1, x2, y, tooth = 9, drop = 8, bend = (points) => points) {
      const line = [[x1, y]];
      for (let x = x1, up = true; x < x2; x += tooth, up = !up) {
        const next = Math.min(x + tooth, x2);
        line.push([x, up ? y : y + drop], [next, up ? y : y + drop]);
      }
      ink(bend(line), { width: 1.3, wobble: 0.5 });
    }

    // Someone in the distance, no more than a head, a coat and a pair of legs.
    // `tall` is standing height; someone seated shows only the top half of it.
    function person(x, feet, tall, coat, seated) {
      const head = tall * 0.07, top = feet - (seated ? tall * 0.52 : tall);
      const shoulder = top + head * 2, hip = seated ? feet : feet - tall * 0.45;
      if (!seated) {
        ink(pts(x - 2, hip - 4, x - 7, feet), { width: 4, color: '#3b3a40', wobble: 0.6 });
        ink(pts(x + 2, hip - 4, x + 8, feet - 2), { width: 4, color: '#3b3a40', wobble: 0.6 });
      }
      dab(x, (shoulder + hip) / 2, tall * 0.12, (hip - shoulder) * 0.55, coat, 0.95, 'source-over');
      dab(x, top + head, head, head * 1.1, '#c99b7c', 1, 'source-over');
      dab(x - 1, top + head * 0.5, head, head * 0.7, '#2f2623', 0.95, 'source-over');
    }

    // ---- The tower's perspective -------------------------------------------

    // The tower is seen from one corner and from below, so its walls fall away on
    // either side of the stair turret: the higher a level line sits, the more it
    // slopes down towards the far edges. `fall` moves a point by that drop.
    const TOWER_CORNERS = [926, 947, 976, 998];   // the turret's three faces sit between these
    function fall([x, y]) {
      const away = x < 926 ? 5.25 + (926 - x) * 0.06
        : x < 947 ? (947 - x) * 0.25
        : x < 976 ? 0
        : x < 998 ? (x - 976) * 0.25
        : 5.5 + (x - 998) * 0.17;
      return [x, y + away * Math.max(0, 1000 - y) / 760];
    }
    const onTower = (points) => points.map(fall);
    // A level line across the tower, bent at each corner it passes...
    const across = (x1, x2, y) => [x1, ...TOWER_CORNERS.filter((x) => x > x1 && x < x2), x2].map((x) => fall([x, y]));
    // ...and the stretch of wall between two of them.
    const band = (x1, x2, top, bottom) => [...across(x1, x2, top), ...across(x1, x2, bottom).reverse()];

    // ---- Outlines and colours shared between parts -------------------------

    const TOWER = onTower(pts(800, 1000, 800, 236, 828, 236, 828, 244, 926, 244, 926, 127, 947, 127, 976, 127,
      998, 127, 998, 244, 1058, 244, 1058, 236, 1085, 236, 1085, 1000));
    const GABLE = pts(668, 1000, 668, 652, 735, 572, 800, 642, 800, 1000);
    const WING = pts(390, 1000, 390, 710, 668, 692, 668, 1000);
    const ROOF = pts(400, 710, 668, 692, 668, 652, 700, 612, 470, 664);
    const ANNEXE = pts(1085, 1000, 1085, 672, 1150, 692, 1235, 765, 1235, 1000);
    const CLOCKS = [[877, 356, 31, 31], [1028, 360, 16, 30]];   // centre and radii of each face

    const STONE_SHADE = '#b3854e', COOL_SHADE = '#74688a', DEEP_SHADE = '#5c4c58', SUNLIT = '#f8e8bd';
    const BARK = '#3a2f28';

    // ---- The parts of the scene --------------------------------------------

    // Loose blue washes, with the paper left bare for cloud.
    function sky() {
      [
        [240, 50, 380, 80], [820, 60, 330, 70], [1390, 120, 300, 130], [640, 330, 170, 190],
        [1210, 400, 150, 230], [590, 600, 120, 130], [1470, 330, 190, 170], [1120, 170, 120, 70],
        [420, 190, 150, 60],
      ].forEach(([x, y, rx, ry]) => {
        wash(oval(x, y, rx, ry), '#9cc0e0', { strength: between(0.22, 0.38), spread: 0.26, layers: 14, pool: 0 });
      });
      [[980, 150, 200, 50], [330, 120, 220, 40], [1300, 250, 180, 50]].forEach(([x, y, rx, ry]) => {
        wash(oval(x, y, rx, ry), '#cdc5c0', { strength: 0.2, spread: 0.25, layers: 8, pool: 0 });
      });
    }

    // Far trees behind the buildings on the right, kept pale so they sit back.
    function farTrees() {
      wash(pts(1090, 965, 1090, 700, 1180, 640, 1320, 690, 1450, 640, 1600, 700, 1600, 965), '#9aae8c',
        { strength: 0.42, spread: 0.1, pool: 0.15 });
      wash(pts(1150, 965, 1170, 790, 1300, 760, 1480, 800, 1600, 780, 1600, 965), '#6f8a6a',
        { strength: 0.35, spread: 0.1, pool: 0 });
    }

    // The buildings are kept as clean paper before any stone colour goes on.
    function clearBuildings() {
      [TOWER, GABLE, WING, ROOF, ANNEXE].forEach((shape) => reserve(shape));
    }

    // The low building to the right of the tower.
    function annexe() {
      wash(ANNEXE, '#dcb876', { strength: 0.5, spread: 0.02 });
      ink(pts(1085, 672, 1150, 692, 1235, 765), { width: 1.2, color: SOFT_INK, dry: 0.1 });
      pane(1108, 770, 1120, 815);
      pane(1126, 770, 1138, 815);
    }

    // The gabled wing to the left of the tower, running back under the oak.
    function wing() {
      wash(ROOF, '#84818f', { strength: 0.6, spread: 0.02 });
      wash(WING, '#d7ad66', { strength: 0.7, spread: 0.015 });
      wash(box(390, 710, 600, 1000), '#8a8088', { strength: 0.2, spread: 0.06, pool: 0 });
      wash(GABLE, '#e2bd76', { strength: 0.7, spread: 0.012 });
      wash(pts(668, 1000, 668, 652, 700, 614, 700, 1000), '#b98c4c', { strength: 0.3, spread: 0.03 });
      const DORMER = pts(588, 696, 622, 655, 656, 692);
      reserve(DORMER);
      wash(DORMER, '#dcb46c', { strength: 0.65, spread: 0.02 });
      ink([...DORMER], { width: 1.2 });
      pane(617, 668, 627, 690);

      ink(pts(664, 656, 735, 568, 803, 640), { width: 2 });
      ink(pts(672, 664, 735, 584, 798, 652), { width: 0.9, color: SOFT_INK, dry: 0.2 });
      ink(pts(735, 568, 735, 552), { width: 1.6 });
      ink(pts(668, 652, 668, 1000), { width: 1.3, dry: 0.08 });
      ink(pts(400, 710, 668, 692), { width: 1.6, dry: 0.1 });
      ink(pts(470, 664, 700, 612), { width: 1.2, color: SOFT_INK, dry: 0.15 });
      ink(pts(410, 730, 668, 714), { width: 0.8, color: SOFT_INK, dry: 0.3 });
      ink(pts(410, 858, 800, 850), { width: 0.8, color: SOFT_INK, dry: 0.35 });
      pane(731, 628, 739, 668);
      [[700, 745, 810], [718, 745, 810], [760, 762, 806], [777, 762, 806], [760, 886, 950], [778, 886, 950],
        [598, 762, 815], [615, 762, 815], [540, 772, 815], [598, 892, 950], [615, 892, 950]]
        .forEach(([x, top, bottom]) => pane(x, top, x + 13, bottom));
      wash(pts(505, 1000, 505, 840, 532, 806, 560, 840, 560, 1000), '#6a5a4c', { strength: 0.4, spread: 0.03 });
    }

    // The clock tower. The sun is on the right, so the right-hand face stays pale,
    // the left face and the near side of the turret are glazed darker, and the
    // turret, every ledge and every window throw their shadows to the left.
    function tower() {
      const glaze = (shape, color, strength) => wash(shape, color, { strength, spread: 0.01, pool: 0 });

      wash(pts(768, 1000, 780, 668, 800, 642, 800, 1000), COOL_SHADE, { strength: 0.3, spread: 0.04, pool: 0 });
      wash(TOWER, '#ecd193', { strength: 0.7, spread: 0.01 });
      const LEFT_FACE = onTower(pts(800, 236, 828, 236, 828, 244, 926, 244, 926, 1000, 800, 1000));
      glaze(LEFT_FACE, STONE_SHADE, 0.36);
      glaze(LEFT_FACE, COOL_SHADE, 0.2);
      glaze(band(828, 926, 246, 1000), COOL_SHADE, 0.1);
      glaze(band(926, 947, 127, 1000), '#9c7446', 0.55);
      glaze(band(947, 976, 127, 1000), '#cda25e', 0.24);
      glaze(band(868, 926, 246, 1000), fade(868, 0, 926, 0, DEEP_SHADE), 0.48);
      glaze(band(1030, 1085, 246, 1000), fade(1030, 0, 1085, 0, '#b58d58'), 0.3);
      glaze(band(1046, 1058, 246, 1000), DEEP_SHADE, 0.2);
      glaze(band(800, 1085, 740, 1000), fade(0, 740, 0, 1000, '#85788c'), 0.4);
      [[800, 926, 262, 16, 0.5], [998, 1085, 262, 13, 0.34], [926, 998, 150, 9, 0.4], [800, 926, 434, 12, 0.45],
        [998, 1085, 434, 10, 0.3], [834, 926, 704, 14, 0.5], [800, 926, 318, 6, 0.3], [998, 1085, 318, 5, 0.2]]
        .forEach(([x1, x2, y, depth, strength]) => {
          wash(band(x1, x2, y, y + depth), DEEP_SHADE, { strength, spread: 0.03, layers: 6, pool: 0 });
        });
      wash(pts(745, 1000, 930, 1000, 925, 1012, 725, 1012), DEEP_SHADE, { strength: 0.3, spread: 0.05, pool: 0 });
      for (let i = 0; i < 170; i++) {
        // Stray blocks of stone, some warmer and some greyer than their neighbours.
        dab(between(806, 1080), between(260, 990), between(5, 11), between(3, 5),
          pick(['#c08f48', '#b58a55', '#d9b06a', '#a88a70']), between(0.1, 0.22));
      }

      // Outlines: heavy on the shaded side, thin and broken where the sun bleaches them.
      ink(onTower(pts(800, 236, 800, 1000)), { width: 2.3, dry: 0.03 });
      ink(onTower(pts(1085, 236, 1085, 1000)), { width: 1, color: SOFT_INK, dry: 0.3 });
      ink(onTower(pts(828, 244, 828, 1000)), { width: 0.9, color: SOFT_INK, dry: 0.25 });
      ink(onTower(pts(1058, 244, 1058, 1000)), { width: 0.9, color: SOFT_INK, dry: 0.3 });
      ink(onTower(pts(926, 127, 926, 1000)), { width: 1.8, dry: 0.05 });
      ink(onTower(pts(998, 127, 998, 1000)), { width: 1.1, dry: 0.15 });
      ink(onTower(pts(947, 127, 947, 1000)), { width: 0.8, color: SOFT_INK, dry: 0.3 });
      ink(onTower(pts(976, 127, 976, 1000)), { width: 0.7, color: SOFT_INK, dry: 0.45 });
      ink(onTower(pts(992, 152, 992, 1000)), { width: 1.3, color: SUNLIT, wobble: 0.4, dry: 0.5 });
      ink(onTower(pts(1080, 240, 1080, 1000)), { width: 1.2, color: SUNLIT, wobble: 0.4, dry: 0.55 });
      battlement(828, 926, 244, 9, 8, onTower);
      battlement(998, 1058, 244, 7, 8, onTower);
      battlement(926, 998, 127, 8, 7, onTower);
      ink(onTower(pts(800, 236, 828, 236, 828, 246)), { width: 1.4 });
      ink(onTower(pts(1058, 246, 1058, 236, 1085, 236)), { width: 1.2 });
      ink(onTower(pts(928, 127, 928, 127)).concat([[928, 24]]), { width: 1.1, wobble: 0.4 });
      [[926, 998, 150, 1], [926, 998, 244, 0.8], [800, 926, 262, 1.5], [998, 1085, 262, 1.1], [800, 926, 318, 0.9],
        [998, 1085, 318, 0.8], [800, 926, 434, 1.4], [998, 1085, 434, 1], [800, 926, 456, 0.8], [998, 1085, 456, 0.7],
        [998, 1085, 704, 0.8]]
        .forEach(([x1, x2, y, width]) => ink(across(x1, x2, y), { width, color: width > 1 ? INK : SOFT_INK, dry: 0.12 }));
      [262, 434].forEach((y) => ink(across(998, 1085, y - 2.5), { width: 1.8, color: SUNLIT, wobble: 0.3, dry: 0.1 }));

      // A stone balcony on the shaded face: a pale top, a dark underside, brackets.
      ink(across(832, 926, 698), { width: 4, color: '#dcbd82', wobble: 0.3 });
      ink(across(832, 926, 695), { width: 1.2, dry: 0.05 });
      ink(across(832, 926, 702), { width: 1.6 });
      [846, 874, 902].forEach((x) => ink(onTower(pts(x, 703, x, 714, x + 5, 703)), { width: 1.6, wobble: 0.3 }));

      // Belfry openings, slits and the paired windows of each stage. Those on the
      // right-hand face are narrower, since that wall is seen at an angle.
      const inShade = { bend: onTower, lit: '#dcbb7c' }, inSun = { bend: onTower, lit: SUNLIT };
      [[859, 278, 314], [883, 278, 314], [860, 634, 668], [884, 634, 668], [860, 762, 815], [884, 762, 815],
        [860, 882, 945], [884, 882, 945]].forEach(([x, top, bottom]) => pane(x, top, x + 14, bottom, inShade));
      [[1012, 280, 314], [1033, 280, 314], [1014, 640, 670], [1033, 640, 670], [1014, 882, 940], [1033, 882, 940]]
        .forEach(([x, top, bottom]) => pane(x, top, x + 10, bottom, inSun));
      pane(875, 506, 881, 548, inShade);
      pane(1026, 506, 1031, 548, inSun);
      [[300, 328], [522, 552], [642, 670], [772, 802]].forEach(([top, bottom]) => pane(958, top, 964, bottom, inSun));
    }

    // The clock faces, each set back in a square recess: one facing us, one seen
    // at an angle round the corner. Only the faces are painted; the hands are
    // drawn live on top of the painting (see clock.js).
    function clockFaces() {
      CLOCKS.forEach(([cx, cy, rx, ry]) => {
        const recess = (grow) => onTower(box(cx - rx - grow, cy - ry - grow, cx + rx + grow, cy + ry + grow));
        const closed = (points) => [...points, points[0]];
        const around = (reach, sides) => onTower(oval(cx, cy, rx * reach, ry * reach, sides));
        wash(recess(8), DEEP_SHADE, { strength: 0.16, spread: 0.02, pool: 0 });
        wash(onTower(box(cx - rx - 8, cy - ry - 8, cx + rx + 8, cy - ry - 1)), DEEP_SHADE, { strength: 0.32, spread: 0.03, pool: 0 });
        ink(closed(recess(9)), { width: 1.2, dry: 0.1 });
        ink(closed(recess(6)), { width: 0.7, color: SOFT_INK, dry: 0.2 });
        wash(onTower(oval(cx - 3, cy + 3.5, rx + 1.5, ry + 1.5, 30)), DEEP_SHADE, { strength: 0.5, spread: 0.02, layers: 6, pool: 0 });
        ctx.fillStyle = '#fbf8ef';
        trace(around(1, 40));
        ctx.fill();
        ink(closed(around(1, 40)), { width: 2.2, wobble: 0.4 });
        ink(closed(around(0.8, 30)), { width: 0.6, color: SOFT_INK, wobble: 0.3, dry: 0.2 });
        const mark = (angle, from, to) => onTower([[cx + Math.cos(angle) * rx * from, cy + Math.sin(angle) * ry * from],
          [cx + Math.cos(angle) * rx * to, cy + Math.sin(angle) * ry * to]]);
        for (let hour = 0; hour < 12; hour++) ink(mark(hour / 12 * 2 * Math.PI, 0.82, 0.96), { width: 1.2, wobble: 0.2 });
        // Two strokes that leave no mark, where hands were once painted. They use
        // up the same stretch of the brush's run of chance, so every leaf painted
        // after this stays exactly where it was. Remove them and the trees change.
        ink(mark(-2.43, 0, 0.55), { dry: 1 });
        ink(mark(-0.75, 0, 0.76), { dry: 1 });
      });
    }

    // The big tree on the left: pale greens first, then deeper ones where the
    // canopy turns from the sun, then a little ink for twigs and leaf edges.
    function oak() {
      const OAK = [[130, 300, 230, 220], [330, 420, 190, 190], [90, 560, 200, 230], [300, 640, 220, 200],
        [420, 770, 100, 150], [200, 830, 240, 120]];
      const shade = (x, y) => (y - 120) / 820 - Math.abs(x - 230) / 1500 + gauss() * 0.15;
      OAK.forEach(([x, y, rx, ry]) => wash(oval(x, y, rx * 0.9, ry * 0.9), '#bcc968', { strength: 0.5, spread: 0.2, layers: 10, pool: 0.15 }));
      foliage(OAK, 700, [18, 44], 0.2, (x, y) => (shade(x, y) > 0.08 ? pick(['#8aa646', '#7d9b3f', '#93a84a']) : null));
      foliage(OAK, 560, [14, 36], 0.22, (x, y) => (shade(x, y) > 0.34 ? pick(['#4f7436', '#456a34', '#5a7a35']) : null));
      foliage(OAK, 380, [12, 28], 0.24, (x, y) => (shade(x, y) > 0.58 ? pick(['#2b4a2c', '#2a452c', '#33502b']) : null));
      foliage(OAK, 200, [3, 7], 0.45, () => pick(['#3d5d2f', '#56732f', '#2e4628']));
      scallops(OAK, '#3f5230');
      // Deep shade where the canopy closes over the end of the building.
      wash(oval(400, 835, 115, 150), '#2f4a2f', { strength: 0.5, spread: 0.2, pool: 0 });
      wash(oval(330, 900, 150, 80), '#2a422c', { strength: 0.4, spread: 0.2, pool: 0 });
      ink(pts(150, 1000, 160, 880, 150, 800, 110, 700), { width: 9, color: BARK, wobble: 1.5 });
      ink(pts(158, 870, 215, 780, 250, 680), { width: 5, color: BARK, wobble: 1.5 });
      ink(pts(150, 800, 190, 700, 180, 600), { width: 3.5, color: BARK, wobble: 1.5, dry: 0.1 });
      ink(pts(215, 780, 300, 730, 360, 640), { width: 2.5, color: BARK, wobble: 1.5, dry: 0.15 });
    }

    // The lighter trees on the right, turning yellow, with sky showing through.
    function elms() {
      const ELMS = [[1330, 470, 230, 330], [1500, 380, 160, 300], [1180, 640, 100, 190], [1560, 640, 100, 250]];
      ELMS.forEach(([x, y, rx, ry]) => wash(oval(x, y, rx * 0.8, ry * 0.8), '#d9cf7a', { strength: 0.26, spread: 0.24, layers: 8, pool: 0 }));
      [[1338, 1000, 1342, 800, 1325, 640, 1260, 520], [1342, 800, 1400, 640, 1440, 500], [1325, 640, 1340, 500, 1320, 380],
        [1400, 640, 1470, 590], [1300, 600, 1230, 600, 1180, 560], [1535, 985, 1528, 780, 1500, 600, 1470, 430],
        [1528, 780, 1570, 640, 1590, 480], [1500, 600, 1545, 500]]
        .forEach((branch, i) => ink(pts(...branch), { width: [6, 3, 2.5, 1.6, 1.6, 5, 2.5, 1.6][i], color: BARK, wobble: 1.6, dry: 0.06 }));
      foliage(ELMS, 620, [10, 26], 0.26, () => (rand() < 0.8 ? pick(['#d8c24a', '#c9b540', '#b9b04a', '#a5a544']) : null));
      foliage(ELMS, 300, [8, 22], 0.26, (x, y) => (y > 380 || rand() < 0.3 ? pick(['#8a9a40', '#6f8a3c', '#7d8f38']) : null));
      foliage(ELMS, 120, [6, 14], 0.3, (x, y) => (y > 560 ? pick(['#4b5e30', '#55682f']) : null));
      foliage(ELMS, 160, [2, 5], 0.5, () => pick(['#7d7a2c', '#5e6a2c', '#a08f2e']));
    }

    // Path, lawn, the deep shade under the oak, and the clipped hedges.
    function ground() {
      wash(pts(500, 984, 1010, 974, 1120, 1067, 540, 1067), '#d9c4b6', { strength: 0.5, spread: 0.03 });
      for (let y = 992; y < 1067; y += 13) {
        ink(pts(540, y + between(-2, 2), 1090, y + between(-3, 3)), { width: 0.6, color: '#b9a393', dry: 0.55 });
      }
      wash(pts(0, 990, 520, 984, 560, 1067, 0, 1067), '#b3cc58', { strength: 0.7, spread: 0.03 });
      wash(pts(0, 986, 520, 982, 470, 1022, 0, 1034), '#5d8a3a', { strength: 0.5, spread: 0.08 });
      wash(pts(0, 925, 470, 938, 505, 990, 0, 1000), '#3a5a33', { strength: 0.6, spread: 0.07 });
      wash(pts(1000, 1067, 1010, 990, 1600, 975, 1600, 1067), '#cdbfa8', { strength: 0.35, spread: 0.03, pool: 0 });
      const HEDGES = [
        pts(962, 1006, 985, 962, 1060, 944, 1200, 938, 1330, 948, 1425, 986, 1385, 1022, 1000, 1026),
        pts(1230, 992, 1420, 958, 1600, 936, 1600, 990, 1320, 1004),
        pts(1085, 1067, 1108, 1014, 1290, 994, 1600, 968, 1600, 1067),
      ];
      HEDGES.forEach((hedge) => wash(hedge, '#56794c', { strength: 0.8, spread: 0.035 }));
      wash(pts(962, 1008, 1425, 990, 1385, 1024, 1000, 1028), '#2f4a34', { strength: 0.5, spread: 0.08, pool: 0 });
      wash(pts(1090, 1067, 1105, 1030, 1600, 1010, 1600, 1067), '#2f4a34', { strength: 0.5, spread: 0.06, pool: 0 });
      foliage([[1190, 985, 200, 30], [1400, 1028, 220, 34], [1450, 968, 150, 20]], 150, [5, 13], 0.22,
        () => pick(['#2f4a30', '#3a5a36', '#27402c']));
      HEDGES.forEach((hedge) => ink(hedge.slice(1, -2), { width: 1.1, color: '#2f3f2c', wobble: 1.6, dry: 0.3 }));
    }

    // Tables and benches, set down in a few strokes of brown.
    function benches() {
      const WOOD = '#8a5a34';
      [[215, 972, 430, 986, 5], [360, 992, 700, 1004, 5], [585, 1013, 770, 1022, 5], [465, 1056, 690, 1040, 6],
        [690, 1040, 775, 1046, 6], [975, 1001, 1090, 1005, 4], [1312, 1021, 1470, 1023, 4]]
        .forEach(([x1, y1, x2, y2, width]) => {
          ink(pts(x1, y1, x2, y2), { width, color: WOOD, wobble: 0.8, dry: 0.04 });
          ink(pts(x1, y1 + width * 0.7, x2, y2 + width * 0.7), { width: 0.9, wobble: 0.8, dry: 0.3 });
          ink(pts(x1 + 12, y1 + 3, x1 + 10, y1 + 20), { width: 1.6, wobble: 0.5 });
          ink(pts(x2 - 12, y2 + 3, x2 - 10, y2 + 20), { width: 1.6, wobble: 0.5 });
        });
    }

    // One person walking by the tower, and a few sitting at the tables.
    function people() {
      person(945, 1052, 112, '#7a2f45', false);
      [[392, 988, 84, '#e9e4d8'], [428, 990, 80, '#cfc8ba'], [484, 996, 86, '#2f2d2f'], [634, 1008, 90, '#ece8dd'],
        [664, 1002, 88, '#2c2b2e'], [305, 978, 74, '#55504c']].forEach(([x, feet, tall, coat]) => person(x, feet, tall, coat, true));
    }

    // A small lamp by the door.
    function lamp() {
      ink(pts(752, 962, 752, 842), { width: 1.6, wobble: 0.4 });
      dab(752, 832, 9, 9, '#fbf8ef', 1, 'source-over');
      ink([...oval(752, 832, 9, 9, 16), [761, 832]], { width: 1, color: SOFT_INK, wobble: 0.3 });
    }

    // ---- Back to front -----------------------------------------------------
    // The order matters twice over: later paint covers earlier, and each part
    // takes the next stretch of the seeded brush's run of chance. Adding,
    // removing or reordering a part therefore reshuffles everything after it.

    sky();
    farTrees();
    clearBuildings();
    annexe();
    wing();
    tower();
    clockFaces();
    oak();
    elms();
    ground();
    benches();
    people();
    lamp();

    return { clocks: CLOCKS, lean: fall };
  };
})();
