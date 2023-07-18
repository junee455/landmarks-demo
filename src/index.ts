import "./index.css";
import * as THREE from "three";

import { loadOccluderGLTF, loadOccluderOBJ } from "./loadModel";

import { constructRequestDataEmbed, environments, sendToVps } from "./vpsV3";

import { v4 as uuidv4 } from "uuid";

import {
  getSlam,
  getIntrinsics,
  getEmbed,
  Intrinsics,
  EmbedData,
} from "./slamInterface";

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
  try {
    const slamVals = getSlam();

    const quat = slamVals.quaternion;

    slamTranslate.set(...slamVals.translation);
    slamQuat.set(quat.x, quat.y, quat.z, quat.w);

    camera.position.copy(initialCamPos);
    camera.position.add(slamTranslate);

    camera.quaternion.copy(initialCamRot);
    camera.quaternion.multiply(slamQuat);

    camera.updateMatrixWorld();
    camera.updateMatrix();
  } catch {
    camera.rotation.set(0, 0.5, 0);
    camera.position.set(100, 0, 100);
  }
}

async function computeFov(camera: THREE.PerspectiveCamera) {
  for (let i = 0; i < 10; i++) {
    try {
      const tempIntrinsics = getIntrinsics();
      const fx = Math.min(tempIntrinsics.fx, tempIntrinsics.fy);
      const fy = Math.max(tempIntrinsics.fx, tempIntrinsics.fy);

      const width = Math.min(tempIntrinsics.height, tempIntrinsics.width);
      const height = Math.max(tempIntrinsics.height, tempIntrinsics.width);

      const fovY = (2 * Math.atan(height / (2 * fy)) * 180) / Math.PI;
      const fovX = (2 * Math.atan(width / (2 * fx)) * 180) / Math.PI;

      camera.fov = (fovY + fovX) / 2;
      camera.updateProjectionMatrix();
      return;
    } catch {
      await sleep(100);
    }
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const { scene, camera } = initThree("threeCanvas", onAnimate);

  statusElement = document.getElementById("animateStatus") as HTMLDivElement;

  computeFov(camera);

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

  async function vpsLoop() {
    for (;;) {
      if (shouldContinue) {
        try {
          let slamVals: EmbedData;
          let intrinsics: Intrinsics;
          for (let i = 0; i < 10; i++) {
            try {
              slamVals = getEmbed();
              intrinsics = getIntrinsics();
              if (slamVals && intrinsics) {
                break;
              }
            } catch {
              console.log("failed to get slam");
            }
          }
          if (!slamVals || !intrinsics) {
            await sleep(localizationFrequency);

            throw new Error("metadata missing");
          }

          console.log(intrinsics);

          const blob = slamVals.base64Vector;

          const trackQuat = new THREE.Quaternion(
            slamVals.pose.quaternion.x,
            slamVals.pose.quaternion.y,
            slamVals.pose.quaternion.z,
            slamVals.pose.quaternion.w,
          );

          const trackEuler = new THREE.Euler().setFromQuaternion(
            trackQuat,
            "YXZ",
          );

          const trackPose = new THREE.Vector3(...slamVals.pose.translation);

          let trackerPos = {
            x: slamVals.pose.translation[0],
            y: slamVals.pose.translation[1],
            z: slamVals.pose.translation[2],
            rx: THREE.MathUtils.radToDeg(trackEuler.x),
            ry: THREE.MathUtils.radToDeg(trackEuler.y),
            rz: THREE.MathUtils.radToDeg(trackEuler.z),
          };

          const formData = constructRequestDataEmbed(
            blob,
            {
              ...intrinsics,
              cx: Math.min(intrinsics.cx, intrinsics.cy),
              cy: Math.max(intrinsics.cx, intrinsics.cy),
              width: Math.min(intrinsics.height, intrinsics.width),
              height: Math.max(intrinsics.height, intrinsics.width),
            },
            [currentLocation.location_id],
            currentUuid,
            trackerPos,
          );

          const vpsRes = (await sendToVps(formData, environments.stage)).data;

          if (vpsRes.status === "done" && vpsRes.attributes) {
            markerEl.style.backgroundColor = "green";

            vpsPos.set(
              vpsRes.attributes.vps_pose.x,
              vpsRes.attributes.vps_pose.y,
              vpsRes.attributes.vps_pose.z,
            );

            vpsRot.setFromEuler(
              new THREE.Euler(
                (vpsRes.attributes.vps_pose.rx / 180) * Math.PI,
                (vpsRes.attributes.vps_pose.ry / 180) * Math.PI,
                (vpsRes.attributes.vps_pose.rz / 180) * Math.PI,
                "YXZ",
              ),
              true,
            );

            const actualCamPos = Helpers.correctPosition(
              trackPose.toArray(),
              vpsPos.toArray(),
              camera.position.toArray(),
            );

            const actualCamRot = Helpers.correctAngle(
              trackQuat,
              vpsRot,
              camera.quaternion,
            );

            const worldRigTransform = Helpers.getWorldRigTransform(
              camera.position,
              new THREE.Vector3(...actualCamPos),
              camera.quaternion,
              actualCamRot,
            );

            wordlRig.position.copy(worldRigTransform.position);
            wordlRig.quaternion.copy(worldRigTransform.rotation);
          } else {
            markerEl.style.backgroundColor = "red";
          }

          console.log(vpsRes);
        } catch (e) {
          markerEl.style.backgroundColor = "yellow";

          // const vpsPos = Mocks.polytechFront.attributes.vps_pose;
          const vpsPos = Mocks.polytechRight.attributes.vps_pose;

          const vpsQuat = new THREE.Quaternion();
          vpsQuat.setFromEuler(
            new THREE.Euler(
              (vpsPos.rx / 180) * Math.PI,
              (vpsPos.ry / 180) * Math.PI,
              (vpsPos.rz / 180) * Math.PI,
              "YXZ",
            ),
            true,
          );

          const worldRigTransform = Helpers.getWorldRigTransform(
            camera.position,
            new THREE.Vector3(vpsPos.x, vpsPos.y, vpsPos.z),
            camera.quaternion,
            vpsQuat,
          );

          wordlRig.position.copy(worldRigTransform.position);
          wordlRig.quaternion.copy(worldRigTransform.rotation);

          console.log(e);
        }
      }
      await sleep(localizationFrequency);
    }
  }

  vpsLoop();

  try {
    console.log(getIntrinsics());
    console.log(getSlam());
  } catch {
    console.log("failed to get device metadata");
  }
});
