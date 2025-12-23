const fs = require("fs");
const path = require("path");
const { loadHasher } = require("./loadHasher.cjs");

/**
 * Options for how file change results are returned.
 * @typedef {"boolean" | "detail" | "callback"} ChangeCheckMode
 */

/**
 * Callback info passed when mode === "callback".
 * @typedef {Object} ChangeInfo
 * @property {string} filePath
 * @property {boolean} changed
 * @property {boolean} suspicious
 * @property {number} mtimeMs
 * @property {number} size
 * @property {string | null} hash
 */

/**
 * Options for checkFile and checkFolder.
 * @typedef {Object} CheckOptions
 * @property {ChangeCheckMode} [mode="boolean"]
 * @property {(info: ChangeInfo) => void} [onChange]
 */

/**
 * Persistent file-change checker using mtime+size with xxh3 fallback.
 */
module.exports = class FolderChangeChecker {
  /**
   * @param {{ mtimePath: string, hashPath: string, backend?: "wasm" | "native" | "js" }} options
   */
  constructor({ mtimePath, hashPath, backend = "wasm" }) {
    this.mtimePath = mtimePath;
    this.hashPath = hashPath;
    this.backend = backend;

    this.mtimes = this._loadJSON(mtimePath);
    this.hashes = this._loadJSON(hashPath);

    // Load hasher asynchronously
    this.ready = loadHasher(backend).then((hasher) => {
      this.hasher = hasher;
    });
  }

  async computeHash(filePath) {
    await this.ready;
    return this.hasher.hashFile(filePath);
  }
  /**
   * Determine if metadata looks suspicious enough to require hashing.
   * @private
   * @param {{mtimeMs:number,size:number}|undefined} prev
   * @param {fs.Stats} stat
   * @returns {boolean}
   */
  _isSuspicious(prev, stat) {
    if (!prev) return true;

    const { mtimeMs, size } = stat;

    if (mtimeMs < prev.mtimeMs) return true;
    if (size === prev.size && mtimeMs !== prev.mtimeMs) return true;
    if (size < 64) return true;

    return false;
  }

  /**
   * Check a single file for changes.
   * @param {string} filePath
   * @param {CheckOptions} [options]
   * @returns {boolean | ChangeInfo}
   */
  checkFile(filePath, options = {}) {
    const { mode = "boolean", onChange } = options;

    const stat = fs.statSync(filePath);
    const { mtimeMs, size } = stat;

    const prev = this.mtimes[filePath];

    if (prev && prev.mtimeMs === mtimeMs && prev.size === size) {
      if (mode === "detail") {
        return {
          filePath,
          changed: false,
          suspicious: false,
          mtimeMs,
          size,
          hash: null,
        };
      }
      return false;
    }

    const suspicious = this._isSuspicious(prev, stat);

    let newHash = null;
    let changed = true;

    if (suspicious) {
      newHash = this.computeHash(filePath);
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
      hash: newHash,
    };

    if (mode === "callback" && typeof onChange === "function") {
      onChange(info);
    }

    if (mode === "detail") {
      return info;
    }

    return changed;
  }

  /**
   * Recursively check all files in a folder.
   * @param {string} folderPath
   * @param {CheckOptions} [options]
   * @returns {Array<string> | Array<ChangeInfo>}
   */
  checkFolder(folderPath, options = {}) {
    const results = [];

    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);

        if (stat.isDirectory()) {
          walk(full);
        } else {
          const result = this.checkFile(full, options);

          if (options.mode === "detail") {
            results.push(result);
          } else if (options.mode === "boolean" && result) {
            results.push(full);
          }
        }
      }
    };

    walk(folderPath);

    this._saveJSON(this.mtimePath, this.mtimes);
    this._saveJSON(this.hashPath, this.hashes);

    return results;
  }
};
