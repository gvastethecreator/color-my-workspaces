import * as vscode from "vscode";
import {
  ALL_CHROME_ELEMENTS,
  buildChromeColors,
  flagsToElements,
  MANAGED_CHROME_KEYS,
  type ChromeFlags,
} from "./chrome.ts";
import { colorFromIdentity, contrastForeground, normalizeHex, randomWorkspaceColor } from "./color.ts";
import { DEFAULT_STATUS_ICON, parseCodiconId } from "./icons.ts";
import { projectDisplayName, workspaceIdentity } from "./identity.ts";
import { mergeManagedColors } from "./merge.ts";
import { PALETTE } from "./palette.ts";
import { openColorPanel, postPanelState } from "./panel.ts";
import { chromeTones, chromeCompatibilityNote, type PanelMessage, type PanelState } from "./panelState.ts";
import { pickCodicon, pickPaletteColor, pickStatusAction } from "./quickActions.ts";
import { formatStatusBarItem, formatStatusBarText, STATUS_CHIP_TEXT, statusBarTooltip, statusChipColor } from "./statusDisplay.ts";

const DISABLED_KEY = "workspaceColor.disabled";
const PREVIOUS_COLOR_KEY = "workspaceColor.previousColor";
const WELCOME_KEY = "workspaceColor.didShowWelcome";
const SUPPORT_URL = "https://github.com/gvastethecreator/color-my-workspaces";
const TARGET = vscode.ConfigurationTarget.Workspace;
const MODERN_UI_SETTING = "experimental.modernUI";
// Git/SCM uses 10000. Remote uses +Infinity and stays first.
// MAX_VALUE - 1 === MAX_VALUE in IEEE floats, so the label uses a distinct high finite priority.
const STATUS_CHIP_PRIORITY = Number.MAX_VALUE;
const STATUS_LABEL_PRIORITY = 1_000_000_000;
let welcomeQueued = false;
let statusItems: StatusItems | undefined;

type StatusItems = {
  chip: vscode.StatusBarItem;
  label: vscode.StatusBarItem;
};

export function activate(context: vscode.ExtensionContext): void {
  const chip = vscode.window.createStatusBarItem(
    "workspaceColor.chip",
    vscode.StatusBarAlignment.Left,
    STATUS_CHIP_PRIORITY,
  );
  chip.name = "Color My Workspaces";
  chip.command = "workspaceColor.quickActions";
  chip.text = STATUS_CHIP_TEXT;
  chip.tooltip = "Workspace color";
  const label = vscode.window.createStatusBarItem(
    "workspaceColor.project",
    vscode.StatusBarAlignment.Left,
    STATUS_LABEL_PRIORITY,
  );
  label.name = "Color My Workspaces";
  label.command = "workspaceColor.quickActions";
  label.tooltip = "Workspace color";
  const status: StatusItems = { chip, label };
  statusItems = status;
  context.subscriptions.push(chip, label);

  const applyFromFolder = vscode.commands.registerCommand("workspaceColor.applyFromFolder", () =>
    runApplyFromFolder(context),
  );
  const pick = vscode.commands.registerCommand("workspaceColor.pick", () => runPick(context));
  const quickActions = vscode.commands.registerCommand("workspaceColor.quickActions", () =>
    runQuickActions(context),
  );
  const openPanelCmd = vscode.commands.registerCommand("workspaceColor.openPanel", () =>
    openPanel(context),
  );
  const surprise = vscode.commands.registerCommand("workspaceColor.surprise", () =>
    runSurprise(context),
  );
  const reset = vscode.commands.registerCommand("workspaceColor.reset", () => runReset(context));
  const resetSettings = vscode.commands.registerCommand("workspaceColor.resetSettings", () =>
    runResetSettings(context),
  );

  context.subscriptions.push(
    applyFromFolder,
    pick,
    quickActions,
    openPanelCmd,
    surprise,
    reset,
    resetSettings,
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
  if (!statusItems) {
    return;
  }
  const status = statusItems;
  openColorPanel(context, () => panelState(context), async (message) => {
    await handlePanelMessage(context, status, message);
  });
}

async function handlePanelMessage(
  context: vscode.ExtensionContext,
  status: StatusItems,
  message: PanelMessage,
): Promise<void> {
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
      await persistAndPaint(context, color);
      return;
    }
    case "setLabel":
      if (!requireWorkspace()) {
        return;
      }
      await persistLabel(message.label);
      updateStatusBar(context, status);
      postPanelState(panelState(context));
      return;
    case "setShowStatusBarLabel":
      await vscode.workspace
        .getConfiguration("workspaceColor")
        .update("showStatusBarLabel", message.enabled, TARGET);
      updateStatusBar(context, status, { showName: message.enabled });
      postPanelState(panelState(context, { showName: message.enabled }));
      return;
    case "setShowStatusBarIcon":
      await persistShowStatusBarIcon(message.enabled);
      updateStatusBar(context, status, {
        showIcon: message.enabled,
        icon: message.enabled ? (currentStatusIcon() ?? DEFAULT_STATUS_ICON) : undefined,
      });
      postPanelState(panelState(context, { showIcon: message.enabled }));
      return;
    case "setIcon":
      await applyStatusIcon(context, status, message.icon);
      return;
    case "setFlag":
      if (!ALL_CHROME_ELEMENTS.includes(message.element) || !requireWorkspace()) {
        return;
      }
      await vscode.workspace
        .getConfiguration("workspaceColor")
        .update(message.element, message.enabled, TARGET);
      await refresh(context, status);
      return;
    case "setStepped":
      if (!requireWorkspace()) {
        return;
      }
      await vscode.workspace.getConfiguration("workspaceColor").update("stepped", message.enabled, TARGET);
      await refresh(context, status);
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
    case "resetSettings":
      await runResetSettings(context);
      return;
    case "copyHex":
      await copyColor(normalizeHex(message.color) ?? currentColor());
      return;
    case "setSeparateBars":
      if (!requireWorkspace()) {
        postPanelState(panelState(context));
        return;
      }
      await setSeparateBars(context, message.enabled);
      return;
    case "openUrl":
      if (message.url === SUPPORT_URL) {
        await vscode.env.openExternal(vscode.Uri.parse(SUPPORT_URL));
      }
      return;
  }
}

async function runQuickActions(context: vscode.ExtensionContext): Promise<void> {
  if (!requireWorkspace()) {
    return;
  }
  const action = await pickStatusAction({
    palette: PALETTE,
    currentColor: currentColor(),
    showStatusBarLabel: showStatusBarLabel(),
    showStatusBarIcon: showStatusBarIcon(),
    applied: context.workspaceState.get(DISABLED_KEY) !== true,
  });
  if (!action) {
    return;
  }
  switch (action.type) {
    case "color":
      await context.workspaceState.update(DISABLED_KEY, false);
      await persistAndPaint(context, action.color);
      return;
    case "surprise":
      await runSurprise(context);
      return;
    case "folder":
      await runApplyFromFolder(context);
      return;
    case "copy":
      await copyColor(currentColor());
      return;
    case "settings":
      openPanel(context);
      return;
    case "toggleLabel": {
      const next = !showStatusBarLabel();
      await vscode.workspace
        .getConfiguration("workspaceColor")
        .update("showStatusBarLabel", next, TARGET);
      if (statusItems) {
        updateStatusBar(context, statusItems, { showName: next });
      }
      return;
    }
    case "toggleIcon": {
      const next = !showStatusBarIcon();
      await persistShowStatusBarIcon(next);
      if (statusItems) {
        updateStatusBar(context, statusItems, { showIcon: next });
      }
      return;
    }
    case "pickIcon":
      await runPickIcon(context, statusItems);
      return;
    case "reset":
      await runReset(context);
      return;
  }
}

async function runPick(context: vscode.ExtensionContext): Promise<void> {
  if (!requireWorkspace()) {
    return;
  }
  const color = await pickPaletteColor(PALETTE, currentColor());
  if (!color) {
    return;
  }
  await context.workspaceState.update(DISABLED_KEY, false);
  await persistAndPaint(context, color);
}

async function runApplyFromFolder(context: vscode.ExtensionContext): Promise<void> {
  const color = colorFromCurrentWorkspace();
  if (!color) {
    await vscode.window.showWarningMessage("Open a folder or workspace first.");
    return;
  }
  await context.workspaceState.update(DISABLED_KEY, false);
  await persistAndPaint(context, color);
}

async function runSurprise(context: vscode.ExtensionContext): Promise<void> {
  if (!requireWorkspace()) {
    return;
  }
  const previous = currentColor();
  if (previous) {
    await context.workspaceState.update(PREVIOUS_COLOR_KEY, previous);
  }
  await context.workspaceState.update(DISABLED_KEY, false);
  const next = randomWorkspaceColor();
  await persistAndPaint(context, next);
  const undo = "Undo";
  const choice = await vscode.window.showInformationMessage(`Color set to ${next}`, undo);
  if (choice !== undo) {
    return;
  }
  const stored = context.workspaceState.get<string>(PREVIOUS_COLOR_KEY);
  const hex = stored ? normalizeHex(stored) : undefined;
  if (!hex) {
    return;
  }
  await persistAndPaint(context, hex);
}

async function runReset(context: vscode.ExtensionContext): Promise<void> {
  if (!requireWorkspace()) {
    return;
  }
  await context.workspaceState.update(DISABLED_KEY, true);
  await vscode.workspace.getConfiguration("workspaceColor").update("color", undefined, TARGET);
  await paint(undefined);
  if (statusItems) {
    updateStatusBar(context, statusItems);
  }
  postPanelState(panelState(context));
}

const WORKSPACE_COLOR_SETTING_KEYS = [
  "color",
  "label",
  "showStatusBarLabel",
  "icon",
  "showStatusBarIcon",
  "stepped",
  "titleBar",
  "activityBar",
  "statusBar",
  "commandCenter",
] as const;

async function runResetSettings(context: vscode.ExtensionContext): Promise<void> {
  if (!requireWorkspace()) {
    return;
  }
  await context.workspaceState.update(DISABLED_KEY, true);
  const config = vscode.workspace.getConfiguration("workspaceColor");
  for (const key of WORKSPACE_COLOR_SETTING_KEYS) {
    await config.update(key, undefined, TARGET);
  }
  await paint(undefined);
  if (statusItems) {
    updateStatusBar(context, statusItems);
  }
  postPanelState(panelState(context));
  if (!isModernUi()) {
    await setSeparateBars(context, false);
  }
}

async function copyColor(color: string | undefined): Promise<void> {
  if (!color) {
    await vscode.window.showWarningMessage("No workspace color to copy.");
    return;
  }
  await vscode.env.clipboard.writeText(color);
  vscode.window.setStatusBarMessage(`Copied ${color}`, 2500);
}

function requireWorkspace(): boolean {
  if (hasWorkspace()) {
    return true;
  }
  void vscode.window.showWarningMessage("Open a folder or workspace first.");
  return false;
}

async function refresh(context: vscode.ExtensionContext, status: StatusItems): Promise<void> {
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
  const painted = await paint(buildCurrentChrome(color));
  if (painted) {
    await maybeShowWelcome(context);
  }
}

async function persistAndPaint(context: vscode.ExtensionContext, color: string): Promise<void> {
  await vscode.workspace.getConfiguration("workspaceColor").update("color", color, TARGET);
  const painted = await paint(buildCurrentChrome(color));
  if (painted) {
    await maybeShowWelcome(context);
  }
}

async function persistLabel(raw: string): Promise<void> {
  const label = raw.trim();
  await vscode.workspace
    .getConfiguration("workspaceColor")
    .update("label", label.length > 0 ? label : undefined, TARGET);
}

async function persistIcon(id: string): Promise<void> {
  await vscode.workspace.getConfiguration("workspaceColor").update("icon", id, TARGET);
}

async function persistShowStatusBarIcon(enabled: boolean): Promise<void> {
  const config = vscode.workspace.getConfiguration("workspaceColor");
  await config.update("showStatusBarIcon", enabled, TARGET);
  if (enabled && !currentStatusIcon()) {
    await persistIcon(DEFAULT_STATUS_ICON);
  }
}

async function applyStatusIcon(
  context: vscode.ExtensionContext,
  status: StatusItems,
  raw: string,
): Promise<void> {
  const id = parseCodiconId(raw);
  if (!id || !requireWorkspace()) {
    return;
  }
  updateStatusBar(context, status, { showIcon: true, icon: id });
  postPanelState(panelState(context, { showIcon: true, icon: id }));
  await persistIcon(id);
  if (!showStatusBarIcon()) {
    await persistShowStatusBarIcon(true);
  }
}

async function runPickIcon(context: vscode.ExtensionContext, status?: StatusItems): Promise<void> {
  if (!requireWorkspace()) {
    return;
  }
  const id = await pickCodicon(currentStatusIcon() ?? DEFAULT_STATUS_ICON);
  if (!id || !status) {
    return;
  }
  await applyStatusIcon(context, status, id);
}

async function maybeShowWelcome(context: vscode.ExtensionContext): Promise<void> {
  if (welcomeQueued || context.globalState.get(WELCOME_KEY) === true) {
    return;
  }
  welcomeQueued = true;
  await context.globalState.update(WELCOME_KEY, true);
  const open = "Open Color My Workspaces Settings";
  const choice = await vscode.window.showInformationMessage(
    "This workspace is colored. Click the project name in the status bar to change it.",
    open,
  );
  if (choice === open) {
    openPanel(context);
  }
}

async function setSeparateBars(context: vscode.ExtensionContext, separate: boolean): Promise<void> {
  const wantModernUi = !separate;
  if (isModernUi() === wantModernUi) {
    postPanelState(panelState(context));
    return;
  }
  const written = await writeModernUiSetting(wantModernUi);
  if (!written) {
    postPanelState(panelState(context));
    return;
  }
  const reload = "Reload Window";
  const choice = await vscode.window.showInformationMessage(
    wantModernUi
      ? "Reload the window to restore Modern UI."
      : "Reload the window to disable Modern UI so each bar keeps its own color.",
    reload,
  );
  if (choice === reload) {
    await vscode.commands.executeCommand("workbench.action.reloadWindow");
  }
}

async function writeModernUiSetting(enabled: boolean): Promise<boolean> {
  const config = vscode.workspace.getConfiguration("workbench");
  try {
    await config.update(MODERN_UI_SETTING, enabled, TARGET);
    return true;
  } catch {
    // Workspace scope can reject this setting. Ask before writing User settings.
  }
  const apply = "Apply for all windows";
  const choice = await vscode.window.showWarningMessage(
    enabled
      ? "Could not restore Modern UI for this workspace. Apply it for all windows instead?"
      : "Could not turn off Modern UI for this workspace. Apply it for all windows instead?",
    apply,
  );
  if (choice !== apply) {
    return false;
  }
  try {
    await config.update(MODERN_UI_SETTING, enabled, vscode.ConfigurationTarget.Global);
    return true;
  } catch {
    await vscode.window.showErrorMessage("Could not change Modern UI from this window.");
    return false;
  }
}

async function paint(next: Record<string, string> | undefined): Promise<boolean> {
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
    return true;
  } catch {
    await vscode.window.showErrorMessage("Could not write workspace color settings.");
    return false;
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

function showStatusBarLabel(): boolean {
  return vscode.workspace.getConfiguration("workspaceColor").get("showStatusBarLabel", true);
}

function showStatusBarIcon(): boolean {
  return vscode.workspace.getConfiguration("workspaceColor").get("showStatusBarIcon", false);
}

function currentStatusIcon(): string | undefined {
  return parseCodiconId(vscode.workspace.getConfiguration("workspaceColor").get<string>("icon"));
}

function panelState(
  context: vscode.ExtensionContext,
  overrides: { showName?: boolean; showIcon?: boolean; icon?: string } = {},
): PanelState {
  const color = currentColor() ?? "#3b3b8f";
  const stepped = vscode.workspace.getConfiguration("workspaceColor").get<boolean>("stepped", true);
  const flags = readFlags();
  const modernUi = isModernUi();
  const tones = chromeTones(color, stepped);
  const name = currentProjectName() ?? "Workspace";
  const showName = overrides.showName ?? showStatusBarLabel();
  const showIcon = overrides.showIcon ?? showStatusBarIcon();
  return {
    projectName: name,
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
    tones,
    statusPreviewText: formatStatusBarText(name),
    statusForeground: contrastForeground(tones.statusBar),
    chipColor: statusChipColor(
      color,
      flags.statusBar && context.workspaceState.get(DISABLED_KEY) !== true ? tones.statusBar : undefined,
    ),
    showStatusBarLabel: showName,
    showStatusBarIcon: showIcon,
    statusIcon: overrides.icon ?? currentStatusIcon() ?? DEFAULT_STATUS_ICON,
    palette: PALETTE,
  };
}

function isModernUi(): boolean {
  return vscode.workspace.getConfiguration("workbench").get<boolean>(MODERN_UI_SETTING) === true;
}

function updateStatusBar(
  context: vscode.ExtensionContext,
  status: StatusItems,
  overrides: { showName?: boolean; showIcon?: boolean; icon?: string } = {},
): void {
  const showName = overrides.showName ?? showStatusBarLabel();
  const showIcon = overrides.showIcon ?? showStatusBarIcon();
  const name = showName ? currentProjectName() : undefined;
  const icon = showIcon ? (overrides.icon ?? currentStatusIcon() ?? DEFAULT_STATUS_ICON) : undefined;
  const text = formatStatusBarItem({ icon, name });
  const color = currentColor();
  const flags = readFlags();
  const applied = context.workspaceState.get(DISABLED_KEY) !== true;
  const tooltip = statusBarTooltip({ name: currentProjectName() ?? "Workspace", color });
  if (text) {
    status.chip.hide();
    status.label.text = text;
    status.label.tooltip = tooltip;
    status.label.accessibilityInformation = { label: `Workspace color ${currentProjectName() ?? "Workspace"}` };
    status.label.color = undefined;
    status.label.show();
    return;
  }
  status.label.hide();
  if (!hasWorkspace() || !color) {
    status.chip.hide();
    return;
  }
  status.chip.text = STATUS_CHIP_TEXT;
  status.chip.tooltip = tooltip;
  status.chip.color = applied
    ? statusChipColor(color, flags.statusBar ? elementBackgroundForStatus(color) : undefined)
    : undefined;
  status.chip.accessibilityInformation = { label: "Workspace color" };
  status.chip.show();
}

function elementBackgroundForStatus(color: string): string {
  const stepped = vscode.workspace.getConfiguration("workspaceColor").get<boolean>("stepped", true);
  return chromeTones(color, stepped).statusBar;
}
