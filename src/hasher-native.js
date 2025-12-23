import pkg from '@node-rs/xxhash';
import fs from 'fs';
const { xxh64 } = pkg;

export function createNativeHasher() {
  return {
    hashFile(filePath) {
      const data = fs.readFileSync(filePath);
      return xxh64(data).toString(16);
    }
  };
}
