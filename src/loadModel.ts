import * as THREE from "three";

import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

export function loadOccluderGLTF(path: string, onLoad: (root: GLTF) => void) {
  const objLoader = new GLTFLoader();
  objLoader.load(path, onLoad);
}

export function loadOccluderOBJ(
  path: string,
  onLoad: (root: THREE.Group) => void,
) {
  const objLoader = new OBJLoader();
  objLoader.load(path, onLoad);
}
