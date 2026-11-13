import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { inspectAndRigModel, disposeModel } from '../utils/modelRigging.js';

const CAMERA_PRESETS = {
  hero: { pos: [4.4, 1.55, 4.8], target: [0, 0.58, 0] },
  profile: { pos: [5.6, 1.1, 0], target: [0, 0.55, 0] },
  rear: { pos: [-2.6, 1.45, -4.6], target: [0, 0.58, 0] }
};

const CAR_CONFIGS = {
  'ferrari-laferrari': {
    groundOffset: 0,
    interior: { offset: [0.22, 0.78, -0.02], steeringOffset: [0.02, -0.05, -0.25] }
  },
  'mclaren-p1': {
    groundOffset: -0.16,
    interior: { offset: [0.34, 0.82, 0.04], steeringOffset: [0.02, 0.01, -0.22] }
  },
  'porsche-918': {
    groundOffset: -0.06,
    interior: { offset: [0.21, 0.75, -0.04], steeringOffset: [0.02, -0.04, -0.26] }
  }
};

export default function CanvasScene({
  currentCar,
  cameraPreset,
  activeHotspot,
  graphicsQuality,
  isAutoRotate,
  currentTheme,
  onHotspotsProjected,
  onModelLoaded,
  onLoadProgress,
  onUserInteract
}) {
  const mountRef = useRef(null);
  const currentCarRef = useRef(currentCar);
  const onHotspotsProjectedRef = useRef(onHotspotsProjected);
  const onModelLoadedRef = useRef(onModelLoaded);
  const onLoadProgressRef = useRef(onLoadProgress);
  const cameraPresetRef = useRef(cameraPreset);
  const graphicsQualityRef = useRef(graphicsQuality);
  const currentThemeRef = useRef(currentTheme);

  currentCarRef.current = currentCar;
  onHotspotsProjectedRef.current = onHotspotsProjected;
  onModelLoadedRef.current = onModelLoaded;
  onLoadProgressRef.current = onLoadProgress;
  cameraPresetRef.current = cameraPreset;
  graphicsQualityRef.current = graphicsQuality;
  currentThemeRef.current = currentTheme;

  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    currentModel: null,
    riggedParts: null,
    skyUniforms: null,
    reflector: null,
    floorOverlayMat: null,
    shadowMesh: null,
    keyLight: null,
    fillLight: null,
    hemiLight: null,
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
    scene.background = new THREE.Color(0x07080c);
    scene.fog = new THREE.FogExp2(0x08090f, 0.028);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 120);
    camera.position.set(...CAMERA_PRESETS.hero.pos);

    const isPerf = graphicsQualityRef.current === 'performance';
    const renderer = new THREE.WebGLRenderer({
      antialias: !isPerf,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isPerf ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isPerf;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isPerf ? 1.35 : 1.65;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), isPerf ? 0.06 : 0.02).texture;
    scene.environment = envTexture;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.012;
    controls.minDistance = 0.6;
    controls.maxDistance = 12;
    controls.target.set(...CAMERA_PRESETS.hero.target);

    const skyGeo = new THREE.SphereGeometry(85, 32, 32);
    const initialRgb = currentThemeRef.current?.rgb || [0.30, 0.22, 0.52];

    const skyUniforms = {
      u_time: { value: 0 },
      u_res: { value: new THREE.Vector2(width * renderer.getPixelRatio(), height * renderer.getPixelRatio()) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_themeColor: { value: new THREE.Vector3(...initialRgb) }
    };

    const skyMat = new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      side: THREE.BackSide,
      fog: false,
      vertexShader: `
        void main(){
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_res;
        uniform vec2 u_mouse;
        uniform vec3 u_themeColor;

        float hash(float n){ return fract(sin(n) * 43758.5453123); }
        float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

        float stars(vec2 uv, float density){
          vec2 cell = floor(uv * density);
          vec2 sub = fract(uv * density);
          float h = hash2(cell);
          float brightness = step(0.972, h);
          float size = 0.03 + h * 0.045;
          float d = length(sub - vec2(hash2(cell + 100.0), hash2(cell + 200.0)));
          float star = brightness * smoothstep(size, 0.0, d);
          star *= 0.65 + 0.35 * sin(u_time * (1.5 + h * 4.0) + h * 6.28);
          return star * 2.2;
        }

        float singleShootingStar(vec2 uv, float t){
          float localT = t * 0.14;
          float cycle = fract(localT);
          float seed = floor(localT);
          float h1 = hash(seed * 7.31);
          float h2 = hash(seed * 13.17);

          vec2 start = vec2(0.18 + h1 * 0.65, 0.64 + h2 * 0.28);
          vec2 dir = normalize(vec2(1.0, -0.45 - h1 * 0.22));
          float progress = smoothstep(0.0, 0.38, cycle);
          vec2 pos = start + dir * progress * 0.68;

          vec2 toP = uv - pos;
          float along = dot(toP, dir);
          float perp = length(toP - dir * along);

          float trail = smoothstep(0.0, -0.22, along) * smoothstep(-0.34, -0.02, along);
          float core = smoothstep(0.0032, 0.0, perp) * trail;
          float glow = smoothstep(0.016, 0.0, perp) * trail * 0.55;
          float fade = smoothstep(0.0, 0.05, cycle) * smoothstep(0.45, 0.28, cycle);
          return (core + glow) * fade * 3.2;
        }

        void main(){
          vec2 uv = gl_FragCoord.xy / max(u_res, vec2(1.0));
          float aspect = u_res.x / max(u_res.y, 1.0);

          vec3 skyTop    = vec3(0.02, 0.022, 0.04);
          vec3 skyMid    = vec3(0.055, 0.058, 0.095) + u_themeColor * 0.2;
          vec3 skyBottom = vec3(0.045, 0.048, 0.08) + u_themeColor * 0.25;

          float skyGrad = uv.y;
          vec3 col = mix(skyBottom, skyMid, smoothstep(0.25, 0.65, skyGrad));
          col = mix(col, skyTop, smoothstep(0.65, 1.0, skyGrad));

          float horizonGlow = exp(-pow((skyGrad - 0.35) * 3.5, 2.0));
          col += u_themeColor * horizonGlow * 0.52;

          vec2 aspectUv = vec2(uv.x * aspect, uv.y);
          float starField = stars(aspectUv, 75.0) + stars(aspectUv + 300.0, 120.0) * 0.85;
          col += vec3(0.95, 0.96, 1.0) * starField;

          float s1 = singleShootingStar(aspectUv, u_time);
          col += (vec3(0.95, 0.98, 1.0) + u_themeColor * 0.45) * s1;

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyMesh);
    stateRef.current.skyUniforms = skyUniforms;

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
      if (cameraPresetRef.current === 'interior' && isMouseDown) {
        const dx = e.clientX - mouseX;
        const dy = e.clientY - mouseY;
        mouseX = e.clientX;
        mouseY = e.clientY;

        const st = stateRef.current;
        st.interiorAngles.lon -= dx * 0.0022;
        st.interiorAngles.lat -= dy * 0.0022;
        st.interiorAngles.lat = Math.max(-0.45, Math.min(0.35, st.interiorAngles.lat));
      }
      if (stateRef.current.skyUniforms) {
        stateRef.current.skyUniforms.u_mouse.value.set(
          e.clientX / window.innerWidth,
          1.0 - e.clientY / window.innerHeight
        );
      }
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

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x4b5568, 2.5);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const tLightRgb = currentThemeRef.current?.lightRgb || [1.0, 0.98, 1.05];
    const keyLight = new THREE.DirectionalLight(new THREE.Color(...tLightRgb), 3.6);
    keyLight.position.set(6, 12, 7);
    scene.add(keyLight);

    const themeColorObj = new THREE.Color(currentThemeRef.current?.primary || '#a78bfa');
    const fillLight = new THREE.DirectionalLight(themeColorObj, 2.4);
    fillLight.position.set(-8, 6, -5);
    scene.add(fillLight);

    const frontFill = new THREE.DirectionalLight(0xf8fafc, 1.8);
    frontFill.position.set(-5, 3.5, 8);
    scene.add(frontFill);

    stateRef.current.keyLight = keyLight;
    stateRef.current.fillLight = fillLight;
    stateRef.current.hemiLight = hemiLight;

    const reflectorGeo = new THREE.PlaneGeometry(240, 240);
    const reflector = new Reflector(reflectorGeo, {
      clipBias: 0.003,
      textureWidth: Math.floor(width * (isPerf ? 0.5 : 1)),
      textureHeight: Math.floor(height * (isPerf ? 0.5 : 1)),
      color: 0x383c4d
    });
    reflector.rotation.x = -Math.PI / 2;
    reflector.position.y = 0;
    reflector.visible = !isPerf;
    scene.add(reflector);
    stateRef.current.reflector = reflector;

    const floorOverlayGeo = new THREE.PlaneGeometry(240, 240);
    const floorOverlayMat = new THREE.MeshStandardMaterial({
      color: 0x0a0b12,
      roughness: isPerf ? 0.35 : 0.16,
      metalness: isPerf ? 0.75 : 0.88,
      transparent: true,
      opacity: isPerf ? 1.0 : 0.62,
      fog: true
    });
    const floorOverlay = new THREE.Mesh(floorOverlayGeo, floorOverlayMat);
    floorOverlay.rotation.x = -Math.PI / 2;
    floorOverlay.position.y = 0.001;
    scene.add(floorOverlay);
    stateRef.current.floorOverlayMat = floorOverlayMat;

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const ctx = shadowCanvas.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 128, 12, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
    gradient.addColorStop(0.55, 'rgba(0, 0, 0, 0.52)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(2.5, 4.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.003;
    scene.add(shadowMesh);
    stateRef.current.shadowMesh = shadowMesh;

    stateRef.current.scene = scene;
    stateRef.current.camera = camera;
    stateRef.current.renderer = renderer;
    stateRef.current.controls = controls;

    const projVec = new THREE.Vector3();
    let reqId;

    const animate = (t) => {
      reqId = requestAnimationFrame(animate);
      const st = stateRef.current;
      const curPreset = cameraPresetRef.current;
      const activeCarData = currentCarRef.current;

      if (st.skyUniforms) {
        st.skyUniforms.u_time.value = t * 0.001;
      }

      if (curPreset === 'interior') {
        controls.enabled = false;

        const carId = activeCarData?.id || 'ferrari-laferrari';
        const config = CAR_CONFIGS[carId]?.interior || CAR_CONFIGS['ferrari-laferrari'].interior;

        let driverHeadPos = new THREE.Vector3(...config.offset);
        if (st.riggedParts?.steering) {
          const wp = new THREE.Vector3();
          st.riggedParts.steering.getWorldPosition(wp);
          driverHeadPos.set(
            wp.x + config.steeringOffset[0],
            wp.y + config.steeringOffset[1],
            wp.z + config.steeringOffset[2]
          );
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

      const emitHotspots = onHotspotsProjectedRef.current;
      if (activeCarData?.hotspots && emitHotspots && mountRef.current && curPreset !== 'interior') {
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        const coords = activeCarData.hotspots.map((spot) => {
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
    reqId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      const dpr = renderer.getPixelRatio();
      if (stateRef.current.skyUniforms) {
        stateRef.current.skyUniforms.u_res.value.set(w * dpr, h * dpr);
      }
      if (stateRef.current.reflector) {
        stateRef.current.reflector.getRenderTarget().setSize(Math.floor(w * dpr), Math.floor(h * dpr));
      }
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
      shadowTex.dispose();
      envTexture.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const st = stateRef.current;
    if (!st.skyUniforms || !currentTheme) return;
    st.skyUniforms.u_themeColor.value.set(...currentTheme.rgb);
    if (st.fillLight) {
      st.fillLight.color.set(currentTheme.primary);
    }
    if (st.keyLight) {
      st.keyLight.color.set(new THREE.Color(...currentTheme.lightRgb));
    }
    if (st.scene?.fog) {
      const fogBase = new THREE.Color(0x07080c).lerp(new THREE.Color(currentTheme.primary), 0.14);
      st.scene.fog.color.copy(fogBase);
    }
  }, [currentTheme]);

  useEffect(() => {
    const st = stateRef.current;
    if (!st.renderer || !mountRef.current) return;
    const isPerf = graphicsQuality === 'performance';

    const dpr = isPerf ? 1 : Math.min(window.devicePixelRatio, 2);
    st.renderer.setPixelRatio(dpr);
    st.renderer.toneMappingExposure = isPerf ? 1.35 : 1.65;

    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;
    if (st.skyUniforms) {
      st.skyUniforms.u_res.value.set(w * dpr, h * dpr);
    }

    if (st.reflector) {
      st.reflector.visible = !isPerf;
      if (!isPerf) {
        st.reflector.getRenderTarget().setSize(Math.floor(w * dpr), Math.floor(h * dpr));
      }
    }

    if (st.floorOverlayMat) {
      st.floorOverlayMat.opacity = isPerf ? 1.0 : 0.62;
      st.floorOverlayMat.roughness = isPerf ? 0.35 : 0.16;
      st.floorOverlayMat.needsUpdate = true;
    }
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

        const carId = currentCar.id || 'ferrari-laferrari';
        const config = CAR_CONFIGS[carId] || CAR_CONFIGS['ferrari-laferrari'];
        model.position.y += config.groundOffset;

        model.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.envMapIntensity = 2.2;
            child.material.needsUpdate = true;
          }
        });

        scene.add(model);
        stateRef.current.currentModel = model;
        stateRef.current.riggedParts = rigged;
        if (onLoadProgressRef.current) onLoadProgressRef.current(100);
        if (onModelLoadedRef.current) onModelLoadedRef.current(rigged);
      },
      (xhr) => {
        if (cancelled) return;
        if (xhr.lengthComputable && onLoadProgressRef.current) {
          const pct = Math.min(95, Math.round((xhr.loaded / xhr.total) * 95));
          onLoadProgressRef.current(pct);
        }
      },
      (err) => {
        console.error('GLTF Load Error:', err);
        if (!cancelled && onModelLoadedRef.current) onModelLoadedRef.current(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [currentCar]);

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
    const st = stateRef.current;
    if (!activeHotspot) {
      if (cameraPresetRef.current && cameraPresetRef.current !== 'interior') {
        const preset = CAMERA_PRESETS[cameraPresetRef.current] || CAMERA_PRESETS.hero;
        st.desiredCamPos.set(...preset.pos);
        st.desiredTarget.set(...preset.target);
        st.isTransitioning = true;
      }
      return;
    }
    const [hx, hy, hz] = activeHotspot.position;
    st.desiredTarget.set(hx, hy, hz);
    const dir = new THREE.Vector3(hx || 0.4, 0.6, hz || 0.8).normalize();
    st.desiredCamPos.set(hx + dir.x * 2.4, hy + 0.85, hz + dir.z * 2.4);
    st.isTransitioning = true;
  }, [activeHotspot]);

  return <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing" />;
}