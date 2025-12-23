const fs = require('fs');
const { xxh64 } = require('@node-rs/xxhash');
const { normalizeHex } = require('./normalizeHex.cjs');

function createNativeHasher() {
  return {
    hashFile(filePath) {
      const data = fs.readFileSync(filePath);
      return normalizeHex(xxh64(data).toString(16));
    }
  };
}

module.exports = { createNativeHasher };
