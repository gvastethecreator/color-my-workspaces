import type { ChromeElement, ChromeFlags } from "./chrome.ts";
import { ALL_CHROME_ELEMENTS, elementBackground } from "./chrome.ts";
import type { PaletteSwatch } from "./palette.ts";

export type PanelState = {
  projectName: string;
  derivedName: string;
  color: string;
  stepped: boolean;
  applied: boolean;
  hasWorkspace: boolean;
  modernUi: boolean;
  chromeNote: string;
  flags: ChromeFlags;
  tones: Record<ChromeElement, string>;
  statusPreviewText: string;
  statusForeground: string;
  chipColor: string;
  showStatusBarLabel: boolean;
  showStatusBarIcon: boolean;
  statusIcon: string;
  palette: readonly PaletteSwatch[];
};

export type PanelMessage =
  | { type: "ready" }
  | { type: "setColor"; color: string }
  | { type: "setLabel"; label: string }
  | { type: "setShowStatusBarLabel"; enabled: boolean }
  | { type: "setShowStatusBarIcon"; enabled: boolean }
  | { type: "setIcon"; icon: string }
  | { type: "setFlag"; element: ChromeElement; enabled: boolean }
  | { type: "setStepped"; enabled: boolean }
  | { type: "applyFromFolder" }
  | { type: "surprise" }
  | { type: "reset" }
  | { type: "resetSettings" }
  | { type: "copyHex"; color: string }
  | { type: "setSeparateBars"; enabled: boolean }
  | { type: "openUrl"; url: string };

export function chromeCompatibilityNote(input: {
  modernUi: boolean;
  activityBarLocation?: string;
}): string {
  if (input.modernUi) {
    return "Modern UI uses the title bar color as the window backdrop. Activity bar and command center may stay transparent. Turn on Disable Modern UI, then reload, to paint each bar on its own. You can turn Modern UI back on from the same control.";
  }
  if (input.activityBarLocation === "top" || input.activityBarLocation === "bottom") {
    return "The activity bar is on the top or bottom. Its color is written to activityBarTop, not only activityBar.";
  }
  return "Window shell is titleBar and tints the frame. Activity bar colors both the side rail and the top bar (activityBarTop).";
}

export function chromeTones(color: string, stepped: boolean): Record<ChromeElement, string> {
  return Object.fromEntries(
    ALL_CHROME_ELEMENTS.map((element) => [element, elementBackground(color, element, stepped)]),
  ) as Record<ChromeElement, string>;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function nonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 32; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}
