import * as THREE from "three";

export interface ThreeContext {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  deltaTime: number;
}

export function initThree(elId: string, onAnimate: (c: ThreeContext) => void) {
  const threeCanvas = document.getElementById(elId) as HTMLCanvasElement;

  const renderWidth = document.body.offsetWidth;
  const renderHeight = document.body.offsetHeight;

  threeCanvas.width = renderWidth;
  threeCanvas.height = renderHeight;
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    canvas: threeCanvas,
  });

  renderer.setSize(renderWidth, renderHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    renderWidth / renderHeight,
    0.1,
    1000,
  );

  const clock = new THREE.Clock(true);

  function animate() {
    const deltaTime = clock.getDelta();

    requestAnimationFrame(animate);

    onAnimate({
      scene,
      camera,
      renderer,
      deltaTime,
    });

    renderer.render(scene, camera);
  }
  setTimeout(animate, 0);

  return {
    scene,
    camera,
    renderer,
  };
}
