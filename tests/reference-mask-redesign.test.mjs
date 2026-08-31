import assert from "node:assert/strict";
import test from "node:test";
import { getMaskBounds, getMaskVisualStyle, isInsideMask, LEAF_MASK_GEOMETRY, traceMaskDetail, traceMaskPath } from "../app/lib/masks.mjs";

const WIDTH = 1200;
const HEIGHT = 500;

function capturePath(maskId) {
  const commands = [];
  const context = new Proxy({}, {
    get: (_, method) => (...args) => commands.push([method, ...args]),
  });
  traceMaskPath(context, maskId);
  return commands;
}

function flattenPath(commands, steps = 48) {
  const points = [];
  let current = null;
  for (const [method, ...args] of commands) {
    if (method === "moveTo" || method === "lineTo") {
      current = [args[0], args[1]];
      points.push(current);
    } else if (method === "bezierCurveTo" && current) {
      const [c1x, c1y, c2x, c2y, endX, endY] = args;
      const [startX, startY] = current;
      for (let index = 1; index <= steps; index += 1) {
        const t = index / steps;
        const inverse = 1 - t;
        points.push([
          inverse ** 3 * startX + 3 * inverse ** 2 * t * c1x + 3 * inverse * t ** 2 * c2x + t ** 3 * endX,
          inverse ** 3 * startY + 3 * inverse ** 2 * t * c1y + 3 * inverse * t ** 2 * c2y + t ** 3 * endY,
        ]);
      }
      current = [endX, endY];
    }
  }
  return points;
}

function inPolygon(x, y, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const [x1, y1] = polygon[index];
    const [x2, y2] = polygon[previous];
    if ((y1 > y) !== (y2 > y) && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) inside = !inside;
  }
  return inside;
}

function inside(maskId, [localX, localY]) {
  const bounds = getMaskBounds(maskId, WIDTH, HEIGHT);
  return isInsideMask(
    maskId,
    localX * (2 * bounds.halfWidth) / WIDTH,
    localY * (2 * bounds.halfHeight) / HEIGHT,
    WIDTH,
    HEIGHT,
  );
}

test("reference silhouettes preserve the four requested landmarks", () => {
  assert.equal(inside("butterfly", [-0.58, -0.48]), true);
  assert.equal(inside("butterfly", [0.58, -0.48]), true);
  assert.equal(inside("butterfly", [-0.5, 0.42]), true);
  assert.equal(inside("butterfly", [0.5, 0.42]), true);
  assert.equal(inside("butterfly", [0, 0.78]), false, "bottom V notch");

  assert.equal(inside("leaf", [0.6, -0.7]), true, "diagonal tip");
  assert.equal(inside("leaf", [-0.55, 0.45]), true, "broad leaf base");
  assert.equal(inside("leaf", [-0.45, 0.5]), true, "lower blade");
  assert.equal(inside("leaf", [0.9, 0.7]), false, "rounded outer edge");

  assert.equal(inside("lightbulb", [0, -0.66]), true, "bulb dome");
  assert.equal(inside("lightbulb", [0, 0.72]), true, "soft lower neck");
  assert.equal(inside("lightbulb", [0.88, 0.2]), false, "outside the bulb body");

  assert.equal(inside("cloud", [-0.55, -0.34]), true, "large left dome");
  assert.equal(inside("cloud", [0.16, -0.42]), true, "small upper dome");
  assert.equal(inside("cloud", [0.66, -0.16]), true, "right dome");
  assert.equal(inside("cloud", [0, 0.72]), false, "soft baseline stays inside compact bounds");
});

test("all four placement regions are derived from their traced path", () => {
  for (const maskId of ["butterfly", "leaf", "lightbulb", "cloud"]) {
    const polygon = flattenPath(capturePath(maskId), 128);
    assert.ok(polygon.length > 20, `${maskId} has a detailed path`);
    assert.ok(capturePath(maskId).some(([method]) => method === "closePath"), `${maskId} closes`);
    for (let xIndex = -20; xIndex <= 20; xIndex += 1) {
      for (let yIndex = -20; yIndex <= 20; yIndex += 1) {
        const localX = xIndex / 20;
        const localY = yIndex / 20;
        assert.equal(
          inside(maskId, [localX, localY]),
          inPolygon(localX, localY, polygon),
          `${maskId} path mismatch at ${localX},${localY}`,
        );
      }
    }
  }
});

test("bulb details keep only the filament and socket inside the canvas detail box", () => {
  const commands = [];
  const context = new Proxy({}, {
    get: (_, method) => (...args) => commands.push([method, ...args]),
  });
  assert.equal(traceMaskDetail(context, "lightbulb"), true);
  const outerRayPoints = commands
    .filter(([method]) => method === "moveTo")
    .map(([, x, y]) => [x, y])
    .filter(([x, y]) => Math.abs(x) >= 0.6 || y <= -0.78);
  assert.deepEqual(outerRayPoints, [], "outer light rays are removed");
  assert.equal(commands.filter(([method]) => method === "lineTo").length, 2, "socket lines are included");
});

test("approved concept colors are preserved for the requested masks", () => {
  assert.deepEqual(getMaskVisualStyle("butterfly", "#000"), { stroke: "#7098df", fill: "#eaf2ff" });
  assert.deepEqual(getMaskVisualStyle("leaf", "#000"), { stroke: "#73b393", fill: "#e8f7ef" });
  assert.deepEqual(getMaskVisualStyle("lightbulb", "#000"), { stroke: "#e5aa3f", fill: "#fff4c9" });
  assert.deepEqual(getMaskVisualStyle("cloud", "#000"), { stroke: "#8eaddf", fill: "#fffdf8" });
  assert.deepEqual(getMaskVisualStyle("circle", "#123456"), { stroke: "#123456", fill: "#ffffff" });
});

test("leaf keeps a smooth rounded outline and veins branching both ways", () => {
  const path = capturePath("leaf").filter(([method]) => method === "bezierCurveTo");
  assert.ok(path.length >= 5, "leaf uses enough Bézier segments for a rounded outline");

  const commands = [];
  const context = new Proxy({}, {
    get: (_, method) => (...args) => commands.push([method, ...args]),
  });
  traceMaskDetail(context, "leaf");
  const branchDirections = commands.flatMap(([method, ...args], index) => {
    if (method !== "lineTo") return [];
    const previous = commands[index - 1];
    return previous?.[0] === "moveTo" ? [Math.sign(args[0] - previous[1])] : [];
  });
  assert.ok(branchDirections.some((direction) => direction < 0), "veins branch left");
  assert.ok(branchDirections.some((direction) => direction > 0), "veins branch right");
  assert.deepEqual(commands[0].slice(1), LEAF_MASK_GEOMETRY.petioleTip, "vein starts at petiole");
  assert.deepEqual(commands[LEAF_MASK_GEOMETRY.spine.length - 1].slice(-2), LEAF_MASK_GEOMETRY.tip, "vein reaches tip");
});

test("reference silhouettes keep practical proportions on the 1200 by 500 canvas", () => {
  const butterfly = getMaskBounds("butterfly", WIDTH, HEIGHT);
  const leaf = getMaskBounds("leaf", WIDTH, HEIGHT);
  const cloud = getMaskBounds("cloud", WIDTH, HEIGHT);
  assert.ok(butterfly.halfWidth * 2 / (butterfly.halfHeight * 2) >= 1.6);
  assert.ok(butterfly.halfWidth * 2 / (butterfly.halfHeight * 2) <= 1.8);
  assert.ok(leaf.halfWidth * 2 / (leaf.halfHeight * 2) >= 1.35);
  assert.ok(leaf.halfWidth * 2 / (leaf.halfHeight * 2) <= 1.58);
  assert.ok(cloud.halfWidth * 2 / (cloud.halfHeight * 2) >= 1.5);
  assert.ok(cloud.halfWidth * 2 / (cloud.halfHeight * 2) <= 1.85);
});

test("placement never leaks beyond the high-resolution visible reference path", () => {
  for (const maskId of ["butterfly", "leaf", "lightbulb", "cloud"]) {
    const visiblePolygon = flattenPath(capturePath(maskId), 256);
    for (let xIndex = -40; xIndex <= 40; xIndex += 1) {
      for (let yIndex = -40; yIndex <= 40; yIndex += 1) {
        const localX = xIndex / 40;
        const localY = yIndex / 40;
        if (inside(maskId, [localX, localY])) {
          assert.equal(inPolygon(localX, localY, visiblePolygon), true, `${maskId} grid leak ${localX},${localY}`);
        }
      }
    }
  }

  const maskId = "leaf";
  const bounds = getMaskBounds(maskId, WIDTH, HEIGHT);
  const visiblePolygon = flattenPath(capturePath(maskId), 256);
  const toLocalPoint = (radius, angle) => [radius * Math.cos(angle), radius * Math.sin(angle)];
  for (let direction = 0; direction < 2048; direction += 1) {
    const angle = direction * Math.PI * 2 / 2048;
    let low = 0;
    let high = 1.2;
    for (let iteration = 0; iteration < 22; iteration += 1) {
      const radius = (low + high) / 2;
      const [localX, localY] = toLocalPoint(radius, angle);
      const x = localX * (2 * bounds.halfWidth) / WIDTH;
      const y = localY * (2 * bounds.halfHeight) / HEIGHT;
      if (isInsideMask(maskId, x, y, WIDTH, HEIGHT)) low = radius;
      else high = radius;
    }
    const [localX, localY] = toLocalPoint(Math.max(0, low - 0.002), angle);
    assert.equal(inPolygon(localX, localY, visiblePolygon), true, `leaf radial containment ${direction}`);
  }

  for (const radialMask of ["butterfly", "lightbulb", "cloud"]) {
    const radialBounds = getMaskBounds(radialMask, WIDTH, HEIGHT);
    const radialPolygon = flattenPath(capturePath(radialMask), 256);
    for (let direction = 0; direction < 512; direction += 1) {
      const angle = direction * Math.PI * 2 / 512;
      let low = 0;
      let high = 1.2;
      for (let iteration = 0; iteration < 20; iteration += 1) {
        const radius = (low + high) / 2;
        const [localX, localY] = toLocalPoint(radius, angle);
        const x = localX * (2 * radialBounds.halfWidth) / WIDTH;
        const y = localY * (2 * radialBounds.halfHeight) / HEIGHT;
        if (isInsideMask(radialMask, x, y, WIDTH, HEIGHT)) low = radius;
        else high = radius;
      }
      const [localX, localY] = toLocalPoint(Math.max(0, low - 0.002), angle);
      assert.equal(inPolygon(localX, localY, radialPolygon), true, `${radialMask} radial containment ${direction}`);
    }
  }
});
