import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adjustLightness,
  colorFromIdentity,
  contrastForeground,
  hexWithAlpha,
  hslToHex,
  hexToHsl,
  applyHslContrast,
  isValidHex,
  mixHex,
  normalizeHex,
  parseHex,
  relativeLuminance,
  rgbToHex,
} from "./color.ts";

describe("parseHex", () => {
  it("accepts #rgb and #rrggbb", () => {
    assert.deepEqual(parseHex("#3af"), { r: 51, g: 170, b: 255 });
    assert.deepEqual(parseHex("336699"), { r: 51, g: 102, b: 153 });
    assert.deepEqual(parseHex("#336699aa"), { r: 51, g: 102, b: 153 });
  });

  it("rejects garbage", () => {
    assert.equal(parseHex("blue"), undefined);
    assert.equal(parseHex("#12"), undefined);
    assert.equal(isValidHex("not-a-color"), false);
  });
});

describe("normalizeHex", () => {
  it("lowercases and expands short hex", () => {
    assert.equal(normalizeHex("#ABC"), "#aabbcc");
    assert.equal(normalizeHex("  #FfFFff  "), "#ffffff");
  });
});

describe("contrastForeground", () => {
  it("uses dark text on light backgrounds", () => {
    assert.equal(contrastForeground("#f5f5f5"), "#161616");
  });

  it("uses light text on dark backgrounds", () => {
    assert.equal(contrastForeground("#1f4b6e"), "#f4f4f4");
  });

  it("keeps luminance monotonic with mix", () => {
    const dark = relativeLuminance(parseHex("#111111")!);
    const light = relativeLuminance(parseHex("#eeeeee")!);
    assert.ok(light > dark);
  });
});

describe("colorFromIdentity", () => {
  it("is stable for the same folder identity", () => {
    assert.equal(colorFromIdentity("shop/frontend"), colorFromIdentity("shop/frontend"));
  });

  it("changes when the folder identity changes", () => {
    assert.notEqual(colorFromIdentity("shop/frontend"), colorFromIdentity("shop/api"));
  });

  it("returns a parseable hex", () => {
    assert.equal(isValidHex(colorFromIdentity("vscode-color")), true);
  });
});

describe("color math", () => {
  it("roundtrips rgb through hex", () => {
    assert.equal(rgbToHex({ r: 51, g: 102, b: 153 }), "#336699");
  });

  it("builds hsl colors in range", () => {
    assert.equal(hslToHex(210, 50, 40).startsWith("#"), true);
    assert.equal(isValidHex(hslToHex(210, 50, 40)), true);
  });

  it("mixes toward the second color", () => {
    assert.equal(mixHex("#000000", "#ffffff", 0), "#000000");
    assert.equal(mixHex("#000000", "#ffffff", 1), "#ffffff");
  });

  it("appends alpha bytes", () => {
    assert.equal(hexWithAlpha("#336699", 1), "#336699ff");
    assert.equal(hexWithAlpha("#336699", 0), "#33669900");
  });

  it("moves lightness away from the original", () => {
    assert.notEqual(adjustLightness("#336699", 12), "#336699");
  });

  it("reads hsl from hex", () => {
    const hsl = hexToHsl("#336699");
    assert.ok(hsl);
    assert.equal(Math.round(hsl.h), 210);
  });

  it("leaves color unchanged at contrast 50", () => {
    const hsl = hexToHsl("#336699")!;
    const next = applyHslContrast(hsl.h, hsl.s, hsl.l, 50);
    assert.equal(hslToHex(next.h, next.s, next.l), "#336699");
  });

  it("pushes lightness away from mid when contrast is high", () => {
    const hsl = hexToHsl("#336699")!;
    const next = applyHslContrast(hsl.h, hsl.s, hsl.l, 100);
    assert.ok(Math.abs(next.l - 50) >= Math.abs(hsl.l - 50));
  });
});
