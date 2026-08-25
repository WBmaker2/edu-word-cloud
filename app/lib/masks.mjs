export const MASK_IDS = ["circle", "bubble", "heart", "star", "book", "butterfly", "leaf", "lightbulb", "cloud"];

const STAR_POINTS = Array.from({ length: 10 }, (_, index) => {
  const angle = -Math.PI / 2 + index * (Math.PI / 5);
  const radius = index % 2 === 0 ? 0.94 : 0.42;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
});

const LOCAL_PATH_POLYGON_CACHE = new Map();

export function getMaskBounds(maskId, width, height) {
  const shortSide = Math.min(width, height);

  if (maskId === "bubble") return { halfWidth: width * 0.39, halfHeight: height * 0.36 };
  if (maskId === "book") return { halfWidth: width * 0.25, halfHeight: height * 0.42 };
  if (maskId === "butterfly") return { halfWidth: width * 0.31, halfHeight: height * 0.42 };
  if (maskId === "leaf") return { halfWidth: width * 0.26, halfHeight: height * 0.41 };
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
  if (maskId === "butterfly" || maskId === "leaf") return isInsidePathMask(maskId, localX, localY);
  if (maskId === "lightbulb") return isInsideLightbulb(localX, localY);
  if (maskId === "cloud") return isInsidePathMask(maskId, localX, localY);
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
  if (maskId === "butterfly") {
    context.moveTo(-0.08, -0.25);
    context.bezierCurveTo(-0.12, -0.12, -0.12, 0.42, -0.08, 0.58);
    context.bezierCurveTo(-0.04, 0.68, 0.04, 0.68, 0.08, 0.58);
    context.bezierCurveTo(0.12, 0.42, 0.12, -0.12, 0.08, -0.25);
    context.bezierCurveTo(0.04, -0.34, -0.04, -0.34, -0.08, -0.25);
    context.moveTo(-0.05, -0.23);
    context.bezierCurveTo(-0.11, -0.36, -0.18, -0.43, -0.24, -0.46);
    context.moveTo(0.05, -0.23);
    context.bezierCurveTo(0.11, -0.36, 0.18, -0.43, 0.24, -0.46);
    return true;
  }
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

function isInsidePathMask(maskId, x, y) {
  let polygon = LOCAL_PATH_POLYGON_CACHE.get(maskId);
  if (!polygon) {
    const commands = [];
    const context = {
      moveTo: (...args) => commands.push(["moveTo", ...args]),
      lineTo: (...args) => commands.push(["lineTo", ...args]),
      bezierCurveTo: (...args) => commands.push(["bezierCurveTo", ...args]),
      closePath: () => {},
    };
    traceMaskPath(context, maskId);
    polygon = flattenMaskPath(commands);
    LOCAL_PATH_POLYGON_CACHE.set(maskId, polygon);
  }
  return isInsidePolygon(x, y, polygon);
}

function flattenMaskPath(commands, steps = 12) {
  const points = [];
  let current = null;
  for (const [method, ...args] of commands) {
    if (method === "moveTo" || method === "lineTo") {
      current = [args[0], args[1]];
      points.push(current);
    } else if (method === "bezierCurveTo" && current) {
      const [control1X, control1Y, control2X, control2Y, endX, endY] = args;
      const [startX, startY] = current;
      for (let step = 1; step <= steps; step += 1) {
        const t = step / steps;
        const inverse = 1 - t;
        points.push([
          inverse ** 3 * startX + 3 * inverse ** 2 * t * control1X + 3 * inverse * t ** 2 * control2X + t ** 3 * endX,
          inverse ** 3 * startY + 3 * inverse ** 2 * t * control1Y + 3 * inverse * t ** 2 * control2Y + t ** 3 * endY,
        ]);
      }
      current = [endX, endY];
    }
  }
  return points;
}

function isInsideLightbulb(x, y) {
  const bulb = isInsideEllipse(x, y, 0, -0.2, 0.78, 0.76);
  const neck = isInsideEllipse(x, y, 0, 0.34, 0.4, 0.54);
  const socket = Math.abs(x) <= 0.32 && y >= 0.52 && y <= 0.88;
  return bulb || neck || socket;
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
  context.moveTo(0, -0.64);
  context.bezierCurveTo(-0.12, -0.8, -0.38, -0.98, -0.64, -0.9);
  context.bezierCurveTo(-0.88, -0.84, -1, -0.58, -0.9, -0.3);
  context.bezierCurveTo(-0.82, -0.24, -0.5, -0.04, -0.18, -0.02);
  context.bezierCurveTo(-0.42, 0.04, -0.74, 0.2, -0.78, 0.42);
  context.bezierCurveTo(-0.76, 0.68, -0.5, 0.82, -0.28, 0.72);
  context.bezierCurveTo(-0.14, 0.66, -0.07, 0.54, 0, 0.42);
  context.bezierCurveTo(0.07, 0.54, 0.14, 0.66, 0.28, 0.72);
  context.bezierCurveTo(0.5, 0.82, 0.76, 0.68, 0.78, 0.42);
  context.bezierCurveTo(0.74, 0.2, 0.42, 0.04, 0.18, -0.02);
  context.bezierCurveTo(0.5, -0.04, 0.82, -0.24, 0.9, -0.3);
  context.bezierCurveTo(1, -0.58, 0.88, -0.84, 0.64, -0.9);
  context.bezierCurveTo(0.38, -0.98, 0.12, -0.8, 0, -0.64);
}

function traceLeafPath(context) {
  context.moveTo(0.76, -0.8);
  context.bezierCurveTo(0.24, -0.88, -0.62, -0.68, -0.98, -0.12);
  context.bezierCurveTo(-1.04, 0.1, -0.9, 0.44, -0.62, 0.58);
  context.bezierCurveTo(-0.46, 0.68, -0.3, 0.68, -0.18, 0.64);
  context.bezierCurveTo(-0.22, 0.78, -0.27, 0.94, -0.3, 1.05);
  context.bezierCurveTo(-0.33, 1.12, -0.28, 1.18, -0.23, 1.13);
  context.bezierCurveTo(-0.14, 0.98, -0.13, 0.8, -0.14, 0.63);
  context.bezierCurveTo(0.36, 0.72, 0.78, 0.5, 1.04, 0.08);
  context.bezierCurveTo(1.12, -0.2, 1.04, -0.58, 0.76, -0.8);
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
  context.bezierCurveTo(-1, 0.28, -0.98, 0.04, -0.88, -0.06);
  context.bezierCurveTo(-0.98, -0.2, -0.9, -0.48, -0.7, -0.54);
  context.bezierCurveTo(-0.62, -0.68, -0.4, -0.72, -0.28, -0.54);
  context.bezierCurveTo(-0.24, -0.86, -0.14, -1.08, 0, -1.08);
  context.bezierCurveTo(0.14, -1.08, 0.24, -0.86, 0.3, -0.56);
  context.bezierCurveTo(0.4, -0.74, 0.56, -0.74, 0.64, -0.54);
  context.bezierCurveTo(0.84, -0.58, 0.96, -0.3, 0.88, -0.06);
  context.bezierCurveTo(1, 0.08, 1, 0.3, 0.9, 0.44);
  context.bezierCurveTo(0.78, 0.7, 0.46, 0.76, 0.16, 0.68);
  context.bezierCurveTo(-0.16, 0.76, -0.5, 0.76, -0.8, 0.62);
  context.bezierCurveTo(-0.9, 0.6, -0.96, 0.56, -0.96, 0.5);
  context.bezierCurveTo(-0.96, 0.48, -0.96, 0.46, -0.94, 0.45);
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
