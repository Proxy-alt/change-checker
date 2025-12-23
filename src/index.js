import fs from 'fs';
import path from 'path';
import { loadHasher } from './loadHasher.js';

class FolderChangeChecker {
  constructor({ mtimePath, hashPath, backend = 'wasm' }) {
    this.mtimePath = mtimePath;
    this.hashPath = hashPath;
    this.backend = backend;

    this.mtimes = this._loadJSON(mtimePath);
    this.hashes = this._loadJSON(hashPath);

    this.ready = loadHasher(backend).then((hasher) => {
      this.hasher = hasher;
    });
  }

  async computeHash(filePath) {
    await this.ready;
    return this.hasher.hashFile(filePath);
  }

  _isSuspicious(prev, stat) {
    if (!prev) return true;

    const { mtimeMs, size } = stat;

    if (mtimeMs < prev.mtimeMs) return true;
    if (size === prev.size && mtimeMs !== prev.mtimeMs) return true;
    if (size < 64) return true;

    return false;
  }

  async checkFile(filePath, options = {}) {
    const { mode = 'boolean', onChange } = options;

    const stat = fs.statSync(filePath);
    const { mtimeMs, size } = stat;

    const prev = this.mtimes[filePath];

    if (prev && prev.mtimeMs === mtimeMs && prev.size === size) {
      if (mode === 'detail') {
        return {
          filePath,
          changed: false,
          suspicious: false,
          mtimeMs,
          size,
          hash: null
        };
      }
      return false;
    }

    const suspicious = this._isSuspicious(prev, stat);

    let newHash = null;
    let changed = true;

    if (suspicious) {
      newHash = await this.computeHash(filePath);
      const oldHash = this.hashes[filePath];
      changed = newHash !== oldHash;
      this.hashes[filePath] = newHash;
    }

    this.mtimes[filePath] = { mtimeMs, size };

    const info = {
      filePath,
      changed,
      suspicious,
      mtimeMs,
      size,
      hash: newHash
    };

    if (mode === 'callback' && typeof onChange === 'function') {
      onChange(info);
    }

    if (mode === 'detail') {
      return info;
    }

    return changed;
  }

  async checkFolder(folderPath, options = {}) {
    const results = [];

    const walk = async (dir) => {
      for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);

        if (stat.isDirectory()) {
          await walk(full);
        } else {
          const result = await this.checkFile(full, options);

          if (result) {
            results.push(options.mode === 'detail' ? result : full);
          }
        }
      }
    };

    await walk(folderPath);

    this._saveJSON(this.mtimePath, this.mtimes);
    this._saveJSON(this.hashPath, this.hashes);

    return results;
  }

  _loadJSON(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  _saveJSON(filePath, obj) {
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
  }
}

export default FolderChangeChecker;
