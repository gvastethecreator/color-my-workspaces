export function folderIdentity(fsPath: string): string {
  const parts = fsPath.split(/[\\/]/).filter((part) => part.length > 0 && !/^[a-zA-Z]:$/.test(part));
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  }
  return parts[parts.length - 1] ?? fsPath;
}

export function workspaceIdentity(input: {
  workspaceFile?: string;
  folders: readonly string[];
}): string | undefined {
  if (input.workspaceFile) {
    const base = input.workspaceFile.split(/[\\/]/).filter((part) => part.length > 0).pop() ?? "";
    const name = base.replace(/\.code-workspace$/i, "");
    return name || undefined;
  }
  if (input.folders.length === 0) {
    return undefined;
  }
  return input.folders.map(folderIdentity).join("|");
}

export function projectDisplayName(input: {
  customLabel?: string;
  workspaceName?: string;
  folders: readonly string[];
}): string | undefined {
  const custom = input.customLabel?.trim();
  if (custom) {
    return custom;
  }
  const named = input.workspaceName?.trim();
  if (named) {
    return named;
  }
  if (input.folders.length === 0) {
    return undefined;
  }
  const parts = input.folders[0]
    .split(/[\\/]/)
    .filter((part) => part.length > 0 && !/^[a-zA-Z]:$/.test(part));
  return parts[parts.length - 1];
}

export function truncateLabel(label: string, max = 28): string {
  if (label.length <= max) {
    return label;
  }
  return `${label.slice(0, Math.max(1, max - 1))}…`;
}
