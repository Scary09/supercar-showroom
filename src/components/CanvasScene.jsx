import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { inspectAndRigModel } from '../utils/modelRigging';

export default function CanvasScene({
  currentCar,
  partsState,
  isCockpitView,
  onHotspotsProjected,
  onModelLoaded
}) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    currentModel: null,
    riggedParts: null
  });

  useEffect(() => {
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080d);
    scene.fog = new THREE.FogExp2(0x06080d, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.8, 2.2, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 1.0;
    controls.maxDistance = 15;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-6, 4, -6);
    scene.add(fillLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x0a0d14, roughness: 0.2, metalness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(50, 50, 0x1e293b, 0x0f172a));

    stateRef.current = { scene, camera, renderer, controls, currentModel: null, riggedParts: null };

    let reqId;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      controls.update();

      if (currentCar?.hotspots && onHotspotsProjected) {
        const coords = currentCar.hotspots.map((h) => {
          const v = new THREE.Vector3(...h.position).project(camera);
          return {
            ...h,
            x: ((v.x + 1) * width) / 2,
            y: ((-v.y + 1) * height) / 2,
            visible: v.z < 1
          };
        });
        onHotspotsProjected(coords);
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
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!currentCar?.modelPath || !stateRef.current.scene) return;
    const { scene } = stateRef.current;

    if (stateRef.current.currentModel) {
      scene.remove(stateRef.current.currentModel);
      stateRef.current.currentModel = null;
    }

    const loader = new GLTFLoader();
    loader.load(
      currentCar.modelPath,
      (gltf) => {
        const model = gltf.scene;
        const rigged = inspectAndRigModel(model);
        scene.add(model);
        stateRef.current.currentModel = model;
        stateRef.current.riggedParts = rigged;
        if (onModelLoaded) onModelLoaded(rigged);
      },
      undefined,
      (err) => console.error(err)
    );
  }, [currentCar]);

  useEffect(() => {
    const { riggedParts } = stateRef.current;
    if (!riggedParts) return;

    riggedParts.doors.forEach((door) => {
      door.mesh.rotation.y = partsState.doors ? door.openAngle : door.initialY;
    });

    if (riggedParts.hood) {
      riggedParts.hood.mesh.rotation.x = partsState.hood ? riggedParts.hood.openAngle : riggedParts.hood.initialX;
    }

    if (riggedParts.spoiler) {
      riggedParts.spoiler.mesh.position.y = partsState.spoiler ? riggedParts.spoiler.raisedY : riggedParts.spoiler.initialY;
    }
  }, [partsState]);

  useEffect(() => {
    const { camera, controls, riggedParts } = stateRef.current;
    if (!camera || !controls) return;

    if (isCockpitView) {
      let targetPos = new THREE.Vector3(0.35, 1.15, -0.15);
      if (riggedParts?.steering) {
        const wp = new THREE.Vector3();
        riggedParts.steering.getWorldPosition(wp);
        targetPos.set(wp.x, wp.y + 0.35, wp.z + 0.55);
      }
      camera.position.copy(targetPos);
      controls.target.set(targetPos.x, targetPos.y, targetPos.z - 2.5);
    } else {
      camera.position.set(4.8, 2.2, 5.2);
      controls.target.set(0, 0.7, 0);
    }
  }, [isCockpitView]);

  return <div ref={mountRef} className="w-full h-full relative" />;
}
