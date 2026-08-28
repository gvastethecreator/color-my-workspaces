import * as vscode from "vscode";
import {
  ALL_CHROME_ELEMENTS,
  buildChromeColors,
  flagsToElements,
  MANAGED_CHROME_KEYS,
  type ChromeFlags,
} from "./chrome.ts";
import { colorFromIdentity, normalizeHex, randomWorkspaceColor } from "./color.ts";
import { projectDisplayName, truncateLabel, workspaceIdentity } from "./identity.ts";
import { mergeManagedColors } from "./merge.ts";
import { PALETTE } from "./palette.ts";
import { openColorPanel, postPanelState } from "./panel.ts";
import { chromeTones, chromeCompatibilityNote, type PanelMessage, type PanelState } from "./panelState.ts";

const DISABLED_KEY = "workspaceColor.disabled";
const TARGET = vscode.ConfigurationTarget.Workspace;
const STATUS_PRIORITY = 10_000;

export function activate(context: vscode.ExtensionContext): void {
  const status = vscode.window.createStatusBarItem(
    "workspaceColor.project",
    vscode.StatusBarAlignment.Left,
    STATUS_PRIORITY,
  );
  status.name = "Workspace Color";
  status.command = "workspaceColor.openPanel";
  status.tooltip = "Workspace color";
  context.subscriptions.push(status);

  const applyFromFolder = vscode.commands.registerCommand("workspaceColor.applyFromFolder", () =>
    runApplyFromFolder(context),
  );
  const pick = vscode.commands.registerCommand("workspaceColor.pick", () => openPanel(context));
  const openPanelCmd = vscode.commands.registerCommand("workspaceColor.openPanel", () =>
    openPanel(context),
  );
  const surprise = vscode.commands.registerCommand("workspaceColor.surprise", () =>
    runSurprise(context),
  );
  const reset = vscode.commands.registerCommand("workspaceColor.reset", () => runReset(context));

  context.subscriptions.push(
    applyFromFolder,
    pick,
    openPanelCmd,
    surprise,
    reset,
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration("workspaceColor") ||
        event.affectsConfiguration("workbench.experimental.modernUI") ||
        event.affectsConfiguration("workbench.activityBar.location")
      ) {
        void refresh(context, status);
      }
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      void refresh(context, status);
    }),
  );

  void refresh(context, status);
}

export function deactivate(): void {}

function openPanel(context: vscode.ExtensionContext): void {
  openColorPanel(context, () => panelState(context), async (message) => {
    await handlePanelMessage(context, message);
  });
}

async function handlePanelMessage(context: vscode.ExtensionContext, message: PanelMessage): Promise<void> {
  switch (message.type) {
    case "ready":
      postPanelState(panelState(context));
      return;
    case "setColor": {
      const color = normalizeHex(message.color);
      if (!color) {
        return;
      }
      if (!requireWorkspace()) {
        return;
      }
      await context.workspaceState.update(DISABLED_KEY, false);
      await persistAndPaint(color);
      return;
    }
    case "setLabel":
      if (!requireWorkspace()) {
        return;
      }
      await persistLabel(message.label);
      return;
    case "setFlag":
      if (!ALL_CHROME_ELEMENTS.includes(message.element) || !requireWorkspace()) {
        return;
      }
      await vscode.workspace
        .getConfiguration("workspaceColor")
        .update(message.element, message.enabled, TARGET);
      return;
    case "setStepped":
      if (!requireWorkspace()) {
        return;
      }
      await vscode.workspace.getConfiguration("workspaceColor").update("stepped", message.enabled, TARGET);
      return;
    case "applyFromFolder":
      await runApplyFromFolder(context);
      return;
    case "surprise":
      await runSurprise(context);
      return;
    case "reset":
      await runReset(context);
      return;
    case "disableModernUi":
      await disableModernUi();
      return;
  }
}

async function runApplyFromFolder(context: vscode.ExtensionContext): Promise<void> {
  const color = colorFromCurrentWorkspace();
  if (!color) {
    await vscode.window.showWarningMessage("Open a folder or workspace first.");
    return;
  }
  await context.workspaceState.update(DISABLED_KEY, false);
  await persistAndPaint(color);
}

async function runSurprise(context: vscode.ExtensionContext): Promise<void> {
  if (!requireWorkspace()) {
    return;
  }
  await context.workspaceState.update(DISABLED_KEY, false);
  await persistAndPaint(randomWorkspaceColor());
}

async function runReset(context: vscode.ExtensionContext): Promise<void> {
  if (!requireWorkspace()) {
    return;
  }
  await context.workspaceState.update(DISABLED_KEY, true);
  await vscode.workspace.getConfiguration("workspaceColor").update("color", undefined, TARGET);
  await paint(undefined);
}

function requireWorkspace(): boolean {
  if (hasWorkspace()) {
    return true;
  }
  void vscode.window.showWarningMessage("Open a folder or workspace first.");
  return false;
}

async function refresh(context: vscode.ExtensionContext, status: vscode.StatusBarItem): Promise<void> {
  updateStatusBar(context, status);
  postPanelState(panelState(context));
  if (context.workspaceState.get(DISABLED_KEY) === true) {
    return;
  }
  if (!vscode.workspace.getConfiguration("workspaceColor").get<boolean>("autoApply", true)) {
    return;
  }
  if (!hasWorkspace()) {
    return;
  }
  const color = currentColor();
  if (!color) {
    return;
  }
  await paint(buildCurrentChrome(color));
}

async function persistAndPaint(color: string): Promise<void> {
  await vscode.workspace.getConfiguration("workspaceColor").update("color", color, TARGET);
  await paint(buildCurrentChrome(color));
}

async function persistLabel(raw: string): Promise<void> {
  const label = raw.trim();
  await vscode.workspace
    .getConfiguration("workspaceColor")
    .update("label", label.length > 0 ? label : undefined, TARGET);
}

async function disableModernUi(): Promise<void> {
  const config = vscode.workspace.getConfiguration("workbench");
  try {
    await config.update("experimental.modernUI", false, TARGET);
  } catch {
    try {
      await config.update("experimental.modernUI", false, vscode.ConfigurationTarget.Global);
    } catch {
      await vscode.window.showErrorMessage("Could not turn off Modern UI from this window.");
    }
  }
}

async function paint(next: Record<string, string> | undefined): Promise<void> {
  const inspect = vscode.workspace
    .getConfiguration("workbench")
    .inspect<Record<string, string>>("colorCustomizations");
  const existing =
    inspect?.workspaceValue && typeof inspect.workspaceValue === "object"
      ? { ...inspect.workspaceValue }
      : undefined;
  const merged = mergeManagedColors(existing, MANAGED_CHROME_KEYS, next);
  try {
    await vscode.workspace.getConfiguration("workbench").update("colorCustomizations", merged, TARGET);
  } catch {
    await vscode.window.showErrorMessage("Could not write workspace color settings.");
  }
}

function buildCurrentChrome(color: string): Record<string, string> {
  const flags = readFlags();
  const stepped = vscode.workspace.getConfiguration("workspaceColor").get<boolean>("stepped", true);
  return buildChromeColors(color, flagsToElements(flags), { stepped });
}

function readFlags(): ChromeFlags {
  const cfg = vscode.workspace.getConfiguration("workspaceColor");
  return {
    titleBar: cfg.get("titleBar", true),
    activityBar: cfg.get("activityBar", true),
    statusBar: cfg.get("statusBar", true),
    commandCenter: cfg.get("commandCenter", true),
  };
}

function currentSavedColor(): string | undefined {
  const raw = vscode.workspace.getConfiguration("workspaceColor").get<string>("color", "");
  return raw ? normalizeHex(raw) : undefined;
}

function currentColor(): string | undefined {
  return currentSavedColor() ?? colorFromCurrentWorkspace();
}

function colorFromCurrentWorkspace(): string | undefined {
  const identity = workspaceIdentity({
    workspaceFile: vscode.workspace.workspaceFile?.fsPath,
    folders: folderPaths(),
  });
  return identity ? colorFromIdentity(identity) : undefined;
}

function hasWorkspace(): boolean {
  return Boolean(vscode.workspace.workspaceFile || (vscode.workspace.workspaceFolders?.length ?? 0) > 0);
}

function folderPaths(): string[] {
  return (vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri.fsPath);
}

function customLabel(): string | undefined {
  const raw = vscode.workspace.getConfiguration("workspaceColor").get<string>("label", "");
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function derivedProjectName(): string | undefined {
  return projectDisplayName({
    workspaceName: vscode.workspace.name,
    folders: folderPaths(),
  });
}

function currentProjectName(): string | undefined {
  return projectDisplayName({
    customLabel: customLabel(),
    workspaceName: vscode.workspace.name,
    folders: folderPaths(),
  });
}

function panelState(context: vscode.ExtensionContext): PanelState {
  const color = currentColor() ?? "#3b3b8f";
  const stepped = vscode.workspace.getConfiguration("workspaceColor").get<boolean>("stepped", true);
  const flags = readFlags();
  const modernUi = isModernUi();
  return {
    projectName: currentProjectName() ?? "Workspace",
    derivedName: derivedProjectName() ?? "Workspace",
    color,
    stepped,
    applied: context.workspaceState.get(DISABLED_KEY) !== true && hasWorkspace(),
    hasWorkspace: hasWorkspace(),
    modernUi,
    chromeNote: chromeCompatibilityNote({
      modernUi,
      activityBarLocation: vscode.workspace.getConfiguration("workbench").get<string>("activityBar.location"),
    }),
    flags,
    tones: chromeTones(color, stepped),
    palette: PALETTE,
  };
}

function isModernUi(): boolean {
  return vscode.workspace.getConfiguration("workbench").get<boolean>("experimental.modernUI") === true;
}

function updateStatusBar(context: vscode.ExtensionContext, status: vscode.StatusBarItem): void {
  const name = currentProjectName();
  if (!name) {
    status.hide();
    return;
  }
  const color = currentColor();
  const flags = readFlags();
  status.text = truncateLabel(name);
  status.tooltip = color ? `${name} · ${color}` : name;
  status.accessibilityInformation = { label: `Workspace color ${name}` };
  if (!flags.statusBar && color && context.workspaceState.get(DISABLED_KEY) !== true) {
    status.color = color;
  } else {
    status.color = undefined;
  }
  status.show();
}
