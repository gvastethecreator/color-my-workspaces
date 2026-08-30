# Workspace Color

Color the VS Code or Cursor title bar, activity bar, status bar, and command center so each folder is easy to tell apart.

This extension writes `workbench.colorCustomizations` in the workspace. It cannot color the Windows taskbar.

## Quick start

Install the VSIX, open a folder, then click the project name on the left of the status bar.

In the panel you can pick a color, name the workspace, and choose which bars to paint. If bars stay transparent, turn on **Disable Modern UI** and reload.

F5 (`Run Extension`) opens `test-workspace/` so test colors do not land in this repo. See [development](docs/development.md).

## Commands

- **Change Color...** — also runs from the status bar
- **Open Workspace Color Settings**
- **Pick Color** / **Apply Color from Folder** / **Surprise Me**
- **Clear Color** — drops keys this extension added; leaves other customizations
- **Reset Settings** — restores Workspace Color options to defaults and clears the color

## Settings

- `workspaceColor.color` — hex. Empty uses a color from the folder name
- `workspaceColor.label` / `workspaceColor.showStatusBarLabel` — status bar name
- `workspaceColor.icon` / `workspaceColor.showStatusBarIcon` — Codicon on the status bar (`folder`, `rocket`, …). A color pill is shown when the name and icon are both hidden
- `workspaceColor.titleBar` / `activityBar` / `statusBar` / `commandCenter`
- `workspaceColor.stepped` — slightly different shade on each bar

## License

MIT. See [LICENSE](LICENSE).
