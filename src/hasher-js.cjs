const fs = require('fs');
const XXH = require('xxhashjs');
const { normalizeHex } = require('./normalizeHex.cjs');

function createJsHasher() {
  return {
    hashFile(filePath) {
      const data = fs.readFileSync(filePath);
      return normalizeHex(
        XXH.h64(0).update(data).digest().toString(16)
      );
    }
  };
}

module.exports = { createJsHasher };
