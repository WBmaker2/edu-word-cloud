import { PALETTE_OPTIONS } from "./cloud-options.mjs";

export function getPaletteNavigationTarget(paletteId, direction, hasNavigated) {
  if (!hasNavigated) return PALETTE_OPTIONS[0].id;

  const currentIndex = PALETTE_OPTIONS.findIndex(({ id }) => id === paletteId);
  const safeIndex = currentIndex < 0 ? 0 : currentIndex;
  const nextIndex = Math.max(0, Math.min(PALETTE_OPTIONS.length - 1, safeIndex + direction));
  return PALETTE_OPTIONS[nextIndex].id;
}

export function canMovePalette(paletteId, direction, hasNavigated) {
  if (!hasNavigated) return true;

  const currentIndex = PALETTE_OPTIONS.findIndex(({ id }) => id === paletteId);
  if (currentIndex < 0) return true;
  return direction < 0 ? currentIndex > 0 : currentIndex < PALETTE_OPTIONS.length - 1;
}
