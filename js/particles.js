/* Constellation particle field — WebGL2 GPGPU spring simulation.
   Positions and velocities live in float textures and ping-pong each frame:
   velocity += (target - position) * spring + mouse repulsion, velocity *= friction. */
(function () {
  const canvas = document.getElementById('constellation');
  if (!canvas) return;

  const PALETTE = [
    [0.502, 0.322, 1.0],   // electric iris
    [0.502, 0.322, 1.0],
    [1.0, 0.722, 0.161],   // saffron spark
    [0.082, 0.518, 0.431], // deep verdant
    [0.416, 0.353, 0.804], // slate blue
    [0.290, 0.498, 0.839], // blue
    [0.690, 0.522, 1.0],   // light violet
    [0.741, 0.741, 0.741], // silver mist
  ];

  const SPRING = 0.006;
  const FRICTION = 0.892;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: false });

  if (!gl || !gl.getExtension('EXT_color_buffer_float')) {
    fallback2d();
    return;
  }

  // Texture side length — total particles = SIDE * SIDE.
  const SIDE = window.innerWidth < 760 ? 56 : 96;
  const COUNT = SIDE * SIDE;

  const simVert = `#version 300 es
  in vec2 a_pos;
  out vec2 v_uv;
  void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }`;

  const velFrag = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 outColor;
  uniform sampler2D t_position;
  uniform sampler2D t_velocity;
  uniform sampler2D t_target;
  uniform float u_spring;
  uniform float u_friction;
  uniform float u_progress;
  uniform vec3 u_pointer;
  uniform float u_pointerStrength;
  uniform float u_time;

  void main() {
    vec4 pos = texture(t_position, v_uv);
    vec3 vel = texture(t_velocity, v_uv).xyz;
    vec4 tgt = texture(t_target, v_uv);

    // Per-particle spring variation keeps the cloud from snapping in unison.
    float spring = u_spring * (0.6 + tgt.w) * u_progress;
    vel += (tgt.xyz - pos.xyz) * spring;

    // Pointer pushes nearby particles outward, then the spring reels them back.
    vec3 away = pos.xyz - u_pointer;
    float d2 = dot(away, away);
    vel += normalize(away + 1e-5) * u_pointerStrength * exp(-d2 * 9.0) * 0.0016;

    // Slow ambient wander so the cloud never reads as frozen.
    float n = sin(u_time * 0.6 + pos.x * 3.1 + pos.y * 2.3);
    float m = cos(u_time * 0.5 + pos.y * 2.7 + pos.z * 3.3);
    vel += vec3(n, m, n * m) * 0.000045;

    vel *= u_friction;
    outColor = vec4(vel, 1.0);
  }`;

  const posFrag = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 outColor;
  uniform sampler2D t_position;
  uniform sampler2D t_velocity;
  void main() {
    vec4 pos = texture(t_position, v_uv);
    vec3 vel = texture(t_velocity, v_uv).xyz;
    outColor = vec4(pos.xyz + vel, pos.w);
  }`;

  const drawVert = `#version 300 es
  precision highp float;
  in vec2 a_corner;
  in vec3 a_bary;
  in vec2 a_lookup;
  in vec3 a_color;
  in vec2 a_meta;        // x: size, y: alpha
  out vec3 v_bary;
  out vec3 v_color;
  out float v_alpha;
  uniform sampler2D t_position;
  uniform float u_rotation;
  uniform float u_camDist;
  uniform float u_focal;
  uniform vec2 u_screen;
  uniform vec2 u_center;
  uniform float u_reveal;

  void main() {
    vec3 p = texture(t_position, a_lookup).xyz;

    float s = sin(u_rotation), c = cos(u_rotation);
    vec3 r = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);

    float z = r.z + u_camDist;
    vec2 projected = r.xy / z * u_focal + u_center;

    // Perspective-scaled quad corner, expanded in pixel space.
    float size = a_meta.x * (u_camDist / z);
    vec2 offset = a_corner * size / u_screen * 2.0;

    gl_Position = vec4(projected + offset, 0.0, 1.0);
    v_bary = a_bary;
    v_color = a_color;
    v_alpha = a_meta.y * u_reveal * clamp(u_camDist / z - 0.35, 0.0, 1.4);
  }`;

  const drawFrag = `#version 300 es
  precision highp float;
  in vec3 v_bary;
  in vec3 v_color;
  in float v_alpha;
  out vec4 outColor;
  void main() {
    // Outlined triangle: keep only fragments close to an edge.
    vec3 d = fwidth(v_bary);
    vec3 edge = smoothstep(vec3(0.0), d * 1.6, v_bary);
    float line = 1.0 - min(min(edge.x, edge.y), edge.z);
    if (line < 0.02) discard;
    outColor = vec4(v_color * v_alpha * line, v_alpha * line);
  }`;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  function program(vsSrc, fsSrc) {
    const vs = compile(gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return null;
    }
    return prog;
  }

  const velProg = program(simVert, velFrag);
  const posProg = program(simVert, posFrag);
  const drawProg = program(drawVert, drawFrag);
  if (!velProg || !posProg || !drawProg) {
    fallback2d();
    return;
  }

  // ---- Target cloud: two lobes with folded surface, plus an ambient outer haze ----
  const targetData = new Float32Array(COUNT * 4);
  const startData = new Float32Array(COUNT * 4);
  const colorData = new Float32Array(COUNT * 3);
  const metaData = new Float32Array(COUNT * 2);
  const lookupData = new Float32Array(COUNT * 2);

  for (let i = 0; i < COUNT; i++) {
    const ambient = i % 8 === 0;
    let x, y, z;

    if (ambient) {
      // Sparse haze drifting across the viewport behind the main cloud.
      x = (Math.random() - 0.5) * 6.0;
      y = (Math.random() - 0.5) * 4.4;
      z = (Math.random() - 0.5) * 2.0;
    } else {
      const lobe = Math.random() < 0.5 ? -1 : 1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      // Weighted toward the outside but still filling the volume, so the mass
      // has depth instead of collapsing onto a hard-edged shell.
      const shell = 0.45 + Math.pow(Math.random(), 0.45) * 0.55;
      let nx = Math.sin(phi) * Math.cos(theta);
      let ny = Math.cos(phi);
      let nz = Math.sin(phi) * Math.sin(theta);
      // Folds: ridged displacement so the silhouette reads organic, not spherical.
      const fold =
        0.16 * Math.sin(nx * 4.5 + nz * 3.0) +
        0.12 * Math.sin(ny * 6.0 + nx * 2.2) +
        0.08 * Math.sin(nz * 7.5 + ny * 4.0);
      const r = shell + fold;
      x = nx * r * 0.82 + lobe * 0.2;
      y = ny * r * 0.8;
      z = nz * r * 0.78;
    }

    targetData[i * 4] = x;
    targetData[i * 4 + 1] = y;
    targetData[i * 4 + 2] = z;
    targetData[i * 4 + 3] = Math.random() * 0.8;

    // Intro: particles start scattered and spring inward.
    const spread = 1.6 + Math.random() * 1.6;
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(2 * Math.random() - 1);
    startData[i * 4] = Math.sin(b) * Math.cos(a) * spread;
    startData[i * 4 + 1] = Math.cos(b) * spread;
    startData[i * 4 + 2] = Math.sin(b) * Math.sin(a) * spread;
    startData[i * 4 + 3] = 1;

    const col = PALETTE[(Math.random() * PALETTE.length) | 0];
    colorData[i * 3] = col[0];
    colorData[i * 3 + 1] = col[1];
    colorData[i * 3 + 2] = col[2];

    metaData[i * 2] = ambient ? 2.2 + Math.random() * 1.6 : 4.0 + Math.random() * 4.5;
    metaData[i * 2 + 1] = ambient ? 0.10 + Math.random() * 0.12 : 0.45 + Math.random() * 0.55;

    lookupData[i * 2] = ((i % SIDE) + 0.5) / SIDE;
    lookupData[i * 2 + 1] = ((i / SIDE | 0) + 0.5) / SIDE;
  }

  function dataTexture(data) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, SIDE, SIDE, 0, gl.RGBA, gl.FLOAT, data || null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  const targetTex = dataTexture(targetData);
  let posTex = [dataTexture(startData), dataTexture(startData)];
  let velTex = [dataTexture(new Float32Array(COUNT * 4)), dataTexture(new Float32Array(COUNT * 4))];
  let ping = 0;

  const fbo = gl.createFramebuffer();

  function renderTo(tex) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, SIDE, SIDE);
  }

  // Fullscreen quad for the simulation passes.
  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  const quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  [velProg, posProg].forEach((p) => gl.bindAttribLocation(p, 0, 'a_pos'));

  // Instanced triangle geometry for the draw pass.
  const drawVao = gl.createVertexArray();
  gl.bindVertexArray(drawVao);

  function attrib(prog, name, data, size, divisor) {
    const loc = gl.getAttribLocation(prog, name);
    if (loc < 0) return;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    if (divisor) gl.vertexAttribDivisor(loc, divisor);
  }

  const corners = new Float32Array([0, 1, 0.87, -0.5, -0.87, -0.5]);
  const barys = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  attrib(drawProg, 'a_corner', corners, 2, 0);
  attrib(drawProg, 'a_bary', barys, 3, 0);
  attrib(drawProg, 'a_lookup', lookupData, 2, 1);
  attrib(drawProg, 'a_color', colorData, 3, 1);
  attrib(drawProg, 'a_meta', metaData, 2, 1);

  const uni = (prog, name) => gl.getUniformLocation(prog, name);
  const U = {
    velPos: uni(velProg, 't_position'),
    velVel: uni(velProg, 't_velocity'),
    velTgt: uni(velProg, 't_target'),
    velSpring: uni(velProg, 'u_spring'),
    velFriction: uni(velProg, 'u_friction'),
    velProgress: uni(velProg, 'u_progress'),
    velPointer: uni(velProg, 'u_pointer'),
    velPointerStrength: uni(velProg, 'u_pointerStrength'),
    velTime: uni(velProg, 'u_time'),
    posPos: uni(posProg, 't_position'),
    posVel: uni(posProg, 't_velocity'),
    drawPos: uni(drawProg, 't_position'),
    drawRotation: uni(drawProg, 'u_rotation'),
    drawCam: uni(drawProg, 'u_camDist'),
    drawFocal: uni(drawProg, 'u_focal'),
    drawScreen: uni(drawProg, 'u_screen'),
    drawCenter: uni(drawProg, 'u_center'),
    drawReveal: uni(drawProg, 'u_reveal'),
  };

  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize() {
    // Additive blending over many overlapping triangles is fill-rate bound,
    // so the canvas stays below full device resolution.
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0, strength: 0 };
  window.addEventListener('pointermove', (e) => {
    // Normalised to the same space the cloud lives in.
    pointer.tx = ((e.clientX / window.innerWidth) * 2 - 1) * 1.6;
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1) * 1.1;
    pointer.strength = 1;
  });
  window.addEventListener('pointerleave', () => { pointer.strength = 0; });

  let scrollY = window.scrollY;
  let scrollTarget = scrollY;
  window.addEventListener('scroll', () => { scrollTarget = window.scrollY; }, { passive: true });

  let visible = true;
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible) last = performance.now();
  });

  function simulate(time, progress) {
    gl.disable(gl.BLEND);
    gl.bindVertexArray(quadVao);

    // Velocity pass.
    gl.useProgram(velProg);
    renderTo(velTex[1 - ping]);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, posTex[ping]); gl.uniform1i(U.velPos, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, velTex[ping]); gl.uniform1i(U.velVel, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, targetTex); gl.uniform1i(U.velTgt, 2);
    gl.uniform1f(U.velSpring, SPRING);
    gl.uniform1f(U.velFriction, FRICTION);
    gl.uniform1f(U.velProgress, progress);
    gl.uniform3f(U.velPointer, pointer.x, pointer.y, 0.0);
    gl.uniform1f(U.velPointerStrength, pointer.strength);
    gl.uniform1f(U.velTime, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Position pass.
    gl.useProgram(posProg);
    renderTo(posTex[1 - ping]);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, posTex[ping]); gl.uniform1i(U.posPos, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, velTex[1 - ping]); gl.uniform1i(U.posVel, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    ping = 1 - ping;
  }

  function draw(rotation, reveal) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.useProgram(drawProg);
    gl.bindVertexArray(drawVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, posTex[ping]);
    gl.uniform1i(U.drawPos, 0);

    const aspect = width / height;
    const wide = width >= 980;
    gl.uniform1f(U.drawRotation, rotation);
    gl.uniform1f(U.drawCam, 3.0);
    gl.uniform1f(U.drawFocal, 1.8 / Math.max(aspect, 0.8));
    gl.uniform2f(U.drawScreen, width, height);
    // On wide screens the cloud sits in the right half, beside the headline.
    gl.uniform2f(U.drawCenter, wide ? 0.4 : 0.0, wide ? 0.04 : 0.1);
    gl.uniform1f(U.drawReveal, reveal);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, drawCount);
  }

  // Weak GPUs get fewer particles rather than a stuttering page.
  let drawCount = COUNT;
  let quality = 0;
  let sampleFrames = 0;
  let sampleStart = 0;

  function adaptQuality(now) {
    if (quality >= 2) return;
    if (!sampleStart) { sampleStart = now; sampleFrames = 0; return; }
    sampleFrames++;
    const span = now - sampleStart;
    if (span < 2000) return;
    const fps = (sampleFrames * 1000) / span;
    sampleStart = now;
    sampleFrames = 0;
    if (fps < 30) {
      quality++;
      drawCount = Math.floor(COUNT / (quality === 1 ? 2.5 : 6));
    } else {
      quality = 2; // healthy frame rate, stop sampling
    }
  }

  let start = performance.now();
  let last = start;

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min((now - last) / 16.667, 3);
    last = now;
    const elapsed = (now - start) / 1000;

    pointer.x += (pointer.tx - pointer.x) * 0.08 * dt;
    pointer.y += (pointer.ty - pointer.y) * 0.08 * dt;
    scrollY += (scrollTarget - scrollY) * 0.08 * dt;

    const progress = Math.min(elapsed / 1.2, 1);
    const reveal = Math.min(elapsed / 1.6, 1);
    // Scroll drives rotation, so the cloud keeps turning as the page moves.
    const rotation = elapsed * 0.06 + scrollY * 0.0016;
    // Past the hero the cloud recedes to an ambient haze so copy stays readable.
    // Narrow screens have no free column for it, so it stays dimmer throughout.
    const fade = Math.max(1 - scrollY / (height * 0.75), 0.12) * (width < 980 ? 0.5 : 1);

    const steps = Math.min(Math.round(dt), 3);
    for (let i = 0; i < steps; i++) simulate(elapsed, progress);
    draw(rotation, reveal * fade);
    adaptQuality(now);
  }

  if (reducedMotion) {
    // Settle the cloud without animating, then draw once.
    for (let i = 0; i < 240; i++) simulate(0, 1);
    draw(0, 1);
  } else {
    requestAnimationFrame(frame);
  }

  // ---- 2D fallback for browsers without WebGL2 float rendering ----
  function fallback2d() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const colors = ['#8052ff', '#ffb829', '#15846e', '#bdbdbd', '#6a5acd', '#4a7fd6', '#b085ff'];
    let w = 0, h = 0, parts = [];

    function size() {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * d;
      canvas.height = h * d;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(d, 0, 0, d, 0, 0);
      build();
    }

    function build() {
      parts = [];
      const cx = w >= 980 ? w * 0.72 : w * 0.5;
      const cy = h * 0.5;
      const radius = Math.min(w, h) * 0.3;
      for (let i = 0; i < 260; i++) {
        const ambient = i % 4 === 0;
        const angle = Math.random() * Math.PI * 2;
        const r = ambient ? 0 : Math.pow(Math.random(), 0.5) * radius;
        parts.push({
          x: ambient ? Math.random() * w : cx + (Math.random() < 0.5 ? -1 : 1) * radius * 0.3 + Math.cos(angle) * r,
          y: ambient ? Math.random() * h : cy + Math.sin(angle) * r * 0.85,
          s: ambient ? 2 + Math.random() * 2 : 3 + Math.random() * 4,
          c: colors[(Math.random() * colors.length) | 0],
          a: ambient ? 0.2 : 0.6 + Math.random() * 0.4,
          p: Math.random() * Math.PI * 2,
          d: 3 + Math.random() * 5,
        });
      }
    }

    function render(t) {
      ctx.clearRect(0, 0, w, h);
      parts.forEach((p) => {
        const x = p.x + Math.cos(p.p + t) * p.d;
        const y = p.y + Math.sin(p.p + t * 0.8) * p.d;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.p + t * 0.05);
        ctx.beginPath();
        ctx.moveTo(0, -p.s);
        ctx.lineTo(p.s * 0.87, p.s * 0.5);
        ctx.lineTo(-p.s * 0.87, p.s * 0.5);
        ctx.closePath();
        ctx.strokeStyle = p.c;
        ctx.globalAlpha = p.a;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      });
    }

    size();
    window.addEventListener('resize', size);
    if (reducedMotion) {
      render(0);
    } else {
      requestAnimationFrame(function loop(ts) {
        render(ts / 1000);
        requestAnimationFrame(loop);
      });
    }
  }
})();
