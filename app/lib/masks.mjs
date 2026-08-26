export const MASK_IDS = ["circle", "bubble", "heart", "star", "book", "butterfly", "leaf", "lightbulb", "cloud"];

const STAR_POINTS = Array.from({ length: 10 }, (_, index) => {
  const angle = -Math.PI / 2 + index * (Math.PI / 5);
  const radius = index % 2 === 0 ? 0.94 : 0.42;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
});

const LOCAL_PATH_INDEX_CACHE = new Map();
const PATH_BUCKET_COUNT = 128;
const PATH_MIN_Y = -1.1;
const PATH_MAX_Y = 1.1;

export function getMaskBounds(maskId, width, height) {
  const shortSide = Math.min(width, height);

  if (maskId === "bubble") return { halfWidth: width * 0.39, halfHeight: height * 0.36 };
  if (maskId === "book") return { halfWidth: width * 0.25, halfHeight: height * 0.42 };
  if (maskId === "butterfly") return { halfWidth: width * 0.3, halfHeight: height * 0.46 };
  if (maskId === "leaf") return { halfWidth: width * 0.41, halfHeight: height * 0.42 };
  if (maskId === "lightbulb") return { halfWidth: shortSide * 0.34, halfHeight: shortSide * 0.45 };
  if (maskId === "cloud") return { halfWidth: width * 0.32, halfHeight: height * 0.44 };
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
  if (maskId === "butterfly" || maskId === "leaf" || maskId === "lightbulb" || maskId === "cloud") {
    return isInsidePathMask(maskId, localX, localY);
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
    context.moveTo(-0.03, -0.2);
    context.bezierCurveTo(-0.1, -0.34, -0.13, 0.18, -0.08, 0.45);
    context.bezierCurveTo(-0.05, 0.58, -0.02, 0.6, 0, 0.58);
    context.bezierCurveTo(0.02, 0.6, 0.05, 0.58, 0.08, 0.45);
    context.bezierCurveTo(0.13, 0.18, 0.1, -0.34, 0.03, -0.2);
    context.moveTo(-0.02, -0.2);
    context.bezierCurveTo(-0.06, -0.3, -0.11, -0.38, -0.17, -0.43);
    context.moveTo(0.02, -0.2);
    context.bezierCurveTo(0.06, -0.3, 0.11, -0.38, 0.17, -0.43);
    return true;
  }
  if (maskId === "leaf") {
    context.moveTo(-0.82, 0.76);
    context.bezierCurveTo(-0.42, 0.28, 0.16, -0.38, 0.88, -0.82);
    context.moveTo(-0.5, 0.42);
    context.lineTo(-0.78, 0.18);
    context.moveTo(-0.25, 0.2);
    context.lineTo(-0.55, -0.04);
    context.moveTo(0.02, -0.02);
    context.lineTo(-0.27, -0.25);
    context.moveTo(0.27, -0.25);
    context.lineTo(0.02, -0.47);
    context.moveTo(-0.42, 0.48);
    context.lineTo(-0.16, 0.24);
    context.moveTo(-0.14, 0.25);
    context.lineTo(0.1, 0.01);
    context.moveTo(0.14, 0.01);
    context.lineTo(0.36, -0.22);
    context.moveTo(0.39, -0.23);
    context.lineTo(0.58, -0.48);
    return true;
  }
  if (maskId === "lightbulb") {
    // Seven rays stay outside the body path, so words never occupy the rays.
    context.moveTo(0, -0.94);
    context.lineTo(0, -0.76);
    context.moveTo(-0.64, -0.78);
    context.lineTo(-0.52, -0.66);
    context.moveTo(0.64, -0.78);
    context.lineTo(0.52, -0.66);
    context.moveTo(-0.92, -0.16);
    context.lineTo(-0.74, -0.16);
    context.moveTo(0.92, -0.16);
    context.lineTo(0.74, -0.16);
    context.moveTo(-0.64, 0.48);
    context.lineTo(-0.52, 0.36);
    context.moveTo(0.64, 0.48);
    context.lineTo(0.52, 0.36);
    context.moveTo(-0.24, 0.23);
    context.bezierCurveTo(-0.13, 0.15, -0.06, 0.34, 0, 0.23);
    context.bezierCurveTo(0.06, 0.34, 0.13, 0.15, 0.24, 0.23);
    context.moveTo(-0.26, 0.58);
    context.lineTo(0.26, 0.58);
    context.moveTo(-0.26, 0.7);
    context.lineTo(0.26, 0.7);
    context.moveTo(-0.2, 0.82);
    context.lineTo(0.2, 0.82);
    return true;
  }
  if (maskId !== "book") return false;

  context.moveTo(0, -0.46);
  context.bezierCurveTo(-0.02, -0.1, -0.02, 0.44, 0, 0.78);
  return true;
}

function isInsidePathMask(maskId, x, y) {
  let pathIndex = LOCAL_PATH_INDEX_CACHE.get(maskId);
  if (!pathIndex) {
    const commands = [];
    const context = {
      moveTo: (...args) => commands.push(["moveTo", ...args]),
      lineTo: (...args) => commands.push(["lineTo", ...args]),
      bezierCurveTo: (...args) => commands.push(["bezierCurveTo", ...args]),
      closePath: () => {},
    };
    traceMaskPath(context, maskId);
    const polygon = flattenMaskPath(commands, 128);
    pathIndex = createPathIndex(polygon);
    LOCAL_PATH_INDEX_CACHE.set(maskId, pathIndex);
  }
  return isInsideIndexedPolygon(x, y, pathIndex);
}

function createPathIndex(points) {
  const buckets = Array.from({ length: PATH_BUCKET_COUNT }, () => []);
  const edges = [];
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const [currentX, currentY] = points[index];
    const [previousX, previousY] = points[previous];
    if (currentY === previousY) continue;
    const edgeIndex = edges.length;
    edges.push([currentX, currentY, previousX, previousY]);
    const minY = Math.max(Math.min(currentY, previousY), PATH_MIN_Y);
    const maxY = Math.min(Math.max(currentY, previousY), PATH_MAX_Y);
    const firstBucket = Math.max(0, Math.floor(((minY - PATH_MIN_Y) / (PATH_MAX_Y - PATH_MIN_Y)) * PATH_BUCKET_COUNT));
    const lastBucket = Math.min(
      PATH_BUCKET_COUNT - 1,
      Math.floor(((maxY - PATH_MIN_Y) / (PATH_MAX_Y - PATH_MIN_Y)) * PATH_BUCKET_COUNT),
    );
    for (let bucket = firstBucket; bucket <= lastBucket; bucket += 1) buckets[bucket].push(edgeIndex);
  }
  return { buckets, edges };
}

function isInsideIndexedPolygon(x, y, pathIndex) {
  if (y < PATH_MIN_Y || y > PATH_MAX_Y) return false;
  const bucket = Math.min(
    PATH_BUCKET_COUNT - 1,
    Math.max(0, Math.floor(((y - PATH_MIN_Y) / (PATH_MAX_Y - PATH_MIN_Y)) * PATH_BUCKET_COUNT)),
  );
  let inside = false;
  for (const edgeIndex of pathIndex.buckets[bucket]) {
    const [currentX, currentY, previousX, previousY] = pathIndex.edges[edgeIndex];
    const crossesRay = (currentY > y) !== (previousY > y)
      && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;
    if (crossesRay) inside = !inside;
  }
  return inside;
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
  context.moveTo(0, -0.16);
  context.bezierCurveTo(-0.14, -0.48, -0.5, -0.94, -0.78, -0.9);
  context.bezierCurveTo(-0.98, -0.87, -1, -0.64, -0.94, -0.46);
  context.bezierCurveTo(-0.91, -0.32, -0.8, -0.25, -0.66, -0.16);
  context.bezierCurveTo(-0.85, -0.08, -0.97, 0.08, -0.96, 0.27);
  context.bezierCurveTo(-0.87, 0.5, -0.68, 0.68, -0.47, 0.69);
  context.bezierCurveTo(-0.25, 0.7, -0.12, 0.54, 0, 0.34);
  context.bezierCurveTo(0.12, 0.54, 0.25, 0.7, 0.47, 0.69);
  context.bezierCurveTo(0.68, 0.68, 0.87, 0.5, 0.96, 0.27);
  context.bezierCurveTo(0.97, 0.08, 0.85, -0.08, 0.66, -0.16);
  context.bezierCurveTo(0.8, -0.25, 0.91, -0.32, 0.94, -0.46);
  context.bezierCurveTo(1, -0.64, 0.98, -0.87, 0.78, -0.9);
  context.bezierCurveTo(0.5, -0.94, 0.14, -0.48, 0, -0.16);
}

function traceLeafPath(context) {
  context.moveTo(0.9, -0.88);
  context.bezierCurveTo(0.66, -0.84, 0.49, -0.78, 0.34, -0.71);
  context.bezierCurveTo(0.26, -0.79, 0.18, -0.82, 0.1, -0.78);
  context.bezierCurveTo(0.03, -0.75, 0, -0.69, -0.02, -0.62);
  context.bezierCurveTo(-0.11, -0.68, -0.2, -0.7, -0.27, -0.64);
  context.bezierCurveTo(-0.34, -0.59, -0.36, -0.52, -0.37, -0.44);
  context.bezierCurveTo(-0.46, -0.49, -0.55, -0.49, -0.61, -0.43);
  context.bezierCurveTo(-0.67, -0.36, -0.68, -0.29, -0.68, -0.21);
  context.bezierCurveTo(-0.77, -0.25, -0.85, -0.22, -0.89, -0.14);
  context.bezierCurveTo(-0.93, -0.05, -0.9, 0.03, -0.86, 0.1);
  context.bezierCurveTo(-0.93, 0.12, -0.98, 0.19, -0.96, 0.27);
  context.bezierCurveTo(-0.94, 0.37, -0.85, 0.43, -0.75, 0.45);
  context.bezierCurveTo(-0.82, 0.52, -0.84, 0.61, -0.79, 0.68);
  context.bezierCurveTo(-0.72, 0.78, -0.6, 0.78, -0.5, 0.73);
  context.bezierCurveTo(-0.47, 0.83, -0.47, 0.92, -0.5, 0.99);
  context.bezierCurveTo(-0.47, 1, -0.42, 1, -0.39, 0.98);
  context.bezierCurveTo(-0.37, 0.9, -0.38, 0.82, -0.4, 0.73);
  context.bezierCurveTo(-0.28, 0.77, -0.15, 0.74, -0.05, 0.68);
  context.bezierCurveTo(0.02, 0.63, 0.08, 0.56, 0.14, 0.5);
  context.bezierCurveTo(0.08, 0.48, 0.1, 0.42, 0.2, 0.36);
  context.bezierCurveTo(0.26, 0.33, 0.31, 0.26, 0.28, 0.2);
  context.bezierCurveTo(0.36, 0.2, 0.41, 0.12, 0.39, 0.03);
  context.bezierCurveTo(0.48, 0.1, 0.55, 0.04, 0.52, -0.03);
  context.bezierCurveTo(0.62, -0.17, 0.67, -0.26, 0.65, -0.34);
  context.bezierCurveTo(0.74, -0.38, 0.79, -0.48, 0.76, -0.56);
  context.bezierCurveTo(0.84, -0.62, 0.88, -0.75, 0.9, -0.88);
}

function traceLightbulbPath(context) {
  context.moveTo(0, -0.86);
  context.bezierCurveTo(-0.47, -0.86, -0.76, -0.57, -0.76, -0.2);
  context.bezierCurveTo(-0.76, 0.08, -0.63, 0.25, -0.46, 0.4);
  context.bezierCurveTo(-0.37, 0.48, -0.34, 0.56, -0.33, 0.64);
  context.lineTo(-0.33, 0.82);
  context.bezierCurveTo(-0.33, 0.89, -0.26, 0.92, -0.18, 0.92);
  context.lineTo(0.18, 0.92);
  context.bezierCurveTo(0.26, 0.92, 0.33, 0.89, 0.33, 0.82);
  context.lineTo(0.33, 0.64);
  context.bezierCurveTo(0.34, 0.56, 0.37, 0.48, 0.46, 0.4);
  context.bezierCurveTo(0.63, 0.25, 0.76, 0.08, 0.76, -0.2);
  context.bezierCurveTo(0.76, -0.57, 0.47, -0.86, 0, -0.86);
}

function traceCloudPath(context) {
  context.moveTo(-0.92, 0.44);
  context.bezierCurveTo(-0.99, 0.28, -0.98, 0.06, -0.86, -0.04);
  context.bezierCurveTo(-0.84, -0.31, -0.66, -0.52, -0.43, -0.49);
  context.bezierCurveTo(-0.26, -0.79, 0.12, -0.79, 0.27, -0.47);
  context.bezierCurveTo(0.39, -0.61, 0.62, -0.58, 0.7, -0.34);
  context.bezierCurveTo(0.94, -0.35, 1, -0.08, 0.91, 0.1);
  context.bezierCurveTo(1, 0.2, 0.98, 0.36, 0.88, 0.44);
  context.lineTo(-0.92, 0.44);
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
