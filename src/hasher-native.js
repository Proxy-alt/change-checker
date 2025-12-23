import fs from 'fs';
import pkg from '@node-rs/xxhash';
import { normalizeHex } from './normalizeHex.js';

const { xxh64 } = pkg;

export function createNativeHasher() {
  return {
    hashFile(filePath) {
      const data = fs.readFileSync(filePath);
      return normalizeHex(xxh64(data).toString(16));
    }
  };
}
