import { createJsHasher } from './hasher-js.js';
import { createNativeHasher } from './hasher-native.js';
import { createWasmHasher } from './hasher-wasm.js';

/**
 * Load the appropriate hashing backend.
 * @param {"wasm" | "native" | "js"} backend
 * @returns {Promise<{ hashFile(filePath: string): string }>}
 */
export async function loadHasher(backend) {
  switch (backend) {
    case 'native':
      return createNativeHasher();

    case 'js':
      return createJsHasher();

    case 'wasm':
    default:
      return await createWasmHasher();
  }
}
