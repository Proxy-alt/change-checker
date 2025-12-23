import fs from 'fs';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import os from 'os';
import path from 'path';
import FolderChangeChecker from './index.js';

const BACKENDS = ['wasm', 'native', 'js'];

describe('FolderChangeChecker', () => {
  let tempDir;
  let mtimePath;
  let hashPath;

  before(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'change-checker-test-'));
    mtimePath = path.join(tempDir, 'mtimes.json');
    hashPath = path.join(tempDir, 'hashes.json');
  });

  after(() => {
    for (const file of fs.readdirSync(tempDir)) {
      fs.unlinkSync(path.join(tempDir, file));
    }
    fs.rmdirSync(tempDir);
  });

  for (const backend of BACKENDS) {
    describe(`with ${backend} backend`, () => {
      let checker;

      before(async () => {
        checker = new FolderChangeChecker({ mtimePath, hashPath, backend });
        await checker.ready;
      });

      it('should detect new file as changed', async () => {
        const testFile = path.join(tempDir, 'test.txt');
        fs.writeFileSync(testFile, 'hello world');

        const result = await checker.checkFile(testFile);
        assert.strictEqual(result, true);

        fs.unlinkSync(testFile);
      });

      it('should detect unchanged file', async () => {
        const testFile = path.join(tempDir, 'test.txt');
        fs.writeFileSync(testFile, 'hello world');

        await checker.checkFile(testFile);
        const result = await checker.checkFile(testFile);
        assert.strictEqual(result, false);

        fs.unlinkSync(testFile);
      });

      it('should detect modified file', async () => {
        const testFile = path.join(tempDir, 'test.txt');
        fs.writeFileSync(testFile, 'hello world');

        await checker.checkFile(testFile);

        fs.writeFileSync(testFile, 'hello world modified');

        const result = await checker.checkFile(testFile);
        assert.strictEqual(result, true);

        fs.unlinkSync(testFile);
      });

      it('checkFile with detail mode', async () => {
        const testFile = path.join(tempDir, 'test.txt');
        fs.writeFileSync(testFile, 'hello world');

        const result = await checker.checkFile(testFile, { mode: 'detail' });
        assert(result.filePath === testFile);
        assert(result.changed === true);
        assert(result.hash);

        fs.unlinkSync(testFile);
      });

      it('checkFolder', async () => {
        if (fs.existsSync(mtimePath)) fs.unlinkSync(mtimePath);
        if (fs.existsSync(hashPath)) fs.unlinkSync(hashPath);

        const testFile1 = path.join(tempDir, 'test1.txt');
        const testFile2 = path.join(tempDir, 'test2.txt');
        fs.writeFileSync(testFile1, 'content1');
        fs.writeFileSync(testFile2, 'content2');

        const result = await checker.checkFolder(tempDir);
        assert(Array.isArray(result));
        assert(result.length === 2);
        assert(result.includes(testFile1));
        assert(result.includes(testFile2));

        fs.unlinkSync(testFile1);
        fs.unlinkSync(testFile2);
      });

      it('computeHash', async () => {
        const testFile = path.join(tempDir, 'test.txt');
        fs.writeFileSync(testFile, 'hello world');

        const hash = await checker.computeHash(testFile);
        assert(typeof hash === 'string');
        assert(hash.length > 0);

        fs.unlinkSync(testFile);
      });
    });
  }
});
