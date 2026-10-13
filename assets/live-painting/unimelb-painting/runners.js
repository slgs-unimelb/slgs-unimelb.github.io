/*
 * The flag bearers: two students in mid-stride across the foreground, each
 * holding a flag staff high in both hands. They are painted, so they stand
 * still; only the flags they carry move.
 *
 *   const staffs = UnimelbPainting.paintRunners(brush);
 *
 * Returns one entry per runner, saying which flag element goes on the staff,
 * where it meets the staff, which way the staff points, and how long the flag
 * is and how far it sags.
 *
 * To change who is running, what they wear or which flag they carry, edit
 * RUNNERS. Positions are in painting units on a 1600 x 1067 sheet.
 */
(() => {
  // `flag` is the tag of a waving-flag element (see flags/). `flagLength` is in
  // painting units and `flagDroop` is how far the cloth sags, in radians.
  // `x` and `ground` place the point on the ground under the hips, and `tall`
  // is the runner's standing height. `pose` gives each joint as [forward, up]
  // in body heights from that point; they run to the left, so forward is left.
  const RUNNERS = [
    {
      flag: 'au-flag', flagLength: 320, flagDroop: 0.16,
      x: 312, ground: 1052, tall: 430,
      skin: '#cf9d76', hair: '#241d1b', shirt: '#cfdbe6', shorts: '#34405e', shoes: '#ece7dc',
      pose: {
        hip: [0, 0.5], shoulder: [0.09, 0.8], head: [0.135, 0.925], grip: [0.26, 0.84], reach: [0.3, 1.04],
        elbowNear: [0.23, 0.71], elbowFar: [0.22, 0.94], kneeFront: [0.24, 0.42], ankleFront: [0.17, 0.18],
        toeFront: [0.27, 0.13], kneeBack: [-0.13, 0.27], ankleBack: [-0.3, 0.06], toeBack: [-0.24, 0.005],
      },
    },
    {
      flag: 'sl-flag', flagLength: 290, flagDroop: 0.23,
      x: 625, ground: 1032, tall: 395,
      skin: '#c69068', hair: '#1f1917', longHair: true, shirt: '#ee6f8e', shorts: '#3f4c96', skirt: '#3f4c96',
      shoes: '#f0ece2', waist: 0.12, chest: 0.148,
      pose: {
        hip: [0, 0.51], shoulder: [0.07, 0.81], head: [0.11, 0.935], grip: [0.235, 0.8], reach: [0.25, 1.02],
        elbowNear: [0.21, 0.68], elbowFar: [0.18, 0.93], kneeFront: [0.23, 0.4], ankleFront: [0.24, 0.15],
        toeFront: [0.34, 0.12], kneeBack: [-0.14, 0.31], ankleBack: [-0.34, 0.37], toeBack: [-0.42, 0.29],
      },
    },
  ];

  window.UnimelbPainting.paintRunners = (brush) => {
    const { INK, SOFT_INK, pts, oval, soften, wash, reserve, solid, ink, dab } = brush;

    // A limb from a to b: a tapering strip, a little fuller in the middle, with
    // an ink line down each side.
    function limb(a, b, wide, narrow, color) {
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const ux = (b[0] - a[0]) / length, uy = (b[1] - a[1]) / length;
      const side = (sign) => [0, 0.5, 1].map((along) => {
        const half = (wide + (narrow - wide) * along) / 2 * (along === 0.5 ? 1.1 : 1) * sign;
        return [a[0] + ux * length * along - uy * half, a[1] + uy * length * along + ux * half];
      });
      solid([[a[0] - ux * wide * 0.3, a[1] - uy * wide * 0.3], ...side(1),
        [b[0] + ux * narrow * 0.3, b[1] + uy * narrow * 0.3], ...side(-1).reverse()], color);
      [side(1), side(-1)].forEach((edge) => ink(edge, { width: 1.3, wobble: 0.5, dry: 0.1 }));
    }

    // Paints one runner, and returns where the flag meets the staff and the
    // direction the staff points.
    function runner({ x, ground, tall, pose, skin, hair, longHair, shirt, shorts, skirt, shoes, waist = 0.15, chest = 0.165, flagLength }) {
      const size = (fraction) => fraction * tall;
      const at = ([forward, up]) => [x - forward * tall, ground - up * tall];
      const part = (from, to, along) => [from[0] + (to[0] - from[0]) * along, from[1] + (to[1] - from[1]) * along];
      const j = Object.fromEntries(Object.entries(pose).map(([name, point]) => [name, at(point)]));
      const leg = (knee, ankle, toe) => {
        limb(j.hip, knee, size(0.085), size(0.06), skin);
        limb(knee, ankle, size(0.056), size(0.034), skin);
        limb(part(j.hip, knee, -0.1), part(j.hip, knee, 0.62), size(0.11), size(0.095), shorts);
        limb(part(ankle, toe, -0.25), toe, size(0.05), size(0.036), shoes);
        ink([part(ankle, toe, -0.3), [toe[0] - size(0.012), toe[1] + size(0.02)]].map(([px, py]) => [px, py + size(0.022)]),
          { width: 2, wobble: 0.4 });
      };
      const arm = (elbow, hand) => {
        limb(j.shoulder, elbow, size(0.05), size(0.04), skin);
        limb(elbow, hand, size(0.04), size(0.03), skin);
        limb(part(j.shoulder, elbow, -0.15), part(j.shoulder, elbow, 0.5), size(0.066), size(0.058), shirt);
      };

      // A shadow on the grass, then the far leg and far arm.
      wash(oval(x, ground + size(0.012), size(0.3), size(0.026)), '#4d4a5c', { strength: 0.45, spread: 0.1, pool: 0 });
      leg(j.kneeBack, j.ankleBack, j.toeBack);
      arm(j.elbowFar, j.reach);

      // The staff, running up through both hands to a gilt knob. The flag's
      // hoist is half its length, and hangs from just below the knob.
      const span = Math.hypot(j.reach[0] - j.grip[0], j.reach[1] - j.grip[1]);
      const up = [(j.reach[0] - j.grip[0]) / span, (j.reach[1] - j.grip[1]) / span];
      const along = (from, distance) => [from[0] + up[0] * distance, from[1] + up[1] * distance];
      const foot = along(j.grip, -size(0.1)), meet = along(j.reach, size(0.08) + flagLength / 2), tip = along(meet, 10);
      const shaft = [[foot[0] - 3, foot[1]], [tip[0] - 2.2, tip[1]], [tip[0] + 2.2, tip[1]], [foot[0] + 3, foot[1]]];
      reserve(shaft, 0.0006);
      wash(shaft, '#b9a888', { strength: 0.8, spread: 0.002, layers: 6, pool: 0 });
      ink([shaft[0], shaft[1]], { width: 1.5, wobble: 0.3, dry: 0.03 });
      ink([shaft[3], shaft[2]], { width: 1, color: SOFT_INK, wobble: 0.3, dry: 0.1 });
      dab(tip[0] + up[0] * 5, tip[1] + up[1] * 5, 5, 5, '#c9a13f', 1, 'source-over');
      ink([...oval(tip[0] + up[0] * 5, tip[1] + up[1] * 5, 5, 5, 12), [tip[0] + up[0] * 5 + 5, tip[1] + up[1] * 5]], { width: 1, wobble: 0.3 });

      // Body, neck and head.
      limb(j.hip, j.shoulder, size(waist), size(chest), shirt);
      limb(part(j.shoulder, j.head, 0.1), part(j.shoulder, j.head, 0.75), size(0.05), size(0.046), skin);
      const [hx, hy] = j.head, rx = size(0.057), ry = size(0.07);
      // Angles on the head run from the face (0) over the crown (90) to the back (180).
      const onHead = (degrees, reach) => [hx - Math.cos(degrees * Math.PI / 180) * rx * reach, hy - Math.sin(degrees * Math.PI / 180) * ry * reach];
      if (longHair) {
        // Long hair, tied back and streaming out behind in two locks.
        const tie = onHead(165, 0.95), swing = [tie[0] + size(0.15), tie[1] - size(0.035)];
        limb(tie, swing, size(0.062), size(0.05), hair);
        limb(swing, [swing[0] + size(0.15), swing[1] + size(0.03)], size(0.05), size(0.012), hair);
        limb(onHead(190, 0.9), [tie[0] + size(0.2), tie[1] + size(0.065)], size(0.045), size(0.01), hair);
      }
      solid(oval(hx, hy, rx, ry, 14), skin);
      ink([...oval(hx, hy, rx, ry, 18), [hx + rx, hy]], { width: 1.2, wobble: 0.4, dry: 0.12 });
      dab(hx - rx * 1.02, hy + ry * 0.12, rx * 0.17, ry * 0.13, skin, 1, 'source-over');
      dab(...onHead(18, 0.55), rx * 0.09, ry * 0.07, INK, 0.9, 'source-over');
      solid([40, 60, 80, 100, 120, 140, 160, 180, 200, 215].map((degrees) => onHead(degrees, 1.13))
        .concat([onHead(205, 0.55), onHead(150, 0.35), onHead(95, 0.5), onHead(55, 0.72)]), hair);

      // The near leg and near arm, then both hands closed round the staff.
      leg(j.kneeFront, j.ankleFront, j.toeFront);
      if (skirt) {
        // A short skirt, lying over the raised thigh and flaring out behind.
        const front = part(j.hip, j.kneeFront, 0.6), back = part(j.hip, j.kneeBack, 0.55), belt = part(j.hip, j.shoulder, 0.14);
        const cloth = [[belt[0] - size(waist * 0.55), belt[1]], [front[0] - size(0.02), front[1] - size(0.068)],
          [front[0] + size(0.015), front[1] + size(0.062)], [j.hip[0] + size(0.03), j.hip[1] + size(0.175)],
          [back[0] + size(0.02), back[1] + size(0.075)], [back[0] + size(0.1), back[1] - size(0.02)],
          [belt[0] + size(waist * 0.55), belt[1]]];
        solid(cloth, skirt);
        ink([...soften(cloth, 1).slice(2)], { width: 1.3, wobble: 0.6, dry: 0.1 });
        [0.3, 0.55, 0.8].forEach((share) => {
          // Pleats, fanning from the waist to the hem.
          const hem = part(cloth[2], cloth[4], share);
          ink([part(belt, hem, 0.25), [hem[0], hem[1] + size(0.01)]], { width: 0.8, color: SOFT_INK, wobble: 0.5, dry: 0.3 });
        });
      } else {
        limb(part(j.hip, j.shoulder, -0.12), part(j.hip, j.shoulder, 0.16), size(0.16), size(0.15), shorts);
      }
      arm(j.elbowNear, j.grip);
      [j.grip, j.reach].forEach(([px, py]) => {
        dab(px, py, size(0.026), size(0.03), skin, 1, 'source-over');
        ink([...oval(px, py, size(0.024), size(0.028), 10), [px + size(0.024), py]], { width: 1, wobble: 0.4, dry: 0.15 });
      });

      // A few dry strokes trailing from the back foot, for speed.
      [0, 1, 2].forEach((n) => {
        const y = j.ankleBack[1] + size(0.05 + n * 0.035), start = j.toeBack[0] + size(0.06 + n * 0.03);
        ink(pts(start, y, start + size(0.2 - n * 0.04), y + 2), { width: 1.1, color: SOFT_INK, wobble: 0.8, dry: 0.5 });
      });

      return { meet, up };
    }

    return RUNNERS.map((who) => ({ flag: who.flag, length: who.flagLength, droop: who.flagDroop, ...runner(who) }));
  };
})();
