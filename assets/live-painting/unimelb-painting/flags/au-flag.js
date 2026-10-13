/*!
 * <au-flag> — the flag of Australia, waving in the wind.
 *
 *   <script src="au-flag.js" defer></script>
 *   <au-flag speed="1"></au-flag>
 *
 *   speed   wave speed multiplier: 1 = steady breeze, 2 = twice as fast, 0 = frozen.
 *           Set it as an attribute or from script: flag.speed = 1.5
 *
 * Size it with CSS (the height follows the width):  au-flag { width: 480px }
 */
(() => {
  // The travelling waves that make up the ripple, five numbers each: height (as a
  // fraction of the flag's length), ripples along the flag, speed, phase, and the
  // direction of travel in degrees up from the horizontal.
  const WAVES = [
    [0.032, 12.5, 3.6, 0.0, 30],
    [0.012, 19, 5.9, 1.3, 21],
    [0.006, 30, 9.4, 4.0, 40],
  ];
  const MARGIN = 0.03;    // room either side of the flag, as a fraction of the canvas width
  const BOX = 0.6;        // canvas height / width: a 1:2 flag plus room to swing
  const SKIRT = 1.5;      // pixels of mesh beyond the cloth, where its edge fades out
  const GRID = 96;        // mesh columns (and half as many rows)
  const MAX_DPR = 2;

  const SPAN = 1 - 2 * MARGIN;   // flag length / canvas width
  const STILL = matchMedia('(prefers-reduced-motion: reduce)');

  const TEMPLATE = `
    <style>
      :host { display: inline-block; width: 320px; max-width: 100%; }
      canvas, img { display: block; width: 100%; aspect-ratio: 1 / ${BOX}; object-fit: contain; }
    </style>
    <canvas></canvas>`;

  const RIPPLE = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    uniform vec4 waves[${WAVES.length}];   // height, wave vector (x, y), phase

    const float PACE = 0.32;   // how strongly the waves pick up speed as they travel

    // Slope (xy) and height (z) of the cloth at p. Everything is in flag lengths,
    // with y pointing down and z towards the viewer.
    vec3 ripple(vec2 p) {
      // The hoist is pinned, so every wave grows from nothing towards the free end.
      float hold = p.x * (1.7 - 0.7 * p.x), holdSlope = 1.7 - 1.4 * p.x;
      vec3 sum = vec3(0.0);
      for (int i = 0; i < ${WAVES.length}; i++) {
        // Each wave stretches out the further it has travelled, so it runs slowly
        // by the pole and fast at the free end without changing direction.
        vec2 k = waves[i].yz;
        float along = dot(k, p);
        float ease = PACE * along / length(k);
        float angle = along * (1.0 - ease) + waves[i].w;
        float rise = waves[i].x * sin(angle);
        float tilt = waves[i].x * cos(angle) * (1.0 - 2.0 * ease);
        sum += vec3(holdSlope * rise + hold * tilt * k.x, hold * tilt * k.y, hold * rise);
        // The quicker waves start later still, which leaves the flutter to the free end.
        holdSlope = holdSlope * p.x + hold;
        hold *= p.x;
      }
      return sum;
    }`;

  const VERTEX = `${RIPPLE}
    attribute vec2 corner;
    uniform vec4 frame;    // where the hoist's top corner sits (xy) and one flag length (zw)
    uniform vec2 skirt;
    varying vec2 vUv;

    const vec2 LEAN = vec2(-0.35, 0.85);   // seen from above right, near cloth shifts down and left
    const float SAG = 0.02;                // how far the free end droops

    void main() {
      vUv = mix(-skirt, 1.0 + skirt, corner);
      vec2 p = vec2(vUv.x, vUv.y * 0.5);
      p += ripple(p).z * LEAN + vec2(0.0, SAG * p.x * p.x);
      gl_Position = vec4(frame.xy + p * frame.zw, 0.0, 1.0);
    }`;

  const FRAGMENT = `${RIPPLE}
    uniform sampler2D art;
    uniform float pixels;   // flag length in device pixels
    varying vec2 vUv;

    const vec3 LIGHT = vec3(-0.42, -0.56, 0.71);       // from the upper left, in front
    const vec3 HALFWAY = vec3(-0.227, -0.303, 0.925);  // between the light and the viewer
    const float RELIEF = 1.5;                          // exaggerates the folds for lighting

    void main() {
      vec3 normal = normalize(vec3(-ripple(vec2(vUv.x, vUv.y * 0.5)).xy * RELIEF, 1.0));
      vec3 color = texture2D(art, vUv).rgb;

      // Shade the folds, keeping the colours deep on the sides turned from the light.
      color *= 1.0 + 1.05 * (dot(normal, LIGHT) - LIGHT.z);

      // A glassy coat on top: a tight glint where a fold faces the light, and a
      // crisp-edged reflection of the bright sky in whatever tilts upwards.
      float glint = pow(max(dot(normal, HALFWAY), 0.0), 60.0);
      float up = -2.0 * normal.z * normal.y + (0.5 - vUv.y) * 0.3;
      float sky = smoothstep(0.02, 0.1, up);
      color += 0.55 * glint + 0.07 * sky;

      // Fade the last pixel of cloth for a clean edge, with a thin bright rim just inside it.
      vec2 edge = min(vUv, 1.0 - vUv) * vec2(pixels, pixels * 0.5);
      color += 0.2 * (1.0 - smoothstep(0.0, 2.5, min(edge.x, edge.y)));
      float alpha = clamp(edge.x + 0.5, 0.0, 1.0) * clamp(edge.y + 0.5, 0.0, 1.0);
      gl_FragColor = vec4(color, 1.0) * alpha;
    }`;

  class AUFlag extends HTMLElement {
    static get observedAttributes() { return ['speed']; }

    #canvas;
    #gl;
    #uniforms = {};
    #waves = new Float32Array(WAVES.length * 4);
    #art = document.createElement('canvas');   // the flat artwork, rasterised for the GPU
    #ready = false;
    #speed = 1;
    #time = 0;
    #last = 0;
    #frame = 0;
    #visible = false;
    #resizer = new ResizeObserver(() => this.#resize());
    #watcher = new IntersectionObserver(([entry]) => {
      this.#visible = entry.isIntersecting;
      this.#sync();
    });

    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).innerHTML = TEMPLATE;
      this.#canvas = this.shadowRoot.querySelector('canvas');
      this.#gl = this.#canvas.getContext('webgl', { antialias: false });

      const image = new Image();
      image.src = ARTWORK;
      if (!this.#gl) {
        // No WebGL: show the flag flat rather than nothing.
        this.#canvas.replaceWith(image);
        return;
      }
      image.onload = () => {
        this.#art.width = 2048;
        this.#art.height = 1024;
        this.#art.getContext('2d').drawImage(image, 0, 0, 2048, 1024);
        this.#setup();
      };
      this.#canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        this.#ready = false;
        this.#sync();
      });
      this.#canvas.addEventListener('webglcontextrestored', () => this.#setup());
    }

    get speed() { return this.#speed; }
    set speed(value) { this.setAttribute('speed', value); }

    attributeChangedCallback(_, __, value) {
      const speed = parseFloat(value);
      this.#speed = Number.isFinite(speed) ? speed : 1;
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) this.setAttribute('role', 'img');
      if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Flag of Australia');
      this.#resizer.observe(this);
      this.#watcher.observe(this);
      STILL.addEventListener('change', this.#sync);
    }

    disconnectedCallback() {
      this.#resizer.disconnect();
      this.#watcher.disconnect();
      STILL.removeEventListener('change', this.#sync);
      this.#visible = false;
      this.#sync();
    }

    // Build everything the GPU needs: shaders, the mesh and the artwork texture.
    #setup() {
      const gl = this.#gl;
      const program = gl.createProgram();
      for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]]) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('<au-flag> could not build its shaders', gl.getProgramInfoLog(program));
        return;
      }
      gl.useProgram(program);
      for (const name of ['waves', 'frame', 'skirt', 'pixels']) {
        this.#uniforms[name] = gl.getUniformLocation(program, name);
      }

      const columns = GRID, rows = GRID / 2, corners = [], triangles = [];
      for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= columns; x++) corners.push(x / columns, y / rows);
      }
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const i = y * (columns + 1) + x;
          triangles.push(i, i + 1, i + columns + 1, i + 1, i + columns + 2, i + columns + 1);
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(corners), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles), gl.STATIC_DRAW);
      const corner = gl.getAttribLocation(program, 'corner');
      gl.enableVertexAttribArray(corner);
      gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);

      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.#art);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      // The flag sits centred in the canvas; clip space runs -1..1 with y pointing up.
      gl.uniform4f(this.#uniforms.frame, -SPAN, SPAN / (2 * BOX), 2 * SPAN, -2 * SPAN / BOX);

      this.#ready = true;
      this.#resize();
    }

    #resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.round(this.#canvas.clientWidth * dpr);
      if (!this.#ready || !width) return;

      const gl = this.#gl, pixels = width * SPAN;
      this.#canvas.width = width;
      this.#canvas.height = Math.round(width * BOX);
      gl.viewport(0, 0, this.#canvas.width, this.#canvas.height);
      gl.uniform1f(this.#uniforms.pixels, pixels);
      gl.uniform2f(this.#uniforms.skirt, SKIRT / pixels, 2 * SKIRT / pixels);

      this.#draw();
      this.#sync();
    }

    // Run the animation only while the flag is on screen and motion is welcome.
    #sync = () => {
      const animate = this.#visible && this.#ready && !STILL.matches;
      if (animate && !this.#frame) {
        this.#last = performance.now();
        this.#frame = requestAnimationFrame(this.#tick);
      } else if (!animate && this.#frame) {
        cancelAnimationFrame(this.#frame);
        this.#frame = 0;
      }
    };

    #tick = (now) => {
      // Advancing our own clock keeps speed changes seamless, and capping the step
      // stops the flag lurching after the tab has been in the background.
      this.#time += Math.min(now - this.#last, 50) / 1000 * this.#speed;
      this.#last = now;
      this.#draw();
      this.#frame = requestAnimationFrame(this.#tick);
    };

    #draw() {
      const gl = this.#gl, t = this.#time;
      const gust = 0.82 + 0.18 * Math.sin(0.61 * t + 2 * Math.sin(0.17 * t));

      WAVES.forEach(([height, ripples, speed, phase, degrees], i) => {
        const angle = degrees * Math.PI / 180;
        // The phase is wrapped here so the shader never sees a large number.
        this.#waves.set([
          height * gust,
          ripples * Math.cos(angle),
          -ripples * Math.sin(angle),
          (phase - speed * t) % (2 * Math.PI),
        ], i * 4);
      });
      gl.uniform4fv(this.#uniforms.waves, this.#waves);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, GRID * GRID * 3, gl.UNSIGNED_SHORT, 0);
    }
  }

  // The flag artwork (public domain, from Wikimedia Commons), kept inline so the
  // component is a single file and also works from a page opened straight off disk.
  const ARTWORK = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1280" height="640" viewBox="0 0 10080 5040"><defs><clipPath id="c1"><path d="M0,0H6V3H0z"/></clipPath><clipPath id="c2"><path d="M0,0V1.5H6V3H6zM6,0H3V3H0V3z"/></clipPath><path id="Star7" d="M0,-360 69.421398,-144.155019 281.459334,-224.456329 155.988466,-35.603349 350.974048,80.107536 125.093037,99.758368 156.198146,324.348792 0,160 -156.198146,324.348792 -125.093037,99.758368 -350.974048,80.107536 -155.988466,-35.603349 -281.459334,-224.456329 -69.421398,-144.155019z"/><path id="Star5" d="M0,-210 54.859957,-75.508253 199.721868,-64.893569 88.765275,28.841586 123.434903,169.893569 0,93.333333 -123.434903,169.893569 -88.765275,28.841586 -199.721868,-64.893569 -54.859957,-75.508253z"/></defs><g transform="scale(840)"><rect width="12" height="6" fill="#00008b"/><path d="M0,0 6,3M6,0 0,3" stroke="#fff" stroke-width="0.6" clip-path="url(#c1)"/><path d="M0,0 6,3M6,0 0,3" stroke="#f00" stroke-width="0.4" clip-path="url(#c2)"/><path d="M3,0V3M0,1.5H6" stroke="#fff"/><path d="M3,0V3M0,1.5H6" stroke="#f00" stroke-width="0.6"/></g><g fill="#fff"><use id="Comwlth" xlink:href="#Star7" transform="translate(2520, 3780) scale(2.1)"/><use id="αCrucis" xlink:href="#Star7" x="7560" y="4200"/><use id="βCrucis" xlink:href="#Star7" x="6300" y="2205"/><use id="γCrucis" xlink:href="#Star7" x="7560" y="840"/><use id="δCrucis" xlink:href="#Star7" x="8680" y="1869"/><use id="εCrucis" xlink:href="#Star5" x="8064" y="2730"/></g></svg>');

  if (!customElements.get('au-flag')) customElements.define('au-flag', AUFlag);
})();
