import { THREE, Builder, mat, WORLD_MAT, WORLD_MAT_FLAT, noise2, qv } from './engine.js';
const B = THREE;

export function makeWater(storm = false) {
  const geo = new B.PlaneGeometry(900, 900, 90, 90); geo.rotateX(-Math.PI / 2);
  const m = new B.ShaderMaterial({
    uniforms: { t: { value: 0 }, deep: { value: new B.Color(storm ? 0x0a1c2c : 0x0b5a8c) }, shallow: { value: new B.Color(storm ? 0x1f4a5a : 0x2fb3d6) },
      fogC: { value: new B.Color(0xbfe3ff) }, fogN: { value: 60 }, fogF: { value: 220 }, amp: { value: storm ? 1.6 : 0.35 }, isl: { value: new B.Vector3(0, 0, 60) }, foamOn: { value: 1 }, foamK: { value: storm ? 0.97 : 0.88 } },
    vertexShader: `uniform float t; uniform float amp; varying vec3 vW; varying float vH; varying float vD;
      void main(){ vec3 p=position; vec4 w=modelMatrix*vec4(p,1.);
        float h = sin(w.x*0.08+t*1.1)*0.6 + sin(w.z*0.11+t*0.9)*0.5 + sin((w.x+w.z)*0.21+t*1.7)*0.25;
        w.y += h*amp; vH=h; vW=w.xyz; vec4 mv=viewMatrix*w; vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 deep; uniform vec3 shallow; uniform vec3 fogC; uniform float fogN; uniform float fogF; uniform float t; uniform vec3 isl; uniform float foamOn; uniform float foamK; varying vec3 vW; varying float vH; varying float vD;
      void main(){ float k = smoothstep(-0.8,1.2,vH); vec3 c = mix(deep, shallow, k*0.7);
        float r = length(vW.xz-isl.xy); float shore = 1.0-smoothstep(0.0, 14.0, abs(r-isl.z));
        c = mix(c, shallow*1.15, shore*0.6);
        float f = sin(vW.x*0.7+t*2.0+sin(vW.z*0.5))*sin(vW.z*0.6-t*1.6);
        float foam = step(foamK, f*0.5+0.5 + vH*0.06) + step(0.92, shore + sin(r*1.2 - t*2.0)*0.08)*foamOn;
        c = mix(c, vec3(0.95,0.98,1.0), clamp(foam,0.,1.)*0.85);
        float fg = smoothstep(fogN, fogF, vD); c = mix(c, fogC, fg);
        gl_FragColor = vec4(c,1.0);
#include <colorspace_fragment>

      }`,
  });
  const mesh = new B.Mesh(geo, m); mesh.userData.mat = m; return mesh;
}

export function makeSky(top, bot, sun = true) {
  const m = new B.ShaderMaterial({ side: B.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new B.Color(top) }, bot: { value: new B.Color(bot) }, sunDir: { value: new B.Vector3(0.4, 0.5, -0.6).normalize() }, sunOn: { value: sun ? 1 : 0 }, flash: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position=p.xyww; }`,
    fragmentShader: `uniform vec3 top; uniform vec3 bot; uniform vec3 sunDir; uniform float sunOn; uniform float flash; varying vec3 vP;
      void main(){ float h=clamp(vP.y*1.6+0.1,0.,1.); vec3 c=mix(bot,top,pow(h,0.7)); float s=max(dot(vP,sunDir),0.);
        c += sunOn*(step(0.997,s)*vec3(1.,.95,.8) + pow(s,40.)*vec3(1.,.8,.5)*0.5); c += flash*vec3(0.7,0.75,1.0)*(0.4+h);
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

// Terrain from a height function
export function makeTerrain(hf, size = 170, seg = 85, colors = {}) {
  const geo = new B.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position; const n = pos.count;
  for (let i = 0; i < n; i++) pos.setY(i, hf(pos.getX(i), pos.getZ(i)));
  const g = geo.toNonIndexed(); g.computeVertexNormals();
  const P = g.attributes.position, N = g.attributes.normal; const col = new Float32Array(P.count * 3); const c = new B.Color();
  const sand = new B.Color(colors.sand || 0xf0d9a0), grass = new B.Color(colors.grass || 0x6cc04a), grass2 = new B.Color(colors.grass2 || 0x4f9a3a), rock = new B.Color(colors.rock || 0x9a8f80), under = new B.Color(0xc9b47a);
  for (let i = 0; i < P.count; i += 3) {
    const y = (P.getY(i) + P.getY(i + 1) + P.getY(i + 2)) / 3; const ny = N.getY(i);
    const x = P.getX(i), z = P.getZ(i);
    if (y < -0.4) c.copy(under); else if (y < 0.9) c.copy(sand); else if (ny < 0.78 || y > (colors.rockY || 11)) c.copy(rock); else c.copy(grass).lerp(grass2, Math.min(1, noise2(x * 0.08, z * 0.08) * 1.2 + (y - 1) * 0.04));
    if (colors.paint) { const pc = colors.paint(x, z, y); if (pc) c.set(pc); }
    for (let k = 0; k < 3; k++) { col[(i + k) * 3] = c.r; col[(i + k) * 3 + 1] = c.g; col[(i + k) * 3 + 2] = c.b; }
  }
  g.setAttribute('color', new B.BufferAttribute(col, 3)); g.deleteAttribute('uv');
  const m = new B.Mesh(g, WORLD_MAT_FLAT); return m;
}
