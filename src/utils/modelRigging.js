import * as THREE from 'three';

export function inspectAndRigModel(model) {
  const parts = {
    doors: [],
    hood: null,
    spoiler: null,
    steering: null
  };

  model.updateMatrixWorld(true);

  const bbox = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bbox.getSize(size);
  bbox.getCenter(center);

  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  const scale = 4.4 / maxAxis;
  model.scale.setScalar(scale);

  model.updateMatrixWorld(true);
  bbox.setFromObject(model);
  bbox.getCenter(center);
  model.position.x = -center.x;
  model.position.y = -bbox.min.y;
  model.position.z = -center.z;

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.envMapIntensity = 1.15;
        child.material.needsUpdate = true;
      }
    }

    const name = (child.name || '').toLowerCase();

    if (name.includes('door') || name.includes('porte')) {
      const isLeft =
        name.includes('left') || name.includes('_l') || name.includes('.l') || child.position.x > 0;
      parts.doors.push({
        mesh: child,
        side: isLeft ? 'left' : 'right',
        initialY: child.rotation.y,
        openAngle: child.rotation.y + (isLeft ? 0.72 : -0.72)
      });
    }

    if (
      (name.includes('hood') ||
        name.includes('bonnet') ||
        name.includes('engine_cover') ||
        name.includes('boot')) &&
      !parts.hood
    ) {
      parts.hood = {
        mesh: child,
        initialX: child.rotation.x,
        openAngle: child.rotation.x - 0.65
      };
    }

    if ((name.includes('spoiler') || name.includes('wing')) && !parts.spoiler) {
      parts.spoiler = {
        mesh: child,
        initialY: child.position.y,
        raisedY: child.position.y + 0.18
      };
    }

    if (name.includes('steering') && !parts.steering) {
      parts.steering = child;
    }
  });

  return parts;
}

export function disposeModel(model) {
  model.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          Object.values(mat).forEach((val) => {
            if (val && typeof val.dispose === 'function') {
              val.dispose();
            }
          });
          mat.dispose();
        });
      }
    }
  });
}