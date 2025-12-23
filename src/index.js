import fs from "fs";
import path from "path";
import XXH from "xxhashjs";

export class FolderChangeChecker {
  constructor({ mtimePath, hashPath }) {
    this.mtimePath = mtimePath;
    this.hashPath = hashPath;

    this.mtimes = this._loadJSON(mtimePath);
    this.hashes = this._loadJSON(hashPath);
  }

  _loadJSON(file) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      return {};
    }
  }

  _saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }

  computeHash(filePath) {
    const data = fs.readFileSync(filePath);
    return XXH.h64().update(data).digest().toString(16);
  }

  /**
   * Determine if metadata looks suspicious enough to require hashing
   */
  _isSuspicious(prev, stat) {
    if (!prev) return true;

    const { mtimeMs, size } = stat;

    // mtime went backwards
    if (mtimeMs < prev.mtimeMs) return true;

    // size unchanged but mtime changed → suspicious
    if (size === prev.size && mtimeMs !== prev.mtimeMs) return true;

    // tiny files are cheap to hash anyway
    if (size < 64) return true;

    return false;
  }

  /**
   * Check a single file
   */
  checkFile(filePath, options = {}) {
    const { mode = "boolean", onChange } = options;

    const stat = fs.statSync(filePath);
    const { mtimeMs, size } = stat;

    const prev = this.mtimes[filePath];

    // Fast path: unchanged
    if (prev && prev.mtimeMs === mtimeMs && prev.size === size) {
      if (mode === "detail") {
        return { changed: false, filePath, reason: "metadata-match" };
      }
      return false;
    }

    // Suspicious → hash fallback
    const suspicious = this._isSuspicious(prev, stat);
    let changed = true;
    let newHash = null;

    if (suspicious) {
      newHash = this.computeHash(filePath);
      const oldHash = this.hashes[filePath];
      changed = newHash !== oldHash;

      // Update stores
      this.hashes[filePath] = newHash;
    }

    // Always update metadata
    this.mtimes[filePath] = { mtimeMs, size };

    // Callback mode
    if (mode === "callback" && typeof onChange === "function") {
      onChange({
        filePath,
        changed,
        suspicious,
        mtimeMs,
        size,
        hash: newHash,
      });
    }

    // Detail mode
    if (mode === "detail") {
      return {
        filePath,
        changed,
        suspicious,
        mtimeMs,
        size,
        hash: newHash,
      };
    }

    // Boolean mode (default)
    return changed;
  }

  /**
   * Recursively walk a folder
   */
  checkFolder(folderPath) {
    let changedFiles = [];

    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);

        if (stat.isDirectory()) {
          walk(full);
        } else {
          if (this.checkFile(full)) {
            changedFiles.push(full);
          }
        }
      }
    };

    walk(folderPath);

    // Persist stores
    this._saveJSON(this.mtimePath, this.mtimes);
    this._saveJSON(this.hashPath, this.hashes);

    return changedFiles;
  }
}
