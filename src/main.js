/**
 * McLaren 720S Spider — Digital Showroom
 * main.js — Three.js scene, model loading, color configurator, camera controls, UI
 */

import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── DOM References ────────────────────────────────────────────────────────────
const canvas          = document.getElementById('three-canvas');
const canvasWrapper   = document.getElementById('canvasWrapper');
const loadingOverlay  = document.getElementById('loadingOverlay');
const loadingBarFill  = document.getElementById('loadingBarFill');
const loadingStatus   = document.getElementById('loadingStatus');
const errorOverlay    = document.getElementById('errorOverlay');
const errorMessage    = document.getElementById('errorMessage');
const cameraHud       = document.getElementById('cameraHud');

const btnAutoRotate   = document.getElementById('btnAutoRotate');
const btnReset        = document.getElementById('btnReset');
const btnFront        = document.getElementById('btnFront');
const btnSide         = document.getElementById('btnSide');

const colorSwatches   = document.getElementById('colorSwatches');
const colorNameDisplay= document.getElementById('colorNameDisplay');
const configNote      = document.getElementById('configNote');

// ─── Navbar scroll effect ────────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ─── Mobile nav toggle ────────────────────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.querySelector('.navbar-links');
navToggle?.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// ─── THREE.JS SETUP ──────────────────────────────────────────────────────────

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050508);

// Fog for depth
scene.fog = new THREE.FogExp2(0x050508, 0.035);

// Camera
const camera = new THREE.PerspectiveCamera(
  42,
  canvasWrapper.clientWidth / canvasWrapper.clientHeight,
  0.1,
  1000
);
camera.position.set(5, 2, 8);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setSize(canvasWrapper.clientWidth, canvasWrapper.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// ─── LIGHTING ────────────────────────────────────────────────────────────────

// Ambient — very dark for drama
const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambientLight);

// Key light — warm from front-top-right
const keyLight = new THREE.DirectionalLight(0xfff5e0, 2.5);
keyLight.position.set(6, 8, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 50;
keyLight.shadow.bias = -0.001;
scene.add(keyLight);

// Fill light — cool blue from left
const fillLight = new THREE.DirectionalLight(0xb0c4ff, 0.8);
fillLight.position.set(-6, 4, 2);
scene.add(fillLight);

// Rim light — orange from rear (supercar signature)
const rimLight = new THREE.DirectionalLight(0xff6b1a, 1.4);
rimLight.position.set(0, 3, -8);
scene.add(rimLight);

// Ground bounce — subtle warm from below
const groundLight = new THREE.DirectionalLight(0xffeedd, 0.3);
groundLight.position.set(0, -4, 0);
scene.add(groundLight);

// Overhead showroom spot
const spotLight = new THREE.SpotLight(0xffffff, 3.0, 30, Math.PI / 5, 0.4, 1.5);
spotLight.position.set(0, 14, 0);
spotLight.castShadow = false;
scene.add(spotLight);

// ─── GROUND PLANE ────────────────────────────────────────────────────────────
const groundGeo  = new THREE.PlaneGeometry(30, 30);
const groundMat  = new THREE.MeshStandardMaterial({
  color: 0x0a0a0e,
  roughness: 0.15,
  metalness: 0.6,
  envMapIntensity: 1.0,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
ground.receiveShadow = true;
scene.add(ground);

// Subtle showroom reflection disc
const discGeo = new THREE.CircleGeometry(3, 64);
const discMat = new THREE.MeshBasicMaterial({
  color: 0xff6b1a,
  transparent: true,
  opacity: 0.04,
  depthWrite: false,
});
const disc = new THREE.Mesh(discGeo, discMat);
disc.rotation.x = -Math.PI / 2;
disc.position.y = 0.005;
scene.add(disc);

// ─── ORBIT CONTROLS ──────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping   = true;
controls.dampingFactor   = 0.07;
controls.minDistance     = 3;
controls.maxDistance     = 20;
controls.minPolarAngle   = Math.PI * 0.05;
controls.maxPolarAngle   = Math.PI * 0.55;
controls.autoRotate      = false;
controls.autoRotateSpeed = 0.6;
controls.enablePan       = false;

// ─── CAMERA PRESETS ──────────────────────────────────────────────────────────
let defaultCamPos    = new THREE.Vector3(5, 2, 8);
let defaultCamTarget = new THREE.Vector3(0, 0.5, 0);
let cameraAnimating  = false;

function animateCameraTo(targetPos, targetLookAt, duration = 900) {
  if (cameraAnimating) return;
  cameraAnimating = true;
  controls.enabled = false;

  const startPos    = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime   = performance.now();

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function tick() {
    const elapsed = performance.now() - startTime;
    const t       = Math.min(elapsed / duration, 1);
    const e       = easeInOutCubic(t);

    camera.position.lerpVectors(startPos, targetPos, e);
    controls.target.lerpVectors(startTarget, targetLookAt, e);
    controls.update();

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      cameraAnimating  = false;
      controls.enabled = true;
    }
  }
  requestAnimationFrame(tick);
}

// ─── BODY MATERIAL TRACKING ──────────────────────────────────────────────────
let bodyMaterials = [];   // Array of identified body MeshStandardMaterial refs
let currentBodyColor = new THREE.Color(0xFF6B1A);

/**
 * Heuristic to decide if a material/mesh looks like a painted body panel.
 * Strategy: exclude obviously non-body names, then include glossy/metallic ones.
 */
function isBodyMaterial(mesh, material) {
  const mName = (material?.name || '').toLowerCase();
  const gName = (mesh?.name     || '').toLowerCase();

  // Hard exclusions — glass, tyres, lights, chrome, interior, logos
  const exclude = [
    'glass', 'window', 'windshield', 'windscreen', 'wiper',
    'tyre', 'tire', 'wheel', 'rim', 'brake', 'rotor', 'caliper',
    'light', 'lamp', 'lens', 'bulb', 'led', 'headlight', 'taillight',
    'chrome', 'silver_trim', 'exhaust', 'pipe',
    'interior', 'seat', 'dashboard', 'steering', 'carpet', 'fabric',
    'badge', 'logo', 'mclaren_logo', 'emblem',
    'black_trim', 'rubber', 'seal',
    'mirror_glass',
    'rollover', 'roll',
  ];

  for (const ex of exclude) {
    if (mName.includes(ex) || gName.includes(ex)) return false;
  }

  // Must be a standard material (has color property)
  if (!(material instanceof THREE.MeshStandardMaterial)) return false;

  // Prefer metallic / coloured panels
  if (material.metalness > 0.2 || material.roughness < 0.6) return true;

  // Also include if name clearly suggests body
  const include = ['body', 'paint', 'panel', 'hood', 'bonnet', 'roof', 'door', 'fender', 'bumper', 'spoiler', 'splitter', 'diffuser', 'sill', 'car'];
  for (const inc of include) {
    if (mName.includes(inc) || gName.includes(inc)) return true;
  }

  return false;
}

// ─── LOAD MODEL ──────────────────────────────────────────────────────────────
const loader = new GLTFLoader();
let modelLoaded = false;

function setLoadingStatus(text, pct) {
  loadingStatus.textContent = text;
  if (pct !== undefined) loadingBarFill.style.width = `${pct}%`;
}

setLoadingStatus('Connecting to showroom…', 5);

loader.load(
  '/models/mclaren_720s_spider.glb',

  // onLoad
  (gltf) => {
    setLoadingStatus('Optimising model…', 90);

    const model = gltf.scene;

    // ── Compute bounding box for auto-framing ──
    const box    = new THREE.Box3().setFromObject(model);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    console.log('[McLaren Showroom] Model loaded');
    console.log('  Bounding box size :', size);
    console.log('  Bounding center   :', center);

    // ── Recentre model so it sits on ground ──
    model.position.sub(center);
    model.position.y += size.y * 0.5;  // shift up so bottom = y=0

    // ── Uniform scale: target ~4 units wide ──
    const targetWidth = 4.5;
    const scaleFactor = targetWidth / size.x;
    model.scale.setScalar(scaleFactor);

    // Re-compute bounding box after transform
    const box2    = new THREE.Box3().setFromObject(model);
    const size2   = box2.getSize(new THREE.Vector3());
    const center2 = box2.getCenter(new THREE.Vector3());

    console.log('  Scaled size       :', size2);
    console.log('  Scaled center     :', center2);

    // ── Adjust ground plane Y to model bottom ──
    const modelBottom = box2.min.y;
    ground.position.y = modelBottom - 0.01;
    disc.position.y   = modelBottom + 0.005;

    // ── Set default camera target to model centre ──
    defaultCamTarget.copy(center2);
    controls.target.copy(center2);

    // ── Smart camera distance based on model size ──
    const maxDim = Math.max(size2.x, size2.y, size2.z);
    const dist   = maxDim * 1.9;
    defaultCamPos.set(dist * 0.7, maxDim * 0.45, dist);
    camera.position.copy(defaultCamPos);
    controls.minDistance = maxDim * 0.6;
    controls.maxDistance = maxDim * 5;

    // ── Adjust spot light ──
    spotLight.position.y = size2.y * 4 + center2.y;

    // ── Enable shadows & identify body materials ──
    const materialMap = new Map(); // de-duplicate shared materials

    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow    = true;
        node.receiveShadow = true;

        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((mat) => {
          if (!mat) return;
          if (materialMap.has(mat.uuid)) return;
          materialMap.set(mat.uuid, mat);

          if (isBodyMaterial(node, mat)) {
            bodyMaterials.push(mat);
            console.log(`  [Body material] mesh="${node.name}" mat="${mat.name}" metalness=${mat.metalness.toFixed(2)} roughness=${mat.roughness.toFixed(2)}`);
          }
        });
      }
    });

    console.log(`  Body materials identified: ${bodyMaterials.length}`);

    if (bodyMaterials.length === 0) {
      configNote.textContent = 'Colour configurator is unavailable — body materials could not be identified in this model. All other controls are functional.';
    } else {
      // Apply default colour (Papaya Orange) to body
      applyBodyColor(currentBodyColor);
    }

    scene.add(model);
    modelLoaded = true;

    // ── Update disc size to model footprint ──
    disc.geometry.dispose();
    disc.geometry = new THREE.CircleGeometry(Math.max(size2.x, size2.z) * 0.55, 64);

    setLoadingStatus('Welcome to the showroom.', 100);

    // Slight delay then hide loader, show HUD
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      cameraHud.classList.add('visible');
    }, 600);
  },

  // onProgress
  (xhr) => {
    if (xhr.lengthComputable) {
      const pct = Math.round((xhr.loaded / xhr.total) * 80) + 5;
      setLoadingStatus(`Loading model… ${pct}%`, pct);
    } else {
      setLoadingStatus('Loading model…', 40);
    }
  },

  // onError
  (error) => {
    console.error('[McLaren Showroom] Failed to load model:', error);
    loadingOverlay.classList.add('hidden');
    errorOverlay.classList.remove('hidden');
    errorMessage.textContent = `Error: ${error?.message || 'Unknown error loading /models/mclaren_720s_spider.glb'}`;
  }
);

// ─── COLOUR CONFIGURATOR ────────────────────────────────────────────────────
function applyBodyColor(color) {
  bodyMaterials.forEach((mat) => {
    mat.color.set(color);
    mat.needsUpdate = true;
  });
}

colorSwatches?.addEventListener('click', (e) => {
  const swatch = e.target.closest('.swatch');
  if (!swatch) return;

  // Update active state
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  swatch.classList.add('active');

  const hex  = swatch.dataset.color;
  const name = swatch.dataset.name;
  colorNameDisplay.textContent = name;

  currentBodyColor = new THREE.Color(hex);

  if (bodyMaterials.length > 0) {
    applyBodyColor(currentBodyColor);
  }
});

// ─── CAMERA CONTROL BUTTONS ───────────────────────────────────────────────────
btnAutoRotate?.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  btnAutoRotate.classList.toggle('active', controls.autoRotate);
});

btnReset?.addEventListener('click', () => {
  animateCameraTo(defaultCamPos.clone(), defaultCamTarget.clone());
});

btnFront?.addEventListener('click', () => {
  // Front view — directly in front of car (positive Z axis)
  const target = defaultCamTarget.clone();
  const dist   = defaultCamPos.distanceTo(defaultCamTarget);
  const frontPos = new THREE.Vector3(target.x, target.y + dist * 0.15, target.z + dist);
  animateCameraTo(frontPos, target);
});

btnSide?.addEventListener('click', () => {
  // Side view — from positive X axis
  const target = defaultCamTarget.clone();
  const dist   = defaultCamPos.distanceTo(defaultCamTarget);
  const sidePos = new THREE.Vector3(target.x + dist, target.y + dist * 0.15, target.z);
  animateCameraTo(sidePos, target);
});

// ─── RESIZE HANDLER ──────────────────────────────────────────────────────────
function onResize() {
  const w = canvasWrapper.clientWidth;
  const h = canvasWrapper.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener('resize', onResize, { passive: true });

// ─── RENDER LOOP ─────────────────────────────────────────────────────────────
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

// ─── SMOOTH SCROLL for hero CTA ──────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href').slice(1);
    const el = document.getElementById(targetId);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navLinks?.classList.remove('open');
    }
  });
});
