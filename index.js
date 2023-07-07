async function sleep(time) {
  await new Promise((resolve) => {
    setTimeout(() => resolve(), time);
  })
}

async function main() {

  await sleep(5000);

  try {
    const conf = JSON.parse(window.javascript_obj?.getCameraHardwareConfigString());
    console.log("intrinsics", conf);
  } catch {
    console.log("failed to get intrinsics");
  }

  for (; ;) {
    try {
      const slam = JSON.parse(window.javascript_obj?.getMetaDataString())
      console.log("slam", slam)
    } catch {
      console.log("failed to get slam");
    }
    await sleep(3000);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  main();
})