declare module "change-checker" {
  export type ChangeCheckMode = "boolean" | "detail" | "callback";

  export interface ChangeInfo {
    filePath: string;
    changed: boolean;
    suspicious: boolean;
    mtimeMs: number;
    size: number;
    hash: string | null;
  }

  export interface CheckOptions {
    mode?: ChangeCheckMode;
    onChange?: (info: ChangeInfo) => void;
  }

  export type HashBackend = "wasm" | "native" | "js";

  export interface CheckerInit {
    mtimePath: string;
    hashPath: string;
    backend?: HashBackend;
  }

  export class FolderChangeChecker {
    constructor(options: CheckerInit);

    computeHash(filePath: string): Promise<string>;

    checkFile(
      filePath: string,
      options?: CheckOptions
    ): Promise<boolean | ChangeInfo>;

    checkFolder(
      folderPath: string,
      options?: CheckOptions
    ): Promise<Array<string> | Array<ChangeInfo>>;
  }

  export default FolderChangeChecker;
}
