import { mixHex, normalizeHex } from "./color.ts";
import { truncateLabel } from "./identity.ts";

export const STATUS_CLICK_HINT = "Click to change color";
export const STATUS_CHIP_TEXT = "$(circle-filled)";

export function formatStatusBarText(name: string): string {
  return truncateLabel(name);
}

export function formatStatusBarItem(input: { icon?: string; name?: string }): string {
  const parts: string[] = [];
  if (input.icon) {
    parts.push(`$(${input.icon})`);
  }
  if (input.name) {
    parts.push(formatStatusBarText(input.name));
  }
  return parts.join(" ");
}

export function formatStatusPreviewText(name: string): string {
  return truncateLabel(name);
}

export function statusBarTooltip(input: { name: string; color?: string }): string {
  if (input.color) {
    return `${input.name} · ${input.color} · ${STATUS_CLICK_HINT}`;
  }
  return `${input.name} · ${STATUS_CLICK_HINT}`;
}

export function statusChipColor(baseHex: string, statusBarBackground?: string): string {
  const base = normalizeHex(baseHex) ?? baseHex;
  const bar = statusBarBackground ? normalizeHex(statusBarBackground) : undefined;
  if (!bar || bar !== base) {
    return base;
  }
  return mixHex(base, "#000000", 0.28);
}
