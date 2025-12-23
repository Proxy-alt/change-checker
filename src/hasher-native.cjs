const fs = require("fs");
const { xxh64 } = require("@node-rs/xxhash");

exports.createNativeHasher = function createNativeHasher() {
  return {
    hashFile(filePath) {
      const data = fs.readFileSync(filePath);
      return xxh64(data).toString(16);
    },
  };
};
