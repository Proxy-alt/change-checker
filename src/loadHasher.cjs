const { createWasmHasher } = require("./hasher-wasm.cjs");
const { createNativeHasher } = require("./hasher-native.cjs");
const { createJsHasher } = require("./hasher-js.cjs");

/**
 * Load the appropriate hashing backend.
 * @param {"wasm" | "native" | "js"} backend
 * @returns {Promise<{ hashFile(filePath: string): string }>}
 */
exports.loadHasher = async function (backend) {
  switch (backend) {
    case "native":
      return createNativeHasher();

    case "js":
      return createJsHasher();

    case "wasm":
    default:
      return await createWasmHasher();
  }
};
