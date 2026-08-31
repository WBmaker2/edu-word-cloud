export const MASK_IDS = ["circle", "bubble", "heart", "star", "book", "butterfly", "leaf", "lightbulb", "cloud"];

export const MASK_VISUAL_STYLES = Object.freeze({
  butterfly: Object.freeze({ stroke: "#7098df", fill: "#eaf2ff" }),
  leaf: Object.freeze({ stroke: "#73b393", fill: "#e8f7ef" }),
  lightbulb: Object.freeze({ stroke: "#e5aa3f", fill: "#fff4c9" }),
  cloud: Object.freeze({ stroke: "#8eaddf", fill: "#fffdf8" }),
});

const STAR_POINTS = Array.from({ length: 10 }, (_, index) => {
  const angle = -Math.PI / 2 + index * (Math.PI / 5);
  const radius = index % 2 === 0 ? 0.94 : 0.42;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
});

const LOCAL_PATH_INDEX_CACHE = new Map();
const PATH_BUCKET_COUNT = 128;
const PATH_MIN_Y = -1.1;
const PATH_MAX_Y = 1.1;

const LEAF_TIP = Object.freeze([0.86, -0.9]);
const LEAF_PETIOLE_TIP = Object.freeze([-0.73, 0.88]);
const LEAF_BLADE_BASE = Object.freeze([-0.5, 0.58]);
const LEAF_OUTLINE_COMMANDS = Object.freeze([
  ["M", LEAF_TIP],
  ["C", Object.freeze([0.44, -0.86, -0.26, -0.58, -0.68, -0.14])],
  ["C", Object.freeze([-0.9, 0.1, -0.86, 0.4, -0.62, 0.58])],
  ["C", Object.freeze([-0.55, 0.63, -0.47, 0.64, -0.39, 0.61])],
  ["C", Object.freeze([-0.08, 0.42, 0.42, 0.02, 0.69, -0.38])],
  ["C", Object.freeze([0.84, -0.6, 0.92, -0.8, ...LEAF_TIP])],
]);
const LEAF_SPINE_COMMANDS = Object.freeze([
  ["M", LEAF_PETIOLE_TIP],
  ["C", Object.freeze([-0.64, 0.76, -0.56, 0.66, ...LEAF_BLADE_BASE])],
  ["C", Object.freeze([-0.08, 0.36, 0.42, -0.02, 0.22, -0.16])],
  ["C", Object.freeze([0.5, -0.47, 0.73, -0.74, ...LEAF_TIP])],
]);
const LEAF_BRANCHES = Object.freeze([
  Object.freeze([Object.freeze([-0.41, 0.53]), Object.freeze([-0.59, 0.36])]),
  Object.freeze([Object.freeze([-0.41, 0.53]), Object.freeze([-0.45, 0.61])]),
  Object.freeze([Object.freeze([-0.2, 0.3]), Object.freeze([-0.39, 0.13])]),
  Object.freeze([Object.freeze([-0.2, 0.3]), Object.freeze([-0.08, 0.35])]),
  Object.freeze([Object.freeze([0.04, 0.04]), Object.freeze([-0.17, -0.15])]),
  Object.freeze([Object.freeze([0.04, 0.04]), Object.freeze([0.16, 0.14])]),
  Object.freeze([Object.freeze([0.31, -0.27]), Object.freeze([0.14, -0.45])]),
  Object.freeze([Object.freeze([0.31, -0.27]), Object.freeze([0.46, -0.15])]),
]);
const LEAF_DETAIL_COMMANDS = Object.freeze([
  ...LEAF_SPINE_COMMANDS,
  ...LEAF_BRANCHES.flatMap(([start, end]) => [["M", start], ["L", end]]),
]);

export const LEAF_MASK_GEOMETRY = Object.freeze({
  tip: LEAF_TIP,
  bladeBase: LEAF_BLADE_BASE,
  petioleTip: LEAF_PETIOLE_TIP,
  outline: LEAF_OUTLINE_COMMANDS,
  spine: LEAF_SPINE_COMMANDS,
  branches: LEAF_BRANCHES,
});

export const LEAF_ICON_PATHS = Object.freeze({
  outline: createLeafSvgPath(LEAF_OUTLINE_COMMANDS, true),
  detail: createLeafSvgPath(LEAF_DETAIL_COMMANDS),
});

export function getMaskBounds(maskId, width, height) {
  const shortSide = Math.min(width, height);

  if (maskId === "bubble") return { halfWidth: width * 0.39, halfHeight: height * 0.36 };
  if (maskId === "book") return { halfWidth: width * 0.25, halfHeight: height * 0.42 };
  if (maskId === "butterfly") return { halfWidth: width * 0.31, halfHeight: height * 0.44 };
  if (maskId === "leaf") return { halfWidth: width * 0.28, halfHeight: height * 0.46 };
  if (maskId === "lightbulb") return { halfWidth: shortSide * 0.34, halfHeight: shortSide * 0.45 };
  if (maskId === "cloud") return { halfWidth: width * 0.32, halfHeight: height * 0.46 };
  return { halfWidth: shortSide * 0.44, halfHeight: shortSide * 0.44 };
}

export function getMaskVisualStyle(maskId, fallbackStroke) {
  return MASK_VISUAL_STYLES[maskId] ?? { stroke: fallbackStroke, fill: "#ffffff" };
}

export function isInsideMask(maskId, x, y, width = 2, height = 2) {
  const { halfWidth, halfHeight } = getMaskBounds(maskId, width, height);
  const localX = (x * width) / (2 * halfWidth);
  const localY = (y * height) / (2 * halfHeight);

  return isInsideLocalMask(maskId, localX, localY);
}

function isInsideLocalMask(maskId, localX, localY) {
  if (Math.abs(localX) > 1 || Math.abs(localY) > 1) return false;
  return isInsidePathMask(maskId, localX, localY);
}

export function traceMaskPath(context, maskId) {
  if (maskId === "circle") {
    traceCirclePath(context);
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
    traceStarPath(context);
  }
  context.closePath();
}

export function traceMaskDetail(context, maskId) {
  if (maskId === "butterfly") {
    context.moveTo(-0.035, -0.16);
    context.bezierCurveTo(-0.08, 0.02, -0.08, 0.34, -0.035, 0.54);
    context.bezierCurveTo(-0.02, 0.6, 0.02, 0.6, 0.035, 0.54);
    context.bezierCurveTo(0.08, 0.34, 0.08, 0.02, 0.035, -0.16);
    context.moveTo(-0.02, -0.16);
    context.bezierCurveTo(-0.06, -0.28, -0.12, -0.36, -0.19, -0.4);
    context.moveTo(0.02, -0.16);
    context.bezierCurveTo(0.06, -0.28, 0.12, -0.36, 0.19, -0.4);
    return true;
  }
  if (maskId === "leaf") {
    traceCommands(context, LEAF_DETAIL_COMMANDS);
    return true;
  }
  if (maskId === "lightbulb") {
    // Keep only the filament and socket lines inside the bulb silhouette.
    context.moveTo(-0.2, 0.18);
    context.bezierCurveTo(-0.1, 0.08, -0.05, 0.28, 0, 0.18);
    context.bezierCurveTo(0.05, 0.28, 0.1, 0.08, 0.2, 0.18);
    context.moveTo(-0.2, 0.66);
    context.lineTo(0.2, 0.66);
    context.moveTo(-0.17, 0.77);
    context.lineTo(0.17, 0.77);
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

function traceCirclePath(context) {
  const radius = 0.94;
  const control = radius * 0.55228475;
  context.moveTo(0, -radius);
  context.bezierCurveTo(control, -radius, radius, -control, radius, 0);
  context.bezierCurveTo(radius, control, control, radius, 0, radius);
  context.bezierCurveTo(-control, radius, -radius, control, -radius, 0);
  context.bezierCurveTo(-radius, -control, -control, -radius, 0, -radius);
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
}

function traceHeartPath(context) {
  context.moveTo(0, 0.88);
  context.bezierCurveTo(-0.16, 0.68, -0.86, 0.26, -0.86, -0.23);
  context.bezierCurveTo(-0.86, -0.64, -0.35, -0.82, 0, -0.43);
  context.bezierCurveTo(0.35, -0.82, 0.86, -0.64, 0.86, -0.23);
  context.bezierCurveTo(0.86, 0.26, 0.16, 0.68, 0, 0.88);
}

function traceButterflyPath(context) {
  context.moveTo(0, -0.1);
  context.bezierCurveTo(-0.12, -0.34, -0.4, -0.8, -0.7, -0.8);
  context.bezierCurveTo(-0.92, -0.8, -0.96, -0.56, -0.83, -0.34);
  context.bezierCurveTo(-0.75, -0.2, -0.6, -0.1, -0.43, -0.03);
  context.bezierCurveTo(-0.68, 0, -0.87, 0.12, -0.86, 0.36);
  context.bezierCurveTo(-0.85, 0.6, -0.63, 0.75, -0.42, 0.64);
  context.bezierCurveTo(-0.22, 0.54, -0.1, 0.36, 0, 0.2);
  context.bezierCurveTo(0.1, 0.36, 0.22, 0.54, 0.42, 0.64);
  context.bezierCurveTo(0.63, 0.75, 0.85, 0.6, 0.86, 0.36);
  context.bezierCurveTo(0.87, 0.12, 0.68, 0, 0.43, -0.03);
  context.bezierCurveTo(0.6, -0.1, 0.75, -0.2, 0.83, -0.34);
  context.bezierCurveTo(0.96, -0.56, 0.92, -0.8, 0.7, -0.8);
  context.bezierCurveTo(0.4, -0.8, 0.12, -0.34, 0, -0.1);
}

function traceLeafPath(context) {
  traceCommands(context, LEAF_OUTLINE_COMMANDS);
}

function traceCommands(context, commands) {
  for (const [method, points] of commands) {
    if (method === "M") context.moveTo(...points);
    if (method === "L") context.lineTo(...points);
    if (method === "C") context.bezierCurveTo(...points);
  }
}

function createLeafSvgPath(commands, close = false) {
  const transform = (value, index) => {
    const scaled = index % 2 === 0 ? 18 + value * 13.2 : 14.5 + value * 10.2;
    return Math.round(scaled * 100) / 100;
  };
  const path = commands.map(([method, points]) => {
    const values = points.map(transform);
    return `${method}${values.join(" ")}`;
  }).join(" ");
  return close ? `${path} Z` : path;
}

function traceLightbulbPath(context) {
  context.moveTo(0, -0.84);
  context.bezierCurveTo(-0.46, -0.84, -0.72, -0.56, -0.72, -0.18);
  context.bezierCurveTo(-0.72, 0.12, -0.56, 0.34, -0.38, 0.48);
  context.bezierCurveTo(-0.22, 0.6, -0.18, 0.66, -0.18, 0.72);
  context.bezierCurveTo(-0.12, 0.77, -0.06, 0.79, 0, 0.79);
  context.bezierCurveTo(0.06, 0.79, 0.12, 0.77, 0.18, 0.72);
  context.bezierCurveTo(0.18, 0.66, 0.22, 0.6, 0.38, 0.48);
  context.bezierCurveTo(0.56, 0.34, 0.72, 0.12, 0.72, -0.18);
  context.bezierCurveTo(0.72, -0.56, 0.46, -0.84, 0, -0.84);
}

function traceCloudPath(context) {
  context.moveTo(-0.9, 0.4);
  context.bezierCurveTo(-1, 0.3, -0.98, 0.08, -0.82, 0.01);
  context.bezierCurveTo(-0.83, -0.27, -0.63, -0.5, -0.4, -0.46);
  context.bezierCurveTo(-0.25, -0.73, 0.1, -0.78, 0.29, -0.47);
  context.bezierCurveTo(0.44, -0.6, 0.66, -0.54, 0.75, -0.27);
  context.bezierCurveTo(0.93, -0.28, 1, -0.08, 0.91, 0.08);
  context.bezierCurveTo(1, 0.2, 0.96, 0.36, 0.82, 0.42);
  context.bezierCurveTo(0.64, 0.53, 0.34, 0.58, 0, 0.56);
  context.bezierCurveTo(-0.34, 0.58, -0.64, 0.53, -0.82, 0.42);
  context.bezierCurveTo(-0.85, 0.42, -0.88, 0.41, -0.9, 0.4);
}

function traceBookPath(context) {
  context.moveTo(-0.92, -0.65);
  context.bezierCurveTo(-0.57, -0.78, -0.23, -0.7, 0, -0.46);
  context.bezierCurveTo(0.23, -0.7, 0.57, -0.78, 0.92, -0.65);
  context.lineTo(0.92, 0.63);
  context.bezierCurveTo(0.59, 0.52, 0.24, 0.57, 0, 0.78);
  context.bezierCurveTo(-0.24, 0.57, -0.59, 0.52, -0.92, 0.63);
}

function traceStarPath(context) {
  const incoming = STAR_POINTS.map((point, index) => pointAlong(point, STAR_POINTS[(index + STAR_POINTS.length - 1) % STAR_POINTS.length], index % 2 === 0 ? 0.13 : 0.1));
  const outgoing = STAR_POINTS.map((point, index) => pointAlong(point, STAR_POINTS[(index + 1) % STAR_POINTS.length], index % 2 === 0 ? 0.13 : 0.1));
  context.moveTo(...outgoing.at(-1));
  STAR_POINTS.forEach((point, index) => {
    context.lineTo(...incoming[index]);
    context.bezierCurveTo(point[0], point[1], point[0], point[1], ...outgoing[index]);
  });
}

function pointAlong([startX, startY], [endX, endY], amount) {
  return [startX + (endX - startX) * amount, startY + (endY - startY) * amount];
}
