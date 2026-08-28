import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeManagedColors } from "./merge.ts";

const managed = ["titleBar.activeBackground", "statusBar.background"];

describe("mergeManagedColors", () => {
  it("keeps colors the user set that we do not own", () => {
    const merged = mergeManagedColors(
      {
        "editor.background": "#111111",
        "titleBar.activeBackground": "#ff0000",
      },
      managed,
      { "titleBar.activeBackground": "#003366" },
    );
    assert.deepEqual(merged, {
      "editor.background": "#111111",
      "titleBar.activeBackground": "#003366",
    });
  });

  it("removes our keys and drops the setting when nothing else remains", () => {
    const merged = mergeManagedColors(
      { "titleBar.activeBackground": "#ff0000" },
      managed,
      undefined,
    );
    assert.equal(merged, undefined);
  });

  it("clears only our keys on reset when other customizations exist", () => {
    const merged = mergeManagedColors(
      {
        "editor.background": "#111111",
        "statusBar.background": "#ff0000",
      },
      managed,
      undefined,
    );
    assert.deepEqual(merged, { "editor.background": "#111111" });
  });
});
