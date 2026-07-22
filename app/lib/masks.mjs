export const MASK_IDS = ["circle", "bubble", "heart", "star", "book"];

const STAR_POINTS = Array.from({ length: 10 }, (_, index) => {
  const angle = -Math.PI / 2 + index * (Math.PI / 5);
  const radius = index % 2 === 0 ? 0.94 : 0.42;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
});

export function getMaskBounds(maskId, width, height) {
  const shortSide = Math.min(width, height);

  if (maskId === "bubble") return { halfWidth: width * 0.39, halfHeight: height * 0.36 };
  if (maskId === "book") return { halfWidth: width * 0.38, halfHeight: height * 0.34 };
  return { halfWidth: shortSide * 0.44, halfHeight: shortSide * 0.44 };
}

export function isInsideMask(maskId, x, y, width = 2, height = 2) {
  const { halfWidth, halfHeight } = getMaskBounds(maskId, width, height);
  const localX = (x * width) / (2 * halfWidth);
  const localY = (y * height) / (2 * halfHeight);

  return isInsideLocalMask(maskId, localX, localY);
}

function isInsideLocalMask(maskId, localX, localY) {
  if (Math.abs(localX) > 1 || Math.abs(localY) > 1) return false;
  if (maskId === "circle") return localX * localX + localY * localY <= 0.88;
  if (maskId === "bubble") {
    return (
      (localX * localX) / 0.92 + ((localY + 0.1) * (localY + 0.1)) / 0.64 <= 1 ||
      isInsideTriangle(localX, localY, [-0.5, 0.42], [-0.12, 0.45], [-0.58, 0.92])
    );
  }
  if (maskId === "heart") {
    const hy = -localY * 1.08 + 0.12;
    return (localX * localX + hy * hy - 0.68) ** 3 - localX * localX * hy ** 3 <= 0;
  }
  if (maskId === "star") {
    return isInsidePolygon(localX, localY, STAR_POINTS);
  }
  if (maskId === "book") {
    return (
      Math.abs(localX) <= 0.9 &&
      Math.abs(localY) <= 0.68 - 0.12 * Math.abs(localX) &&
      !(Math.abs(localX) < 0.04 && Math.abs(localY) > 0.58)
    );
  }
  return false;
}

export function traceMaskPath(context, maskId) {
  const samples = 240;
  for (let index = 0; index <= samples; index += 1) {
    const angle = (index / samples) * Math.PI * 2;
    const radius = findBoundary(maskId, Math.cos(angle), Math.sin(angle));
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

function findBoundary(maskId, directionX, directionY) {
  const steps = 160;
  let lastInside = 0;

  for (let step = 1; step <= steps; step += 1) {
    const radius = step / steps;
    if (!isInsideLocalMask(maskId, directionX * radius, directionY * radius)) break;
    lastInside = radius;
  }
  return lastInside;
}

function isInsideTriangle(x, y, [ax, ay], [bx, by], [cx, cy]) {
  const denominator = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
  const first = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / denominator;
  const second = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / denominator;
  const third = 1 - first - second;
  return first >= 0 && second >= 0 && third >= 0;
}

function isInsidePolygon(x, y, points) {
  let inside = false;

  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const [currentX, currentY] = points[index];
    const [previousX, previousY] = points[previous];
    const crossesRay = (currentY > y) !== (previousY > y)
      && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;
    if (crossesRay) inside = !inside;
  }
  return inside;
}
