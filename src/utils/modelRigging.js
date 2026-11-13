import * as THREE from 'three';

export function inspectAndRigModel(model) {
  const parts = {
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