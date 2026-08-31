import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALL_CHROME_ELEMENTS,
  buildChromeColors,
  elementBackground,
  flagsToElements,
  MANAGED_CHROME_KEYS,
  resolveActivityBarFlag,
} from "./chrome.ts";

describe("buildChromeColors", () => {
  it("paints only the requested chrome", () => {
    const colors = buildChromeColors("#1f4b6e", ["titleBar"]);
    assert.equal(colors["titleBar.activeBackground"], "#1f4b6e");
    assert.equal(colors["statusBar.background"], undefined);
    assert.equal(colors["activityBar.background"], undefined);
    assert.equal(colors["activityBarTop.background"], undefined);
    assert.equal(colors["commandCenter.background"], undefined);
  });

  it("covers every managed key when all elements are on", () => {
    const colors = buildChromeColors("#1f4b6e", ALL_CHROME_ELEMENTS, { stepped: true });
    for (const key of MANAGED_CHROME_KEYS) {
      assert.equal(typeof colors[key], "string", key);
    }
    assert.deepEqual(Object.keys(colors).sort(), [...MANAGED_CHROME_KEYS].sort());
  });

  it("sets a contrasting title foreground", () => {
    const dark = buildChromeColors("#1f4b6e", ["titleBar"]);
    const light = buildChromeColors("#e8e4d9", ["titleBar"]);
    assert.equal(dark["titleBar.activeForeground"], "#f4f4f4");
    assert.equal(light["titleBar.activeForeground"], "#161616");
  });

  it("uses the same base on every bar when stepped is off", () => {
    const colors = buildChromeColors("#1f4b6e", ALL_CHROME_ELEMENTS, { stepped: false });
    assert.equal(colors["titleBar.activeBackground"], "#1f4b6e");
    assert.equal(colors["activityBar.background"], "#1f4b6e");
    assert.equal(colors["statusBar.background"], "#1f4b6e");
    assert.equal(colors["commandCenter.background"], "#1f4b6e");
  });

  it("uses different tones when stepped is on", () => {
    const colors = buildChromeColors("#1f4b6e", ALL_CHROME_ELEMENTS, { stepped: true });
    assert.notEqual(colors["titleBar.activeBackground"], colors["statusBar.background"]);
    assert.notEqual(colors["titleBar.activeBackground"], "#1f4b6e");
    assert.equal(colors["activityBar.background"], "#1f4b6e");
  });

  it("sets borders so bars read as separate", () => {
    const colors = buildChromeColors("#1f4b6e", ALL_CHROME_ELEMENTS);
    assert.equal(typeof colors["titleBar.border"], "string");
    assert.equal(typeof colors["statusBar.border"], "string");
    assert.equal(typeof colors["activityBar.border"], "string");
    assert.equal(typeof colors["commandCenter.inactiveBackground"], "string");
  });
});

describe("flagsToElements", () => {
  it("keeps only the bars that are on", () => {
    assert.deepEqual(
      flagsToElements({
        titleBar: true,
        activityBar: false,
        statusBar: true,
        commandCenter: false,
      }),
      ["titleBar", "statusBar"],
    );
  });
});

describe("resolveActivityBarFlag", () => {
  it("turns off the top and bottom activity bar when unset", () => {
    assert.equal(resolveActivityBarFlag(undefined, "top"), false);
    assert.equal(resolveActivityBarFlag(undefined, "bottom"), false);
  });

  it("keeps the side rail on when unset", () => {
    assert.equal(resolveActivityBarFlag(undefined, "default"), true);
    assert.equal(resolveActivityBarFlag(undefined, undefined), true);
    assert.equal(resolveActivityBarFlag(undefined, "hidden"), true);
  });

  it("keeps an explicit choice", () => {
    assert.equal(resolveActivityBarFlag(true, "top"), true);
    assert.equal(resolveActivityBarFlag(false, "default"), false);
  });
});

describe("elementBackground", () => {
  it("returns the base color when stepped is off", () => {
    assert.equal(elementBackground("#336699", "titleBar", false), "#336699");
    assert.equal(elementBackground("#336699", "statusBar", false), "#336699");
  });

  it("darkens the title and lightens the status when stepped is on", () => {
    const title = elementBackground("#336699", "titleBar", true);
    const status = elementBackground("#336699", "statusBar", true);
    assert.notEqual(title, "#336699");
    assert.notEqual(status, "#336699");
    assert.notEqual(title, status);
  });
});
