# Workspace Color

Color the VS Code title bar, activity bar, status bar, and command center per workspace.

This does not color the Windows taskbar. VS Code has no API for that. Colors are written to `workbench.colorCustomizations` in the workspace (`.vscode/settings.json` or a `.code-workspace` file).

A CSS gradient is not possible. **Stepped tones** gives each bar a slightly different solid shade of the same color.

In current VS Code and Cursor (Modern UI), `titleBar` is the window-shell backdrop. The activity bar on top uses `activityBarTop.*`, not only `activityBar.*`. This extension writes both. If the other bars stay transparent, use **Color bars separately** in the panel (`workbench.experimental.modernUI: false`).

## Try it

1. `pnpm install`
2. `pnpm test`
3. F5 (`Run Extension`)
4. In the new window, click the project name on the left of the status bar

The host opens `test-workspace/` so color settings are not written into this repo. See [development](docs/development.md).

## Commands

- **Open Color Settings** — color, label, and which bars to paint (also opens from the status bar name)
- **Apply Color from Folder** — stable color from the folder name
- **Pick Color** — opens the same panel
- **Surprise Me** — random color
- **Remove Color** — removes keys this extension added and leaves other `colorCustomizations` intact

## Settings

- `workspaceColor.label` — status bar name. Empty uses the folder or workspace name
- `workspaceColor.color` — hex. Empty is derived from the folder
- `workspaceColor.autoApply` — apply on open (default `true`)
- `workspaceColor.stepped` — stepped tones (default `true`)
- `workspaceColor.titleBar` / `activityBar` / `statusBar` / `commandCenter` — enable each bar separately

## License

MIT. See [LICENSE](LICENSE).
