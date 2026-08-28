import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chromeTones, chromeCompatibilityNote, escapeHtml } from "./panelState.ts";

describe("chromeTones", () => {
  it("returns a tone per bar", () => {
    const tones = chromeTones("#1f4b6e", true);
    assert.equal(typeof tones.titleBar, "string");
    assert.equal(typeof tones.statusBar, "string");
    assert.notEqual(tones.titleBar, tones.statusBar);
  });
});

describe("escapeHtml", () => {
  it("escapes markup", () => {
    assert.equal(escapeHtml(`<script>"x"</script>`), "&lt;script&gt;&quot;x&quot;&lt;/script&gt;");
  });
});

describe("chromeCompatibilityNote", () => {
  it("explains a top activity bar", () => {
    const note = chromeCompatibilityNote({ modernUi: false, activityBarLocation: "top" });
    assert.equal(note.includes("activityBarTop"), true);
  });

  it("explains Modern UI blending the bars", () => {
    const note = chromeCompatibilityNote({ modernUi: true });
    assert.equal(note.includes("title bar color"), true);
  });
});
