import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { inspectAndRigModel, disposeModel } from '../utils/modelRigging.js';

const CAMERA_PRESETS = {
  hero: { pos: [4.4, 1.55, 4.8], target: [0, 0.58, 0] },
  profile: { pos: [5.6, 1.1, 0], target: [0, 0.55, 0] },
  rear: { pos: [-2.6, 1.45, -4.6], target: [0, 0.58, 0] }
};

export default function CanvasScene({
  currentCar,
  cameraPreset,
  activeHotspot,
  graphicsQuality,
  isAutoRotate,
  onHotspotsProjected,
  onModelLoaded,
  onUserInteract
}) {
  const mountRef = useRef(null);
  const currentCarRef = useRef(currentCar);
  const onHotspotsProjectedRef = useRef(onHotspotsProjected);
  const cameraPresetRef = useRef(cameraPreset);

  currentCarRef.current = currentCar;
  onHotspotsProjectedRef.current = onHotspotsProjected;
  cameraPresetRef.current = cameraPreset;

  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    currentModel: null,
    riggedParts: null,
    desiredCamPos: new THREE.Vector3(...CAMERA_PRESETS.hero.pos),
    desiredTarget: new THREE.Vector3(...CAMERA_PRESETS.hero.target),
    isTransitioning: false,
    interiorAngles: { lon: 0, lat: 0 }
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050608);
    scene.fog = new THREE.FogExp2(0x050608, 0.032);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 100);
    camera.position.set(...CAMERA_PRESETS.hero.pos);

    const isPerf = graphicsQuality === 'performance';
    const renderer = new THREE.WebGLRenderer({
      antialias: !isPerf,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isPerf ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isPerf;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.015;
    controls.minDistance = 0.6;
    controls.maxDistance = 12;
    controls.target.set(...CAMERA_PRESETS.hero.target);

    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseDown = (e) => {
      if (cameraPresetRef.current === 'interior') {
        isMouseDown = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
      }
    };

    const onMouseMove = (e) => {
      if (!isMouseDown || cameraPresetRef.current !== 'interior') return;
      const dx = e.clientX - mouseX;
      const dy = e.clientY - mouseY;
      mouseX = e.clientX;
      mouseY = e.clientY;

      const st = stateRef.current;
      st.interiorAngles.lon -= dx * 0.0022;
      st.interiorAngles.lat -= dy * 0.0022;
      st.interiorAngles.lat = Math.max(-0.4, Math.min(0.3, st.interiorAngles.lat));
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const stopTransition = () => {
      stateRef.current.isTransitioning = false;
      if (onUserInteract) onUserInteract();
    };
    controls.addEventListener('start', stopTransition);

    if (!isPerf) {
      const overheadStrip = new THREE.DirectionalLight(0xffffff, 2.4);
      overheadStrip.position.set(4, 9, 5);
      overheadStrip.castShadow = true;
      overheadStrip.shadow.mapSize.set(1024, 1024);
      overheadStrip.shadow.bias = -0.0005;
      scene.add(overheadStrip);
    }

    const rimLight = new THREE.DirectionalLight(0xdbeafe, 1.1);
    rimLight.position.set(-6, 4, -6);
    scene.add(rimLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(28, 64),
      new THREE.MeshStandardMaterial({
        color: 0x080a0e,
        roughness: 0.25,
        metalness: 0.85
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !isPerf;
    scene.add(floor);

    stateRef.current.scene = scene;
    stateRef.current.camera = camera;
    stateRef.current.renderer = renderer;
    stateRef.current.controls = controls;

    const projVec = new THREE.Vector3();
    let reqId;

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const st = stateRef.current;
      const curPreset = cameraPresetRef.current;

      if (curPreset === 'interior') {
        controls.enabled = false;
        
        let driverHeadPos = new THREE.Vector3(0.18, 0.94, -0.05);
        if (st.riggedParts?.steering) {
          const wp = new THREE.Vector3();
          st.riggedParts.steering.getWorldPosition(wp);
          driverHeadPos.set(wp.x + 0.02, wp.y + 0.1, wp.z - 0.38);
        }

        camera.position.copy(driverHeadPos);

        const phi = Math.PI / 2 + st.interiorAngles.lat;
        const theta = st.interiorAngles.lon;
        const lookTarget = new THREE.Vector3(
          driverHeadPos.x + 100 * Math.sin(phi) * Math.sin(theta),
          driverHeadPos.y + 100 * Math.cos(phi),
          driverHeadPos.z + 100 * Math.sin(phi) * Math.cos(theta)
        );
        camera.lookAt(lookTarget);
      } else {
        controls.enabled = true;
        if (st.isTransitioning) {
          camera.position.lerp(st.desiredCamPos, 0.06);
          controls.target.lerp(st.desiredTarget, 0.06);
          if (
            camera.position.distanceTo(st.desiredCamPos) < 0.02 &&
            controls.target.distanceTo(st.desiredTarget) < 0.02
          ) {
            st.isTransitioning = false;
          }
        }
        controls.update();
      }

      const activeCar = currentCarRef.current;
      const emitHotspots = onHotspotsProjectedRef.current;
      if (activeCar?.hotspots && emitHotspots && mountRef.current && curPreset !== 'interior') {
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        const coords = activeCar.hotspots.map((spot) => {
          projVec.set(spot.position[0], spot.position[1], spot.position[2]).project(camera);
          return {
            ...spot,
            x: ((projVec.x + 1) * w) / 2,
            y: ((-projVec.y + 1) * h) / 2,
            visible: projVec.z < 1
          };
        });
        emitHotspots(coords);
      } else if (curPreset === 'interior' && emitHotspots) {
        emitHotspots([]);
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      controls.removeEventListener('start', stopTransition);
      if (stateRef.current.currentModel) {
        disposeModel(stateRef.current.currentModel);
      }
      envTexture.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [graphicsQuality]);

  useEffect(() => {
    if (!currentCar?.modelPath || !stateRef.current.scene) return;
    const { scene } = stateRef.current;

    if (stateRef.current.currentModel) {
      scene.remove(stateRef.current.currentModel);
      disposeModel(stateRef.current.currentModel);
      stateRef.current.currentModel = null;
      stateRef.current.riggedParts = null;
    }

    let cancelled = false;
    const loader = new GLTFLoader();
    loader.load(
      currentCar.modelPath,
      (gltf) => {
        if (cancelled) {
          disposeModel(gltf.scene);
          return;
        }
        const model = gltf.scene;
        const rigged = inspectAndRigModel(model);
        scene.add(model);
        stateRef.current.currentModel = model;
        stateRef.current.riggedParts = rigged;
        if (onModelLoaded) onModelLoaded(rigged);
      },
      undefined,
      (err) => console.error('GLTF Load Error:', err)
    );

    return () => {
      cancelled = true;
    };
  }, [currentCar, onModelLoaded]);

  useEffect(() => {
    if (stateRef.current.controls) {
      stateRef.current.controls.autoRotate = isAutoRotate;
      stateRef.current.controls.autoRotateSpeed = 0.8;
    }
  }, [isAutoRotate]);

  useEffect(() => {
    const st = stateRef.current;
    if (!st.camera || !st.controls) return;

    if (cameraPreset === 'interior') {
      st.interiorAngles = { lon: 0, lat: 0 };
      return;
    }

    const preset = CAMERA_PRESETS[cameraPreset] || CAMERA_PRESETS.hero;
    st.desiredCamPos.set(...preset.pos);
    st.desiredTarget.set(...preset.target);
    st.isTransitioning = true;
  }, [cameraPreset]);

  useEffect(() => {
    if (!activeHotspot) return;
    const st = stateRef.current;
    const [hx, hy, hz] = activeHotspot.position;
    st.desiredTarget.set(hx, hy, hz);
    const dir = new THREE.Vector3(hx || 0.4, 0.6, hz || 0.8).normalize();
    st.desiredCamPos.set(hx + dir.x * 2.4, hy + 0.85, hz + dir.z * 2.4);
    st.isTransitioning = true;
  }, [activeHotspot]);

  return <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing" />;
}