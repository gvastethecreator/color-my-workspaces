import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_STATUS_ICON, parseCodiconId, STATUS_ICONS, statusIconText } from "./icons.ts";

describe("parseCodiconId", () => {
  it("accepts a codicon id", () => {
    assert.equal(parseCodiconId("folder"), "folder");
    assert.equal(parseCodiconId("$(rocket)"), "rocket");
  });

  it("rejects garbage", () => {
    assert.equal(parseCodiconId(""), undefined);
    assert.equal(parseCodiconId("folder filled"), undefined);
    assert.equal(parseCodiconId("$(not an icon)"), undefined);
  });
});

describe("STATUS_ICONS", () => {
  it("includes the default icon and unique ids", () => {
    assert.equal(STATUS_ICONS.includes(DEFAULT_STATUS_ICON), true);
    assert.equal(new Set(STATUS_ICONS).size, STATUS_ICONS.length);
  });
});

describe("statusIconText", () => {
  it("wraps the id for the status bar", () => {
    assert.equal(statusIconText("rocket"), "$(rocket)");
  });
});
