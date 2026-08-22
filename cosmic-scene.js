import * as THREE from 'three';

export function initCosmicScene(container) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return null;

  let width = container.clientWidth;
  let height = container.clientHeight;
  const isMobile = window.innerWidth < 768;
  const density = isMobile ? 0.4 : 1;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.0008);

  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
  camera.position.set(0, 0, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // --- Mars Planet ---
  const marsGroup = new THREE.Group();
  scene.add(marsGroup);

  const marsDetail = isMobile ? 4 : 6;
  const marsGeo = new THREE.IcosahedronGeometry(18, marsDetail);
  const marsMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0.12,
    flatShading: false,
    vertexColors: true,
  });
  // Procedural displacement + coloring for terrain (rust plains, dark craters, dusty highlands)
  const posAttr = marsGeo.attributes.position;
  const colorArr = new Float32Array(posAttr.count * 3);
  const deepRust = new THREE.Color(0x7a2c0a);
  const midRust = new THREE.Color(0xc1440e);
  const dustHigh = new THREE.Color(0xe8935a);
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const n = noise3D(x * 0.08, y * 0.08, z * 0.08) * 1.5 + noise3D(x * 0.2, y * 0.2, z * 0.2) * 0.5;
    const fine = noise3D(x * 0.6, y * 0.6, z * 0.6);
    const len = Math.sqrt(x * x + y * y + z * z);
    posAttr.setXYZ(i, x + (x / len) * n, y + (y / len) * n, z + (z / len) * n);

    const t = Math.min(1, Math.max(0, (n + 1.6) / 3.2));
    const col = t < 0.5
      ? deepRust.clone().lerp(midRust, t * 2)
      : midRust.clone().lerp(dustHigh, (t - 0.5) * 2);
    const shade = 1 + fine * 0.12;
    colorArr[i * 3] = col.r * shade;
    colorArr[i * 3 + 1] = col.g * shade;
    colorArr[i * 3 + 2] = col.b * shade;
  }
  marsGeo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
  marsGeo.computeVertexNormals();
  const mars = new THREE.Mesh(marsGeo, marsMat);
  marsGroup.add(mars);

  // Atmospheric glow
  const glowGeo = new THREE.SphereGeometry(21, 64, 64);
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color(0xd97f3d) } },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(glowColor, intensity * 0.6);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  marsGroup.add(glow);

  // Lighting
  const ambient = new THREE.AmbientLight(0x331108, 0.4);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffaa66, 1.8);
  sun.position.set(50, 20, 40);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x4488ff, 0.3);
  rim.position.set(-50, -10, -30);
  scene.add(rim);

  // --- Starfield (multiple layers for parallax) ---
  const starLayers = [];
  for (let layer = 0; layer < 3; layer++) {
    const count = Math.round((layer === 0 ? 4000 : layer === 1 ? 2000 : 800) * density);
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const layerDepth = layer === 0 ? 500 : layer === 1 ? 300 : 150;
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * layerDepth - 200;
      sizes[i] = Math.random() * 2 + 0.5;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const starMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        varying float vSize;
        void main() {
          vSize = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        varying float vSize;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float twinkle = sin(time * 2.0 + gl_FragCoord.x * 0.1) * 0.3 + 0.7;
          float alpha = (1.0 - d * 2.0) * twinkle;
          vec3 color = mix(vec3(1.0, 0.95, 0.88), vec3(0.85, 0.7, 0.5), vSize / 2.5);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    starLayers.push({ mesh: stars, material: starMat, depth: layerDepth });
  }

  // --- Dust particles around Mars ---
  const dustCount = Math.round(300 * density);
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  const dustVel = [];
  for (let i = 0; i < dustCount; i++) {
    const r = 25 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    dustPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    dustPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    dustPos[i * 3 + 2] = r * Math.cos(phi);
    dustVel.push({ speed: 0.001 + Math.random() * 0.003, radius: r });
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xd97f3d,
    size: 0.6,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  marsGroup.add(dust);

  // Mouse parallax (no trail)
  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // --- Warp speed effect (for page transitions) ---
  let warpFactor = 0;
  let warpActive = false;
  function triggerWarp() {
    warpActive = true;
    warpFactor = 1;
  }

  // --- Scroll-driven camera ---
  let scrollProgress = 0;
  let targetScrollProgress = 0;
  window.addEventListener('scroll', () => {
    targetScrollProgress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  }, { passive: true });

  // --- Resize ---
  function onResize() {
    width = container.clientWidth;
    height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);

  // --- Animation loop ---
  const clock = new THREE.Clock();
  let frameId;

  function animate() {
    frameId = requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const t = clock.getElapsedTime();

    // Smooth scroll
    scrollProgress += (targetScrollProgress - scrollProgress) * 0.05;

    // Mars rotation
    mars.rotation.y += dt * 0.08;
    mars.rotation.x = Math.sin(t * 0.1) * 0.05;

    // Dust orbit
    const dPos = dustGeo.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
      const angle = t * dustVel[i].speed;
      const r = dustVel[i].radius;
      dPos[i * 3] = r * Math.sin(angle + i) * Math.cos(i * 0.5);
      dPos[i * 3 + 1] = r * Math.sin(angle + i) * Math.sin(i * 0.5);
      dPos[i * 3 + 2] = r * Math.cos(angle + i);
    }
    dustGeo.attributes.position.needsUpdate = true;

    // Star twinkle
    starLayers.forEach((layer) => {
      layer.material.uniforms.time.value = t;
      layer.mesh.rotation.y = t * 0.005 * (layer === starLayers[0] ? 1 : 0.5);
    });

    // Camera journey: fly through space as user scrolls
    const journeyZ = 100 - scrollProgress * 250;
    const journeyY = scrollProgress * 30;
    camera.position.z += (journeyZ - camera.position.z) * 0.05;
    camera.position.y += (journeyY - camera.position.y) * 0.05;
    camera.position.x += (mouse.x * 15 - camera.position.x) * 0.03;
    camera.lookAt(marsGroup.position.x, marsGroup.position.y + scrollProgress * 10, marsGroup.position.z);

    // Mars moves away as we scroll
    marsGroup.position.z = scrollProgress * -150;
    marsGroup.position.y = scrollProgress * -20;

    // Warp effect
    if (warpActive) {
      warpFactor -= dt * 0.5;
      if (warpFactor <= 0) {
        warpFactor = 0;
        warpActive = false;
      }
      starLayers.forEach((layer) => {
        const positions = layer.mesh.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 2] -= warpFactor * 15;
        }
        layer.mesh.geometry.attributes.position.needsUpdate = true;
      });
    }

    renderer.render(scene, camera);
  }
  animate();

  return { triggerWarp, destroy: () => { cancelAnimationFrame(frameId); window.removeEventListener('resize', onResize); renderer.dispose(); container.removeChild(renderer.domElement); } };
}

// Simple 3D noise function
function noise3D(x, y, z) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}
