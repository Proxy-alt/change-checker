import fs from 'fs';
import xxhash from 'xxhash-wasm';

export async function createWasmHasher() {
  const api = await xxhash();

  return {
    hashFile(filePath) {
      const data = fs.readFileSync(filePath);
      return api.h64Raw(data).toString(16);
    }
  };
}
