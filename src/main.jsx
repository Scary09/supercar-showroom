import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const container = document.getElementById('webgl-container');

// Scene & Camera setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b0e);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(6, 2, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below ground
controls.minDistance = 3;
controls.maxDistance = 12;

// Lighting (Editorial Studio Setup)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
dirLight1.position.set(5, 8, 5);
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0x8899ff, 1.0);
dirLight2.position.set(-5, 4, -5);
scene.add(dirLight2);

// Ground plane for soft reflections
const groundGeo = new THREE.PlaneGeometry(50, 50);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x0b0b0e,
  roughness: 0.4,
  metalness: 0.8
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
scene.add(ground);

// Load Model cleanly without door animation hooks
const loader = new GLTFLoader();
loader.load('./public/models/ferrari-laferrari/scene.bin', (gltf) => {
  const model = gltf.scene;
  
  // Center model bounding box automatically
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.position.y = 0;

  scene.add(model);
}, undefined, (error) => {
  console.error('An error occurred loading the model:', error);
});

// View Preset Buttons Handler
document.querySelectorAll('.view-controls button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.view-controls button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    
    const view = e.target.getAttribute('data-view');
    if (view === 'studio') {
      camera.position.set(6, 2, 6);
      controls.target.set(0, 0, 0);
    } else if (view === 'profile') {
      camera.position.set(7, 1.2, 0);
      controls.target.set(0, 0.5, 0);
    } else if (view === 'rear') {
      camera.position.set(0, 2, -6);
      controls.target.set(0, 0, 0);
    }
  });
});

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
