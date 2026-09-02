import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { describeChromeCompatibility, detectChromeCompatibility } from "./compatibility.ts";

describe("chrome compatibility", () => {
  it("reports Modern UI limitations structurally", () => {
    const compatibility = detectChromeCompatibility({ modernUi: true });
    assert.equal(compatibility.mode, "modern");
    assert.ok(compatibility.limitations.some((item) => item.includes("transparent")));
  });

  it("reports activityBarTop for top or bottom locations", () => {
    const compatibility = detectChromeCompatibility({
      modernUi: false,
      activityBarLocation: "top",
    });
    assert.equal(compatibility.mode, "classic");
    assert.ok(describeChromeCompatibility(compatibility).includes("activityBarTop"));
  });

  it("does not assume a missing experimental setting is classic", () => {
    assert.equal(detectChromeCompatibility({ modernUi: undefined }).mode, "unknown");
  });
});
