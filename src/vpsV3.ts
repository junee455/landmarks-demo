/**
 * Constructs vps request data
 *
 * @param {Blob} photo - a blob with photo
 * @param {number} photoWidth - photo width in px
 * @param {number} photoHeight - photo height in px
 * @param {number} fxfy - photo intrinsics fx and fy in px
 * @param {string[]} locationsIds - locations Ids
 * @param {string} sessionId - uuidv4 session id
 * @param {{
 * x: number,
 * y: number,
 * z: number,
 * rx: number,
 * ry: number,
 * rz: number,
 * }} trackerPos
 * @return {FormData}
 */

interface TrackingPose {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
}

export function constructRequestJson(
  photoWidth: number,
  photoHeight: number,
  fxfy: number,
  locationsIds: string[],
  sessionId: string,
  trackerPos: TrackingPose | null = null,
) {
  const fx = fxfy;
  const fy = fxfy;

  const requestJson = {
    attributes: {
      location_ids: locationsIds,
      session_id: sessionId,
      timestamp: new Date().getTime(),
      client_coordinate_system: "arcore",
      tracking_pose: trackerPos
        ? trackerPos
        : {
            x: 0,
            y: 0,
            z: 0,
            rx: 0,
            ry: 0,
            rz: 0,
          },
      intrinsics: {
        width: photoWidth,
        height: photoHeight,

        fx,
        fy,
        cx: photoWidth / 2,
        cy: photoHeight / 2,
      },
    },
  };

  return requestJson;
}

interface Intrinsics {
  cx: number;
  cy: number;
  fx: number;
  fy: number;
  height: number;
  width: number;
}

export function constructRequestDataEmbed(
  data: Blob,
  intrinsics: Intrinsics,
  locationsIds: string[],
  sessionId: string,
  trackerPos: TrackingPose | null = null,
) {
  const requestJson = {
    attributes: {
      location_ids: locationsIds,
      session_id: sessionId,
      timestamp: new Date().getTime(),
      client_coordinate_system: "arcore",
      tracking_pose: trackerPos
        ? trackerPos
        : {
            x: 0,
            y: 0,
            z: 0,
            rx: 0,
            ry: 0,
            rz: 0,
          },
      intrinsics,
    },
  };

  const formData = new FormData();
  formData.append("embedding", data);
  formData.append("json", JSON.stringify({ data: requestJson }));

  return formData;
}

export function constructRequestDataImg(
  photo: Blob,
  photoWidth: number,
  photoHeight: number,
  fxfy: number,
  locationsIds: string[],
  sessionId: string,
  trackerPos: TrackingPose | null = null,
) {
  const requestJson = constructRequestJson(
    photoWidth,
    photoHeight,
    fxfy,
    locationsIds,
    sessionId,
    trackerPos,
  );

  const formData = new FormData();
  formData.append("image", photo);
  formData.append("json", JSON.stringify({ data: requestJson }));

  return formData;
}

export const environments = {
  stage: "https://vps-stage.naviar.io/vps/api/v3",
  prod: "https://vps.naviar.io/vps/api/v3",
};

export interface VpsV3Response {
  data: {
    status: string;
    status_description: null;
    attributes?: {
      location_id: string;
      location: {
        gps: {
          latitude: number;
          longitude: number;
          altitude: number;
          accuracy: number;
          timestamp: number;
        };
        compass: {
          heading: number;
          accuracy: number;
          timestamp: number;
        };
      };
      tracking_pose: {
        x: number;
        y: number;
        z: number;
        rx: number;
        ry: number;
        rz: number;
      };
      vps_pose: {
        x: number;
        y: number;
        z: number;
        rx: number;
        ry: number;
        rz: number;
      };
    };
  };
}

/**
 * Sends request to vps
 *
 * @param {FormData} formData
 * @param {string} url
 * @returns {Promise<VpsV3Response>}
 */
export function sendToVps(
  formData: FormData,
  url: string,
): Promise<VpsV3Response> {
  return fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  }).then((res) => res.json());
}

/*
unity localization result

{
    "status": "done",
    "status_description": null,
    "attributes": {
        "location_id": "polytech",
        "location": {
            "gps": {
                "latitude": 55.756957845687815,
                "longitude": 37.62934098076874,
                "altitude": 0,
                "accuracy": 0,
                "timestamp": 1688744161.0823774
            },
            "compass": {
                "heading": 2.1622184775532105,
                "accuracy": 0,
                "timestamp": 1688744161.0825846
            }
        },
        "tracking_pose": {
            "x": 0,
            "y": 0,
            "z": 0,
            "rx": 0,
            "ry": 0,
            "rz": 0
        },
        "vps_pose": {
            "x": -185.49988588980548,
            "y": -2.2978620977654485,
            "z": 31.352078336355305,
            "rx": -1.7577962658650772,
            "ry": 129.96221847755325,
            "rz": 2.1323215358133534
        }
    }
}



{
    "status": "done",
    "status_description": null,
    "attributes": {
        "location_id": "polytech",
        "location": {
            "gps": {
                "latitude": 55.756957226778994,
                "longitude": 37.62933688285095,
                "altitude": 0,
                "accuracy": 0,
                "timestamp": 1688744236.091111
            },
            "compass": {
                "heading": 2.3984521611948253,
                "accuracy": 0,
                "timestamp": 1688744236.0912516
            }
        },
        "tracking_pose": {
            "x": 0,
            "y": 0,
            "z": 0,
            "rx": 0,
            "ry": 0,
            "rz": 0
        },
        "vps_pose": {
            "x": -185.39711051461362,
            "y": -2.786254252388382,
            "z": 31.596859486326142,
            "rx": -2.143540611617838,
            "ry": 130.19845216119484,
            "rz": 1.7467823764500148
        }
    }
}
*/
