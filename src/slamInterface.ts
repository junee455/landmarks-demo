import { mockData } from "./mockData";

const IS_SAFARI =
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
  navigator.userAgent.toLowerCase().includes("iphone");

export interface Pose {
  quaternion: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
  translation: [number, number, number];
}

export interface EmbedData {
  base64Vector: Blob;
  pose: Pose;
  timestamp: number;
}

export interface Intrinsics {
  cx: number;
  cy: number;
  fx: number;
  fy: number;
  height: number;
  width: number;
}

let iosIntrinsics: Intrinsics;
let iosEmbed: EmbedData;
let iosPose: Pose;

export function getSlam() {
  if (IS_SAFARI) {
    return iosPose;
  }
  // @ts-ignore
  return JSON.parse(window.javascript_obj.getTrackingPose()) as Pose;
}

function base64VectorToBlob(base64Vector: string): Blob {
  const byteChars = atob(base64Vector);

  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);

  return new Blob([byteArray]);
}

export function getEmbed(): EmbedData {
  let embd;

  if (IS_SAFARI) {
    embd = iosEmbed;
  } else {
    // @ts-ignore
    embd = JSON.parse(window.javascript_obj.getEmbeddingData()) as {
      base64Vector: string;
      pose: Pose;
      timestamp: number;
    };
  }

  return {
    ...embd,
    base64Vector: base64VectorToBlob(embd.base64Vector as string),
  };
}

export function getIntrinsics(): Intrinsics {
  if (IS_SAFARI) {
    return iosIntrinsics;
  }

  try {
    return JSON.parse(
      // @ts-ignore
      window.javascript_obj.getCameraHardwareConfigString(),
    ) as any;
  } catch {
    return JSON.parse(mockData);
  }
}

export function iosWriteSlam(pose: string) {
  iosPose = JSON.parse(pose) as Pose;
}

export function iosWriteIntrinsics(intrinsics: string) {
  iosIntrinsics = JSON.parse(intrinsics) as Intrinsics;
}

export function iosWriteEmbedData(embed: string) {
  iosEmbed = JSON.parse(embed) as EmbedData;
}

if (IS_SAFARI) {
  // @ts-ignore
  window.iosWriteSlam = iosWriteSlam;
  // @ts-ignore
  window.iosWriteIntrinsics = iosWriteIntrinsics;
  // @ts-ignore
  window.iosWriteEmbedData = iosWriteEmbedData;
}
