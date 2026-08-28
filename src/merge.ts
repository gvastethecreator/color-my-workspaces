export function mergeManagedColors(
  workspaceValue: Record<string, string> | undefined,
  managedKeys: readonly string[],
  next: Record<string, string> | undefined,
): Record<string, string> | undefined {
  const managed = new Set(managedKeys);
  const rest: Record<string, string> = {};
  for (const [key, value] of Object.entries(workspaceValue ?? {})) {
    if (!managed.has(key)) {
      rest[key] = value;
    }
  }
  if (!next) {
    return Object.keys(rest).length > 0 ? rest : undefined;
  }
  return { ...rest, ...next };
}
