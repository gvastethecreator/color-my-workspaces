# Publishing Color My Workspaces

Extension id: `gvastethecreator.color-my-workspaces`.

## Package a VSIX (no token needed)

```bash
pnpm run vsix
```

Output: `color-my-workspaces-<version>.vsix` (gitignored).

## Easiest publish path: upload in the browser

You do **not** need the CLI or a PAT for the first publish.

1. Open [https://marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage)
2. Sign in with the Microsoft account that owns publisher `gvastethecreator`
3. Create the publisher if it does not exist yet (id must match `package.json`)
4. Choose **New extension** → **Visual Studio Code** → upload `color-my-workspaces-0.0.1.vsix`

That path avoids `vsce login` and Azure DevOps tokens entirely.

## MFA is not a paid Marketplace feature

- Microsoft account **MFA is free** for personal accounts (Security info / authenticator app).
- Creating an Azure DevOps **Personal Access Token is free**.
- Paid Microsoft Entra / Conditional Access products are for organizations; they are not required to publish a free VS Code extension.

If the CLI asks for MFA, that is your Microsoft account security challenge, not a Marketplace paywall.

## Optional: CLI publish with a PAT

Use this only if you want `vsce publish` from the terminal.

1. Open [https://dev.azure.com](https://dev.azure.com) with the **same** Microsoft account as the Marketplace publisher.
2. If Azure DevOps asks you to create an organization, create a free one (any name).
3. User settings (top right) → **Personal access tokens** → **New Token**.
4. Settings that matter:
   - Organization: **All accessible organizations**
   - Scopes → **Show all scopes** → **Marketplace** → **Manage**
5. Create, copy the token once, store it outside git.
6. Publish:

```bash
# Avoid keytar issues on Windows if needed:
set VSCE_PAT=YOUR_TOKEN_HERE
pnpm exec vsce publish --no-dependencies
```

Or:

```bash
pnpm exec vsce login gvastethecreator
pnpm exec vsce publish --no-dependencies
```

Common mistakes: scoping the PAT to one org instead of **All accessible organizations**, or forgetting **Marketplace → Manage**.

Global Azure DevOps PATs are being retired on **1 December 2026**. After that, prefer browser upload or GitHub Actions OIDC.

## Optional: publish from GitHub Actions (OIDC, no PAT)

`@vscode/vsce` supports `vsce publish --oidc` from GitHub Actions after you configure a trusted publishing policy on the Marketplace for this repo. See the [vsce trusted publishing docs](https://github.com/microsoft/vscode-vsce#trusted-publishing).

## Marketplace content rules

- `package.json` → `icon` must be PNG (not SVG).
- README / CHANGELOG images: relative `media/*.png` or HTTPS. shieldcn badges must use `.png` (`.svg` is rejected by `vsce`).
- Keep SVG sources out of the VSIX (see `.vscodeignore`).

## Assets

| File | Role |
| --- | --- |
| `media/icon.svg` | Master vector |
| `media/icon.png` | Marketplace icon (128×128) |
| `media/icon-512.png` | High-res raster |
| `media/preview.png` | README / Marketplace screenshot |
| `media/preview-source.png` | Square screenshot source for `pnpm run icons` |
| `media/social-preview.png` | GitHub social preview (upload in repo Settings) |

Regenerate rasters: `pnpm run icons`.

## After publish

- Page: `https://marketplace.visualstudio.com/items?itemName=gvastethecreator.color-my-workspaces`
- Search **Color My Workspaces** in the Extensions view
- Upload `media/social-preview.png` as the GitHub social preview image
