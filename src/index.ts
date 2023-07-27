import "./index.css";
import * as THREE from "three";

import { loadOccluderGLTF, loadOccluderOBJ } from "./loadModel";

import { constructRequestDataEmbed, environments, sendToVps } from "./vpsV3";

import { v4 as uuidv4 } from "uuid";

import { initThree, ThreeContext } from "./initThree";

import * as Helpers from "./helpers";

import * as Mocks from "./mockResponse";

async function sleep(time: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

type OnLoad = (arg: any) => void;

interface LocationDescription {
  location_id: string;
  loadOccluder?: (arg: OnLoad) => void;
  loadGraphics?: (arg: OnLoad) => void;
  name?: string;
}

const hiderMaterial = new THREE.MeshStandardMaterial();
hiderMaterial.colorWrite = false;

const availableLocations: LocationDescription[] = [
  {
    location_id: "polytech",
    loadOccluder: (onLoad) => {
      loadOccluderGLTF("polytech.glb", (gltf) => {
        const dummyObj = new THREE.Object3D();
        gltf.scene.traverse((ch) => {
          try {
            (ch as THREE.Mesh).material = hiderMaterial;
          } catch {}
        });
        gltf.scene.rotateY(0.5 * Math.PI);
        dummyObj.add(gltf.scene);
        onLoad(dummyObj);
      });
    },

    loadGraphics: (onLoad) => {
      loadOccluderGLTF("monster scaled.glb", (gltf) => {
        const dummyObj = new THREE.Object3D();
        // gltf.scene.rotateY(0.5 * Math.PI);
        dummyObj.add(gltf.scene);
        onLoad(dummyObj);
      });
    },
  },
  {
    location_id: "Finlyandsky_station_63da64447ee6a98f5bff794e",
    name: "finlyandsky",
    loadOccluder: (onLoad) => {
      loadOccluderGLTF("finlyandsky_better_occluder.glb", (gltf) => {
        const dummyObj = new THREE.Object3D();
        gltf.scene.rotateY((90 / 180) * Math.PI);
        dummyObj.add(gltf.scene);
        onLoad(dummyObj);
      });
    },
  },
];

interface LocationOption {
  name?: string;
  location_id: string;
  occluder?: any;
  graphics?: any;
}

async function initUI(
  onSelect: (opt: Partial<LocationDescription & LocationOption>) => void,
) {
  const locationSelectEl = document.getElementById(
    "locationSelect",
  ) as HTMLSelectElement;

  const locations = [] as LocationOption[];

  for (let loc of availableLocations) {
    const newOption = document.createElement("option");
    newOption.setAttribute("value", loc.location_id);
    newOption.innerHTML = loc.name || loc.location_id;
    locationSelectEl.appendChild(newOption);

    locations.push({
      location_id: loc.location_id,
      name: loc.name || loc.location_id,
      occluder:
        loc.loadOccluder && (await new Promise((res) => loc.loadOccluder(res))),
      graphics:
        loc.loadGraphics && (await new Promise((res) => loc.loadGraphics(res))),
    });
  }

  currentLocation = locations[0];
  onSelect(currentLocation);

  locationSelectEl.addEventListener("change", (ev) => {
    const currentLocation = locations.find(
      (loc) => loc.location_id === (ev.target as HTMLInputElement).value,
    );

    onSelect(currentLocation);
  });
  // const selectLocaion
  const localizeButtonEl = document.getElementById(
    "localizeButton",
  ) as HTMLButtonElement;

  localizeButtonEl.addEventListener("click", () => {
    shouldContinue = !shouldContinue;

    localizeButtonEl.innerHTML = shouldContinue ? "pause" : "start";

    if (shouldContinue) {
      currentUuid = uuidv4();
    }
  });

  const uiContainerEl = document.getElementById(
    "uiContainer",
  ) as HTMLDivElement;

  const hideButtonEl = document.getElementById(
    "hideButton",
  ) as HTMLButtonElement;

  let shown = true;

  hideButtonEl.addEventListener("click", () => {
    shown = !shown;
    if (!shown) {
      hideButtonEl.innerHTML = "show";
      uiContainerEl.style.height = "2rem";
    } else {
      hideButtonEl.innerHTML = "hide";
      uiContainerEl.style.height = "auto";
    }
  });
}

let initialCamPos = new THREE.Vector3(0, 0, 0);
let initialCamRot = new THREE.Quaternion();
initialCamRot.identity();

const slamTranslate = new THREE.Vector3();
const slamQuat = new THREE.Quaternion();

let currentLocation: LocationOption;

let vpsPos = new THREE.Vector3(0, 0, 0);
let vpsRot = new THREE.Quaternion();

let shouldContinue = false;

let currentUuid = "";

let statusElement: HTMLDivElement;

function onAnimate({ camera, deltaTime }: ThreeContext) {
  camera.rotation.set(0, 0.5, 0);
  camera.position.set(100, 0, 100);
}

window.addEventListener("DOMContentLoaded", async () => {
  const { scene, camera } = initThree("threeCanvas", onAnimate);

  statusElement = document.getElementById("animateStatus") as HTMLDivElement;

  const target = new THREE.Object3D();
  scene.add(target);
  target.position.set(0, 0, 0);

  let sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
  sunLight.target = target;
  sunLight.position.set(50, 50, 50);
  scene.add(sunLight);

  sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
  sunLight.target = target;
  sunLight.position.set(-50, 50, 50);
  scene.add(sunLight);

  const wordlRig = new THREE.Object3D();

  scene.add(wordlRig);

  let currentGraphics: any;
  let currentOccluder: any;

  initUI((loc: LocationOption) => {
    currentLocation = loc;

    try {
      if (currentOccluder) {
        wordlRig.remove(currentOccluder);
      }
      wordlRig.add(loc.occluder);
      currentOccluder = loc.occluder;
    } catch {
      console.log("occluder missing");
    }

    try {
      if (currentGraphics) {
        wordlRig.remove(currentGraphics);
      }
      wordlRig.add(loc.graphics);
      currentGraphics = loc.graphics;
    } catch {
      console.log("graphics missing");
    }
  });

  const markerEl = document.getElementById("localizationStatusMarker");

  const localizationFrequency = 500;
});
