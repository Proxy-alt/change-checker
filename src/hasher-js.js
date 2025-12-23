import fs from 'fs';
import * as XXH from 'xxhashjs';

export function createJsHasher() {
  return {
    hashFile(filePath) {
      const data = fs.readFileSync(filePath);
      return XXH.h64().update(data).digest().toString(16);
    }
  };
}
