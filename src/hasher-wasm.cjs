const fs = require('fs');
const xxhash = require('xxhash-wasm');

exports.createWasmHasher = async function () {
  const api = await xxhash();

  return {
    hashFile(filePath) {
      const data = fs.readFileSync(filePath);
      return api.h64Raw(data).toString(16);
    }
  };
};
