export const MASK_IDS = ["circle", "bubble", "heart", "star", "book"];

const STAR_POINTS = Array.from({ length: 10 }, (_, index) => {
  const angle = -Math.PI / 2 + index * (Math.PI / 5);
  const radius = index % 2 === 0 ? 0.94 : 0.42;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
});

export function getMaskBounds(maskId, width, height) {
  const shortSide = Math.min(width, height);

  if (maskId === "bubble") return { halfWidth: width * 0.39, halfHeight: height * 0.36 };
  if (maskId === "book") return { halfWidth: width * 0.25, halfHeight: height * 0.42 };
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
    return isInsideRoundedBubble(localX, localY) || isInsideTriangle(localX, localY, [-0.1, 0.62], [0.18, 0.62], [-0.08, 0.84]);
  }
  if (maskId === "heart") {
    const hy = -localY * 1.08 + 0.12;
    return (localX * localX + hy * hy - 0.68) ** 3 - localX * localX * hy ** 3 <= 0;
  }
  if (maskId === "star") {
    return isInsidePolygon(localX, localY, STAR_POINTS);
  }
  if (maskId === "book") {
    const pageWidth = Math.abs(localX) / 0.92;
    const top = -0.46 - 0.19 * pageWidth ** 1.6;
    const bottom = 0.78 - 0.15 * pageWidth ** 1.7;
    return pageWidth <= 1 && localY >= top && localY <= bottom;
  }
  return false;
}

export function traceMaskPath(context, maskId) {
  if (maskId === "circle") {
    context.arc(0, 0, 0.94, 0, Math.PI * 2);
  } else if (maskId === "bubble") {
    traceBubblePath(context);
  } else if (maskId === "heart") {
    traceHeartPath(context);
  } else if (maskId === "book") {
    traceBookPath(context);
  } else {
    tracePolygonPath(context, STAR_POINTS);
  }
  context.closePath();
}

export function traceMaskDetail(context, maskId) {
  if (maskId !== "book") return;

  context.moveTo(0, -0.46);
  context.bezierCurveTo(-0.02, -0.1, -0.02, 0.44, 0, 0.78);
}

function isInsideTriangle(x, y, [ax, ay], [bx, by], [cx, cy]) {
  const denominator = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
  const first = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / denominator;
  const second = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / denominator;
  const third = 1 - first - second;
  return first >= 0 && second >= 0 && third >= 0;
}

function isInsideRoundedBubble(x, y) {
  const cornerRadius = 0.23;
  const innerX = 0.73;
  const innerY = 0.39;
  const distanceX = Math.max(Math.abs(x) - innerX, 0);
  const distanceY = Math.max(Math.abs(y) - innerY, 0);
  return distanceX * distanceX + distanceY * distanceY <= cornerRadius * cornerRadius;
}

function traceBubblePath(context) {
  context.moveTo(-0.73, -0.62);
  context.bezierCurveTo(-0.9, -0.62, -0.96, -0.45, -0.96, -0.22);
  context.lineTo(-0.96, 0.2);
  context.bezierCurveTo(-0.96, 0.46, -0.81, 0.62, -0.59, 0.62);
  context.lineTo(-0.24, 0.62);
  context.bezierCurveTo(-0.14, 0.62, -0.08, 0.7, -0.08, 0.84);
  context.bezierCurveTo(0.01, 0.75, 0.08, 0.67, 0.18, 0.62);
  context.lineTo(0.69, 0.62);
  context.bezierCurveTo(0.87, 0.62, 0.96, 0.44, 0.96, 0.2);
  context.lineTo(0.96, -0.22);
  context.bezierCurveTo(0.96, -0.45, 0.9, -0.62, 0.73, -0.62);
  context.closePath();
}

function traceHeartPath(context) {
  context.moveTo(0, 0.88);
  context.bezierCurveTo(-0.16, 0.68, -0.86, 0.26, -0.86, -0.23);
  context.bezierCurveTo(-0.86, -0.64, -0.35, -0.82, 0, -0.43);
  context.bezierCurveTo(0.35, -0.82, 0.86, -0.64, 0.86, -0.23);
  context.bezierCurveTo(0.86, 0.26, 0.16, 0.68, 0, 0.88);
}

function traceBookPath(context) {
  context.moveTo(-0.92, -0.65);
  context.bezierCurveTo(-0.57, -0.78, -0.23, -0.7, 0, -0.46);
  context.bezierCurveTo(0.23, -0.7, 0.57, -0.78, 0.92, -0.65);
  context.lineTo(0.92, 0.63);
  context.bezierCurveTo(0.59, 0.52, 0.24, 0.57, 0, 0.78);
  context.bezierCurveTo(-0.24, 0.57, -0.59, 0.52, -0.92, 0.63);
}

function tracePolygonPath(context, points) {
  for (const [x, y] of points) {
    if (x === points[0][0] && y === points[0][1]) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
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
