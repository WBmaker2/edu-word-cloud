export const MASK_IDS = ["circle", "bubble", "heart", "star", "book", "butterfly", "leaf", "lightbulb", "cloud"];

const STAR_POINTS = Array.from({ length: 10 }, (_, index) => {
  const angle = -Math.PI / 2 + index * (Math.PI / 5);
  const radius = index % 2 === 0 ? 0.94 : 0.42;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
});

export function getMaskBounds(maskId, width, height) {
  const shortSide = Math.min(width, height);

  if (maskId === "bubble") return { halfWidth: width * 0.39, halfHeight: height * 0.36 };
  if (maskId === "book") return { halfWidth: width * 0.25, halfHeight: height * 0.42 };
  if (maskId === "butterfly") return { halfWidth: width * 0.31, halfHeight: height * 0.42 };
  if (maskId === "leaf") return { halfWidth: width * 0.31, halfHeight: height * 0.34 };
  if (maskId === "lightbulb") return { halfWidth: shortSide * 0.34, halfHeight: shortSide * 0.44 };
  if (maskId === "cloud") return { halfWidth: width * 0.34, halfHeight: height * 0.34 };
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
  if (maskId === "butterfly") return isInsideButterfly(localX, localY);
  if (maskId === "leaf") return isInsideLeaf(localX, localY);
  if (maskId === "lightbulb") return isInsideLightbulb(localX, localY);
  if (maskId === "cloud") return isInsideCloud(localX, localY);
  return false;
}

export function traceMaskPath(context, maskId) {
  if (maskId === "circle") {
    context.arc(0, 0, 0.94, 0, Math.PI * 2);
  } else if (maskId === "bubble") {
    traceBubblePath(context);
  } else if (maskId === "heart") {
    traceHeartPath(context);
  } else if (maskId === "butterfly") {
    traceButterflyPath(context);
  } else if (maskId === "leaf") {
    traceLeafPath(context);
  } else if (maskId === "lightbulb") {
    traceLightbulbPath(context);
  } else if (maskId === "cloud") {
    traceCloudPath(context);
  } else if (maskId === "book") {
    traceBookPath(context);
  } else {
    tracePolygonPath(context, STAR_POINTS);
  }
  context.closePath();
}

export function traceMaskDetail(context, maskId) {
  if (maskId === "leaf") {
    context.moveTo(-0.42, 0.62);
    context.bezierCurveTo(-0.1, 0.28, 0.18, -0.14, 0.38, -0.62);
    context.moveTo(-0.12, 0.36);
    context.lineTo(-0.42, 0.18);
    context.moveTo(0.03, 0.12);
    context.lineTo(-0.28, -0.06);
    context.moveTo(0.2, -0.18);
    context.lineTo(-0.06, -0.32);
    context.moveTo(0.3, -0.38);
    context.lineTo(0.08, -0.52);
    return true;
  }
  if (maskId === "lightbulb") {
    context.moveTo(-0.2, 0.3);
    context.bezierCurveTo(-0.32, 0.16, -0.24, 0.02, -0.1, 0.14);
    context.bezierCurveTo(0, 0.22, 0.06, 0.3, 0.1, 0.14);
    context.bezierCurveTo(0.24, 0.02, 0.32, 0.16, 0.2, 0.3);
    context.bezierCurveTo(0.08, 0.42, -0.08, 0.42, -0.2, 0.3);
    context.moveTo(-0.3, 0.58);
    context.lineTo(0.3, 0.58);
    context.moveTo(-0.3, 0.72);
    context.lineTo(0.3, 0.72);
    return true;
  }
  if (maskId !== "book") return false;

  context.moveTo(0, -0.46);
  context.bezierCurveTo(-0.02, -0.1, -0.02, 0.44, 0, 0.78);
  return true;
}

function isInsideEllipse(x, y, centerX, centerY, radiusX, radiusY) {
  return ((x - centerX) / radiusX) ** 2 + ((y - centerY) / radiusY) ** 2 <= 1;
}

function isInsideButterfly(x, y) {
  return isInsideEllipse(x, y, -0.4, -0.28, 0.31, 0.58)
    || isInsideEllipse(x, y, 0.4, -0.28, 0.31, 0.58)
    || isInsideEllipse(x, y, -0.42, 0.31, 0.31, 0.32)
    || isInsideEllipse(x, y, 0.42, 0.31, 0.31, 0.32)
    || isInsideEllipse(x, y, 0, 0.02, 0.14, 0.7);
}

function isInsideLeaf(x, y) {
  const angle = 0.16;
  const axisX = Math.cos(angle) * x - Math.sin(angle) * y;
  const axisY = Math.sin(angle) * x + Math.cos(angle) * y;
  const leafBody = (axisX / 1.02) ** 2 + (axisY / 0.67) ** 2 <= 1;
  const stem = isInsideEllipse(x, y, -0.16, 0.8, 0.17, 0.2);
  return leafBody || stem;
}

function isInsideLightbulb(x, y) {
  const bulb = isInsideEllipse(x, y, 0, -0.2, 0.78, 0.76);
  const neck = isInsideEllipse(x, y, 0, 0.34, 0.4, 0.54);
  const socket = Math.abs(x) <= 0.32 && y >= 0.52 && y <= 0.88;
  return bulb || neck || socket;
}

function isInsideCloud(x, y) {
  return isInsideEllipse(x, y, 0, 0.12, 0.84, 0.6)
    || isInsideEllipse(x, y, 0, -0.35, 0.2, 0.66)
    || isInsideEllipse(x, y, -0.55, -0.1, 0.32, 0.44)
    || isInsideEllipse(x, y, 0.55, -0.1, 0.32, 0.44);
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

function traceButterflyPath(context) {
  context.moveTo(0, -0.72);
  context.bezierCurveTo(-0.12, -0.84, -0.38, -1, -0.64, -0.92);
  context.bezierCurveTo(-0.86, -0.88, -1, -0.58, -0.9, -0.28);
  context.bezierCurveTo(-0.94, -0.08, -1, 0.12, -0.9, 0.28);
  context.bezierCurveTo(-0.98, 0.4, -0.96, 0.52, -0.9, 0.56);
  context.bezierCurveTo(-0.82, 0.82, -0.56, 0.9, -0.34, 0.78);
  context.bezierCurveTo(-0.2, 0.78, -0.12, 0.7, -0.08, 0.64);
  context.bezierCurveTo(-0.05, 0.7, -0.03, 0.74, 0, 0.76);
  context.bezierCurveTo(0.03, 0.74, 0.05, 0.7, 0.08, 0.64);
  context.bezierCurveTo(0.12, 0.7, 0.2, 0.78, 0.34, 0.8);
  context.bezierCurveTo(0.56, 0.9, 0.82, 0.82, 0.86, 0.56);
  context.bezierCurveTo(0.96, 0.52, 0.98, 0.4, 0.9, 0.28);
  context.bezierCurveTo(1, 0.12, 0.94, -0.08, 0.9, -0.28);
  context.bezierCurveTo(1, -0.58, 0.86, -0.88, 0.64, -0.92);
  context.bezierCurveTo(0.38, -1, 0.12, -0.84, 0, -0.72);
}

function traceLeafPath(context) {
  context.moveTo(0.2, -0.82);
  context.bezierCurveTo(-0.16, -0.86, -0.9, -0.52, -1.04, 0);
  context.bezierCurveTo(-1.12, 0.2, -1.12, 0.62, -0.48, 0.7);
  context.bezierCurveTo(-0.4, 0.68, -0.28, 0.7, -0.18, 0.68);
  context.bezierCurveTo(-0.5, 0.68, -0.78, 0.84, -0.55, 0.98);
  context.bezierCurveTo(-0.24, 1.05, 0.02, 1.04, 0.1, 0.99);
  context.lineTo(0.04, 0.68);
  context.bezierCurveTo(0.48, 0.7, 1.12, 0.62, 1.04, 0);
  context.bezierCurveTo(1.12, -0.2, 1.1, -0.62, 0.2, -0.82);
}

function traceLightbulbPath(context) {
  context.moveTo(0, -0.96);
  context.bezierCurveTo(-0.5, -0.96, -0.82, -0.62, -0.82, -0.2);
  context.bezierCurveTo(-0.82, 0.12, -0.66, 0.29, -0.46, 0.47);
  context.bezierCurveTo(-0.4, 0.56, -0.38, 0.62, -0.36, 0.7);
  context.lineTo(-0.36, 0.84);
  context.bezierCurveTo(-0.36, 0.92, -0.29, 0.96, -0.2, 0.96);
  context.lineTo(0.2, 0.96);
  context.bezierCurveTo(0.29, 0.96, 0.36, 0.92, 0.36, 0.84);
  context.lineTo(0.36, 0.7);
  context.bezierCurveTo(0.38, 0.62, 0.4, 0.56, 0.46, 0.47);
  context.bezierCurveTo(0.66, 0.29, 0.82, 0.12, 0.82, -0.2);
  context.bezierCurveTo(0.82, -0.62, 0.5, -0.96, 0, -0.96);
}

function traceCloudPath(context) {
  context.moveTo(-0.94, 0.45);
  context.bezierCurveTo(-1, 0.28, -0.99, 0.04, -0.9, -0.04);
  context.bezierCurveTo(-0.98, -0.2, -0.9, -0.55, -0.72, -0.62);
  context.bezierCurveTo(-0.64, -0.72, -0.5, -0.72, -0.42, -0.5);
  context.bezierCurveTo(-0.36, -0.74, -0.25, -0.94, -0.12, -0.92);
  context.bezierCurveTo(-0.08, -1.28, 0.08, -1.28, 0.2, -1.02);
  context.bezierCurveTo(0.28, -1.08, 0.36, -1.02, 0.44, -0.92);
  context.bezierCurveTo(0.55, -0.9, 0.62, -0.72, 0.66, -0.56);
  context.bezierCurveTo(0.76, -0.66, 0.9, -0.58, 0.93, -0.42);
  context.bezierCurveTo(1.02, -0.28, 1, -0.05, 0.9, 0.04);
  context.bezierCurveTo(1, 0.16, 1, 0.38, 0.86, 0.5);
  context.bezierCurveTo(0.7, 0.74, 0.43, 0.8, 0.14, 0.74);
  context.bezierCurveTo(-0.12, 0.83, -0.52, 0.82, -0.84, 0.62);
  context.bezierCurveTo(-0.95, 0.58, -0.98, 0.5, -0.94, 0.45);
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
