import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatStatusBarItem,
  formatStatusBarText,
  STATUS_CHIP_TEXT,
  STATUS_CLICK_HINT,
  statusBarTooltip,
  statusChipColor,
} from "./statusDisplay.ts";

describe("formatStatusBarText", () => {
  it("returns the truncated name without an icon", () => {
    assert.equal(formatStatusBarText("shop"), "shop");
  });

  it("clips long names", () => {
    const text = formatStatusBarText("abcdefghijklmnopqrstuvwxyz0123");
    assert.equal(text.endsWith("…"), true);
    assert.equal(text.includes("$("), false);
  });
});

describe("formatStatusBarItem", () => {
  it("joins a codicon and the name", () => {
    assert.equal(formatStatusBarItem({ icon: "rocket", name: "shop" }), "$(rocket) shop");
    assert.equal(formatStatusBarItem({ icon: "folder" }), "$(folder)");
    assert.equal(formatStatusBarItem({ name: "shop" }), "shop");
  });
});

describe("statusBarTooltip", () => {
  it("includes the name, hex, and click hint", () => {
    assert.equal(
      statusBarTooltip({ name: "shop", color: "#3d4c5c" }),
      `shop · #3d4c5c · ${STATUS_CLICK_HINT}`,
    );
  });

  it("keeps the click hint when there is no color", () => {
    assert.equal(statusBarTooltip({ name: "shop" }), `shop · ${STATUS_CLICK_HINT}`);
  });
});

describe("statusChipColor", () => {
  it("uses the workspace color when the status bar is not the same", () => {
    assert.equal(statusChipColor("#1f4b6e", "#546170"), "#1f4b6e");
    assert.equal(statusChipColor("#1f4b6e"), "#1f4b6e");
  });

  it("darkens the chip when it would vanish into the status bar", () => {
    const chip = statusChipColor("#1f4b6e", "#1f4b6e");
    assert.notEqual(chip, "#1f4b6e");
    assert.equal(chip.startsWith("#"), true);
  });
});

describe("STATUS_CHIP_TEXT", () => {
  it("is a filled circle", () => {
    assert.equal(STATUS_CHIP_TEXT, "$(circle-filled)");
  });
});
