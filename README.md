<div align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=gvastethecreator.color-my-workspaces"><img src="media/icon.png" alt="Color My Workspaces" width="128" /></a>

# Color My Workspaces

**Give every VS Code workspace a clear, reversible visual identity.**

<p>
  <a href="https://marketplace.visualstudio.com/items?itemName=gvastethecreator.color-my-workspaces"><img alt="VS Code Marketplace" src="https://shieldcn.dev/badge/vscode-marketplace.png?variant=outline&amp;size=xs&amp;theme=blue&amp;logo=ri%3ATbBrandVscode" /></a>
  <a href="LICENSE"><img alt="MIT license" src="https://shieldcn.dev/github/license/gvastethecreator/vscode-color-my-workspaces.png?variant=outline&amp;size=xs" /></a>
  <a href="https://github.com/gvastethecreator/vscode-color-my-workspaces/actions/workflows/ci.yml"><img alt="CI status" src="https://shieldcn.dev/github/ci/gvastethecreator/vscode-color-my-workspaces.png?workflow=ci.yml&amp;branch=main&amp;variant=outline&amp;size=xs" /></a>
</p>
</div>

Color My Workspaces colors the title bar, activity bar, Status Bar, and command center for the current workspace. It can derive a stable color from local, remote, virtual, saved, or multi-root workspace URIs.

It does not write anything on first activation. Applying a color is explicit, and Clear restores the values that existed before the extension took ownership.

![Color My Workspaces settings panel](media/preview.png)

## Get started

1. Open a folder or saved workspace.
2. Run **Color My Workspaces: Apply Color from Folder**, or click the workspace item on the left of the Status Bar.
3. Pick a color or open the full settings panel.
4. Enable **Apply automatically when this workspace opens** only if you want automatic reapplication.

Applying writes workspace configuration. Depending on the VS Code workspace type, that can modify `.vscode/settings.json` or a `.code-workspace` file. Review the change before committing it.

## Safe ownership

The extension manages only its documented chrome keys.

- It captures each previous workspace value before first ownership.
- It leaves editor colors and every unmanaged key untouched.
- It skips identical writes.
- It detects changes from you, Settings Sync, another window, or another extension.
- **Keep external values** preserves those values and blocks later automatic writes.
- **Reapply workspace color** takes ownership again and uses the external value as the new restore baseline.
- **Stop managing affected surfaces** turns off the affected surface and restores its other intact keys.

**Clear Color** restores captured values, keeps external/unmanaged values, removes the saved color, and stops painting.

**Reset Settings** also removes every `workspaceColor.*` workspace value and restores an experimental Modern UI value changed by this extension when it is still safe to do so.

## Chrome and accessibility

Generated foregrounds use WCAG contrast ratios and target at least 4.5:1. If the normal dark/light tokens are insufficient, the extension falls back to black or white.

In High Contrast and High Contrast Light themes, chrome painting is suspended. The workspace name, icon, tooltip, controls, and text/hex values remain available, so identity does not depend on color alone.

The full panel supports keyboard navigation, visible focus, native labels, validation text, 200% zoom, narrow layouts, and reduced motion.

## Experimental Modern UI

VS Code's `workbench.experimental.modernUI` setting can blend the title bar across the window and leave other chrome surfaces transparent. Color My Workspaces detects classic, modern, and unknown states and explains the current limitation.

The extension never changes Modern UI automatically. The panel requires an exact workspace-scope confirmation and records the prior value. If VS Code rejects workspace scope, a second modal must explicitly approve changing all VS Code windows. A reload is required.

Modern UI behavior is experimental and is not part of the minimum VS Code engine promise.

## Commands

| Command | Command id |
| --- | --- |
| Apply Color from Folder | `workspaceColor.applyFromFolder` |
| Pick Color | `workspaceColor.pick` |
| Change Color... | `workspaceColor.quickActions` |
| Surprise Me | `workspaceColor.surprise` |
| Clear Color | `workspaceColor.reset` |
| Reset Settings | `workspaceColor.resetSettings` |
| Reapply Color and Take Ownership | `workspaceColor.reapply` |
| Open Color My Workspaces Settings | `workspaceColor.openPanel` |

## Settings

All extension settings use workspace-window scope.

| Setting | Default | Purpose |
| --- | --- | --- |
| `workspaceColor.color` | empty | Saved hex color. Empty previews the stable derived color. |
| `workspaceColor.autoApply` | `false` | Reapply after explicit opt-in. |
| `workspaceColor.identity` | empty | Stable identity override used for color derivation. |
| `workspaceColor.label` | empty | Status Bar name; empty uses the workspace/folder name. |
| `workspaceColor.showStatusBarLabel` | `true` | Show the workspace name. |
| `workspaceColor.icon` | empty | Status Bar Codicon id. |
| `workspaceColor.showStatusBarIcon` | `false` | Show the selected/default icon. |
| `workspaceColor.statusBarClick` | `quick` | Open Quick settings or Full settings. |
| `workspaceColor.stepped` | `true` | Use a different tone on each surface. |
| `workspaceColor.titleBar` | `true` | Color the title bar/window shell. |
| `workspaceColor.activityBar` | `true` | Color side, top, or bottom activity bar keys. |
| `workspaceColor.statusBar` | `true` | Color the Status Bar. |
| `workspaceColor.commandCenter` | `true` | Color the command center. |

## Compatibility

- VS Code desktop 1.134 or newer
- Windows, macOS, and Linux
- local, Remote Development, Virtual Workspaces, and Restricted Mode
- no web extension host / vscode.dev support
- empty windows are shown but never colored

The extension runs in the UI extension host and uses URI/configuration APIs. It does not read or execute workspace code.

## Troubleshooting

**The color is not applied**

Open a folder or saved workspace. Check that Color My Workspaces has been applied once, that the selected surface is enabled, and that a high-contrast theme is not active.

**A surface stays transparent**

Modern UI can control shell transparency. Open the full panel for the detected compatibility note. Changing the experimental setting is optional and requires confirmation plus reload.

**My manual or Peacock value remains**

That key changed outside the extension. Keep it, stop managing the surface, or use **Reapply Color and Take Ownership** after reviewing the new restore baseline.

**Clear did not remove one color**

Clear intentionally keeps an external value. It removes/restores only values whose ownership is still intact.

**The repository became dirty**

Applying writes workspace configuration. Review `.vscode/settings.json` or the saved `.code-workspace` file. Clear restores the captured chrome baseline but does not manipulate Git.

## Privacy and security

Color My Workspaces has no telemetry and makes no product network requests. It does not read document contents, scan files, execute commands, or log paths, environment values, secrets, clipboard bytes, or configuration values. Copy color writes only the selected hex value to the clipboard after an explicit action.

Security reports: [private GitHub advisory](https://github.com/gvastethecreator/vscode-color-my-workspaces/security/advisories/new).

## Development and release

See [development](docs/development.md), [compatibility and QA](docs/compatibility.md), [security review](docs/security-review.md), and [publishing/rollback](docs/publishing.md).
