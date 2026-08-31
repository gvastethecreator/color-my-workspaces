# Publishing to the VS Code Marketplace

This guide covers packaging Color My Workspaces (`color-my-workspaces`) and publishing it under the `gvastethecreator` publisher.

## Checklist before first publish

- [ ] Publisher `gvastethecreator` exists at [Visual Studio Marketplace Manage](https://marketplace.visualstudio.com/manage)
- [ ] `package.json` fields look correct: `publisher`, `name`, `version`, `icon`, `galleryBanner`, `repository`, `license`
- [ ] `media/icon.png` is a **PNG** (not SVG), at least 128×128
- [ ] `README.md` uses relative PNG screenshots (no user SVG images)
- [ ] `CHANGELOG.md` has an entry for the version you will ship
- [ ] `pnpm test` and `pnpm run check-types` pass
- [ ] Local VSIX installs and the panel still works (`pnpm run vsix`, then Install from VSIX…)

## Assets in this repo

| File | Role |
| --- | --- |
| `media/icon.svg` | Master vector (square 425×425). Not shipped in the VSIX. |
| `media/icon-source.png` | 512×512 master raster. Not shipped in the VSIX. |
| `media/icon.png` | Marketplace icon (128×128). Referenced by `package.json` → `icon`. |
| `media/icon-512.png` | High-res icon for README / GitHub. Not shipped in the VSIX. |
| `media/preview.png` | README / Marketplace screenshot of the settings panel. |
| `media/social-preview.png` | GitHub social preview (1280×420). Upload in repo Settings → General → Social preview. |
| `docs/assets/github-readme-assets/final/social-preview.png` | Same social card under the assets folder. |

Regenerate icon rasters after editing the SVG:

```bash
pnpm run icons
```

## Package a VSIX locally

The extension is bundled with esbuild, so there are no runtime `dependencies`. Use `--no-dependencies`:

```bash
pnpm run vsix
```

That runs the production build, then `vsce package --no-dependencies`. Output: `color-my-workspaces-<version>.vsix` (gitignored).

Inspect contents if needed:

```bash
pnpm exec vsce ls --no-dependencies
```

Install the VSIX in VS Code / Cursor: **Extensions: Install from VSIX…**

## Create the publisher (once)

1. Sign in at [https://marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage) with a Microsoft account.
2. Create a publisher whose **ID** is exactly `gvastethecreator` (must match `package.json` → `publisher`).
3. Fill display name, and optionally link the GitHub repo.

## Authentication options

### Personal Access Token (manual publish)

Azure DevOps global PATs are being retired (**1 December 2026**). Prefer Entra ID automation for CI when you can. For a one-off local publish:

1. Open Azure DevOps → User settings → Personal access tokens → New Token.
2. Organization: **All accessible organizations** (or the org that owns the publisher).
3. Scopes → Show all scopes → **Marketplace → Manage**.
4. Create the token and store it somewhere safe (not in git).

Login and publish:

```bash
pnpm exec vsce login gvastethecreator
# paste the PAT when prompted

pnpm run package
pnpm exec vsce publish --no-dependencies
```

Or publish a specific version:

```bash
pnpm exec vsce publish 0.1.0 --no-dependencies
```

`vsce publish` bumps / uses `package.json` version according to the args you pass. Prefer bumping the version in git first, then packaging/publishing that exact version.

### Microsoft Entra ID (recommended for CI)

Microsoft recommends workload identity federation + managed identity instead of long-lived PATs. See the official guide: [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) → Secure automated publishing.

## Marketplace content rules (vsce will reject you)

- Marketplace `icon` must be PNG, not SVG.
- README / CHANGELOG images must resolve as HTTPS or as packaged relative files. Prefer relative `media/*.png` paths in this repo.
- Do **not** put user SVG images in README or CHANGELOG. shieldcn badges must use the `.png` endpoint (`.svg` is rejected by `vsce`).
- Keep SVG sources out of the VSIX (already covered by `.vscodeignore`).

## Version and changelog

For the first Marketplace release, bump past the local scaffold, for example `0.1.0`, and add a matching `CHANGELOG.md` section.

Suggested flow:

1. Update `version` in `package.json`.
2. Update `CHANGELOG.md`.
3. `pnpm test && pnpm run check-types`
4. `pnpm run vsix` and smoke-test the VSIX.
5. Commit, tag (`v0.1.0`), push.
6. `pnpm exec vsce publish --no-dependencies`

## Optional: Open VSX

Cursor and some other editors also pull from [Open VSX](https://open-vsx.org/). After the VS Code Marketplace publish works, you can publish the same VSIX with [`ovsx`](https://github.com/eclipse/openvsx/wiki/Publishing-Extensions):

```bash
pnpm add -D ovsx
pnpm exec ovsx publish color-my-workspaces-<version>.vsix -p <OPEN_VSX_TOKEN>
```

## After publish

- Marketplace page: `https://marketplace.visualstudio.com/items?itemName=gvastethecreator.color-my-workspaces`
- Install from the Extensions view by searching **Color My Workspaces**.
- Upload `media/social-preview.png` as the GitHub repository social preview image.
- Watch the first issues for missing permissions / Modern UI notes already covered in the README.
