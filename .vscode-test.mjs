import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig } from "@vscode/test-cli";

const workspaceFolder = mkdtempSync(path.join(tmpdir(), "color-my-workspaces-test-"));
writeFileSync(path.join(workspaceFolder, "README.md"), "# Integration fixture\n", "utf8");
process.on("exit", () => rmSync(workspaceFolder, { recursive: true, force: true }));

export default defineConfig({
  label: `desktop-${process.env.VSCODE_TEST_VERSION ?? "stable"}`,
  files: "dist-test/**/*.test.cjs",
  version: process.env.VSCODE_TEST_VERSION ?? "stable",
  workspaceFolder,
  mocha: {
    timeout: 30_000,
  },
});
