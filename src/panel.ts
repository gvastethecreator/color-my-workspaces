import * as vscode from "vscode";
import type { ChromeElement } from "./chrome.ts";
import { ALL_CHROME_ELEMENTS } from "./chrome.ts";
import { PALETTE } from "./palette.ts";
import { escapeHtml, nonce, type PanelMessage, type PanelState } from "./panelState.ts";

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
    "Workspace Color",
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true },
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

function renderHtml(webview: vscode.Webview, scriptNonce: string, state: PanelState): string {
  const csp = [
    `default-src 'none'`,
    `img-src ${webview.cspSource} data:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${scriptNonce}'`,
  ].join("; ");

  const surfaces = ALL_CHROME_ELEMENTS.map((element) => {
    const checked = state.flags[element] ? "checked" : "";
    return `<label class="surface">
      <input type="checkbox" data-flag="${element}" ${checked} />
      <span class="swatch" data-tone="${element}"></span>
      <span>${escapeHtml(FLAG_LABELS[element])}</span>
    </label>`;
  }).join("");

  const swatches = PALETTE.map(
    (item) =>
      `<button type="button" class="chip" data-color="${escapeHtml(item.color)}" title="${escapeHtml(item.label)}" aria-label="${escapeHtml(item.label)}"></button>`,
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Workspace Color</title>
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
      align-items: start;
    }
    @container (min-width: 36rem) {
      .split { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
    }
    .field { display: grid; gap: 6px; }
    .field > span { color: var(--vscode-descriptionForeground); }
    input[type="text"] {
      width: 100%;
      min-width: 0;
      padding: 6px 8px;
      color: var(--vscode-input-foreground);
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, var(--vscode-widget-border));
      border-radius: 4px;
    }
    .preview {
      border: 1px solid var(--vscode-widget-border, var(--vscode-editorWidget-border));
      border-radius: 8px;
      overflow: hidden;
    }
    .preview .title, .preview .status { height: 22px; }
    .preview .activity-top { height: 18px; }
    .preview .mid { display: flex; min-height: 64px; }
    .preview .activity { width: 22px; flex: none; }
    .preview .editor { flex: 1; background: var(--vscode-editor-background); }
    .off { opacity: 0.28; }
    .color-row { display: flex; gap: 8px; align-items: center; }
    .color-row input[type="text"] { flex: 1; }
    input[type="color"] {
      width: 40px;
      height: 32px;
      padding: 0;
      border: 1px solid var(--vscode-widget-border, transparent);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
    }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      width: 24px;
      height: 24px;
      padding: 0;
      border-radius: 4px;
      border: 1px solid var(--vscode-widget-border, transparent);
      background: var(--c, #333);
      cursor: pointer;
    }
    .surfaces {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }
    @container (min-width: 28rem) {
      .surfaces { grid-template-columns: 1fr 1fr; }
    }
    .surface, .option {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 40px;
      padding: 8px 10px;
      border: 1px solid var(--vscode-widget-border, var(--vscode-editorWidget-border));
      border-radius: 6px;
      cursor: pointer;
    }
    .swatch {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      border: 1px solid var(--vscode-widget-border, transparent);
      flex: none;
    }
    .option > span { display: grid; gap: 2px; }
    .hint { margin: 0; color: var(--vscode-descriptionForeground); }
    .actions, .footer { display: flex; flex-wrap: wrap; gap: 12px; }
    .footer { justify-content: flex-end; }
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
    @media (prefers-reduced-motion: no-preference) {
      button.cmd:active { scale: 0.96; }
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
      <h1>Workspace Color</h1>
      <p class="muted" id="statusLine" role="status"></p>
    </header>
    <section>
      <h2>Label</h2>
      <label class="field">
        <span>Status bar name</span>
        <input id="label" type="text" maxlength="48" spellcheck="false" value="${escapeHtml(state.projectName)}" placeholder="${escapeHtml(state.derivedName)}" />
      </label>
    </section>
    <div class="split">
      <section>
        <h2>Preview</h2>
        <div class="preview" aria-hidden="true">
          <div class="title" data-tone="titleBar"></div>
          <div class="activity-top" data-tone="activityBar"></div>
          <div class="mid">
            <div class="activity" data-tone="activityBar"></div>
            <div class="editor"></div>
          </div>
          <div class="status" data-tone="statusBar"></div>
        </div>
      </section>
      <section>
        <h2>Color</h2>
        <div class="color-row">
          <input id="picker" type="color" value="${escapeHtml(state.color)}" aria-label="Color" />
          <input id="hex" type="text" spellcheck="false" value="${escapeHtml(state.color)}" aria-label="Hex" />
        </div>
        <div class="chips">${swatches}</div>
        <div class="actions">
          <button type="button" class="cmd" data-action="applyFromFolder">Use folder color</button>
          <button type="button" class="cmd secondary" data-action="surprise">Surprise me</button>
        </div>
      </section>
    </div>
    <section>
      <h2>Surfaces</h2>
      <p class="muted" id="chromeNote">${escapeHtml(state.chromeNote)}</p>
      <div class="surfaces">${surfaces}</div>
      <label class="option">
        <input id="stepped" type="checkbox" ${state.stepped ? "checked" : ""} />
        <span>
          Stepped tones
          <span class="hint">Each bar uses a slightly different shade of the same color.</span>
        </span>
      </label>
      <button type="button" class="cmd secondary" id="classicChrome" data-action="disableModernUi" ${state.modernUi ? "" : "hidden"}>
        Color bars separately
      </button>
    </section>
    <div class="footer">
      <button type="button" class="cmd secondary" data-action="reset">Remove color</button>
    </div>
  </main>
  <script nonce="${scriptNonce}">
    const vscode = acquireVsCodeApi();
    const picker = document.getElementById("picker");
    const hex = document.getElementById("hex");
    const label = document.getElementById("label");
    const stepped = document.getElementById("stepped");
    const statusLine = document.getElementById("statusLine");
    const chromeNote = document.getElementById("chromeNote");
    const classicChrome = document.getElementById("classicChrome");
    let colorTimer;
    let labelTimer;

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
      chromeNote.textContent = state.chromeNote;
      classicChrome.hidden = !state.modernUi;
      if (document.activeElement !== picker) picker.value = state.color;
      if (document.activeElement !== hex) hex.value = state.color;
      if (document.activeElement !== label) {
        label.value = state.projectName;
        label.placeholder = state.derivedName || "Workspace";
      }
      stepped.checked = state.stepped;
      for (const input of document.querySelectorAll("[data-flag]")) {
        input.checked = Boolean(state.flags[input.dataset.flag]);
      }
      for (const chip of document.querySelectorAll(".chip")) {
        chip.style.setProperty("--c", chip.dataset.color);
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

    picker.addEventListener("input", () => {
      hex.value = picker.value;
      clearTimeout(colorTimer);
      colorTimer = setTimeout(() => sendColor(picker.value), 120);
    });
    hex.addEventListener("change", () => sendColor(hex.value));
    hex.addEventListener("keydown", (event) => {
      if (event.key === "Enter") sendColor(hex.value);
    });
    label.addEventListener("input", () => {
      clearTimeout(labelTimer);
      labelTimer = setTimeout(sendLabel, 180);
    });
    label.addEventListener("change", sendLabel);
    stepped.addEventListener("change", () => {
      vscode.postMessage({ type: "setStepped", enabled: stepped.checked });
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
      button.addEventListener("click", () => sendColor(button.dataset.color));
    });

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
