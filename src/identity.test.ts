import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { folderIdentity, projectDisplayName, truncateLabel, workspaceIdentity } from "./identity.ts";

describe("folderIdentity", () => {
  it("uses parent/name so the same repo matches across user paths", () => {
    assert.equal(folderIdentity("C:\\Users\\ada\\projects\\shop"), "projects/shop");
    assert.equal(folderIdentity("/home/ada/projects/shop"), "projects/shop");
  });

  it("drops a Windows drive letter when it is the only parent", () => {
    assert.equal(folderIdentity("X:\\vscode-color"), "vscode-color");
  });
});

describe("workspaceIdentity", () => {
  it("prefers the workspace file name", () => {
    assert.equal(
      workspaceIdentity({
        workspaceFile: "C:\\work\\shop.code-workspace",
        folders: ["C:\\work\\api", "C:\\work\\web"],
      }),
      "shop",
    );
  });

  it("joins multi-root folders when there is no workspace file", () => {
    assert.equal(
      workspaceIdentity({
        folders: ["C:\\work\\api", "C:\\work\\web"],
      }),
      "work/api|work/web",
    );
  });

  it("returns nothing without a folder", () => {
    assert.equal(workspaceIdentity({ folders: [] }), undefined);
  });
});

describe("projectDisplayName", () => {
  it("prefers a custom label", () => {
    assert.equal(
      projectDisplayName({
        customLabel: "Shop API",
        workspaceName: "shop",
        folders: ["C:\\work\\api"],
      }),
      "Shop API",
    );
  });

  it("ignores a blank custom label", () => {
    assert.equal(
      projectDisplayName({
        customLabel: "   ",
        workspaceName: "shop",
        folders: ["C:\\work\\api"],
      }),
      "shop",
    );
  });

  it("prefers the workspace name", () => {
    assert.equal(projectDisplayName({ workspaceName: "shop", folders: ["C:\\work\\api"] }), "shop");
  });

  it("falls back to the folder name", () => {
    assert.equal(
      projectDisplayName({ folders: ["C:\\work\\vscode-color"] }),
      "vscode-color",
    );
  });
});

describe("truncateLabel", () => {
  it("leaves short names intact", () => {
    assert.equal(truncateLabel("shop", 28), "shop");
  });

  it("clips long names", () => {
    const label = truncateLabel("abcdefghijklmnopqrstuvwxyz0123", 10);
    assert.equal(label.length, 10);
    assert.equal(label.endsWith("…"), true);
  });
});
