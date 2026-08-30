export type PaletteSwatch = {
  label: string;
  color: string;
};

export const PALETTE_COLUMNS = 9;
export const QUICK_PICK_COLOR_COUNT = 8;

/** Swatches ordered by hue so adjacent chips read as a spectrum. */
export const PALETTE: readonly PaletteSwatch[] = [
  { label: "Ember", color: "#7a2e2e" },
  { label: "Rust", color: "#8a4333" },
  { label: "Copper", color: "#8a4a32" },
  { label: "Clay", color: "#6e4e3a" },
  { label: "Ochre", color: "#7a5b20" },
  { label: "Moss", color: "#3a5c32" },
  { label: "Forest", color: "#2d5a3d" },
  { label: "Pine", color: "#1f5c48" },
  { label: "Teal", color: "#1f6f6a" },
  { label: "Ocean", color: "#1e4f78" },
  { label: "Slate", color: "#3d4c5c" },
  { label: "Steel", color: "#45566b" },
  { label: "Navy", color: "#243e6b" },
  { label: "Indigo", color: "#3b3b8f" },
  { label: "Grape", color: "#4d356e" },
  { label: "Plum", color: "#5a3d6b" },
  { label: "Berry", color: "#6b2d52" },
  { label: "Wine", color: "#6b2d3c" },
];
