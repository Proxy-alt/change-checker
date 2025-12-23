import fs from "fs";import pkg from "@node-rs/xxhash";
const { xxh64 } = pkg;

export function createNativeHasher() {
  return {
    hashFile(filePath) {
      const data = fs.readFileSync(filePath);
      return xxh64(data).toString(16);
    },
  };
}
