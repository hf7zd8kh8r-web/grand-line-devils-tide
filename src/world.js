import { THREE, Builder, mat, WORLD_MAT, WORLD_MAT_FLAT, noise2, qv } from './engine.js';
const B = THREE;

// Ocean: analytic waves (normals for sun sparkles), depth colour from distance to the island shore, moving shoreline foam
// bands, soft crest foam, sun glints + fog. `hq` uniform trims the extra work on low quality.
export function makeWater(storm = false) {
  const geo = new B.PlaneGeometry(900, 900, 90, 90); geo.rotateX(-Math.PI / 2);
  const m = new B.ShaderMaterial({
    uniforms: { t: { value: 0 }, deep: { value: new B.Color(storm ? 0x0a1c2c : 0x0b5a8c) }, shallow: { value: new B.Color(storm ? 0x1f4a5a : 0x2fb3d6) },
      fogC: { value: new B.Color(0xbfe3ff) }, fogN: { value: 60 }, fogF: { value: 220 }, amp: { value: storm ? 1.6 : 0.35 }, isl: { value: new B.Vector3(0, 0, 60) }, foamOn: { value: 1 }, foamK: { value: storm ? 0.97 : 0.88 },
      sunDir: { value: new B.Vector3(0.4, 0.5, -0.6).normalize() }, sunC: { value: new B.Color(0xfff1d0) }, hq: { value: 1 }, night: { value: 0 }, hm: { value: null }, hmS: { value: 200 }, hmOn: { value: 0 } },
    vertexShader: `uniform float t; uniform float amp; varying vec3 vW; varying float vH; varying float vD; varying vec3 vN;
      void main(){ vec3 p=position; vec4 w=modelMatrix*vec4(p,1.);
        float a1=w.x*0.08+t*1.1, a2=w.z*0.11+t*0.9, a3=(w.x+w.z)*0.21+t*1.7;
        float h = sin(a1)*0.6 + sin(a2)*0.5 + sin(a3)*0.25;
        float dx = cos(a1)*0.6*0.08 + cos(a3)*0.25*0.21, dz = cos(a2)*0.5*0.11 + cos(a3)*0.25*0.21;
        vN = normalize(vec3(-dx*amp*3.0, 1.0, -dz*amp*3.0));
        w.y += h*amp; vH=h; vW=w.xyz; vec4 mv=viewMatrix*w; vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 deep; uniform vec3 shallow; uniform vec3 fogC; uniform float fogN; uniform float fogF; uniform float t; uniform vec3 isl; uniform float foamOn; uniform float foamK; uniform vec3 sunDir; uniform vec3 sunC; uniform float hq; uniform float night; uniform sampler2D hm; uniform float hmS; uniform float hmOn; varying vec3 vW; varying float vH; varying float vD; varying vec3 vN;
      float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hs(i),hs(i+vec2(1,0)),f.x), mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x), f.y); }
      void main(){ float r = length(vW.xz-isl.xy); float off = r-isl.z; float dW = max(0.0, off*0.3 + 1.5);
        if (hmOn > 0.5) { vec2 uv = vW.xz/hmS + 0.5; if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) { float gh = texture2D(hm, uv).r*12.0 - 8.0; dW = max(0.0, -gh); } else dW = 12.0; }
        float dep = smoothstep(0.3, 9.0, dW); float k = smoothstep(-0.8,1.2,vH);
        vec3 lag = mix(shallow*1.22 + vec3(0.03,0.06,0.04), shallow, smoothstep(0.0, 2.5, dW));
        vec3 c = mix(lag, deep, dep); c = mix(c, c*1.08 + vec3(0.02,0.05,0.06), k*0.5);
        float nz = vn(vW.xz*0.35 + vec2(t*0.2, -t*0.15));
        if (hq > 0.5) { float ca = vn(vW.xz*0.9 + vec2(t*0.5, t*0.3)) * vn(vW.xz*1.3 - vec2(t*0.4, t*0.2)); c += vec3(0.25,0.35,0.35) * smoothstep(0.35, 0.6, ca) * (1.0-smoothstep(0.0, 5.0, dW)) * 0.55; }
        float bands = smoothstep(0.8, 0.97, sin(dW*3.0 - t*2.2 + nz*2.5)*0.5+0.5) * (1.0-smoothstep(0.5, 3.2, dW));
        float edge = smoothstep(0.45, 0.95, (1.0-smoothstep(0.0, 0.8, dW)) * (0.7+nz*0.6));
        float f = sin(vW.x*0.7+t*2.0+sin(vW.z*0.5))*sin(vW.z*0.6-t*1.6);
        float crest = smoothstep(foamK-0.03, foamK+0.05, f*0.5+0.5 + vH*0.06) * (0.6+nz*0.6);
        float foam = clamp(crest*0.8 + (bands*0.8 + edge)*foamOn, 0., 1.);
        c = mix(c, vec3(0.95,0.98,1.0)*(1.0-night*0.6), foam*0.85);
        vec3 V = normalize(cameraPosition - vW); vec3 Rf = reflect(-V, normalize(vN)); float sp = max(dot(Rf, sunDir), 0.0);
        c += sunC * pow(sp, 60.0) * 0.35 * (1.0-night*0.7);
        if (hq > 0.5) { float g = hs(floor(vW.xz*3.0) + floor(t*6.0)); c += sunC * step(0.985, g) * pow(sp, 6.0) * 1.6 * (1.0 - night*0.8); }
        float fr = pow(1.0 - max(dot(V, vec3(0,1,0)), 0.0), 3.0); c = mix(c, fogC, fr*0.25);
        float fg = smoothstep(fogN, fogF, vD); c = mix(c, fogC, fg);
        gl_FragColor = vec4(c,1.0);
#include <colorspace_fragment>

      }`,
  });
  const mesh = new B.Mesh(geo, m); mesh.userData.mat = m; return mesh;
}

// Sky dome: vertical gradient blended into the fog colour at the horizon (soft fog seam), sun disc + halo, dusk glow around the
// sun, drifting procedural cloud wisps (hq), dimmed at night.
export function makeSky(top, bot, sun = true) {
  const m = new B.ShaderMaterial({ side: B.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new B.Color(top) }, bot: { value: new B.Color(bot) }, sunDir: { value: new B.Vector3(0.4, 0.5, -0.6).normalize() }, sunOn: { value: sun ? 1 : 0 }, flash: { value: 0 },
      fogC: { value: new B.Color(bot) }, dusk: { value: 0 }, night: { value: 0 }, t: { value: 0 }, hq: { value: 1 } },
    vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position=p.xyww; }`,
    fragmentShader: `uniform vec3 top; uniform vec3 bot; uniform vec3 sunDir; uniform float sunOn; uniform float flash; uniform vec3 fogC; uniform float dusk; uniform float night; uniform float t; uniform float hq; varying vec3 vP;
      float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hs(i),hs(i+vec2(1,0)),f.x), mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x), f.y); }
      void main(){ float h=clamp(vP.y*1.6+0.1,0.,1.); vec3 c=mix(bot,top,pow(h,0.7)); float s=max(dot(vP,sunDir),0.);
        float hz = 1.0 - smoothstep(0.0, 0.22, vP.y); c = mix(c, fogC, hz*0.85);
        c += dusk * vec3(1.0,0.45,0.25) * pow(s, 4.0) * 0.55 * (1.0-h*0.6);
        c += dusk * vec3(0.9,0.35,0.5) * hz * 0.25;
        if (hq > 0.5 && vP.y > 0.02) { vec2 uv = vP.xz / (vP.y + 0.25) * 2.2 + vec2(t*0.012, t*0.006); float cl = vn(uv)*0.55 + vn(uv*2.3)*0.3 + vn(uv*5.1)*0.15; cl = smoothstep(0.55, 0.85, cl) * smoothstep(0.02, 0.25, vP.y);
          vec3 cc = mix(vec3(1.0), vec3(1.0,0.7,0.55), dusk) * (1.0 - night*0.75); c = mix(c, cc, cl*0.55); }
        c += sunOn*(1.0-night)*(smoothstep(0.9965, 0.9985, s)*vec3(1.,.96,.82)*1.2 + pow(s,40.)*vec3(1.,.8,.5)*0.5 + pow(s, 6.0)*vec3(1.0,0.85,0.6)*0.12); c += flash*vec3(0.7,0.75,1.0)*(0.4+h);
        gl_FragColor=vec4(c,1.);
#include <colorspace_fragment>
 }` });
  const mesh = new B.Mesh(new B.SphereGeometry(400, 24, 12), m); mesh.renderOrder = -1; mesh.userData.mat = m; mesh.frustumCulled = false; return mesh;
}

export function addClouds(b, n = 14, seed = 1, rad = 230, y = 60) {
  let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = rad * (0.7 + r() * 0.4); const x = Math.cos(a) * d, z = Math.sin(a) * d, yy = y + r() * 30;
    for (let j = 0; j < 4; j++) b.add(new B.IcosahedronGeometry(8 + r() * 7, 1), 0xffffff, mat(x + (j - 1.5) * 9, yy + r() * 4, z + r() * 6, 0, 0, 0, 1.4, 0.7, 1), { outline: false, grad: 0.25 }); }
}

// Terrain from a height function. Low-poly flat faces with rich colour: multi-scale grass hue variation (lush/dry patches,
// meadow tints), wet sand + sand->grass dithered transition, soft dirt blending around painted paths, cliff rock strata + moss.
export function makeTerrain(hf, size = 170, seg = 85, colors = {}) {
  const geo = new B.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position; const n = pos.count;
  for (let i = 0; i < n; i++) pos.setY(i, hf(pos.getX(i), pos.getZ(i)));
  const g = geo.toNonIndexed(); g.computeVertexNormals();
  const P = g.attributes.position, N = g.attributes.normal; const col = new Float32Array(P.count * 3); const c = new B.Color(), t1 = new B.Color(), t2 = new B.Color();
  const sand = new B.Color(colors.sand || 0xf0d9a0), grass = new B.Color(colors.grass || 0x6cc04a), grass2 = new B.Color(colors.grass2 || 0x4f9a3a), rock = new B.Color(colors.rock || 0x9a8f80), under = new B.Color(0xc9b47a);
  const wet = sand.clone().multiplyScalar(0.8).lerp(new B.Color(0x8a7a5a), 0.15), dry = grass.clone().lerp(sand, 0.38).lerp(new B.Color(0xc8b860), 0.12), lushC = grass2.clone().multiplyScalar(0.86), meadow = grass.clone().lerp(new B.Color(0xa8d860), 0.35);
  const rock2 = rock.clone().multiplyScalar(0.72), moss = grass2.clone().lerp(rock, 0.35), dirt = sand.clone().lerp(rock, 0.45).multiplyScalar(0.92);
  const rockY = colors.rockY || 11; const paint = colors.paint;
  for (let i = 0; i < P.count; i += 3) {
    const y = (P.getY(i) + P.getY(i + 1) + P.getY(i + 2)) / 3; const ny = N.getY(i);
    const x = (P.getX(i) + P.getX(i + 1) + P.getX(i + 2)) / 3, z = (P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2)) / 3;
    const n1 = noise2(x * 0.045, z * 0.045), n2 = noise2(x * 0.16 + 7.3, z * 0.16 - 3.1), n3 = noise2(x * 0.9 + 1.7, z * 0.9 + 9.1);
    const band = 0.9 + (n2 - 0.5) * 0.5;
    if (y < -0.4) c.copy(under).multiplyScalar(Math.max(0.55, 1 + y * 0.12));
    else if (y < 0.35) c.copy(wet).lerp(sand, Math.max(0, (y + 0.4) / 0.75) * 0.6);
    else if (y < band) c.copy(sand).multiplyScalar(0.95 + n3 * 0.1);
    else if (ny < 0.78 || y > rockY) { const st = 0.84 + 0.16 * Math.sin(y * 2.4 + n2 * 3); c.copy(rock).lerp(rock2, n1 * 0.6).multiplyScalar(st * (0.92 + n3 * 0.16)); if (ny > 0.62 && n2 > 0.55) c.lerp(moss, 0.45); }
    else { c.copy(grass).lerp(grass2, Math.min(1, Math.max(0, n1 * 1.25 - 0.1 + (y - 1) * 0.04)));
      if (n2 > 0.7) c.lerp(dry, Math.min(0.55, (n2 - 0.7) * 2.2)); else if (n2 < 0.3) c.lerp(lushC, (0.3 - n2) * 2.4); else if (n1 > 0.62) c.lerp(meadow, (n1 - 0.62) * 1.8);
      const tb = band + 0.35 + n3 * 0.25; if (y < tb) c.lerp(t1.copy(sand).lerp(c, 0.45), (1 - (y - band) / (tb - band)) * (n3 > 0.5 ? 0.7 : 0.35));
      c.multiplyScalar(0.94 + n3 * 0.12); }
    if (paint) { const pc = paint(x, z, y); if (pc) { t1.set(pc); c.copy(t1).multiplyScalar(0.9 + n3 * 0.16); if (n3 > 0.82) c.lerp(dirt, 0.4); }
      else if (y > 0.9) { let k = 0; for (const [ox, oz] of [[1.4, 0], [-1.4, 0], [0, 1.4], [0, -1.4]]) { const q = paint(x + ox, z + oz, y); if (q) { k++; t2.set(q); } } if (k) c.lerp(t2.lerp(dirt, 0.3), 0.18 + k * 0.1 * (0.6 + n3 * 0.8)); } }
    for (let k = 0; k < 3; k++) { col[(i + k) * 3] = c.r; col[(i + k) * 3 + 1] = c.g; col[(i + k) * 3 + 2] = c.b; }
  }
  g.setAttribute('color', new B.BufferAttribute(col, 3)); g.deleteAttribute('uv');
  const m = new B.Mesh(g, WORLD_MAT_FLAT); m.userData.terrain = true; return m;
}
