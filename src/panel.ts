import * as vscode from "vscode";
import type { ChromeElement } from "./chrome.ts";
import { ALL_CHROME_ELEMENTS } from "./chrome.ts";
import { STATUS_ICONS } from "./icons.ts";
import { PALETTE, PALETTE_COLUMNS } from "./palette.ts";
import { escapeHtml, nonce, type PanelMessage, type PanelState } from "./panelState.ts";
import { STATUS_ICON_SVG } from "./statusIconSvg.ts";

let panel: vscode.WebviewPanel | undefined;

export function openColorPanel(
  context: vscode.ExtensionContext,
  getState: () => PanelState,
  onMessage: (message: PanelMessage) => Promise<void>,
): void {
  if (panel) {
    panel.reveal(vscode.ViewColumn.Beside);
    postPanelState(getState());
    return;
  }

  panel = vscode.window.createWebviewPanel(
    "workspaceColor.settings",
    "Color My Workspaces",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "media")],
    },
  );

  const scriptNonce = nonce();
  panel.webview.html = renderHtml(panel.webview, scriptNonce, getState());
  panel.onDidDispose(() => {
    panel = undefined;
  });
  panel.webview.onDidReceiveMessage((message: PanelMessage) => {
    void onMessage(message);
  });
  context.subscriptions.push(panel);
}

export function postPanelState(state: PanelState): void {
  panel?.webview.postMessage({ type: "state", ...state });
}

function renderHtml(
  webview: vscode.Webview,
  scriptNonce: string,
  state: PanelState,
): string {
  const iconMap = JSON.stringify(STATUS_ICON_SVG).replaceAll("<", "\\u003c");
  const csp = [
    `default-src 'none'`,
    `img-src ${webview.cspSource} data:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${scriptNonce}'`,
  ].join("; ");

  const surfaces = ALL_CHROME_ELEMENTS.map((element) => {
    const checked = state.flags[element] ? "checked" : "";
    return `<label class="surface" title="${escapeHtml(FLAG_TIPS[element])}">
      <input type="checkbox" data-flag="${element}" ${checked} />
      <span class="swatch" data-tone="${element}"></span>
      <span>${escapeHtml(FLAG_LABELS[element])}</span>
    </label>`;
  }).join("");

  const swatches = PALETTE.map(
    (item) =>
      `<button type="button" class="chip" data-color="${escapeHtml(item.color)}" title="${escapeHtml(item.label)}" aria-label="${escapeHtml(item.label)}" aria-pressed="false"></button>`,
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Color My Workspaces</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
    }
    .page {
      container-type: inline-size;
      max-width: 44rem;
      margin: 0 auto;
      padding: 20px 24px 28px;
      display: grid;
      gap: 24px;
    }
    header, section { display: grid; gap: 8px; min-width: 0; }
    h1 { font-size: 1.15rem; font-weight: 600; margin: 0; }
    h2 {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin: 0;
    }
    .muted { color: var(--vscode-descriptionForeground); margin: 0; }
    .split {
      display: grid;
      gap: 24px;
      grid-template-columns: 1fr;
      align-items: stretch;
    }
    @container (min-width: 36rem) {
      .split { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
      .preview-pane {
        grid-template-rows: auto 1fr;
      }
      .checks { grid-template-columns: 1fr 1fr 1fr; }
    }
    input:disabled { cursor: not-allowed; }
    .field { display: grid; gap: 6px; }
    .field > span { color: var(--vscode-descriptionForeground); }
    input[type="text"], select {
      width: 100%;
      min-width: 0;
      padding: 6px 8px;
      color: var(--vscode-input-foreground);
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, var(--vscode-widget-border));
      border-radius: 4px;
    }
    select {
      color: var(--vscode-dropdown-foreground);
      background: var(--vscode-dropdown-background);
      border-color: var(--vscode-dropdown-border, var(--vscode-widget-border));
    }
    .label-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 12px;
    }
    .label-row + .label-row { margin-top: 6px; }
    .label-row .option { flex: none; }
    .label-row input[type="text"], .label-row select { flex: 1; min-width: 12rem; }
    .icon-pick-wrap { position: relative; flex: 1; min-width: 8rem; }
    .icon-pick {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      justify-content: flex-start;
    }
    .icon-pick .status-icon { width: 16px; height: 16px; }
    .icon-pick-id { font-size: 0.85rem; }
    .icon-menu {
      position: absolute;
      bottom: calc(100% + 4px);
      left: 0;
      z-index: 20;
      display: grid;
      grid-template-columns: repeat(8, 1.75rem);
      gap: 2px;
      padding: 6px;
      background: var(--vscode-menu-background, var(--vscode-editorWidget-background));
      border: 1px solid var(--vscode-widget-border, var(--vscode-editorWidget-border));
      border-radius: 6px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
    }
    .icon-menu[hidden] { display: none; }
    .icon-option {
      width: 1.75rem;
      height: 1.75rem;
      display: grid;
      place-items: center;
      padding: 0;
      border: none;
      border-radius: 4px;
      color: var(--vscode-foreground);
      background: transparent;
      cursor: pointer;
    }
    .icon-option .status-icon { width: 14px; height: 14px; }
    .status-icon {
      width: 16px;
      height: 16px;
      flex: none;
      display: block;
    }
    .icon-option:hover,
    .icon-option[aria-current="true"] {
      background: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.08));
    }
    .icon-option[aria-current="true"] {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: 0;
    }
    #label:disabled { opacity: 0.55; }
    .preview {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 140px;
      border: 1px solid var(--vscode-widget-border, var(--vscode-editorWidget-border));
      border-radius: 8px;
      overflow: hidden;
    }
    .preview .title { height: 22px; flex: none; }
    .preview .status {
      height: 22px;
      display: flex;
      align-items: center;
      padding: 0 8px;
      font-size: 11px;
      line-height: 22px;
      overflow: hidden;
      flex: none;
    }
    .preview .status span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .preview .status #statusPreviewIcon {
      flex: none;
      overflow: visible;
      margin-right: 6px;
      display: inline-flex;
      color: inherit;
    }
    .preview .status #statusPreviewIcon[hidden] { display: none; }
    .preview .status #statusPreviewIcon .status-icon {
      width: 14px;
      height: 14px;
    }
    .chip-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex: none;
      margin-right: 6px;
    }
    .preview .activity-top { height: 18px; flex: none; }
    .preview .mid { display: flex; flex: 1; min-height: 64px; }
    .preview .activity { width: 22px; flex: none; }
    .preview .editor {
      flex: 1;
      background: var(--vscode-editor-background);
      padding: 8px 10px 8px 8px;
      display: flex;
      gap: 8px;
      overflow: hidden;
    }
    .preview .gutter {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-top: 1px;
      flex: none;
    }
    .preview .gutter i {
      display: block;
      width: 8px;
      height: 4px;
      border-radius: 1px;
      background: var(--vscode-editorLineNumber-foreground, var(--vscode-descriptionForeground));
      opacity: 0.55;
    }
    .preview .code {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }
    .preview .ln {
      display: block;
      height: 4px;
      border-radius: 2px;
      background: var(--vscode-editor-foreground);
      opacity: 0.16;
    }
    .preview .ln.k { opacity: 0.34; }
    .preview .ln.s { opacity: 0.22; }
    .off { opacity: 0.28; }
    .color-row { display: flex; gap: 8px; align-items: center; }
    .color-row input[type="text"] { flex: 1; }
    .color-row button { flex: none; }
    .error { color: var(--vscode-errorForeground); }
    input[type="color"] {
      width: 40px;
      height: 32px;
      padding: 0;
      border: 1px solid var(--vscode-widget-border, transparent);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
    }
    .chips {
      display: grid;
      grid-template-columns: repeat(${PALETTE_COLUMNS}, minmax(0, 1fr));
      gap: 6px;
    }
    .chip {
      width: 100%;
      aspect-ratio: 1;
      height: auto;
      padding: 0;
      border-radius: 4px;
      border: 1px solid var(--vscode-widget-border, transparent);
      background: var(--c, #333);
      cursor: pointer;
    }
    .sliders { display: grid; gap: 8px; }
    .slider {
      display: grid;
      grid-template-columns: 6.75rem minmax(0, 1fr) 2.4rem;
      align-items: center;
      gap: 8px;
    }
    .slider > span, .slider output {
      color: var(--vscode-descriptionForeground);
      font-size: 0.85rem;
    }
    .slider output { font-variant-numeric: tabular-nums; text-align: right; }
    input[type="range"] { width: 100%; min-width: 0; accent-color: var(--vscode-focusBorder); }
    .surfaces, .checks {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
      padding: 4px 10px;
      border: 1px solid var(--vscode-widget-border, var(--vscode-editorWidget-border));
      border-radius: 6px;
    }
    .surface, .option {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 26px;
      padding: 3px 0;
      cursor: pointer;
    }
    .surface[title], .option[title], h2[title] { cursor: help; }
    .swatch {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      border: 1px solid var(--vscode-widget-border, transparent);
      flex: none;
    }
    .hint { margin: 0; color: var(--vscode-descriptionForeground); }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; }
    .footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px 16px;
      margin-top: 4px;
      padding-top: 16px;
      border-top: 1px solid var(--vscode-widget-border, transparent);
    }
    .support {
      margin: 0 0 0 auto;
    }
    .support a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--vscode-descriptionForeground);
      text-decoration: none;
      font-size: 0.8rem;
    }
    .support a:hover { color: var(--vscode-foreground); }
    .support svg { flex: none; }
    button.cmd {
      padding: 6px 12px;
      min-height: 32px;
      border: none;
      border-radius: 4px;
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-background);
      cursor: pointer;
    }
    button.cmd.secondary {
      color: var(--vscode-button-secondaryForeground);
      background: var(--vscode-button-secondaryBackground);
    }
    button.cmd:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .chip.current {
      outline: 2px solid var(--vscode-focusBorder);
      outline-offset: 1px;
    }
    @media (prefers-reduced-motion: no-preference) {
      button.cmd:active:not(:disabled) { scale: 0.96; }
      .chip, .preview [data-tone] {
        transition-property: opacity, background-color;
        transition-duration: 150ms;
        transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
      }
    }
    :focus-visible {
      outline: 2px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  <main class="page">
    <header>
      <h1>Color My Workspaces</h1>
      <p class="muted" id="statusLine" role="status"></p>
    </header>
    <div class="split">
      <section class="preview-pane">
        <h2>Preview</h2>
        <div class="preview" aria-hidden="true">
          <div class="title" data-tone="titleBar"></div>
          <div class="activity-top" data-tone="activityBar"></div>
          <div class="mid">
            <div class="activity" data-tone="activityBar"></div>
            <div class="editor">
              <div class="gutter">${Array.from({ length: 8 }, () => "<i></i>").join("")}</div>
              <div class="code">
                <span class="ln k" style="width:68%"></span>
                <span class="ln" style="width:42%"></span>
                <span class="ln s" style="width:78%;margin-left:10px"></span>
                <span class="ln" style="width:54%;margin-left:10px"></span>
                <span class="ln k" style="width:36%"></span>
                <span class="ln s" style="width:62%;margin-left:10px"></span>
                <span class="ln" style="width:28%"></span>
                <span class="ln" style="width:51%"></span>
              </div>
            </div>
          </div>
          <div class="status" data-tone="statusBar"><span id="statusPreviewChip" class="chip-dot" ${(state.showStatusBarLabel && state.statusPreviewText) || state.showStatusBarIcon ? "hidden" : ""} style="background:${escapeHtml(state.chipColor)}"></span><span id="statusPreviewIcon" ${state.showStatusBarIcon ? "" : "hidden"} style="color:${escapeHtml(state.statusForeground)}"></span><span id="statusPreviewLabel" ${state.showStatusBarLabel ? "" : "hidden"} style="color:${escapeHtml(state.statusForeground)}">${escapeHtml(state.statusPreviewText)}</span></div>
        </div>
      </section>
      <section>
        <h2>Color</h2>
        <div class="color-row">
          <input id="picker" type="color" value="${escapeHtml(state.color)}" aria-label="Color" />
          <input id="hex" type="text" spellcheck="false" value="${escapeHtml(state.color)}" aria-label="Hex" aria-invalid="false" aria-describedby="hexError" />
          <button type="button" class="cmd secondary" id="copyHex" aria-label="Copy color" ${state.applied ? "" : "disabled"}>Copy</button>
        </div>
        <p id="hexError" class="hint error" hidden role="status">Enter a color like #3b3b8f.</p>
        <div class="chips">${swatches}</div>
        <div class="sliders">
          <label class="slider">
            <span>Hue</span>
            <input id="hue" type="range" min="0" max="360" />
            <output id="hueValue" for="hue">0</output>
          </label>
          <label class="slider">
            <span>Saturation</span>
            <input id="saturation" type="range" min="0" max="100" />
            <output id="saturationValue" for="saturation">0</output>
          </label>
          <label class="slider">
            <span>Brightness</span>
            <input id="brightness" type="range" min="0" max="100" />
            <output id="brightnessValue" for="brightness">0</output>
          </label>
          <label class="slider">
            <span>Contrast</span>
            <input id="contrast" type="range" min="0" max="100" value="50" />
            <output id="contrastValue" for="contrast">50</output>
          </label>
        </div>
        <div class="actions">
          <button type="button" class="cmd" data-action="applyFromFolder" ${state.hasWorkspace ? "" : "disabled"}>Use folder color</button>
          <button type="button" class="cmd secondary" data-action="surprise" ${state.hasWorkspace ? "" : "disabled"}>Surprise me</button>
          <button type="button" class="cmd secondary" data-action="reset" id="clearColor" ${state.applied ? "" : "disabled"}>Clear</button>
        </div>
      </section>
    </div>
    <section>
      <h2 id="chromeNote" title="${escapeHtml(state.chromeNote)}">Surfaces</h2>
      <div class="checks">
        ${surfaces}
        <label class="option" title="Each bar uses a slightly different shade of the same color.">
          <input id="stepped" type="checkbox" ${state.stepped ? "checked" : ""} />
          <span>Stepped tones</span>
        </label>
        <label class="option" title="Turns off Modern UI so each bar keeps its own color. Uncheck to restore Modern UI. Reload the window after changing this.">
          <input id="separateBars" type="checkbox" ${state.modernUi ? "" : "checked"} />
          <span>Disable Modern UI</span>
        </label>
      </div>
    </section>
    <section>
      <h2>Status bar</h2>
      <div class="label-row">
        <label class="option" title="Turn off to hide the project name. A color pill is shown when the name and icon are both hidden.">
          <input id="showLabel" type="checkbox" ${state.showStatusBarLabel ? "checked" : ""} />
          <span>Show status bar name</span>
        </label>
        <input id="label" type="text" maxlength="48" spellcheck="false" value="${escapeHtml(state.projectName)}" placeholder="${escapeHtml(state.derivedName)}" aria-label="Status bar name" ${state.showStatusBarLabel ? "" : "disabled"} />
      </div>
      <div class="label-row">
        <label class="option" title="Turn off to hide the Codicon. A color pill is shown when the name and icon are both hidden.">
          <input id="showIcon" type="checkbox" ${state.showStatusBarIcon ? "checked" : ""} />
          <span>Show status bar icon</span>
        </label>
        <div class="icon-pick-wrap" id="iconPickWrap">
          <button type="button" class="cmd secondary icon-pick" id="pickIcon" aria-haspopup="listbox" aria-expanded="false" aria-controls="iconMenu" aria-label="Status bar icon" ${state.hasWorkspace ? "" : "disabled"}>
            <span id="pickIconGlyph" aria-hidden="true"></span>
            <span id="pickIconId">${escapeHtml(state.statusIcon)}</span>
          </button>
          <div class="icon-menu" id="iconMenu" hidden role="listbox" aria-label="Status bar icons">${STATUS_ICONS.map((id) => {
            const safe = escapeHtml(id);
            return `<button type="button" class="icon-option" role="option" data-icon="${safe}" title="${safe}" aria-label="${safe}" aria-current="${id === state.statusIcon ? "true" : "false"}"></button>`;
          }).join("")}</div>
        </div>
      </div>
      <div class="label-row">
        <label class="option" title="What a click on the status bar name or color pill opens." for="statusBarClick">
          <span>On click</span>
        </label>
        <select id="statusBarClick" aria-label="Status bar click">
          <option value="quick" ${state.statusBarClick === "full" ? "" : "selected"}>Quick settings</option>
          <option value="full" ${state.statusBarClick === "full" ? "selected" : ""}>Full settings</option>
        </select>
      </div>
    </section>
    <div class="footer">
      <button type="button" class="cmd secondary" data-action="resetSettings" id="resetSettings" ${state.hasWorkspace ? "" : "disabled"}>Reset settings</button>
      <p class="support">
        <a href="https://github.com/gvastethecreator/vscode-color-my-workspaces" id="supportLink">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          Support this project, give a star
        </a>
      </p>
    </div>
  </main>
  <script nonce="${scriptNonce}">
    const vscode = acquireVsCodeApi();
    const STATUS_ICON_SVG = ${iconMap};
    function iconMarkup(id) {
      return STATUS_ICON_SVG[id] || STATUS_ICON_SVG.folder || "";
    }
    const picker = document.getElementById("picker");
    const hex = document.getElementById("hex");
    const hexError = document.getElementById("hexError");
    const copyHex = document.getElementById("copyHex");
    const clearColor = document.getElementById("clearColor");
    const resetSettings = document.getElementById("resetSettings");
    const label = document.getElementById("label");
    const showLabel = document.getElementById("showLabel");
    const showIcon = document.getElementById("showIcon");
    const statusBarClick = document.getElementById("statusBarClick");
    const pickIcon = document.getElementById("pickIcon");
    const pickIconGlyph = document.getElementById("pickIconGlyph");
    const pickIconId = document.getElementById("pickIconId");
    const iconMenu = document.getElementById("iconMenu");
    const iconPickWrap = document.getElementById("iconPickWrap");
    const stepped = document.getElementById("stepped");
    const separateBars = document.getElementById("separateBars");
    const statusLine = document.getElementById("statusLine");
    const chromeNote = document.getElementById("chromeNote");
    const statusPreviewChip = document.getElementById("statusPreviewChip");
    const statusPreviewIcon = document.getElementById("statusPreviewIcon");
    const statusPreviewLabel = document.getElementById("statusPreviewLabel");
    const hue = document.getElementById("hue");
    const saturation = document.getElementById("saturation");
    const brightness = document.getElementById("brightness");
    const contrast = document.getElementById("contrast");
    const hueValue = document.getElementById("hueValue");
    const saturationValue = document.getElementById("saturationValue");
    const brightnessValue = document.getElementById("brightnessValue");
    const contrastValue = document.getElementById("contrastValue");
    let colorTimer;
    let labelTimer;
    let hasWorkspace = ${state.hasWorkspace ? "true" : "false"};
    let baseHsl = { h: 0, s: 0, l: 0 };

    function clamp(n, min, max) {
      return Math.min(max, Math.max(min, n));
    }

    function rgbToHsl(r, g, b) {
      const rr = r / 255, gg = g / 255, bb = b / 255;
      const max = Math.max(rr, gg, bb);
      const min = Math.min(rr, gg, bb);
      const l = (max + min) / 2;
      if (max === min) return { h: 0, s: 0, l: l * 100 };
      const d = max - min;
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      let h = 0;
      if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0);
      else if (max === gg) h = (bb - rr) / d + 2;
      else h = (rr - gg) / d + 4;
      return { h: h * 60, s: s * 100, l: l * 100 };
    }

    function hslToHex(h, s, l) {
      const sat = clamp(s, 0, 100) / 100;
      const light = clamp(l, 0, 100) / 100;
      const hue = ((h % 360) + 360) % 360;
      const c = (1 - Math.abs(2 * light - 1)) * sat;
      const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
      const m = light - c / 2;
      let r = 0, g = 0, b = 0;
      if (hue < 60) { r = c; g = x; }
      else if (hue < 120) { r = x; g = c; }
      else if (hue < 180) { g = c; b = x; }
      else if (hue < 240) { g = x; b = c; }
      else if (hue < 300) { r = x; b = c; }
      else { r = c; b = x; }
      const ch = (n) => Math.round(clamp((n + m) * 255, 0, 255)).toString(16).padStart(2, "0");
      return "#" + ch(r) + ch(g) + ch(b);
    }

    function hexToHsl(value) {
      const n = normalize(value).slice(1);
      return rgbToHsl(parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16));
    }

    function colorFromSliders() {
      const t = Number(contrast.value) / 50;
      const s = clamp(baseHsl.s * (0.35 + t * 0.65), 0, 100);
      const l = clamp(50 + (baseHsl.l - 50) * t, 0, 100);
      return hslToHex(baseHsl.h, s, l);
    }

    function sliderFocused() {
      return (
        document.activeElement === hue ||
        document.activeElement === saturation ||
        document.activeElement === brightness ||
        document.activeElement === contrast
      );
    }

    function setSliderOutputs() {
      hueValue.textContent = String(Math.round(Number(hue.value)));
      saturationValue.textContent = String(Math.round(Number(saturation.value)));
      brightnessValue.textContent = String(Math.round(Number(brightness.value)));
      contrastValue.textContent = String(Math.round(Number(contrast.value)));
    }

    function setBaseFromHex(value) {
      if (!validHex(value)) return;
      baseHsl = hexToHsl(value);
      hue.value = String(Math.round(baseHsl.h));
      saturation.value = String(Math.round(baseHsl.s));
      brightness.value = String(Math.round(baseHsl.l));
      contrast.value = "50";
      setSliderOutputs();
    }

    function setHexError(invalid) {
      hexError.hidden = !invalid;
      hex.setAttribute("aria-invalid", invalid ? "true" : "false");
    }

    function validHex(value) {
      return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
    }

    function normalize(value) {
      const v = value.trim();
      if (/^#?[0-9a-fA-F]{3}$/.test(v)) {
        const s = v.replace("#", "");
        return "#" + s.split("").map((c) => c + c).join("").toLowerCase();
      }
      const long = v.replace("#", "");
      return "#" + long.toLowerCase();
    }

    function applyState(state) {
      statusLine.textContent = state.hasWorkspace
        ? (state.applied ? "Color applied on this workspace." : "Color is not applied.")
        : "Open a folder to color this window.";
      chromeNote.title = state.chromeNote;
      separateBars.checked = !state.modernUi;
      statusPreviewChip.style.background = state.chipColor;
      statusPreviewLabel.textContent = state.statusPreviewText;
      statusPreviewLabel.style.color = state.statusForeground;
      statusPreviewIcon.style.color = state.statusForeground;
      setIconPreview(state.statusIcon, state.showStatusBarIcon);
      if (document.activeElement !== picker) picker.value = state.color;
      if (document.activeElement !== hex) {
        hex.value = state.color;
        setHexError(false);
      }
      if (!sliderFocused()) setBaseFromHex(state.color);
      if (document.activeElement !== label) {
        label.value = state.projectName;
        label.placeholder = state.derivedName || "Workspace";
      }
      showLabel.checked = state.showStatusBarLabel;
      showIcon.checked = state.showStatusBarIcon;
      if (document.activeElement !== statusBarClick) statusBarClick.value = state.statusBarClick === "full" ? "full" : "quick";
      hasWorkspace = Boolean(state.hasWorkspace);
      applyStatusPreview(state.showStatusBarLabel, state.showStatusBarIcon);
      stepped.checked = state.stepped;
      clearColor.disabled = !state.applied;
      resetSettings.disabled = !state.hasWorkspace;
      copyHex.disabled = !state.hasWorkspace || !validHex(state.color);
      document.querySelectorAll("[data-action='applyFromFolder'], [data-action='surprise']").forEach((button) => {
        button.disabled = !state.hasWorkspace;
      });
      for (const input of document.querySelectorAll("[data-flag]")) {
        input.checked = Boolean(state.flags[input.dataset.flag]);
      }
      for (const chip of document.querySelectorAll(".chip")) {
        chip.style.setProperty("--c", chip.dataset.color);
        const current = (chip.dataset.color || "").toLowerCase() === state.color.toLowerCase();
        chip.classList.toggle("current", current);
        chip.setAttribute("aria-pressed", current ? "true" : "false");
      }
      for (const node of document.querySelectorAll("[data-tone]")) {
        const key = node.dataset.tone;
        node.style.background = state.tones[key] || "transparent";
        node.classList.toggle("off", state.flags[key] === false);
      }
    }

    function sendColor(value) {
      if (!validHex(value)) return;
      vscode.postMessage({ type: "setColor", color: normalize(value) });
    }

    function sendLabel() {
      vscode.postMessage({ type: "setLabel", label: label.value });
    }

    function applyStatusPreview(showName, showIconEnabled) {
      label.disabled = !showName;
      pickIcon.disabled = !hasWorkspace;
      statusPreviewChip.hidden = (showName && Boolean(statusPreviewLabel.textContent)) || showIconEnabled;
      statusPreviewLabel.hidden = !showName;
      statusPreviewIcon.hidden = !showIconEnabled;
    }

    function setIconPreview(id, show) {
      pickIconGlyph.innerHTML = iconMarkup(id);
      pickIconId.textContent = id;
      statusPreviewIcon.innerHTML = iconMarkup(id);
      statusPreviewIcon.hidden = !show;
      for (const option of iconMenu.querySelectorAll(".icon-option")) {
        option.setAttribute("aria-current", option.dataset.icon === id ? "true" : "false");
      }
    }

    for (const option of iconMenu.querySelectorAll(".icon-option")) {
      option.innerHTML = iconMarkup(option.dataset.icon);
    }

    function setIconMenuOpen(open) {
      iconMenu.hidden = !open;
      pickIcon.setAttribute("aria-expanded", open ? "true" : "false");
    }

    picker.addEventListener("input", () => {
      hex.value = picker.value;
      setHexError(false);
      setBaseFromHex(picker.value);
      clearTimeout(colorTimer);
      colorTimer = setTimeout(() => sendColor(picker.value), 120);
    });
    hex.addEventListener("input", () => {
      const value = hex.value.trim();
      if (value.length === 0 || validHex(value)) {
        setHexError(false);
        if (validHex(value)) {
          setBaseFromHex(value);
          clearTimeout(colorTimer);
          colorTimer = setTimeout(() => sendColor(value), 120);
        }
        return;
      }
      setHexError(true);
    });
    hex.addEventListener("change", () => {
      if (!validHex(hex.value)) {
        setHexError(true);
        return;
      }
      sendColor(hex.value);
    });
    hex.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      if (!validHex(hex.value)) {
        setHexError(true);
        return;
      }
      sendColor(hex.value);
    });
    copyHex.addEventListener("click", () => {
      if (!validHex(hex.value)) {
        setHexError(true);
        return;
      }
      vscode.postMessage({ type: "copyHex", color: hex.value });
    });
    label.addEventListener("input", () => {
      clearTimeout(labelTimer);
      labelTimer = setTimeout(sendLabel, 180);
    });
    label.addEventListener("change", sendLabel);
    showLabel.addEventListener("change", () => {
      applyStatusPreview(showLabel.checked, showIcon.checked);
      vscode.postMessage({ type: "setShowStatusBarLabel", enabled: showLabel.checked });
    });
    showIcon.addEventListener("change", () => {
      applyStatusPreview(showLabel.checked, showIcon.checked);
      statusPreviewIcon.hidden = !showIcon.checked;
      vscode.postMessage({ type: "setShowStatusBarIcon", enabled: showIcon.checked });
    });
    statusBarClick.addEventListener("change", () => {
      vscode.postMessage({ type: "setStatusBarClick", target: statusBarClick.value });
    });
    pickIcon.addEventListener("click", (event) => {
      event.stopPropagation();
      if (pickIcon.disabled) return;
      setIconMenuOpen(iconMenu.hidden);
    });
    iconMenu.addEventListener("click", (event) => {
      event.stopPropagation();
      const option = event.target.closest("[data-icon]");
      if (!option || !option.dataset.icon) return;
      const id = option.dataset.icon;
      showIcon.checked = true;
      setIconPreview(id, true);
      applyStatusPreview(showLabel.checked, true);
      setIconMenuOpen(false);
      vscode.postMessage({ type: "setIcon", icon: id });
    });
    document.addEventListener("click", () => setIconMenuOpen(false));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setIconMenuOpen(false);
    });
    stepped.addEventListener("change", () => {
      vscode.postMessage({ type: "setStepped", enabled: stepped.checked });
    });
    separateBars.addEventListener("change", () => {
      vscode.postMessage({ type: "setSeparateBars", enabled: separateBars.checked });
    });
    document.querySelectorAll("[data-flag]").forEach((input) => {
      input.addEventListener("change", () => {
        vscode.postMessage({ type: "setFlag", element: input.dataset.flag, enabled: input.checked });
      });
    });
    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        vscode.postMessage({ type: button.dataset.action });
      });
    });
    document.querySelectorAll(".chip").forEach((button) => {
      button.addEventListener("click", () => {
        setHexError(false);
        setBaseFromHex(button.dataset.color);
        sendColor(button.dataset.color);
      });
    });
    document.getElementById("supportLink").addEventListener("click", (event) => {
      event.preventDefault();
      vscode.postMessage({ type: "openUrl", url: event.currentTarget.getAttribute("href") });
    });
    function sendFromSliders() {
      setSliderOutputs();
      const next = colorFromSliders();
      picker.value = next;
      hex.value = next;
      setHexError(false);
      clearTimeout(colorTimer);
      colorTimer = setTimeout(() => sendColor(next), 120);
    }
    hue.addEventListener("input", () => {
      baseHsl.h = Number(hue.value);
      contrast.value = "50";
      sendFromSliders();
    });
    saturation.addEventListener("input", () => {
      baseHsl.s = Number(saturation.value);
      contrast.value = "50";
      sendFromSliders();
    });
    brightness.addEventListener("input", () => {
      baseHsl.l = Number(brightness.value);
      contrast.value = "50";
      sendFromSliders();
    });
    contrast.addEventListener("input", sendFromSliders);

    window.addEventListener("message", (event) => {
      if (event.data?.type === "state") applyState(event.data);
    });

    applyState(${JSON.stringify(state).replaceAll("<", "\\u003c")});
    vscode.postMessage({ type: "ready" });
  </script>
</body>
</html>`;
}

const FLAG_LABELS: Record<ChromeElement, string> = {
  titleBar: "Window shell",
  activityBar: "Activity bar",
  statusBar: "Status bar",
  commandCenter: "Command center",
};

const FLAG_TIPS: Record<ChromeElement, string> = {
  titleBar: "Colors the window shell (titleBar). In Modern UI this is the backdrop behind the chrome.",
  activityBar: "Colors the side rail (activityBar) and the top or bottom bar (activityBarTop).",
  statusBar: "Colors the status bar.",
  commandCenter: "Colors the command center in the title bar.",
};
