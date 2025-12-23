const fs = require('fs');
const XXH = require('xxhashjs');

module.exports = function createJsHasher() {
  return {
    hashFile(filePath) {
      const data = fs.readFileSync(filePath);
      return XXH.h64().update(data).digest().toString(16);
    }
  };
};
