/**
 * beams.js — Vanilla Three.js port of the <Beams /> component from React Bits
 * No React / react-three-fiber required.
 * Mobile-optimised: lower DPR, fewer beams, pauses when off-screen or tab hidden.
 *
 * Usage (auto-initialises on DOMContentLoaded):
 *   Add <div id="beams-canvas-container"></div> anywhere in your HTML.
 *   The canvas fills that container absolutely.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// ─── Perlin / Classic noise GLSL ──────────────────────────────────────────────
const NOISE_GLSL = /* glsl */`
float _random(in vec2 st){
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123);
}
float _noise2(in vec2 st){
    vec2 i=floor(st); vec2 f=fract(st);
    float a=_random(i);
    float b=_random(i+vec2(1.,0.));
    float c=_random(i+vec2(0.,1.));
    float d=_random(i+vec2(1.,1.));
    vec2 u=f*f*(3.-2.*f);
    return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
}
vec4 _permute(vec4 x){return mod(((x*34.)+1.)*x,289.);}
vec4 _taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
vec3 _fade(vec3 t){return t*t*t*(t*(t*6.-15.)+10.);}
float cnoise(vec3 P){
    vec3 Pi0=floor(P); vec3 Pi1=Pi0+vec3(1.);
    Pi0=mod(Pi0,289.); Pi1=mod(Pi1,289.);
    vec3 Pf0=fract(P); vec3 Pf1=Pf0-vec3(1.);
    vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);
    vec4 iy=vec4(Pi0.yy,Pi1.yy);
    vec4 iz0=Pi0.zzzz; vec4 iz1=Pi1.zzzz;
    vec4 ixy=_permute(_permute(ix)+iy);
    vec4 ixy0=_permute(ixy+iz0); vec4 ixy1=_permute(ixy+iz1);
    vec4 gx0=ixy0/7.; vec4 gy0=fract(floor(gx0)/7.)-.5; gx0=fract(gx0);
    vec4 gz0=vec4(.5)-abs(gx0)-abs(gy0); vec4 sz0=step(gz0,vec4(0.));
    gx0-=sz0*(step(0.,gx0)-.5); gy0-=sz0*(step(0.,gy0)-.5);
    vec4 gx1=ixy1/7.; vec4 gy1=fract(floor(gx1)/7.)-.5; gx1=fract(gx1);
    vec4 gz1=vec4(.5)-abs(gx1)-abs(gy1); vec4 sz1=step(gz1,vec4(0.));
    gx1-=sz1*(step(0.,gx1)-.5); gy1-=sz1*(step(0.,gy1)-.5);
    vec3 g000=vec3(gx0.x,gy0.x,gz0.x); vec3 g100=vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010=vec3(gx0.z,gy0.z,gz0.z); vec3 g110=vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001=vec3(gx1.x,gy1.x,gz1.x); vec3 g101=vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011=vec3(gx1.z,gy1.z,gz1.z); vec3 g111=vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0=_taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
    g000*=norm0.x; g010*=norm0.y; g100*=norm0.z; g110*=norm0.w;
    vec4 norm1=_taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
    g001*=norm1.x; g011*=norm1.y; g101*=norm1.z; g111*=norm1.w;
    float n000=dot(g000,Pf0); float n100=dot(g100,vec3(Pf1.x,Pf0.yz));
    float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)); float n110=dot(g110,vec3(Pf1.xy,Pf0.z));
    float n001=dot(g001,vec3(Pf0.xy,Pf1.z)); float n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
    float n011=dot(g011,vec3(Pf0.x,Pf1.yz)); float n111=dot(g111,Pf1);
    vec3 fade_xyz=_fade(Pf0);
    vec4 nz=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
    vec2 nyz=mix(nz.xy,nz.zw,fade_xyz.y);
    return 2.2*mix(nyz.x,nyz.y,fade_xyz.x);
}
`;

// ─── Helper: noise functions injected into vertex shader header ───────────────
const VERT_HEADER = /* glsl */`
uniform float uTime;
uniform float uSpeed;
uniform float uScale;
${NOISE_GLSL}

float getDisplace(vec3 pos, vec2 uvCoord){
    vec3 nPos = vec3(pos.x * 0.0, pos.y - uvCoord.y, pos.z + uTime * uSpeed * 3.0) * uScale;
    return cnoise(nPos);
}
vec3 displacedPos(vec3 pos, vec2 uvCoord){
    vec3 p = pos;
    p.z += getDisplace(pos, uvCoord);
    return p;
}
vec3 computeNormal(vec3 pos, vec2 uvCoord){
    vec3 cur  = displacedPos(pos, uvCoord);
    vec3 nx   = displacedPos(pos + vec3(0.01, 0.0, 0.0), uvCoord);
    vec3 nz   = displacedPos(pos + vec3(0.0, -0.01, 0.0), uvCoord);
    return normalize(cross(normalize(nz - cur), normalize(nx - cur)));
}
`;

// ─── Fragment grain helper ────────────────────────────────────────────────────
const FRAG_HEADER = /* glsl */`
uniform float uNoiseIntensity;
float grainRandom(vec2 st){ return fract(sin(dot(st,vec2(12.9898,78.233)))*43758.5453123); }
float grainNoise(vec2 st){
    vec2 i=floor(st); vec2 f=fract(st);
    float a=grainRandom(i); float b=grainRandom(i+vec2(1.,0.));
    float c=grainRandom(i+vec2(0.,1.)); float d=grainRandom(i+vec2(1.,1.));
    vec2 u=f*f*(3.-2.*f);
    return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
}
`;

// ─── Build stacked-planes geometry (same as original) ────────────────────────
function buildBeamGeometry(n, width, height, heightSegments = 100) {
    const geom = new THREE.BufferGeometry();
    const nVerts = n * (heightSegments + 1) * 2;
    const nFaces = n * heightSegments * 2;
    const positions = new Float32Array(nVerts * 3);
    const indices   = new Uint32Array(nFaces * 3);
    const uvs       = new Float32Array(nVerts * 2);

    let vi = 0, fi = 0, ui = 0;
    const totalW = n * width;             // spacing = 0
    const xBase  = -totalW / 2;

    for (let i = 0; i < n; i++) {
        const xOff   = xBase + i * width;
        const uvXOff = Math.random() * 300;
        const uvYOff = Math.random() * 300;

        for (let j = 0; j <= heightSegments; j++) {
            const y  = height * (j / heightSegments - 0.5);
            positions.set([xOff, y, 0, xOff + width, y, 0], vi * 3);
            const uvY = j / heightSegments;
            uvs.set([uvXOff, uvY + uvYOff, uvXOff + 1, uvY + uvYOff], ui);
            if (j < heightSegments) {
                const a = vi, b = vi + 1, c = vi + 2, d = vi + 3;
                indices.set([a, b, c, c, b, d], fi);
                fi += 6;
            }
            vi += 2;
            ui += 4;
        }
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    geom.computeVertexNormals();
    return geom;
}

// ─── Main initialiser ─────────────────────────────────────────────────────────
function initBeams(container, opts = {}) {
    const {
        beamWidth      = 2,
        beamHeight     = 15,
        beamNumber     = 12,
        lightColor     = '#ffffff',
        speed          = 2,
        noiseIntensity = 1.75,
        scale          = 0.2,
        rotation       = 0,
    } = opts;

    const isMobile = window.innerWidth < 768;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    container.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,          // off on all devices – saves fill-rate
        alpha: false,
        powerPreference: 'low-power',
    });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);

    function setSize() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h, false);
        if (camera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
    }

    // ── Scene / camera ────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 20);

    setSize();

    // ── Material (MeshStandardMaterial + onBeforeCompile) ────────────────────
    let shaderUniforms = null;

    const material = new THREE.MeshStandardMaterial({
        color:     new THREE.Color(0, 0, 0),
        roughness: 0.3,
        metalness: 0.3,
    });

    material.onBeforeCompile = shader => {
        // Extra uniforms
        shader.uniforms.uTime          = { value: 0 };
        shader.uniforms.uSpeed         = { value: speed };
        shader.uniforms.uNoiseIntensity = { value: noiseIntensity };
        shader.uniforms.uScale         = { value: scale };
        shaderUniforms = shader.uniforms;

        // Vertex: prepend helpers
        shader.vertexShader = VERT_HEADER + shader.vertexShader;

        // Vertex: displace positions
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
             transformed.z += getDisplace(transformed.xyz, uv);`
        );

        // Vertex: recompute normal from displaced surface
        shader.vertexShader = shader.vertexShader.replace(
            '#include <beginnormal_vertex>',
            `vec3 objectNormal = computeNormal(position.xyz, uv);
             #ifdef USE_TANGENT
               vec3 objectTangent = vec3(tangent.xyz);
             #endif`
        );

        // Fragment: prepend grain helpers
        shader.fragmentShader = FRAG_HEADER + shader.fragmentShader;

        // Fragment: add grain noise after dithering
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `#include <dithering_fragment>
             float grain = grainNoise(gl_FragCoord.xy);
             gl_FragColor.rgb -= grain / 15.0 * uNoiseIntensity;`
        );
    };

    // ── Geometry + mesh ───────────────────────────────────────────────────────
    const actualCount = isMobile ? Math.max(4, Math.floor(beamNumber * 0.6)) : beamNumber;
    const geom  = buildBeamGeometry(actualCount, beamWidth, beamHeight);
    const mesh  = new THREE.Mesh(geom, material);

    const group = new THREE.Group();
    group.rotation.z = rotation * (Math.PI / 180);
    group.add(mesh);
    scene.add(group);

    // ── Lights ────────────────────────────────────────────────────────────────
    const dirLight = new THREE.DirectionalLight(lightColor, 1);
    dirLight.position.set(0, 3, 10);
    group.add(dirLight);

    const ambient = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambient);

    // ── Animation ─────────────────────────────────────────────────────────────
    let rafId  = null;
    let active = true;   // false = paused
    const clock = new THREE.Clock();

    function tick() {
        if (!active) { rafId = null; return; }
        rafId = requestAnimationFrame(tick);
        const delta = clock.getDelta();
        if (shaderUniforms) shaderUniforms.uTime.value += 0.1 * delta;
        renderer.render(scene, camera);
    }

    function pause()  { active = false; }
    function resume() { if (!active) { active = true; clock.getDelta(); tick(); } }

    tick();

    // ── Pause when tab hidden ─────────────────────────────────────────────────
    const onVisibility = () => document.hidden ? pause() : resume();
    document.addEventListener('visibilitychange', onVisibility);

    // ── Pause when scrolled out of view (saves battery on mobile) ────────────
    const observer = new IntersectionObserver(
        ([entry]) => entry.isIntersecting ? resume() : pause(),
        { threshold: 0.05 }
    );
    observer.observe(container);

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => setSize();
    window.addEventListener('resize', onResize);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return function destroy() {
        active = false;
        if (rafId) cancelAnimationFrame(rafId);
        observer.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('resize', onResize);
        geom.dispose();
        material.dispose();
        renderer.dispose();
        canvas.remove();
    };
}

// ─── Auto-init on DOMContentLoaded ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('beams-canvas-container');
    if (!container) return;

    // Respect reduced-motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    initBeams(container, {
        beamWidth:      2,
        beamHeight:     15,
        beamNumber:     12,
        lightColor:     '#00f56f',   // React Bits <Beams /> signature neon green
        speed:          2,
        noiseIntensity: 1.75,
        scale:          0.2,
        rotation:       0,
    });
});
