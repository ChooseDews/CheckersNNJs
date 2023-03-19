global.tfjs = await import("@tensorflow/tfjs-node");
let trainer = await import("./trainNN.js");
await trainer.trainNN();