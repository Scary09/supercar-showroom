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
  const scale = 4.2 / maxAxis;
  model.scale.setScalar(scale);

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
        child.material.needsUpdate = true;
      }
    }

    const name = (child.name || '').toLowerCase();

    if (name.includes('door') || name.includes('porte')) {
      const isLeft = name.includes('left') || name.includes('_l') || name.includes('.l') || child.position.x > 0;
      parts.doors.push({
        mesh: child,
        side: isLeft ? 'left' : 'right',
        initialY: child.rotation.y,
        openAngle: child.rotation.y + (isLeft ? 0.75 : -0.75)
      });
    }

    if (name.includes('hood') || name.includes('bonnet') || name.includes('engine_cover') || name.includes('boot')) {
      if (!parts.hood) {
        parts.hood = {
          mesh: child,
          initialX: child.rotation.x,
          openAngle: child.rotation.x - 0.75
        };
      }
    }

    if (name.includes('spoiler') || name.includes('wing')) {
      if (!parts.spoiler) {
        parts.spoiler = {
          mesh: child,
          initialY: child.position.y,
          raisedY: child.position.y + 0.25
        };
      }
    }

    if (name.includes('steering') && !parts.steering) {
      parts.steering = child;
    }
  });

  return parts;
}
