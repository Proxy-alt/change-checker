import fs from 'fs';
import XXH from 'xxhashjs';
import { normalizeHex } from './normalizeHex.js';

export function createJsHasher() {
  return {
    hashFile(filePath) {
      const data = fs.readFileSync(filePath);
      return normalizeHex(
        XXH.h64(0).update(data).digest().toString(16)
      );
    }
  };
}
