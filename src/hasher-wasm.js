import fs from 'fs';
import xxhash from 'xxhash-wasm';
import { normalizeHex } from './normalizeHex.js';

export async function createWasmHasher() {
  const api = await xxhash();

  return {
    hashFile(filePath) {
      const data = fs.readFileSync(filePath);
      return normalizeHex(api.h64Raw(data).toString(16));
    }
  };
}
