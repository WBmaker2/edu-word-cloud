export const MASK_IDS = ["circle", "bubble", "heart", "star", "book"];

export function isInsideMask(maskId, x, y) {
  if (Math.abs(x) > 1 || Math.abs(y) > 1) return false;
  if (maskId === "circle") return x * x + y * y <= 0.88;
  if (maskId === "bubble") {
    return (
      (x * x) / 0.92 + (y * y) / 0.64 <= 1 ||
      (y > 0.45 && y < 0.9 && x > 0.2 && x < 0.72 - y * 0.35)
    );
  }
  if (maskId === "heart") {
    const hy = -y * 1.08 + 0.12;
    return (x * x + hy * hy - 0.68) ** 3 - x * x * hy ** 3 <= 0;
  }
  if (maskId === "star") {
    const angle = Math.atan2(y, x);
    const radius = Math.hypot(x, y);
    const edge = 0.53 + 0.27 * Math.cos(5 * angle);
    return radius <= edge;
  }
  if (maskId === "book") {
    return (
      Math.abs(x) <= 0.9 &&
      Math.abs(y) <= 0.68 - 0.12 * Math.abs(x) &&
      !(Math.abs(x) < 0.04 && Math.abs(y) > 0.58)
    );
  }
  return false;
}
