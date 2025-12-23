const fs = require('fs');
const xxhash = require('xxhash-wasm');
const { normalizeHex } = require('./normalizeHex.cjs');

async function createWasmHasher() {
  const api = await xxhash();

  return {
    hashFile(filePath) {
      const data = fs.readFileSync(filePath);
      return normalizeHex(api.h64Raw(data).toString(16));
    }
  };
}

module.exports = { createWasmHasher };
